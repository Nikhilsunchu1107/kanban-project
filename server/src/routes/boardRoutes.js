import express from 'express';
import { 
  createBoard, 
  getBoards, 
  getBoardById,
  addBoardMember
} from '../controllers/boardController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// We apply the 'protect' middleware to all routes in this file
// This ensures only logged-in users can create or see boards
router.use(protect);

router.route('/')
  .post(createBoard)
  .get(getBoards);

router.route('/:id')
  .get(getBoardById);

router.route('/:id/members')
  .post(addBoardMember);

export default router;