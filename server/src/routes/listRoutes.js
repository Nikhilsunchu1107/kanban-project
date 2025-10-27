import express from 'express'
import { protect } from '../middleware/authMiddleware'
import { createList, deleteList } from "../controllers/listController.js";

const router = express.Router();
router.use(protect);

router.route('/')
    .post(createList);

router.route('/:id')
    .delete(deleteList);

export default router;