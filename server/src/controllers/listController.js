import mongoose from 'mongoose';
import List from '../models/listModel.js';
import Card from '../models/cardModel.js';
import Board from '../models/boardModel.js';
import { getIO } from '../services/socketService.js';

// @desc    Create a new list
// @route   POST /api/lists
// @access  Private
export const createList = async (req, res) => {
  try {
    const { name, boardId } = req.body;

    // (Optional: Check if user is a member of the board)
    
    // Find current list count to set position
    const listCount = await List.countDocuments({ board: boardId });

    const list = await List.create({
      name,
      board: boardId,
      position: listCount, // Add to the end
    });

    getIO().to(boardId).emit('BOARD_UPDATE', { message: 'List created' });
    res.status(201).json(list);
  } catch (error) {
    console.error("CREATE LIST ERROR:", error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Delete a list
// @route   DELETE /api/lists/:id
// @access  Private
export const deleteList = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    let list;
    let boardId;
    await session.withTransaction(async () => {
      const listId = req.params.id;
      list = await List.findById(listId).session(session);

      if (!list) {
        throw new Error('List not found');
      }
      boardId = list.board.toString();

      // (Optional: Check if user is board owner)

      // 1. Delete all cards in this list
      await Card.deleteMany({ list: listId }, { session });
      
      // 2. Delete the list itself
      await list.deleteOne({ session });

      // (We could update other list positions, but a simple re-fetch is fine)
    });

    getIO().to(boardId).emit('BOARD_UPDATE', { message: 'List deleted' });
    res.status(200).json({ message: 'List deleted' });
  } catch (error) {
    console.error("DELETE LIST ERROR:", error);
    if (error.message === 'List not found') {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server Error' });
  } finally {
    session.endSession();
  }
};

// @desc    Update WIP Limit for a list
// @route   PUT /api/lists/:id/wip
// @access  Private
export const updateListWipLimit = async (req, res) => {
  try {
    const { wipLimit } = req.body; // Expecting { wipLimit: 5 } or { wipLimit: null }
    const listId = req.params.id;

    const list = await List.findById(listId);
    if (!list) {
      return res.status(404).json({ message: 'List not found' });
    }

    // (Optional: Check user permissions)

    // Validate the input (must be a positive number or null)
    const limitValue = wipLimit === null || wipLimit === '' ? null : parseInt(wipLimit, 10);
    if (limitValue !== null && (isNaN(limitValue) || limitValue < 1)) {
        return res.status(400).json({ message: 'WIP limit must be a positive number or null.' });
    }

    list.wipLimit = limitValue;
    await list.save();

    // Emit event so UIs update
    getIO().to(list.board.toString()).emit('BOARD_UPDATE', {
      message: 'List WIP limit updated',
    });

    res.status(200).json(list);
  } catch (error) {
    console.error("UPDATE WIP LIMIT ERROR:", error);
    res.status(500).json({ message: 'Server Error' });
  }
};