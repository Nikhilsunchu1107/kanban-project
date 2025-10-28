import mongoose from 'mongoose';

const listSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  board: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Board',
  },
  position: {
    type: Number,
    required: true,
  },
  // --- ADD THIS FIELD ---
  wipLimit: {
    type: Number,
    default: null, // Default to no limit
  },
  // ----------------------
}, { timestamps: true });

const List = mongoose.model('List', listSchema);
export default List;