import express from 'express';
import {
    createCard,
    moveCard,
    deleteCard,
    updateCard
} from '../controllers/cardContoller.js';
import { protect } from '../middleware/authMiddleware.js'

const router = express.Router();
router.use(protect);

router.route('/')
    .post(createCard);

router.route('/:id/move')
    .put(moveCard);

router.route('/:id')
    .delete(deleteCard)
    .put(updateCard);

export default router;