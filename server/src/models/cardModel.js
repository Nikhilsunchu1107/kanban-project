import mongoose from 'mongoose';

const cardSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  board: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Board', // Links the card directly to the board
  },
  list: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'List', // Links the card to a List
  },
  position: {
    type: Number, // For ordering within a list
    required: true,
  },
}, { timestamps: true });

const Card = mongoose.model('Card', cardSchema);
export default Card;