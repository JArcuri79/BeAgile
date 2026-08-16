import React from 'react';
import { NavLink, useNavigate, useParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';

const NavigationMenu = ({ isOpen, onClose }) => {
  const { role, currentUser, isAuthenticated, logout } = useAuth();
  const { accentColor } = useTheme();
  const navigate = useNavigate();
  const { companySlug, workspaceSlug } = useParams();
  const currentUrl = window.location.href;

  const getMenuItems = () => {
    if (role === 'guest' || role === 'user') return [];

    const base = companySlug && workspaceSlug ? `/${companySlug}/${workspaceSlug}` : '';

    if (role === 'global_admin') {
      return [
        { name: 'Manage Companies', path: '/companies', icon: FiIcons.FiBriefcase },
        { name: 'Manage Workspaces', path: '/projects', icon: FiIcons.FiLayers },
        { name: 'Manage Users', path: '/users', icon: FiIcons.FiUsers },
        { name: 'Company Settings', path: base ? `${base}/company-settings` : '/company-settings', icon: FiIcons.FiSettings },
        { name: 'Account Settings', path: base ? `${base}/account` : '/account', icon: FiIcons.FiUser },
      ];
    }

    if (role === 'admin') {
      const companyProjects = companySlug ? `/${companySlug}/projects` : '/projects';
      const workspaceUsers = base ? `${base}/users` : companyProjects;
      return [
        { name: 'Company Workspaces', path: companyProjects, icon: FiIcons.FiLayers },
        { name: 'Workspace Users', path: workspaceUsers, icon: FiIcons.FiUsers },
        { name: 'Company Settings', path: base ? `${base}/company-settings` : '/company-settings', icon: FiIcons.FiSettings },
        { name: 'Account Settings', path: base ? `${base}/account` : '/account', icon: FiIcons.FiUser },
      ];
    }

    if (role === 'crew') {
      const companyProjects = companySlug ? `/${companySlug}/projects` : '/projects';
      const workspaceUsers = base ? `${base}/users` : companyProjects;
      return [
        { name: 'My Workspaces', path: companyProjects, icon: FiIcons.FiLayers },
        { name: 'Workspace Users', path: workspaceUsers, icon: FiIcons.FiUsers },
        { name: 'Account Settings', path: base ? `${base}/account` : '/account', icon: FiIcons.FiUser },
      ];
    }

    return [];
  };

  const visibleItems = getMenuItems();

  const handleAuthClick = () => {
    onClose();
    if (isAuthenticated) {
      logout();
      navigate('/login');
    } else {
      navigate('/login');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-80 bg-[var(--bg-card)] border-l border-[var(--border-color)] z-[70] p-6 shadow-2xl flex flex-col overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-xl font-black uppercase tracking-tighter text-[var(--text-main)]">System Menu</h2>
              <button onClick={onClose} className="p-2 hover:bg-[var(--bg-main)] text-[var(--text-main)] rounded-lg transition-colors">
                <SafeIcon icon={FiIcons.FiX} />
              </button>
            </div>

            <div className="flex-1 space-y-6">
              <div className="space-y-2">
                <p className="text-[10px] font-black text-[var(--text-muted)] uppercase px-2 tracking-widest">Navigation</p>
                {visibleItems.map(item => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={onClose}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-[var(--bg-main)] text-[var(--text-main)] transition-all group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-[var(--accent)]/10 flex items-center justify-center text-[var(--accent)] group-hover:bg-[var(--accent)] group-hover:text-[var(--accent-foreground)] transition-colors">
                      <SafeIcon icon={item.icon} />
                    </div>
                    <span className="font-bold">{item.name}</span>
                  </NavLink>
                ))}

                <button
                  onClick={handleAuthClick}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-[var(--bg-main)] text-[var(--text-main)] transition-all group"
                >
                  <div className="w-8 h-8 rounded-lg bg-[var(--accent)]/10 flex items-center justify-center text-[var(--accent)] group-hover:bg-[var(--accent)] group-hover:text-[var(--accent-foreground)] transition-colors">
                    <SafeIcon icon={isAuthenticated ? FiIcons.FiLogOut : FiIcons.FiLogIn} />
                  </div>
                  <span className="font-bold">{isAuthenticated ? 'Logout' : 'Login'}</span>
                </button>

                {currentUser && (
                  <div className="px-3 pt-2">
                    <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Signed in as</p>
                    <p className="text-sm font-bold text-[var(--text-main)] mt-1 truncate">{currentUser.name}</p>
                    <p className="text-[10px] text-[var(--text-muted)] truncate">{currentUser.email}</p>
                  </div>
                )}
              </div>

              <div className="pt-6 border-t border-[var(--border-color)]">
                <p className="text-[10px] font-black text-[var(--text-muted)] uppercase px-2 mb-4 tracking-widest">Share Context</p>
                <div className="bg-white p-6 rounded-2xl flex flex-col items-center gap-4 border border-[var(--border-color)] shadow-inner">
                  <QRCodeSVG value={currentUrl} size={160} fgColor={accentColor} />
                  <div className="w-full">
                    <p className="text-[10px] font-bold text-gray-400 mb-1">Current Page URL:</p>
                    <p className="text-[10px] text-gray-500 font-mono break-all bg-gray-50 p-2 rounded border border-gray-100">{currentUrl}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 mt-auto border-t border-[var(--border-color)] text-center text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest">
              BeAgile v2.5.0-Pro
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default NavigationMenu;
