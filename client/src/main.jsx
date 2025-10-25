import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import App from './App.jsx';
import './index.css'; // Tailwind styles
import ProtectedRoute, { GuestRoute } from './components/ProtectedRoute.jsx';
import { AuthProvider } from "./context/AuthContext.jsx";

// Import new pages
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import BoardPage from './pages/BoardPage.jsx';

// Define the routes
const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      // Routes for logged-in users
      {
        element: <ProtectedRoute />,
        children: [
          { path: '/', element: <DashboardPage /> },
          { path: '/board/:boardId', element: <BoardPage /> },
        ],
      },
      // Routes for logged-out users
      {
        element: <GuestRoute />,
        children: [
          { path: '/login', element: <LoginPage /> },
          { path: '/register', element: <RegisterPage /> },
        ],
      },
    ],
  },
])

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </React.StrictMode>
);