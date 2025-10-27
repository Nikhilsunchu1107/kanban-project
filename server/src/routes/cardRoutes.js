import express from 'express';
import { createCard, moveCard, deleteCard } from '../controllers/cardContoller.js';
import { protect } from '../middleware/authMiddleware.js'

const router = express.Router();
router.use(protect);

router.route('/')
    .post(createCard);

router.route('/:id/move')
    .put(moveCard);

router.route('/:id')
    .delete(deleteCard);

export default router;