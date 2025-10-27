import React, { useState } from 'react';
import useAuthAxios from '../hooks/useAuthAxios';

const CreateListForm = ({ boardId, onListAdded }) => {
  const [name, setName] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const api = useAuthAxios();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      const response = await api.post('/lists', { name, boardId });
      onListAdded(response.data);
      setName('');
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to create list:', err);
    }
  };

  if (!isEditing) {
    return (
      <button
        onClick={() => setIsEditing(true)}
        className="flex-shrink-0 w-72 px-3 py-2 text-left text-gray-600 bg-gray-300 rounded-lg shadow-sm hover:bg-gray-400"
      >
        + Add another list
      </button>
    );
  }

  return (
    <div className="flex-shrink-0 w-72 p-3 bg-gray-300 rounded-lg shadow-sm">
      <form onSubmit={handleSubmit}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter list title..."
          className="w-full p-2 mb-2 border border-gray-400 rounded-md shadow-sm"
          autoFocus
        />
        <div className="flex items-center space-x-2">
          <button
            type="submit"
            className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            Add List
          </button>
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="px-4 py-2 text-gray-700 rounded-md hover:bg-gray-400"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateListForm;