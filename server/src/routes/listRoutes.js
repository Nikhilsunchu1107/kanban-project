import express from 'express'
import { protect } from '../middleware/authMiddleware.js'
import { createList, deleteList, updateListWipLimit } from "../controllers/listController.js";

const router = express.Router();
router.use(protect);

router.route('/')
    .post(createList);

router.route('/:id')
    .delete(deleteList);

router.route('/:id/wip')
    .put(updateListWipLimit);

export default router;