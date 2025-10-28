import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import useAuthAxios from '../hooks/useAuthAxios'; // Import the custom hook

const DashboardPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const api = useAuthAxios(); // Use the custom hook

  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newBoardName, setNewBoardName] = useState('');
  const [inviteEmails, setInviteEmails] = useState(''); // <-- ADDED STATE for invite emails

  // Fetch boards
  useEffect(() => {
    const fetchBoards = async () => {
      if (user) {
        try {
          setLoading(true);
          setError(null);
          const response = await api.get('/boards');
          setBoards(response.data);
        } catch (err) {
          setError('Failed to fetch boards.');
          console.error(err);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchBoards();
  }, [user, api]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // --- UPDATED THIS FUNCTION ---
  // Create board
  const handleCreateBoard = async (e) => {
    e.preventDefault();
    if (!newBoardName.trim()) return;

    // Split emails string into an array, trim whitespace, remove empty strings
    const emailsArray = inviteEmails
      .split(',')
      .map(email => email.trim())
      .filter(email => email !== '');

    try {
      setError(null);
      // Send name AND emails array to the backend
      const response = await api.post('/boards', {
        name: newBoardName,
        emails: emailsArray // Pass the processed array
      });
      setBoards([...boards, response.data]);
      setNewBoardName('');
      setInviteEmails(''); // Clear both fields
    } catch (err) {
      setError('Failed to create board. Please try again.');
      console.error(err);
    }
  };
  // -------------------------

  // Delete board
  const handleDeleteBoard = async (boardIdToDelete, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this board and all its contents?")) return;
    const oldBoards = [...boards];
    setBoards(prevBoards => prevBoards.filter(board => board._id !== boardIdToDelete));
    try {
      setError(null);
      await api.delete(`/boards/${boardIdToDelete}`);
    } catch (err) {
      console.error("Failed to delete board:", err);
      setError('Failed to delete board. Reverting.');
      setBoards(oldBoards);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navbar */}
      <nav className="flex items-center justify-between p-4 bg-white shadow-md">
        <h1 className="text-2xl font-bold text-blue-600">TaskFlow</h1>
        <div className="flex items-center space-x-4">
          <span className="text-gray-700">Welcome, {user?.name}!</span>
          <button
            onClick={handleLogout}
            className="px-4 py-2 font-medium text-white bg-red-500 rounded-md hover:bg-red-600"
          >
            Logout
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="p-8">
        <h2 className="mb-6 text-3xl font-bold text-gray-800">Create New Board</h2>

        {/* --- UPDATED THIS FORM --- */}
        <form onSubmit={handleCreateBoard} className="mb-6 p-4 bg-white rounded shadow">
          {/* Board Name Input */}
          <div className="mb-4">
             <label htmlFor="boardName" className="block text-sm font-medium text-gray-700 mb-1">Board Name</label>
            <input
              id="boardName"
              type="text"
              value={newBoardName}
              onChange={(e) => setNewBoardName(e.target.value)}
              placeholder="Enter board name..."
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Invite Emails Input */}
          <div className="mb-4">
            <label htmlFor="inviteEmails" className="block text-sm font-medium text-gray-700 mb-1">Invite Members (Optional)</label>
            <input
              id="inviteEmails"
              type="text"
              value={inviteEmails}
              onChange={(e) => setInviteEmails(e.target.value)}
              placeholder="Enter emails, separated by commas..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
             <p className="text-xs text-gray-500 mt-1">Users must already be registered.</p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full sm:w-auto px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            Create Board
          </button>
        </form>
        {/* ------------------------- */}

        {/* Display Error if any */}
        {error && <p className="mb-4 text-red-500">{error}</p>}

        {/* Your Boards Section */}
        <h2 className="mb-6 text-3xl font-bold text-gray-800">Your Boards</h2>
        {loading && <p>Loading boards...</p>}
        {!loading && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {boards.length > 0 ? (
              boards.map((board) => (
                <div key={board._id} className="relative group">
                  <Link
                    to={`/board/${board._id}`}
                    className="block p-6 bg-white rounded-lg shadow-md hover:shadow-lg hover:bg-blue-50 transition"
                  >
                    <h3 className="text-xl font-semibold text-gray-900">{board.name}</h3>
                     {/* Optional: Display member count or icons */}
                     <p className="text-sm text-gray-500 mt-2">{board.members.length} member(s)</p>
                  </Link>
                  <button
                    onClick={(e) => handleDeleteBoard(board._id, e)}
                    className="absolute top-2 right-2 p-1 text-xs text-gray-400 bg-gray-100 rounded opacity-0 group-hover:opacity-100 hover:text-red-500 hover:bg-gray-200"
                    aria-label="Delete board"
                  >
                     ✕
                  </button>
                </div>
              ))
            ) : (
              <p>You don't have any boards yet. Create one above!</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;