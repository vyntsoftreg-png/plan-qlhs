import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Layout, Spin } from 'antd';

// Middleware
import PrivateRoute from './middleware/PrivateRoute';
import { checkAuth } from './redux/slices/authSlice';

// Pages
import LoginPage from './pages/auth/LoginPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import ChildrenPage from './pages/children/ChildrenPage';
import UsersPage from './pages/users/UsersPage';
import SkillsPage from './pages/skills/SkillsPage';
import PlansPage from './pages/plans/PlansPage';
import EvaluationsPage from './pages/evaluations/EvaluationsPage';
import TemplatesPage from './pages/templates/TemplatesPage';
import KindergartenPage from './pages/settings/KindergartenPage';
import AnalyticsPage from './pages/analytics/AnalyticsPage';
import NotFoundPage from './pages/NotFoundPage';
import LandingPage from './pages/LandingPage';

// Layouts
import MainLayout from './layouts/MainLayout';

function App() {
  const dispatch = useDispatch();
  const { isAuthenticated, initializing } = useSelector(state => state.auth);

  useEffect(() => {
    // Check if user is already logged in
    dispatch(checkAuth());
  }, [dispatch]);

  if (initializing) {
    return (
      <Layout style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh'}}>
        <Spin size="large" />
      </Layout>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <MainLayout>
                <DashboardPage />
              </MainLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/children"
          element={
            <PrivateRoute>
              <MainLayout>
                <ChildrenPage />
              </MainLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/users"
          element={
            <PrivateRoute>
              <MainLayout>
                <UsersPage />
              </MainLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/skills"
          element={
            <PrivateRoute>
              <MainLayout>
                <SkillsPage />
              </MainLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/plans"
          element={
            <PrivateRoute>
              <MainLayout>
                <PlansPage />
              </MainLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/evaluations"
          element={
            <PrivateRoute>
              <MainLayout>
                <EvaluationsPage />
              </MainLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/templates"
          element={
            <PrivateRoute>
              <MainLayout>
                <TemplatesPage />
              </MainLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <PrivateRoute>
              <MainLayout>
                <KindergartenPage />
              </MainLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/analytics"
          element={
            <PrivateRoute>
              <MainLayout>
                <AnalyticsPage />
              </MainLayout>
            </PrivateRoute>
          }
        />

        {/* Default redirect */}
        <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" /> : <LandingPage />} />

        {/* 404 Not Found */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Router>
  );
}

export default App;
