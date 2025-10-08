import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { OrganizationProvider } from './contexts/OrganizationContext';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import MembershipList from './pages/MembershipList';
import MembershipDetail from './pages/MembershipDetail';
import MembershipTypes from './pages/MembershipTypes';
import UserList from './pages/UserList';
import UserProfile from './pages/UserProfile';
import Committees from './pages/Committees';
import EmailTemplates from './pages/EmailTemplates';
import EmailCampaigns from './pages/EmailCampaigns';
import Documents from './pages/Documents';
import Events from './pages/Events';
import Forum from './pages/Forum';
import Settings from './pages/Settings';
import Layout from './components/Layout';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function PrivateRoute({ children, roles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" />;
  }

  return children;
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <AuthProvider>
          <OrganizationProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              <Route path="/" element={
                <PrivateRoute>
                  <Layout />
                </PrivateRoute>
              }>
                <Route index element={<Navigate to="/dashboard" />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="memberships" element={<MembershipList />} />
                <Route path="memberships/:id" element={<MembershipDetail />} />
                <Route path="membership-types" element={
                  <PrivateRoute roles={['admin', 'super_admin']}>
                    <MembershipTypes />
                  </PrivateRoute>
                } />
                <Route path="users" element={
                  <PrivateRoute roles={['admin', 'super_admin']}>
                    <UserList />
                  </PrivateRoute>
                } />
                <Route path="profile" element={<UserProfile />} />
                <Route path="committees" element={<Committees />} />
                <Route path="email-templates" element={
                  <PrivateRoute roles={['admin', 'super_admin']}>
                    <EmailTemplates />
                  </PrivateRoute>
                } />
                <Route path="email-campaigns" element={
                  <PrivateRoute roles={['admin', 'super_admin']}>
                    <EmailCampaigns />
                  </PrivateRoute>
                } />
                <Route path="documents" element={<Documents />} />
                <Route path="events" element={<Events />} />
                <Route path="forum" element={<Forum />} />
                <Route path="settings" element={
                  <PrivateRoute roles={['admin', 'super_admin']}>
                    <Settings />
                  </PrivateRoute>
                } />
              </Route>
            </Routes>
          </OrganizationProvider>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;