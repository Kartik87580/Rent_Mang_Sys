import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Properties } from './pages/Properties';
import { AddProperty } from './pages/AddProperty';
import { EditProperty } from './pages/EditProperty';
import { Payments } from './pages/Payments';
import { AddPayment } from './pages/AddPayment';
import { EditPayment } from './pages/EditPayment';
import { Settings } from './pages/Settings';
import { Layout } from './components/layout/Layout';
import { ProtectedRoute } from './components/layout/ProtectedRoute';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Route */}
        <Route path="/login" element={<Login />} />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/properties" element={<Properties />} />
            <Route path="/properties/new" element={<AddProperty />} />
            <Route path="/properties/:id/edit" element={<EditProperty />} />
            <Route path="/payments" element={<Payments />} />
            <Route path="/payments/new" element={<AddPayment />} />
            <Route path="/payments/:id/edit" element={<EditPayment />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
