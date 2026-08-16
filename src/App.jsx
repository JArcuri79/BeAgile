import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate, Outlet, useParams } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import { WorkspaceProvider } from './contexts/WorkspaceContext';

import Header from './components/layout/Header';
import Dashboard from './pages/Dashboard';
import Roadmap from './pages/Roadmap';
import Bugs from './pages/Bugs';
import ProjectList from './pages/ProjectList';
import MyList from './pages/MyList';
import Kanban from './pages/Kanban';
import Changelog from './pages/Changelog';
import AppSettings from './pages/AppSettings';
import Users from './pages/Users';
import WorkspaceUsers from './pages/WorkspaceUsers';
import Projects from './pages/Projects';
import Companies from './pages/Companies';
import AccountSettings from './pages/AccountSettings';
import Login from './pages/Login';
import ResetPassword from './pages/ResetPassword';
import Links from './pages/Links';
import Notes from './pages/Notes';

import './App.css';
import '@questlabs/react-sdk/dist/style.css';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { role, isLoading } = useAuth();
  if (isLoading) return null;
  if (!allowedRoles.includes(role)) {
    return <Navigate to="/projects" replace />;
  }
  return children;
};

const WorkspaceLayout = () => {
  return (
    <WorkspaceProvider>
      <Outlet />
    </WorkspaceProvider>
  );
};

const AppRoutes = () => {
  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Header />
      <main className="flex-1 overflow-x-hidden">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/companies" element={<ProtectedRoute allowedRoles={['global_admin']}><Companies /></ProtectedRoute>} />
          <Route path="/users" element={<ProtectedRoute allowedRoles={['global_admin']}><Users /></ProtectedRoute>} />
          <Route path="/projects" element={<ProtectedRoute allowedRoles={['user', 'crew', 'admin', 'global_admin']}><Projects /></ProtectedRoute>} />

          <Route path="/:companySlug/projects" element={<ProtectedRoute allowedRoles={['admin', 'global_admin', 'crew', 'user']}><Projects /></ProtectedRoute>} />

          <Route path="/:companySlug/:workspaceSlug" element={<ProtectedRoute allowedRoles={['user', 'crew', 'admin', 'global_admin']}><WorkspaceLayout /></ProtectedRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="roadmap" element={<Roadmap />} />
            <Route path="bugs" element={<Bugs />} />
            <Route path="project-list" element={<ProjectList />} />
            <Route path="my-list" element={<MyList />} />
            <Route path="kanban" element={<Kanban />} />
            <Route path="changelog" element={<Changelog />} />
            <Route path="links" element={<Links />} />
            <Route path="notes" element={<Notes />} />
            <Route path="account" element={<AccountSettings />} />
            <Route path="settings/app" element={<AppSettings />} />
            <Route path="users" element={<WorkspaceUsers />} />
            <Route path="*" element={<Navigate to="." replace />} />
          </Route>

          <Route path="*" element={<Navigate to="/projects" replace />} />
        </Routes>
      </main>
    </div>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <DataProvider>
          <Router>
            <AppRoutes />
          </Router>
        </DataProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
