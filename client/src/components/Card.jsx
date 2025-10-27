import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const Card = ({ card, onDelete, onClick }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleDelete = (e) => {
    e.stopPropagation(); // Prevent drag from starting and prevent modal from opening
    if (window.confirm("Are you sure you want to delete this card?")) {
      onDelete(card._id);
    }
  };

  return (
    // Main div gets the ref, style, attributes, and onClick (for modal)
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      onClick={onClick} // Open modal on click
      className="relative p-3 bg-white rounded-md shadow-sm group cursor-pointer hover:bg-gray-50" // Changed cursor to pointer
    >
      {/* Attach the drag listeners ONLY to the card title area */}
      <div
        {...listeners} // Make only this part draggable
        onClick={(e) => e.stopPropagation()} // Prevent modal opening when starting drag
        className="mb-1 cursor-grab" // Drag handle cursor
      >
        {card.title}
      </div>

      {/* Delete Button */}
      <button
        onClick={handleDelete} // Separate onClick for delete
        className="absolute top-1 right-1 p-0.5 text-xs text-gray-400 bg-gray-100 rounded opacity-0 group-hover:opacity-100 hover:text-red-500 hover:bg-gray-200 z-10" // Added z-index
        aria-label="Delete card"
      >
        ✕
      </button>
    </div>
  );
};

export default Card;