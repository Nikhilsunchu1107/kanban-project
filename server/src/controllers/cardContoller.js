import mongoose from 'mongoose';
import Card from '../models/cardModel.js';
import List from '../models/listModel.js';
import { getIO } from "../services/socketService.js";

// @desc    Create a new card
// @route   POST /api/cards
// @access  Private
export const createCard = async (req, res) => {
    try {
        const { title, listId, boardId } = req.body;

        // Find the list to get the current card count for the position
        const list = await List.findById(listId);
        if (!list) {
            return res.status(404).json({ jmessage: 'List not found' })
        }

        // We can also find all cards in that list to determine the new position
        const cardCount = await Card.countDocuments({ list: listId });

        const card = await Card.create({
            title,
            list: listId,
            board: boardId,
            position: cardCount,
        });

        // Emit the event to the board's room
        getIO().to(boardId).emit('BOARD_UPDATE', {
            message: 'New card created',
        });

        res.status(201).json(card);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Move a card to a new position (and/or new list)
// @route   PUT /api/cards/:id/move
// @access  Private
export const moveCard = async (req, res) => {
    const { listId: newListId, position: newPosition } = req.body;
    const cardId = req.params.id;

    // start a MongoDB session for a transaction
    const session = await mongoose.startSession();

    try {
        let finalCard;
        // start the transaction
        await session.withTransaction(async () => {
            // 1. Get the card being moved
            const card = await Card.findById(cardId).session(session);
            if (!card) {
                throw new Error('Card not found');
            }

            const oldListId = card.list;
            const oldPosition = card.position;

            //  2. Remove card from old position (shift cards down)
            // Find all cards in the old list that were after the card and pull their position down by 1
            await Card.updateMany(
                { list: oldListId, position: { $gt: oldPosition } },
                { $inc: { position: -1 } },
                { session }
            );

            // 3. Add card to new position (shift cards up)
            // Find all cards in the new list that are at or after the new position
            // and push their position up by 1
            await Card.updateMany(
                { list: newListId, position: { $gte: newPosition } },
                { $inc: { position: 1 } },
                { session }
            );

            // 4. Update the card itself with new listId and position
            card.list = newListId;
            card.position = newPosition;
            finalCard = await card.save({ session });
        });

        // Emit the event to the board's room (we get boardId from the card)
        getIO().to(finalCard.board.toString()).emit('BOARD_UPDATE', {
            message: 'Card moved',
            card: finalCard,
        });

        // If the transaction is successful, send the response
        res.status(200).json(finalCard);
    } catch (error) {
        res.status(500).json({ message: 'Serever Error', error: error.message });
    } finally {
        session.endSession();
    }
};

// @desc    Delete a card
// @route   DELETE /api/cards/:id
// @access  Private
export const deleteCard = async (req, res) => {
  try {
    const card = await Card.findById(req.params.id);

    if (!card) {
      return res.status(404).json({ message: 'Card not found' });
    }
    
    // (Optional Security: Check if user is a member of the board)
    
    // Get the board ID before we delete
    const boardId = card.board.toString();
    
    // Delete the card
    await card.deleteOne();

    // Emit an event so everyone's UI updates
    getIO().to(boardId).emit('BOARD_UPDATE', {
      message: 'Card deleted',
    });

    res.status(200).json({ message: 'Card deleted' });
  } catch (error) {
    console.error("DELETE CARD ERROR:", error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Update a card's details
// @route   PUT /api/cards/:id
// @access  Private
export const updateCard = async (req, res) => {
  try {
    // Destructure all possible fields from the body
    const { title, description, dueDate, priority, assignedTo, tag } = req.body;
    const cardId = req.params.id;

    const card = await Card.findById(cardId);

    if (!card) {
      return res.status(404).json({ message: 'Card not found' });
    }

    // (Optional Security: Check if user is a member of the board)

    // Update fields if they were provided in the request body
    if (title !== undefined) card.title = title;
    if (description !== undefined) card.description = description;

    // Handle date (null or valid date string)
    if (dueDate !== undefined) {
       card.dueDate = dueDate ? new Date(dueDate) : null;
    }

    // Handle priority, assignee, tag (null or valid value)
    if (priority !== undefined) card.priority = priority; // Validation handled by schema enum
    if (assignedTo !== undefined) card.assignedTo = assignedTo === 'unassigned' ? null : assignedTo;
    if (tag !== undefined) card.tag = tag === 'none' ? null : tag;

    // Use populate to return the assignee's details
    const updatedCard = await (await card.save()).populate('assignedTo', 'name email');

    // Emit an event so everyone's UI updates
    getIO().to(updatedCard.board.toString()).emit('BOARD_UPDATE', {
      message: 'Card updated',
      card: updatedCard, // Send the updated card data
    });

    res.status(200).json(updatedCard);
  } catch (error) {
    console.error("UPDATE CARD ERROR:", error);
    // Handle potential validation errors from schema enums
    if (error.name === 'ValidationError') {
        return res.status(400).json({ message: 'Invalid data provided', details: error.message });
    }
    res.status(500).json({ message: 'Server Error' });
  }
};