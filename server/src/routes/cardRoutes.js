import express from 'express';
import { createCard, moveCard } from '../controllers/cardContoller.js';
import { protect } from '../middleware/authMiddleware.js'

const router = express.Router();

// protect all card routes
router.use(protect);

router.route('/')
    .post(createCard);

router.route('/:id/move')
    .put(moveCard);

export default router;