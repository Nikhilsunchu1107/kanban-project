import React from 'react';

const Modal = ({ isOpen, onClose, children }) => {
  if (!isOpen) {
    return null; // Don't render anything if the modal is closed
  }

  return (
    // Backdrop (semi-transparent background)
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={onClose} // Close modal if backdrop is clicked
    >
      {/* Modal Content */}
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 relative"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the modal
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 p-1 text-gray-500 rounded-full hover:bg-gray-200 hover:text-gray-800"
          aria-label="Close modal"
        >
          ✕
        </button>
        {/* Content passed from parent */}
        {children}
      </div>
    </div>
  );
};

export default Modal;