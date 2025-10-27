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

  // Fetch boards
  useEffect(() => {
    const fetchBoards = async () => {
      if (user) { // No need to check for token here, hook handles it
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
  }, [user, api]); // Added api as dependency

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Create board
  const handleCreateBoard = async (e) => {
    e.preventDefault();
    if (!newBoardName.trim()) return; 
    try {
      setError(null);
      const response = await api.post('/boards', { name: newBoardName });
      setBoards([...boards, response.data]);
      setNewBoardName('');
    } catch (err) {
      setError('Failed to create board. Please try again.');
      console.error(err);
    }
  };

  // Delete board
  const handleDeleteBoard = async (boardIdToDelete, e) => {
    e.preventDefault(); 
    e.stopPropagation();

    if (!window.confirm("Are you sure you want to delete this board and all its contents?")) {
      return;
    }

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
        <h2 className="mb-6 text-3xl font-bold text-gray-800">Your Boards</h2>
        
        {/* Create Board Form */}
        <form onSubmit={handleCreateBoard} className="mb-6">
          <div className="flex space-x-2">
            <input
              type="text"
              value={newBoardName}
              onChange={(e) => setNewBoardName(e.target.value)}
              placeholder="New board name..."
              className="flex-grow px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              type="submit"
              className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              Create Board
            </button>
          </div>
        </form>
        
        {/* Display Error if any */}
        {error && <p className="mb-4 text-red-500">{error}</p>}

        {/* Board List */}
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
                  </Link>
                  {/* Delete Button */}
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