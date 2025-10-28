import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Map priorities to border colors
const priorityBorderColors = {
  Low: 'border-l-4 border-green-500',
  Medium: 'border-l-4 border-yellow-500',
  High: 'border-l-4 border-red-500',
};

// Map tags to background/text colors
const tagColors = {
  Frontend: 'bg-blue-100 text-blue-800',
  Backend: 'bg-purple-100 text-purple-800',
  Bug: 'bg-red-100 text-red-800',
  'UI/UX': 'bg-pink-100 text-pink-800',
  Feature: 'bg-green-100 text-green-800',
  Refactor: 'bg-indigo-100 text-indigo-800',
  DevOps: 'bg-gray-100 text-gray-800',
};

// Helper to format date
const formatDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    // Simple format like Oct 28
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

// Helper to get initials
const getInitials = (name = '') => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
}

const Card = ({ card, onDelete, onClick }) => {
  const {
    attributes, listeners, setNodeRef, transform, transition, isDragging,
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

  const formattedDueDate = formatDate(card.dueDate);
  const isDueSoon = card.dueDate && new Date(card.dueDate) < new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // Within 3 days
  const isOverdue = card.dueDate && new Date(card.dueDate) < new Date();

  return (
    <div
      ref={setNodeRef} style={style} {...attributes} onClick={onClick}
      // Add left border based on priority
      className={`relative p-3 bg-white rounded-md shadow-sm group cursor-pointer hover:bg-gray-50 ${priorityBorderColors[card.priority] || 'border-l-4 border-transparent'}`}
    >
      {/* Drag Handle Area */}
      <div {...listeners} onClick={(e) => e.stopPropagation()} className="cursor-grab">
        {/* Optional: Add Tag */}
        {card.tag && (
            <span className={`text-xs font-semibold mr-2 px-2 py-0.5 rounded ${tagColors[card.tag] || 'bg-gray-100 text-gray-800'}`}>
                {card.tag}
            </span>
        )}
        {/* Card Title */}
        <span className="text-sm">{card.title}</span>
      </div>

      {/* Footer for Due Date & Assignee */}
      <div className="flex justify-between items-center mt-2 pt-1 border-t border-gray-100">
        {/* Due Date Display */}
        {formattedDueDate && (
          <span className={`text-xs px-1.5 py-0.5 rounded ${
            isOverdue ? 'bg-red-100 text-red-800' : isDueSoon ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-600'
          }`}>
            📅 {formattedDueDate}
          </span>
        )}
        {/* Assignee Initial Bubble */}
        {card.assignedTo && (
            <div
              title={card.assignedTo.name}
              className="flex items-center justify-center w-5 h-5 bg-gray-300 rounded-full text-xs font-semibold text-gray-700"
            >
              {getInitials(card.assignedTo.name)}
            </div>
        )}
      </div>

      {/* Delete Button */}
      <button
        onClick={handleDelete}
        className="absolute top-1 right-1 p-0.5 text-xs text-gray-400 bg-gray-100 rounded opacity-0 group-hover:opacity-100 hover:text-red-500 hover:bg-gray-200 z-10"
        aria-label="Delete card"
      >
        ✕
      </button>
    </div>
  );
};

export default Card;