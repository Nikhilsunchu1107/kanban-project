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