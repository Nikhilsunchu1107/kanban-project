import React, { useState, useEffect } from 'react';

const CardEditForm = ({ card, onSave, onCancel }) => {
  // Initialize state with the card's current details
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description || '');

  // Update state if the selected card changes (edge case)
  useEffect(() => {
    setTitle(card.title);
    setDescription(card.description || '');
  }, [card]);

  const handleSave = () => {
    // Only save if changes were made
    if (title.trim() && (title !== card.title || description !== (card.description || ''))) {
      onSave(card._id, { title, description });
    } else {
      onCancel(); // Close if no changes or title is empty
    }
  };

  return (
    <div className="space-y-4">
      {/* Title Input */}
      <div>
        <label htmlFor="cardTitle" className="block text-sm font-medium text-gray-700">
          Title
        </label>
        <input
          type="text"
          id="cardTitle"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          required
        />
      </div>

      {/* Description Textarea */}
      <div>
        <label htmlFor="cardDescription" className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <textarea
          id="cardDescription"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows="4"
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder="Add a more detailed description..."
        />
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-2">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
        >
          Save
        </button>
      </div>
    </div>
  );
};

export default CardEditForm;