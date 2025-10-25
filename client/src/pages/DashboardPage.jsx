import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

// Create an Axios instance for API calls that require auth
const authAxios = (token) => {
  return axios.create({
    baseURL: 'http://localhost:5001/api',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

const DashboardPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newBoardName, setNewBoardName] = useState(''); // <-- ADDED STATE FOR THE FORM

  // Fetch boards when the page loads
  useEffect(() => {
    const fetchBoards = async () => {
      if (user && user.token) {
        try {
          setLoading(true);
          const api = authAxios(user.token);
          const response = await api.get('/boards');
          setBoards(response.data);
          setLoading(false);
        } catch (err) {
          setError('Failed to fetch boards.');
          setLoading(false);
          console.error(err);
        }
      }
    };
    fetchBoards();
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // --- ADDED THIS FUNCTION ---
  // Handles the creation of a new board
  const handleCreateBoard = async (e) => {
    e.preventDefault();
    if (!newBoardName.trim()) return; // Don't create empty boards

    try {
      const api = authAxios(user.token);
      // Call the create board endpoint
      const response = await api.post('/boards', { name: newBoardName });
      
      // Add the new board to our state to update the UI instantly
      setBoards([...boards, response.data]);
      
      // Clear the input field
      setNewBoardName('');
    } catch (err) {
      setError('Failed to create board. Please try again.');
      console.error(err);
    }
  };
  // -------------------------

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
        
        {/* --- ADDED THIS FORM --- */}
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
        {/* ------------------------- */}
        
        {loading && <p>Loading boards...</p>}
        {error && <p className="text-red-500">{error}</p>}
        
        {!loading && !error && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {boards.length > 0 ? (
              boards.map((board) => (
                <Link
                  key={board._id}
                  to={`/board/${board._id}`}
                  className="block p-6 bg-white rounded-lg shadow-md hover:shadow-lg hover:bg-blue-50 transition"
                >
                  <h3 className="text-xl font-semibold text-gray-900">{board.name}</h3>
                </Link>
              ))
            ) : (
              <p>You don't have any boards yet.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;