import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';
import DashboardLayout from '../layouts/DashboardLayout';

// Pages
import Login from '../pages/Login';
import Register from '../pages/Register';
import Dashboard from '../pages/Dashboard';
import RecoveryScore from '../pages/RecoveryScore';
import LoanManagement from '../pages/LoanManagement';
import ExpenseTracker from '../pages/ExpenseTracker';
import DebtSimulator from '../pages/DebtSimulator';
import DebtForecast from '../pages/DebtForecast';
import AnalyticsCenter from '../pages/AnalyticsCenter';
import AICoach from '../pages/AICoach';
import PaymentTracker from '../pages/PaymentTracker';
import AdminDashboard from '../pages/AdminDashboard';
import AuditReport from '../pages/AuditReport';
import FinancialProfile from '../pages/FinancialProfile';
import SmartFinancialAdvisor from '../pages/SmartFinancialAdvisor';
import RecoveryJourney from '../pages/RecoveryJourney';


const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Auth Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected Main App Layout */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="recovery-score" element={<RecoveryScore />} />
        <Route path="loans" element={<LoanManagement />} />
        <Route path="expenses" element={<ExpenseTracker />} />
        <Route path="simulator" element={<DebtSimulator />} />
        <Route path="forecast" element={<DebtForecast />} />
        <Route path="analytics" element={<AnalyticsCenter />} />
        <Route path="ai-coach" element={<AICoach />} />
        <Route path="payments" element={<PaymentTracker />} />
        <Route path="audit" element={<AuditReport />} />
        <Route path="settings/profile" element={<FinancialProfile />} />
        <Route path="smart-advisor" element={<SmartFinancialAdvisor />} />
        <Route path="recovery-journey" element={<RecoveryJourney />} />
        
        {/* Admin Dashboard - restricted routing */}
        <Route
          path="admin"
          element={
            <ProtectedRoute adminOnly={true}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Fallback route */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default AppRoutes;
