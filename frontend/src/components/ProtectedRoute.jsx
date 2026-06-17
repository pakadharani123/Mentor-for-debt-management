import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div class="min-h-screen bg-brand-dark flex flex-col justify-center items-center">
        <div class="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
        <p class="mt-4 text-brand-muted text-sm font-medium animate-pulse">Verifying credentials...</p>
      </div>
    );
  }

  // If not logged in, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If admin path requested but user is not admin, redirect to home dashboard
  if (adminOnly && user.role !== 'admin') {
    console.warn('Unauthorized administrative access attempt. Redirecting.');
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
