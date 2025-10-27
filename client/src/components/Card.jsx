import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const Card = ({ card, onDelete }) => {
  const {
    attributes,
    listeners, // We still need this from the hook
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
    e.stopPropagation(); 
    if (window.confirm("Are you sure you want to delete this card?")) {
      onDelete(card._id);
    }
  };

  return (
    // Main div gets the ref, style, and attributes, but NOT listeners
    <div
      ref={setNodeRef}
      style={style}
      {...attributes} 
      className="relative p-3 bg-white rounded-md shadow-sm group cursor-grab" // Added cursor-grab
    >
      {/* Attach the drag listeners ONLY to the card title area */}
      <div {...listeners} className="mb-1"> {/* Wrap title and make it the handle */}
        {card.title}
      </div>
      
      {/* Delete Button */}
      <button
        onClick={handleDelete}
        className="absolute top-1 right-1 p-0.5 text-xs text-gray-400 bg-gray-100 rounded opacity-0 group-hover:opacity-100 hover:text-red-500 hover:bg-gray-200"
        aria-label="Delete card"
      >
        ✕
      </button>
    </div>
  );
};

export default Card;