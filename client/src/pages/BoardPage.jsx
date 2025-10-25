import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import useAuthAxios from '../hooks/useAuthAxios';
import { useAuth } from '../context/AuthContext';
import { DndContext, closestCorners } from '@dnd-kit/core';
import List from '../components/List';
import useSocket from '../hooks/useSocket' 

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

    // CREATE A REUSABLE FETCH FUNCTION
    // We'll use this for the initial load AND real-time updates
    const fetchBoard = async () => {
        try {
            // Don't set loading to true here, to avoid flashes on update
            setError(null);
            const response = await api.get(`/boards/${boardId}`);
            setBoard(response.data);
            setLists(response.data.lists);
        } catch (err) {
            setError('Failed to fetch board data.');
            console.error(err);
        }
    };

    useEffect(() => {
        if (user) {
            setLoading(true);
            fetchBoard().finally(() => setLoading(false));
        }
    }, [boardId, user]); // Removed 'api' from deps, 'fetchBoard' is stable now

    // --- 5. ADD THIS NEW useEffect FOR SOCKETS ---
    useEffect(() => {
        if (socket) {
            // 1. Join the "room" for this board
            socket.emit('join_board', boardId);

            // 2. Listen for updates
            const handleBoardUpdate = (data) => {
                console.log('Received board update:', data.message);
                // When an update happens, just re-fetch the entire board
                // This is the simplest and most robust way to stay in sync
                fetchBoard();
            };
            
            socket.on('BOARD_UPDATE', handleBoardUpdate);

            // 3. Clean up the listener when the component unmounts
            return () => {
                socket.off('BOARD_UPDATE', handleBoardUpdate);
            };
        }
    }, [socket, boardId]);

  // This is the main drag-and-drop handler
  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeCardId = active.id;
    
    // Store the current state for rollback
    const oldLists = JSON.parse(JSON.stringify(lists));

    // Find original list and card
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

    // Find destination list (from useDroppable) or card (from useSortable)
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
    if (!overList) return; // Invalid drop

    const newListId = overList._id;
    let newPosition;

    if (overCard) {
      // Dropped on a card
      newPosition = overList.cards.findIndex(card => card._id === overCard._id);
    } else {
      // Dropped on a list (useDroppable area)
      newPosition = overList.cards.length;
    }

    // --- Optimistic Update ---
    let newLists = JSON.parse(JSON.stringify(lists));
    const originalListIndex = newLists.findIndex(l => l._id === originalList._id);
    const [removedCard] = newLists[originalListIndex].cards.splice(
      newLists[originalListIndex].cards.findIndex(c => c._id === activeCardId),
      1
    );
    const newListIndex = newLists.findIndex(l => l._id === newListId);
    newLists[newListIndex].cards.splice(newPosition, 0, removedCard);
    setLists(newLists);

    // --- API Call & Refetch ---
    try {
      await api.put(`/cards/${activeCardId}/move`, {
        listId: newListId,
        position: newPosition,
      });
    } catch (err) {
      console.error('Failed to move card:', err);
      setLists(oldLists); // Rollback on failure
      setError('Failed to move card. Reverting changes.');
    }
  };

  const handleCardAdded = (newCard) => {
    // Find the list the card belongs to and add it
    setLists(prevLists => {
      return prevLists.map(list => {
        if (list._id === newCard.list) {
          // Return a new list object with the new card added
          return { ...list, cards: [...list.cards, newCard] };
        }
        return list;
      });
    });
  };

    const handleInvite = async (e) => {
        e.preventDefault();
        if (!inviteEmail.trim()) return;

        try {
            // Call our new endpoint
            const response = await api.post(`/boards/${boardId}/members`, { email: inviteEmail });
            
            // Update the board state with the new member data
            // The API returns the full board with populated members
            setBoard(response.data);
            setInviteEmail(''); // Clear the form

        } catch (err) {
            console.error('Failed to add member:', err);
            setError(err.response?.data?.message || 'Failed to add member');
        }
    };

    if (loading) return <div className="p-8 text-center">Loading board...</div>;
    if (error) return <div className="p-8 text-red-500">{error}</div>;
    if (!board) return <div className="p-8">Board not found.</div>;

    console.log("OWNER CHECK:", 
        "Board Owner:", board.owner, 
        "Logged-in User:", user
    );

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
                />
              ))}
          </div>
        </div>
      </div>
    </DndContext>
  );
};

export default BoardPage;