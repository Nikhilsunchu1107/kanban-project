import mongoose from 'mongoose';

// Define allowed values for priority and tag
const priorities = ['Low', 'Medium', 'High'];
const tags = ['Frontend', 'Backend', 'Bug', 'UI/UX', 'Feature', 'Refactor', 'DevOps'];

const cardSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: '', // Default to empty string
  },
  board: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Board',
  },
  list: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'List',
  },
  position: {
    type: Number,
    required: true,
  },
  // --- NEW FIELDS ---
  dueDate: {
    type: Date,
    default: null,
  },
  priority: {
    type: String,
    enum: priorities, // Only allow values from the priorities array
    default: 'Medium', // Default priority
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Link to a User
    default: null, // Default to unassigned
  },
  tag: {
    type: String,
    enum: tags, // Only allow values from the tags array
    default: null,
  },
  // ------------------
}, { timestamps: true });

const Card = mongoose.model('Card', cardSchema);

// Export priorities and tags for frontend use if needed
export { priorities, tags };
export default Card;