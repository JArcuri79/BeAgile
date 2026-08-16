import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';

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
import Projects from './pages/Projects';
import Companies from './pages/Companies';
import AccountSettings from './pages/AccountSettings';
import Login from './pages/Login';
import Links from './pages/Links';
import Notes from './pages/Notes';

import './App.css';
import '@questlabs/react-sdk/dist/style.css';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { role, isLoading } = useAuth();
  if (isLoading) return null;
  if (!allowedRoles.includes(role)) {
    return <Navigate to="/roadmap" replace />;
  }
  return children;
};

const AppRoutes = () => {
  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Header />
      <main className="flex-1 overflow-x-hidden">
        <Routes>
          <Route path="/" element={<ProtectedRoute allowedRoles={['crew', 'admin', 'global_admin']}><Dashboard /></ProtectedRoute>} />
          <Route path="/projects" element={<ProtectedRoute allowedRoles={['crew', 'admin', 'global_admin']}><Projects /></ProtectedRoute>} />
          <Route path="/companies" element={<ProtectedRoute allowedRoles={['global_admin']}><Companies /></ProtectedRoute>} />
          <Route path="/account" element={<ProtectedRoute allowedRoles={['user', 'crew', 'admin', 'global_admin']}><AccountSettings /></ProtectedRoute>} />
          <Route path="/login" element={<Login />} />
          
          <Route path="/roadmap" element={<Roadmap />} />
          <Route path="/bugs" element={<Bugs />} />
          <Route path="/changelog" element={<Changelog />} />
          
          {/* Changed allowedRoles to include crew for the following paths */}
          <Route path="/project-list" element={<ProtectedRoute allowedRoles={['crew', 'admin', 'global_admin']}><ProjectList /></ProtectedRoute>} />
          <Route path="/my-list" element={<ProtectedRoute allowedRoles={['crew', 'admin', 'global_admin']}><MyList /></ProtectedRoute>} />
          <Route path="/kanban" element={<ProtectedRoute allowedRoles={['crew', 'admin', 'global_admin']}><Kanban /></ProtectedRoute>} />
          <Route path="/links" element={<ProtectedRoute allowedRoles={['crew', 'admin', 'global_admin']}><Links /></ProtectedRoute>} />
          <Route path="/notes" element={<ProtectedRoute allowedRoles={['crew', 'admin', 'global_admin']}><Notes /></ProtectedRoute>} />
          
          <Route path="/settings/app" element={<ProtectedRoute allowedRoles={['crew', 'admin', 'global_admin']}><AppSettings /></ProtectedRoute>} />
          <Route path="/settings/users" element={<ProtectedRoute allowedRoles={['admin', 'global_admin']}><Users /></ProtectedRoute>} />
          
          <Route path="*" element={<Navigate to="/roadmap" replace />} />
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