import React, { useState } from 'react';
import useAuthAxios from '../hooks/useAuthAxios';

const CreateCardForm = ({ listId, boardId, onCardAdded }) => {
  const [title, setTitle] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const api = useAuthAxios();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      const response = await api.post('/cards', {
        title,
        listId,
        boardId,
      });
      
      onCardAdded(response.data); 
      setTitle('');
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to create card:', err);
    }
  };

  if (!isEditing) {
    return (
      <button
        onClick={() => setIsEditing(true)}
        className="w-full px-3 py-2 text-left text-gray-600 rounded-md hover:bg-gray-300"
      >
        + Add a card
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <textarea
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Enter a title for this card..."
        className="w-full p-2 border border-gray-300 rounded-md shadow-sm"
        rows="3"
        autoFocus
      />
      <div className="flex items-center mt-2 space-x-2">
        <button
          type="submit"
          className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
        >
          Add Card
        </button>
        <button
          type="button"
          onClick={() => setIsEditing(false)}
          className="px-4 py-2 text-gray-700 rounded-md hover:bg-gray-300"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

export default CreateCardForm;