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
import CardSummaryModal from '../components/CardSummaryModal';

const BoardPage = () => {
  const { boardId } = useParams();
  const [board, setBoard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const api = useAuthAxios();
  const [lists, setLists] = useState([]);
  const socket = useSocket();
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);

  // Reusable fetch function
  const fetchBoard = async () => {
    try {
      // setError(null); // Keep previous errors unless explicitly cleared
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
    if (!draggedCard || !originalList) return;

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
    const originalCardIndex = newLists[originalListIndex].cards.findIndex(c => c._id === activeCardId);
    const [removedCard] = newLists[originalListIndex].cards.splice(originalCardIndex, 1);
    const newListIndex = newLists.findIndex(l => l._id === newListId);
    newLists[newListIndex].cards.splice(newPosition, 0, removedCard);
    setLists(newLists);

    // API Call
    try {
      await api.put(`/cards/${activeCardId}/move`, {
        listId: newListId,
        position: newPosition,
      });
      // Backend emits socket event
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
    setLists(prevLists => [...prevLists, { ...newList, cards: [], wipLimit: newList.wipLimit || null }]);
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

  // Update List WIP Limit Handler
  const handleUpdateWipLimit = async (listId, newLimit) => {
    const oldLists = JSON.parse(JSON.stringify(lists));
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

  // Invite Handler (for the form on this page)
  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    try {
      setError(null); // Clear previous errors
      // Use the dedicated endpoint for adding members
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
    const oldLists = JSON.parse(JSON.stringify(lists));
    setLists(prevLists =>
      prevLists.map(list => ({
        ...list,
        cards: list.cards.map(card =>
          card._id === cardId ? { ...card, ...updatedData } : card
        )
      }))
    );
    handleCloseCardModal();

    try {
      await api.put(`/cards/${cardId}`, updatedData);
      // Backend emits socket event
    } catch (err) {
      console.error("Failed to update card:", err);
      setError('Failed to update card. Reverting.');
      setLists(oldLists);
    }
  };

  // Modal Handlers
  const handleCardClick = (card) => {
    setSelectedCard(card);
    setIsCardModalOpen(true);
  };

  const handleCloseCardModal = () => {
    setIsCardModalOpen(false);
    setSelectedCard(null);
  };

  // --- 3. Add Handlers for Summary Modal ---
  const handleOpenSummaryModal = () => {
    setIsSummaryModalOpen(true);
  };

  const handleCloseSummaryModal = () => {
    setIsSummaryModalOpen(false);
  };

  // This function is called when a card is clicked in the summary table
  const handleSelectCardFromSummary = (card) => {
    // We already have the card data, just open the edit modal
    setSelectedCard(card);
    setIsCardModalOpen(true);
    // handleCloseSummaryModal() is called by the summary modal itself
  };

  // Render Guards
  if (loading) return <div className="p-8 text-center">Loading board...</div>;
  if (error && !isCardModalOpen) return <div className="p-8 text-red-500">{error}</div>;
  if (!board) return <div className="p-8">Board not found.</div>;

  // Check if the current user owns the board AFTER board is loaded
  const isOwner = board && user && board.owner._id === user.id;

  return (
    <DndContext onDragEnd={handleDragEnd} collisionDetection={closestCorners}>
      <div className="flex flex-col h-screen">
        {/* Board Header */}
        <nav className="flex items-center justify-between p-4 bg-white shadow-md flex-wrap gap-2">
          <Link to="/" className="text-xl font-bold text-blue-600">
            &larr; Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-gray-800 text-center order-first w-full sm:order-none sm:w-auto">
            {board.name}
          </h1>

          <div className="flex items-center space-x-4">
            <button
              onClick={handleOpenSummaryModal}
              className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md text-sm hover:bg-gray-300"
            >
              View Summary
            </button>
            {/* Invite Form - Conditionally rendered */}
            {isOwner && (
              <form onSubmit={handleInvite} className="flex space-x-2">
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="Invite user by email..."
                  className="px-3 py-1 border border-gray-300 rounded-md shadow-sm text-sm"
                />
                <button
                  type="submit"
                  className="px-3 py-1 text-white bg-blue-600 rounded-md text-sm"
                >
                  Invite
                </button>
              </form>
            )}
            <div className="text-gray-700 text-sm whitespace-nowrap">
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
        <Modal isOpen={isCardModalOpen} onClose={handleCloseCardModal}>
          {selectedCard && (
            <CardEditForm
              card={selectedCard}
              boardMembers={board.members}
              onSave={handleUpdateCard}
              onCancel={handleCloseCardModal}
            />
          )}
        </Modal>

        {/* --- Add Card Summary Modal --- */}
        <CardSummaryModal
          isOpen={isSummaryModalOpen}
          onClose={handleCloseSummaryModal}
          lists={lists} // Pass the lists data
          onCardSelect={handleSelectCardFromSummary} // Pass the callback
        />

      </div>
    </DndContext>
  );
};

export default BoardPage;