import mongoose from 'mongoose';
import Board from "../models/boardModel.js";
import Card from "../models/cardModel.js";
import List from "../models/listModel.js";
import User from "../models/userModel.js";
import { getIO } from '../services/socketService.js';

// @desc    Create a new board
// @route   POST /api/boards
// @access  Private
export const createBoard = async (req, res) => {
    try {
        const { name } = req.body;
        
        // The 'owner' is the logged-in user, which we get from the 'protect' middlewar
        const board = await Board.create({
            name,
            owner: req.user._id,
            members: [req.user._id], // The owner is also a member
        });

        // When a new board is created, we also create default lists
        const defaultLists = ['To Do', 'Development', 'Testing', 'Review', 'Deployment', 'Done'];
        for (let i = 0; i < defaultLists.length; i++) {
            await List.create({
                name:defaultLists[i],
                board: board._id,
                position: i,
            });
        }

        res.status(201).json(board);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Delete a board
// @route   DELETE /api/boards/:id
// @access  Private (Owner only)
export const deleteBoard = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    let board;
    await session.withTransaction(async () => {
      const boardId = req.params.id;
      board = await Board.findById(boardId).session(session);

      if (!board) {
        throw new Error('Board not found');
      }

      // --- Role Check: Only the owner can delete a board ---
      if (board.owner.toString() !== req.user._id.toString()) {
        throw new Error('Not authorized to delete this board');
      }

      // 1. Delete all cards associated with this board
      await Card.deleteMany({ board: boardId }, { session });
      
      // 2. Delete all lists associated with this board
      await List.deleteMany({ board: boardId }, { session });
      
      // 3. Delete the board itself
      await board.deleteOne({ session });
    });

    // (No socket event needed, the user will be on the dashboard)
    res.status(200).json({ message: 'Board deleted successfully' });
  } catch (error) {
    console.error("DELETE BOARD ERROR:", error);
    if (error.message === 'Board not found') {
      return res.status(404).json({ message: error.message });
    }
    if (error.message === 'Not authorized') {
      return res.status(401).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server Error' });
  } finally {
    session.endSession();
  }
};

// @desc    Get all boards for a user (as owner or member)
// @route   GET /api/boards
// @access  Private
export const getBoards = async (req, res) => {
  try {
    // Find all boards where the 'members' array contains the logged-in user's ID
    const boards = await Board.find({ members: req.user._id });
    res.status(200).json(boards);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get a single board by ID with its lists and cards
// @route   GET /api/boards/:id
// @access  Private
export const getBoardById = async (req, res) => {
    try {
        const board = await Board.findById(req.params.id)
            .populate('owner', 'name email')
            .populate('members', 'name email');

        // check if the board exists
        if (!board) {
            return res.status(404).json({ message: 'Board not found' });
        } 

        // we need to check if any member in the array has an _id that matches the user's _id
        const isMember = board .members.some(member => member._id.equals(req.user._id));

        if (!isMember) {
            return res.status(401).json({ message: 'Not authorized for this board' })
        }

        // find all lists for the board, sorted by their position
        const lists = await List.find({ board: board._id }).sort({ position: 1 });

        // find all cards for this board
        const cards = await Card.find({ board: board._id })

        // structure the data to be easy for the frontend:
        // we'll return the lists, and attach the cards to each list
        const listsWithCards = lists.map(list => {
            // find all cards for the current list
            const listCards = cards
                .filter(card => card.list.toString() === list._id.toString())
                .sort((a, b) => a.position - b.position); // Sort cards by position

            // Mongoose docs are immutable, so we convert to a plain JS object
            return { ...list.toObject(), cards: listCards };
        });

        // Send the final, combined data
        res.status(200).json({
            _id: board._id,
            name: board.name,
            owner: board.owner,
            members: board.members,
            lists: listsWithCards, // Send the lists with their cards
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Add a member to a board
// @route   POST /api/boards/:id/members
// @access  Private (Owner only)
export const addBoardMember = async (req, res) => {
    try {
        const { email } = req.body;
        const board = await Board.findById(req.params.id);

        if (!board) {
            return res.status(404).json({ message: 'Board not found' });
        }

        // --- This is your "User Role" check! ---
        // Check if the person making the request is the board owner
        if (board.owner.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Only the board owner can add members' });
        }

        // Find the user to add by their email
        const userToAdd = await User.findOne({ email });
        if (!userToAdd) {
            return res.status(404).json({ message: 'User not found with that email' });
        }

        // Check if user is already a member
        if (board.members.includes(userToAdd._id)) {
            return res.status(400).json({ message: 'User is already a member' });
        }

        // Add the user to the members array
        board.members.push(userToAdd._id);
        await board.save();

        // Also update the board object we send back to include member details
        const updatedBoard = await Board.findById(req.params.id)
            .populate('owner', 'name email')
            .populate('members', 'name email'); // <-- Populate members

        // This tells everyone in the board's room to refetch their data
        getIO().to(req.params.id).emit('BOARD_UPDATE', {
            message: `User ${userToAdd.name} was added to the board`,
        });
            
        res.status(200).json(updatedBoard);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};