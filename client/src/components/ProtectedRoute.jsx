import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate, Outlet } from 'react-router-dom';

// This component protects routes that REQUIRE a user to be logged in
const ProtectedRoute = () => {
  const { user } = useAuth();

  if (!user) {
    // If no user, redirect to the login page
    return <Navigate to="/login" replace />;
  }

  // If there is a user, render the child component (e.g., DashboardPage)
  return <Outlet />;
};

// This component protects routes for "guests" (logged-out users)
export const GuestRoute = () => {
  const { user } = useAuth();

  if (user) {
    // If a user is logged in, redirect them to the dashboard
    return <Navigate to="/" replace />;
  }

  // If no user, render the child component (e.g., LoginPage)
  return <Outlet />;
};

export default ProtectedRoute;