import express from 'express';
import { 
  createBoard,
  deleteBoard,
  getBoards, 
  getBoardById,
  addBoardMember
} from '../controllers/boardController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(protect);

router.route('/')
  .post(createBoard)
  .get(getBoards);

router.route('/:id')
  .get(getBoardById)
  .delete(deleteBoard);

router.route('/:id/members')
  .post(addBoardMember);

export default router;