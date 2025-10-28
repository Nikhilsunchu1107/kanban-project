import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import useAuthAxios from '../hooks/useAuthAxios';
import { useAuth } from '../context/AuthContext';
import { DndContext, closestCorners } from '@dnd-kit/core';
import List from '../components/List';
import CreateListForm from '../components/CreateListForm';
import useSocket from '../hooks/useSocket';
import Modal from '../components/Modal'; // Import Modal
import CardEditForm from '../components/CardEditForm'; // Import Edit Form

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
  const [isModalOpen, setIsModalOpen] = useState(false); // Modal state
  const [selectedCard, setSelectedCard] = useState(null); // Selected card state

  // Reusable fetch function
  const fetchBoard = async () => {
    try {
      // setError(null); // Avoid clearing error on automatic refetch from socket
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
  }, [boardId, user]); // Dependency array includes user and boardId

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
  }, [socket, boardId]); // Dependency array includes socket and boardId

  // Drag End Handler
  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeCardId = active.id;
    const oldLists = JSON.parse(JSON.stringify(lists)); // Deep copy for rollback

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
    if (!draggedCard || !originalList) return; // Card not found or somehow list is missing

    // Find destination list and card/list index
    let overList = lists.find(list => list._id === over.id);
    let overCard = null;
    if (!overList) { // If not dropped directly on a list, find which list the target card is in
      for (const list of lists) {
        overCard = list.cards.find(card => card._id === over.id);
        if (overCard) {
          overList = list;
          break;
        }
      }
    }
    if (!overList) return; // Invalid drop target

    const newListId = overList._id;
    let newPosition;

    if (overCard) { // Dropped onto another card
      newPosition = overList.cards.findIndex(card => card._id === overCard._id);
    } else { // Dropped onto a list column itself
      newPosition = overList.cards.length;
    }

    // --- Optimistic Update ---
    let newLists = JSON.parse(JSON.stringify(lists)); // Deep copy for manipulation
    const originalListIndex = newLists.findIndex(l => l._id === originalList._id);
    const originalCardIndex = newLists[originalListIndex].cards.findIndex(c => c._id === activeCardId);
    const [removedCard] = newLists[originalListIndex].cards.splice(originalCardIndex, 1);
    const newListIndex = newLists.findIndex(l => l._id === newListId);
    newLists[newListIndex].cards.splice(newPosition, 0, removedCard);
    setLists(newLists);

    // --- API Call ---
    try {
      await api.put(`/cards/${activeCardId}/move`, {
        listId: newListId,
        position: newPosition,
      });
      // Backend emits socket event, confirmation/refetch handled by socket listener
    } catch (err) {
      console.error('Failed to move card:', err);
      setLists(oldLists); // Rollback optimistic update on error
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
    const oldLists = JSON.parse(JSON.stringify(lists)); // For rollback
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
      setLists(oldLists); // Rollback on error
    }
  };

  // Add List Handler
  const handleListAdded = (newList) => {
    // Add an empty cards array and potentially default wipLimit for immediate rendering
    setLists(prevLists => [...prevLists, { ...newList, cards: [], wipLimit: newList.wipLimit || null }]);
  };

  // Delete List Handler
  const handleDeleteList = async (listIdToDelete) => {
    const oldLists = JSON.parse(JSON.stringify(lists)); // For rollback
    setLists(prevLists => prevLists.filter(list => list._id !== listIdToDelete));
    try {
      await api.delete(`/lists/${listIdToDelete}`);
      // Backend emits socket event
    } catch (err) {
      console.error("Failed to delete list:", err);
      setError('Failed to delete list. Reverting.');
      setLists(oldLists); // Rollback
    }
  };

  // Update List WIP Limit Handler
  const handleUpdateWipLimit = async (listId, newLimit) => {
    const oldLists = JSON.parse(JSON.stringify(lists)); // For rollback
    // Optimistic Update
    setLists(prevLists => prevLists.map(list =>
      list._id === listId ? { ...list, wipLimit: newLimit } : list
    ));
    try {
      await api.put(`/lists/${listId}/wip`, { wipLimit: newLimit });
      // Backend emits socket event
    } catch (err) {
      console.error("Failed to update WIP limit:", err);
      setError('Failed to update WIP limit. Reverting.');
      setLists(oldLists); // Rollback
    }
  };

  // Invite Handler
  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    try {
      setError(null); // Clear previous errors
      const response = await api.post(`/boards/${boardId}/members`, { email: inviteEmail });
      setBoard(response.data); // Update board state with populated members
      setInviteEmail('');
      // Backend emits socket event
    } catch (err) {
      console.error('Failed to add member:', err);
      setError(err.response?.data?.message || 'Failed to add member');
    }
  };

  // Update Card Handler (for Modal)
  const handleUpdateCard = async (cardId, updatedData) => {
    const oldLists = JSON.parse(JSON.stringify(lists)); // For rollback
    // Optimistic Update
    setLists(prevLists =>
      prevLists.map(list => ({
        ...list,
        cards: list.cards.map(card =>
          card._id === cardId ? { ...card, ...updatedData } : card
        )
      }))
    );
    handleCloseModal(); // Close modal immediately

    try {
      await api.put(`/cards/${cardId}`, updatedData);
      // Backend emits socket event
    } catch (err) {
      console.error("Failed to update card:", err);
      setError('Failed to update card. Reverting.');
      setLists(oldLists); // Rollback on error
    }
  };

  // Modal Handlers
  const handleCardClick = (card) => {
    setSelectedCard(card);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCard(null);
  };

  // Render Guards
  if (loading) return <div className="p-8 text-center">Loading board...</div>;
  if (error && !isModalOpen) return <div className="p-8 text-red-500">{error}</div>; // Don't show board error if modal error occurs
  if (!board) return <div className="p-8">Board not found.</div>;

  const isOwner = board && user && board.owner._id === user.id;

  return (
    <DndContext onDragEnd={handleDragEnd} collisionDetection={closestCorners}>
      <div className="flex flex-col h-screen">
        {/* Board Header */}
        <nav className="flex items-center justify-between p-4 bg-white shadow-md flex-wrap gap-2"> {/* Added flex-wrap and gap */}
          <Link to="/" className="text-xl font-bold text-blue-600">
            &larr; Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-gray-800 text-center order-first w-full sm:order-none sm:w-auto"> {/* Centered title, adjusted order */}
            {board.name}
          </h1>

          <div className="flex items-center space-x-4"> {/* Container for invite and owner */}
            {isOwner && (
              <form onSubmit={handleInvite} className="flex space-x-2">
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="Invite user by email..."
                  className="px-3 py-1 border border-gray-300 rounded-md shadow-sm text-sm" // Smaller text
                />
                <button
                  type="submit"
                  className="px-3 py-1 text-white bg-blue-600 rounded-md text-sm" // Smaller text
                >
                  Invite
                </button>
              </form>
            )}
            <div className="text-gray-700 text-sm whitespace-nowrap"> {/* Prevent wrapping */}
              Owner: {board.owner?.name || '...'}
            </div>
          </div>
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
                onCardClick={handleCardClick} // Pass click handler
                onUpdateWipLimit={handleUpdateWipLimit} // Pass WIP update handler
              />
            ))}
            <CreateListForm
              boardId={board._id}
              onListAdded={handleListAdded}
            />
          </div>
        </div>

        {/* Card Details Modal */}
        <Modal isOpen={isModalOpen} onClose={handleCloseModal}>
          {selectedCard && (
            <CardEditForm
              card={selectedCard}
              onSave={handleUpdateCard}
              onCancel={handleCloseModal}
            />
          )}
        </Modal>

      </div>
    </DndContext>
  );
};

export default BoardPage;