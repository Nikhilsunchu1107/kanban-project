import mongoose from "mongoose";

const listSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  board: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Board', // Links the list to a Board
  },
  position: {
    type: Number, // We will use this for ordering
    required: true,
  },
}, { timestamps: true });

const List = mongoose.model('List', listSchema);
export default List;