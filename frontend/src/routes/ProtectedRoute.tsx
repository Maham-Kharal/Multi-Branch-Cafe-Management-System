import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF7F2]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to user's authorized home dashboard
    switch (user.role) {
      case 'SUPER_ADMIN':
        return <Navigate to="/admin" replace />;
      case 'CAFE_OWNER':
        return <Navigate to="/owner" replace />;
      case 'BRANCH_STAFF':
        return <Navigate to="/staff" replace />;
      default:
        return <Navigate to="/customer" replace />;
    }
  }

  return <>{children}</>;
};
