import React from 'react';
import Modal from './Modal'; // Reuse your existing Modal component

// Helper to format date nicely or return 'N/A'
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  } catch (e) {
    return 'Invalid Date';
  }
};

const CardSummaryModal = ({ isOpen, onClose, lists, onCardSelect }) => {
  // Flatten the cards from all lists into a single array, adding the list name
  const allCards = lists.reduce((acc, list) => {
    list.cards.forEach(card => {
      acc.push({ ...card, phase: list.name }); // Add the list name as 'phase'
    });
    return acc;
  }, []);

  const handleRowClick = (card) => {
    onCardSelect(card); // Call the function passed from BoardPage
    onClose(); // Close the summary modal
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h2 className="text-2xl font-semibold mb-4">Card Summary</h2>
      <div className="max-h-[70vh] overflow-y-auto"> {/* Make table scrollable */}
        <table className="min-w-full divide-y divide-gray-200 border border-gray-200">
          <thead className="bg-gray-50 sticky top-0"> {/* Sticky header */}
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r">Title</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r">Phase</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r">Priority</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r">Due Date</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r">Assigned To</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tag</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {allCards.length > 0 ? (
              allCards.map((card) => (
                <tr key={card._id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-blue-600 border-r">
                    {/* Make title clickable */}
                    <button onClick={() => handleRowClick(card)} className="text-left hover:underline">
                      {card.title}
                    </button>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 border-r">{card.phase}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 border-r">{card.priority || 'N/A'}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 border-r">{formatDate(card.dueDate)}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 border-r">{card.assignedTo?.name || 'Unassigned'}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{card.tag || 'None'}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="px-4 py-4 text-center text-sm text-gray-500">No cards found on this board.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="mt-4 text-right">
        <button
          onClick={onClose}
          className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
        >
          Close
        </button>
      </div>
    </Modal>
  );
};

export default CardSummaryModal;