import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAppDispatch } from './store';
import { checkAuth } from './store/slices/authSlice';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import LeadsPage from './pages/LeadsPage';
import ClientsPage from './pages/ClientsPage';
import ProjectsPage from './pages/ProjectsPage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import InvoicesPage from './pages/InvoicesPage';
import InvoiceDetailPage from './pages/InvoiceDetailPage';
import PaymentsPage from './pages/PaymentsPage';
import FollowUpsPage from './pages/FollowUpsPage';
import ActivityFeedPage from './pages/ActivityFeedPage';
import AutomationSettingsPage from './pages/AutomationSettingsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import ExecutiveDashboardPage from './pages/ExecutiveDashboardPage';
import ReportsPage from './pages/ReportsPage';
import AIInsightsPage from './pages/AIInsightsPage';
import NotFoundPage from './pages/NotFoundPage';

// Components
import ProtectedRoute from './components/auth/ProtectedRoute';
import Layout from './components/layout/Layout';

function App() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    // Check authentication status on app load
    dispatch(checkAuth());
  }, [dispatch]);

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Protected routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout>
              <Navigate to="/dashboard" replace />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Layout>
              <DashboardPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/leads"
        element={
          <ProtectedRoute>
            <Layout>
              <LeadsPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/clients"
        element={
          <ProtectedRoute>
            <Layout>
              <ClientsPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/projects"
        element={
          <ProtectedRoute>
            <Layout>
              <ProjectsPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/projects/:projectId"
        element={
          <ProtectedRoute>
            <Layout>
              <ProjectDetailPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/invoices"
        element={
          <ProtectedRoute>
            <Layout>
              <InvoicesPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/invoices/:invoiceId"
        element={
          <ProtectedRoute>
            <Layout>
              <InvoiceDetailPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/payments"
        element={
          <ProtectedRoute>
            <Layout>
              <PaymentsPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/follow-ups"
        element={
          <ProtectedRoute>
            <Layout>
              <FollowUpsPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/activity"
        element={
          <ProtectedRoute>
            <Layout>
              <ActivityFeedPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/automation"
        element={
          <ProtectedRoute>
            <Layout>
              <AutomationSettingsPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/analytics"
        element={
          <ProtectedRoute>
            <Layout>
              <AnalyticsPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/ai-insights"
        element={
          <ProtectedRoute>
            <Layout>
              <AIInsightsPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/executive"
        element={
          <ProtectedRoute>
            <Layout>
              <ExecutiveDashboardPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/reports"
        element={
          <ProtectedRoute>
            <Layout>
              <ReportsPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;
