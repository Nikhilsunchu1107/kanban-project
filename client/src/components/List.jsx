import React from 'react';
import { SortableContext } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import Card from './Card';
import CreateCardForm from './CreateCardForm';

const List = ({ list, boardId, onCardAdded }) => { 
  const cardIds = list.cards.map(card => card._id);

  // Make the list a droppable area, using its ID
  const { setNodeRef } = useDroppable({ id: list._id });

  return (
    <div 
      className="flex flex-col flex-shrink-0 w-72 bg-gray-200 rounded-lg shadow-md max-h-full"
    >
      {/* List Header */}
      <h3 className="p-3 text-lg font-semibold text-gray-700 bg-gray-300 rounded-t-lg">
        {list.name}
      </h3>
      
      {/* Cards Container */}
      <div 
        ref={setNodeRef}
        className="p-3 space-y-3 overflow-y-auto min-h-[100px]" // Added min-h for empty lists
      >
        <SortableContext items={cardIds}>
          {list.cards.map((card) => (
            <Card key={card._id} card={card} />
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