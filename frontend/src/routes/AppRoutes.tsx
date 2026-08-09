import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AuthLayout } from '../layouts/AuthLayout';
import { DashboardLayout } from '../layouts/DashboardLayout';

import { LoginPage } from '../pages/auth/LoginPage';
import { RegisterPage } from '../pages/auth/RegisterPage';

import { SuperAdminDashboard } from '../pages/super_admin/SuperAdminDashboard';

import { OwnerDashboard } from '../pages/cafe_owner/OwnerDashboard';
import { BranchesPage } from '../pages/cafe_owner/BranchesPage';
import { MasterMenuPage } from '../pages/cafe_owner/MasterMenuPage';
import { BranchMenuPage } from '../pages/cafe_owner/BranchMenuPage';
import { OwnerOrdersPage } from '../pages/cafe_owner/OwnerOrdersPage';
import { OwnerAnalyticsPage } from '../pages/cafe_owner/OwnerAnalyticsPage';

import { StaffDashboard } from '../pages/staff/StaffDashboard';

import { CustomerMenuPage } from '../pages/customer/CustomerMenuPage';
import { ProtectedRoute } from './ProtectedRoute';

const RootRedirect: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated || !user) return <Navigate to="/login" replace />;

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
};

export const AppRoutes: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth Routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        {/* Super Admin Protected Routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<SuperAdminDashboard />} />
          <Route path="cafes" element={<SuperAdminDashboard />} />
          <Route path="owners" element={<SuperAdminDashboard />} />
          <Route path="reports" element={<SuperAdminDashboard />} />
        </Route>

        {/* Café Owner Protected Routes */}
        <Route
          path="/owner"
          element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'CAFE_OWNER']}>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<OwnerDashboard />} />
          <Route path="branches" element={<BranchesPage />} />
          <Route path="master-menu" element={<MasterMenuPage />} />
          <Route path="branch-menu" element={<BranchMenuPage />} />
          <Route path="orders" element={<OwnerOrdersPage />} />
        </Route>

        {/* Branch Staff Protected Routes */}
        <Route
          path="/staff"
          element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'CAFE_OWNER', 'BRANCH_STAFF']}>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<StaffDashboard />} />
          <Route path="orders" element={<StaffDashboard />} />
        </Route>

        {/* Customer Protected Routes */}
        <Route
          path="/customer"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<CustomerMenuPage />} />
          <Route path="orders" element={<CustomerMenuPage />} />
        </Route>

        {/* Root Fallback */}
        <Route path="/" element={<RootRedirect />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};
