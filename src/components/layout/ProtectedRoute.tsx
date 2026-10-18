import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { getAuthState } from '../../services/storage';

export const ProtectedRoute: React.FC = () => {
  const isAuthenticated = getAuthState();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};
