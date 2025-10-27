import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import useAuthAxios from '../hooks/useAuthAxios';
import { useAuth } from '../context/AuthContext';
import { DndContext, closestCorners } from '@dnd-kit/core';
import List from '../components/List'; 
import CreateListForm from '../components/CreateListForm';
import useSocket from '../hooks/useSocket'; 

const BoardPage = () => {
  const { boardId } = useParams();
  const [board, setBoard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const api = useAuthAxios();
  const [lists, setLists] = useState([]);
  const socket = useSocket();
  const [inviteEmail, setInviteEmail] = useState('');

  // Reusable fetch function
  const fetchBoard = async () => {
    try {
      setError(null);
      const response = await api.get(`/boards/${boardId}`);
      setBoard(response.data);
      setLists(response.data.lists);
    } catch (err) {
      setError('Failed to fetch board data.');
      console.error(err);
    }
  };

  // Initial fetch
  useEffect(() => {
    if (user) {
      setLoading(true);
      fetchBoard().finally(() => setLoading(false));
    }
  }, [boardId, user]); 

  // Socket listener
  useEffect(() => {
    if (socket) {
      socket.emit('join_board', boardId);
      const handleBoardUpdate = (data) => {
        console.log('Received board update:', data.message);
        fetchBoard(); // Re-fetch on any update
      };
      socket.on('BOARD_UPDATE', handleBoardUpdate);
      return () => {
        socket.off('BOARD_UPDATE', handleBoardUpdate);
      };
    }
  }, [socket, boardId]);

  // Drag End Handler
  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeCardId = active.id;
    const oldLists = JSON.parse(JSON.stringify(lists));

    let originalList;
    let draggedCard;
    for (const list of lists) {
      draggedCard = list.cards.find(card => card._id === activeCardId);
      if (draggedCard) {
        originalList = list;
        break;
      }
    }
    if (!draggedCard) return;

    let overList = lists.find(list => list._id === over.id);
    let overCard = null;
    if (!overList) {
      for (const list of lists) {
        overCard = list.cards.find(card => card._id === over.id);
        if (overCard) {
          overList = list;
          break;
        }
      }
    }
    if (!overList) return; 

    const newListId = overList._id;
    let newPosition;

    if (overCard) {
      newPosition = overList.cards.findIndex(card => card._id === overCard._id);
    } else {
      newPosition = overList.cards.length;
    }

    // Optimistic Update 
    let newLists = JSON.parse(JSON.stringify(lists));
    const originalListIndex = newLists.findIndex(l => l._id === originalList._id);
    const [removedCard] = newLists[originalListIndex].cards.splice(
      newLists[originalListIndex].cards.findIndex(c => c._id === activeCardId),
      1
    );
    const newListIndex = newLists.findIndex(l => l._id === newListId);
    newLists[newListIndex].cards.splice(newPosition, 0, removedCard);
    setLists(newLists);

    // API Call
    try {
      await api.put(`/cards/${activeCardId}/move`, {
        listId: newListId,
        position: newPosition,
      });
      // Backend emits socket event, no need to re-fetch here
    } catch (err) {
      console.error('Failed to move card:', err);
      setLists(oldLists); // Rollback
      setError('Failed to move card. Reverting changes.');
    }
  };

  // Add Card Handler
  const handleCardAdded = (newCard) => {
    setLists(prevLists => {
      return prevLists.map(list => {
        if (list._id === newCard.list) {
          return { ...list, cards: [...list.cards, newCard] };
        }
        return list;
      });
    });
  };

  // Delete Card Handler
  const handleDeleteCard = async (cardIdToDelete) => {
    const oldLists = JSON.parse(JSON.stringify(lists)); 
    setLists(prevLists => 
      prevLists.map(list => ({
        ...list,
        cards: list.cards.filter(card => card._id !== cardIdToDelete)
      }))
    );
    try {
      await api.delete(`/cards/${cardIdToDelete}`);
      // Backend emits socket event
    } catch (err) {
      console.error("Failed to delete card:", err);
      setError('Failed to delete card. Reverting.');
      setLists(oldLists);
    }
  };

  // Add List Handler
  const handleListAdded = (newList) => {
    // Add an empty cards array for immediate rendering
    setLists(prevLists => [...prevLists, { ...newList, cards: [] }]);
  };

  // Delete List Handler
  const handleDeleteList = async (listIdToDelete) => {
    const oldLists = JSON.parse(JSON.stringify(lists));
    setLists(prevLists => prevLists.filter(list => list._id !== listIdToDelete));
    try {
      await api.delete(`/lists/${listIdToDelete}`);
       // Backend emits socket event
    } catch (err) {
      console.error("Failed to delete list:", err);
      setError('Failed to delete list. Reverting.');
      setLists(oldLists); 
    }
  };

  // Invite Handler
  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    try {
      const response = await api.post(`/boards/${boardId}/members`, { email: inviteEmail });
      setBoard(response.data); // Update board state with populated members
      setInviteEmail('');
      // Backend emits socket event
    } catch (err) {
      console.error('Failed to add member:', err);
      setError(err.response?.data?.message || 'Failed to add member');
    }
  };

  if (loading) return <div className="p-8 text-center">Loading board...</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;
  if (!board) return <div className="p-8">Board not found.</div>;
  
  const isOwner = board && user && board.owner._id === user.id;

  return (
    <DndContext onDragEnd={handleDragEnd} collisionDetection={closestCorners}>
      <div className="flex flex-col h-screen">
        {/* Board Header */}
        <nav className="flex items-center justify-between p-4 bg-white shadow-md">
          <Link to="/" className="text-xl font-bold text-blue-600">
            &larr; Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">{board.name}</h1>
          
          {isOwner && (
            <form onSubmit={handleInvite} className="flex space-x-2">
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="Invite user by email..."
                className="px-3 py-1 border border-gray-300 rounded-md shadow-sm"
              />
              <button
                type="submit"
                className="px-3 py-1 text-white bg-blue-600 rounded-md"
              >
                Invite
              </button>
            </form>
          )}

          <div className="text-gray-700">Owner: {board.owner?.name || '...'}</div>
        </nav>

        {/* Lists Container */}
        <div className="flex-grow p-4 overflow-x-auto bg-gray-100">
          <div className="flex h-full space-x-4">
            {lists.map((list) => (
              <List 
                key={list._id} 
                list={list}
                boardId={board._id} 
                onCardAdded={handleCardAdded} 
                onDeleteCard={handleDeleteCard}
                onDeleteList={handleDeleteList}
              />
            ))}
            <CreateListForm 
              boardId={board._id} 
              onListAdded={handleListAdded} 
            />
          </div>
        </div>
      </div>
    </DndContext>
  );
};

export default BoardPage;