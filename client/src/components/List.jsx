import React, { useState } from 'react'; // Import useState
import { SortableContext } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import Card from './Card';
import CreateCardForm from './CreateCardForm';
import useAuthAxios from '../hooks/useAuthAxios'; // Import API hook

// Add onUpdateWipLimit prop
const List = ({ list, boardId, onCardAdded, onDeleteCard, onDeleteList, onCardClick, onUpdateWipLimit }) => {
  const cardIds = list.cards.map(card => card._id);
  const { setNodeRef } = useDroppable({ id: list._id });
  const api = useAuthAxios(); // Get API client

  // State for editing WIP limit
  const [isEditingWip, setIsEditingWip] = useState(false);
  const [wipValue, setWipValue] = useState(list.wipLimit === null ? '' : list.wipLimit);

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete the list "${list.name}" and all its cards?`)) {
      onDeleteList(list._id);
    }
  };

  const handleWipChange = (e) => {
    setWipValue(e.target.value);
  };

  const handleWipSave = async () => {
    const limit = wipValue === '' ? null : parseInt(wipValue, 10);
    // Basic validation on client-side too
    if (wipValue !== '' && (isNaN(limit) || limit < 1)) {
        alert("WIP Limit must be a positive number or empty.");
        return;
    }
    // Call the parent function (passed from BoardPage) to update via API
    onUpdateWipLimit(list._id, limit);
    setIsEditingWip(false);
  };

  // Determine if WIP limit is exceeded
  const wipExceeded = list.wipLimit !== null && list.cards.length > list.wipLimit;

  return (
    <div
      className={`flex flex-col flex-shrink-0 w-72 bg-gray-200 rounded-lg shadow-md max-h-full ${wipExceeded ? 'border-2 border-red-500' : ''}`} // Add red border if exceeded
    >
      {/* List Header */}
      <div className={`flex items-center justify-between p-3 rounded-t-lg ${wipExceeded ? 'bg-red-200' : 'bg-gray-300'}`}> {/* Change header bg if exceeded */}
        <h3 className={`text-lg font-semibold ${wipExceeded ? 'text-red-800' : 'text-gray-700'}`}>
          {list.name} ({list.cards.length}{list.wipLimit !== null ? ` / ${list.wipLimit}` : ''}) {/* Show card count / limit */}
        </h3>
        {/* WIP Limit Edit Button/Input */}
        <div className="flex items-center space-x-1">
            {isEditingWip ? (
                <>
                    <input
                        type="number"
                        min="1"
                        value={wipValue}
                        onChange={handleWipChange}
                        onBlur={handleWipSave} // Save when input loses focus
                        onKeyDown={(e) => e.key === 'Enter' && handleWipSave()} // Save on Enter
                        className="w-12 px-1 py-0 text-xs border border-gray-400 rounded"
                        placeholder="Limit"
                        autoFocus
                    />
                    <button onClick={handleWipSave} className="text-xs text-blue-600">✓</button>
                    <button onClick={() => setIsEditingWip(false)} className="text-xs text-gray-500">✕</button>
                </>
            ) : (
                <button
                    onClick={() => setIsEditingWip(true)}
                    title="Set WIP Limit"
                    className="px-1 py-0 text-xs text-gray-500 rounded hover:bg-gray-400"
                >
                    {list.wipLimit === null ? 'Set Limit' : `WIP: ${list.wipLimit}`}
                </button>
            )}
            <button
              onClick={handleDelete}
              className="p-1 text-xs text-gray-500 rounded hover:bg-gray-400 hover:text-red-600"
              aria-label="Delete list"
            >
              ✕
            </button>
        </div>
      </div>

      {/* Cards Container */}
      <div
        ref={setNodeRef}
        className="p-3 space-y-3 overflow-y-auto min-h-[100px]"
      >
        <SortableContext items={cardIds}>
          {list.cards.map((card) => (
            <Card
              key={card._id}
              card={card}
              onDelete={onDeleteCard}
              onClick={() => onCardClick(card)}
            />
          ))}
        </SortableContext>

        <CreateCardForm
          listId={list._id}
          boardId={boardId}
          onCardAdded={onCardAdded}
        />
      </div>
    </div>
  );
};

export default List;