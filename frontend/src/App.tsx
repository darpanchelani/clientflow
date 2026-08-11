import React, { Suspense, lazy, useEffect } from "react";
import { Box, CircularProgress } from "@mui/material";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAppDispatch } from "./store";
import { checkAuth } from "./store/slices/authSlice";

// Components
import ProtectedRoute from "./components/auth/ProtectedRoute";
import Layout from "./components/layout/Layout";

const LoginPage = lazy(() => import("./pages/LoginPage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const LeadsPage = lazy(() => import("./pages/LeadsPage"));
const ClientsPage = lazy(() => import("./pages/ClientsPage"));
const ProjectsPage = lazy(() => import("./pages/ProjectsPage"));
const ProjectDetailPage = lazy(() => import("./pages/ProjectDetailPage"));
const InvoicesPage = lazy(() => import("./pages/InvoicesPage"));
const InvoiceDetailPage = lazy(() => import("./pages/InvoiceDetailPage"));
const PaymentsPage = lazy(() => import("./pages/PaymentsPage"));
const FollowUpsPage = lazy(() => import("./pages/FollowUpsPage"));
const ActivityFeedPage = lazy(() => import("./pages/ActivityFeedPage"));
const AutomationSettingsPage = lazy(
  () => import("./pages/AutomationSettingsPage")
);
const AnalyticsPage = lazy(() => import("./pages/AnalyticsPage"));
const ExecutiveDashboardPage = lazy(
  () => import("./pages/ExecutiveDashboardPage")
);
const ReportsPage = lazy(() => import("./pages/ReportsPage"));
const AIInsightsPage = lazy(() => import("./pages/AIInsightsPage"));
const ProposalsPage = lazy(() => import("./pages/ProposalsPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));

function App() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    // Check authentication status on app load
    dispatch(checkAuth());
  }, [dispatch]);

  return (
    <Suspense
      fallback={
        <Box
          role="status"
          aria-label="Loading page"
          sx={{ minHeight: "100vh", display: "grid", placeItems: "center" }}
        >
          <CircularProgress size={34} />
        </Box>
      }
    >
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
          path="/proposals"
          element={
            <ProtectedRoute>
              <Layout>
                <ProposalsPage />
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

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Layout>
                <ProfilePage />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}

export default App;
