import React from 'react';
import { SortableContext } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import Card from './Card';
import CreateCardForm from './CreateCardForm';

const List = ({ list, boardId, onCardAdded, onDeleteCard, onDeleteList }) => { 
  const cardIds = list.cards.map(card => card._id);

  const { setNodeRef } = useDroppable({ id: list._id });

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete the list "${list.name}" and all its cards?`)) {
      onDeleteList(list._id);
    }
  };

  return (
    <div 
      className="flex flex-col flex-shrink-0 w-72 bg-gray-200 rounded-lg shadow-md max-h-full"
    >
      {/* List Header */}
      <div className="flex items-center justify-between p-3 bg-gray-300 rounded-t-lg">
        <h3 className="text-lg font-semibold text-gray-700">
          {list.name}
        </h3>
        <button 
          onClick={handleDelete}
          className="p-1 text-xs text-gray-500 rounded hover:bg-gray-400 hover:text-red-600"
          aria-label="Delete list"
        >
          ✕
        </button>
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