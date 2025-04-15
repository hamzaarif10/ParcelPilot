import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('authToken'); // Check if token exists

  if (!token) {
    return <Navigate to="/login" />; // Redirect to login if no token
  }

  return children; // Render the protected component
};

export default ProtectedRoute;