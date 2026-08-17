import React, { useState } from 'react';
import { NavLink, useMatch } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import NavigationMenu from './NavigationMenu';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import { motion } from 'framer-motion';

const Header = () => {
  const { role, switchRole, currentUser } = useAuth();
  const { isDark, toggleTheme, logoUrl, companyName } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [imgError, setImgError] = useState(false);
  const workspaceMatch = useMatch('/:companySlug/:workspaceSlug/*');
  const companySlug = workspaceMatch?.params?.companySlug;
  const workspaceSlug = workspaceMatch?.params?.workspaceSlug;

  const base = companySlug && workspaceSlug ? `/${companySlug}/${workspaceSlug}` : '';

  const navLinks = [
    { name: 'Dashboard', path: base || '/', allowedRoles: ['crew', 'admin', 'global_admin'] },
    { name: 'Roadmap', path: base ? `${base}/roadmap` : '/roadmap', allowedRoles: ['guest', 'user', 'crew', 'admin', 'global_admin'] },
    { name: 'Bugs Log', path: base ? `${base}/bugs` : '/bugs', allowedRoles: ['guest', 'user', 'crew', 'admin', 'global_admin'] },
    { name: 'Project List', path: base ? `${base}/project-list` : '/project-list', allowedRoles: ['crew', 'admin', 'global_admin'] },
    { name: 'My List', path: base ? `${base}/my-list` : '/my-list', allowedRoles: ['crew', 'admin', 'global_admin'] },
    { name: 'Kanban', path: base ? `${base}/kanban` : '/kanban', allowedRoles: ['crew', 'admin', 'global_admin'] },
    { name: 'Changelog', path: base ? `${base}/changelog` : '/changelog', allowedRoles: ['guest', 'user', 'crew', 'admin', 'global_admin'] },
    { name: 'Links', path: base ? `${base}/links` : '/links', allowedRoles: ['crew', 'admin', 'global_admin'] },
    { name: 'Notes', path: base ? `${base}/notes` : '/notes', allowedRoles: ['crew', 'admin', 'global_admin'] },
  ].filter(link => link.allowedRoles.includes(role));

  const homeLink = '/';

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[var(--border-color)] bg-[var(--bg-card)]">
      <div className="bg-[var(--accent)] text-[var(--accent-foreground)] px-4 sm:px-8 py-1.5 text-[10px] flex justify-between items-center font-black tracking-widest uppercase transition-colors">
        <span className="hidden sm:inline">{companySlug && workspaceSlug ? `${companySlug} / ${workspaceSlug}` : 'Global Infrastructure Node'}</span>
        <div className="flex gap-2 sm:gap-4 items-center overflow-x-auto">
          <span className="opacity-70 hidden md:inline">Simulation Context:</span>
          <div className="flex gap-1 bg-black/20 p-0.5 rounded-md">
            {['guest', 'user', 'crew', 'admin', 'global_admin'].map(r => (
              <button
                key={r}
                onClick={() => switchRole(r)}
                className={`px-2 sm:px-3 py-0.5 rounded transition-all whitespace-nowrap ${role === r ? 'bg-white text-black shadow-sm' : 'hover:bg-white/10'}`}
              >
                {r.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="w-full px-8 h-16 flex items-center justify-between border-b border-[var(--border-color)]">
        <div className="flex items-center gap-6">
          <NavLink to={homeLink} className="flex items-center gap-3 font-black text-2xl tracking-tighter">
            {(!logoUrl || imgError) ? (
              <div className="w-9 h-9 bg-[var(--accent)] rounded-xl flex items-center justify-center text-[var(--accent-foreground)] shadow-lg transition-all">
                <SafeIcon icon={FiIcons.FiZap} className="text-xl" />
              </div>
            ) : (
              <img src={logoUrl} alt="Logo" className="h-9 w-auto rounded-lg shadow-sm" onError={() => setImgError(true)} />
            )}
            <span className="text-[var(--text-main)] truncate max-w-[150px] sm:max-w-[250px]">{companyName || 'BeAgile'}</span>
          </NavLink>
        </div>

        <div className="flex items-center gap-4">
          <button onClick={toggleTheme} className="p-2.5 rounded-full hover:bg-[var(--bg-main)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-all">
            <SafeIcon icon={isDark ? FiIcons.FiSun : FiIcons.FiMoon} className="text-lg" />
          </button>
          <div className="h-8 w-[1px] bg-[var(--border-color)] mx-2" />
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-[10px] font-black uppercase text-[var(--text-muted)]">Authenticated</p>
              <p className="text-sm font-bold capitalize mt-1 text-[var(--text-main)]">{role.replace('_', ' ')} Session</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] flex items-center justify-center font-black text-[var(--accent)] shadow-inner">
              {role.charAt(0).toUpperCase()}
            </div>
          </div>
          <div className="h-8 w-[1px] bg-[var(--border-color)] mx-2" />
          <button onClick={() => setIsMenuOpen(true)} className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-[var(--bg-main)] border border-transparent hover:border-[var(--border-color)] transition-all">
            <SafeIcon icon={FiIcons.FiMenu} className="text-xl text-[var(--text-main)]" />
          </button>
        </div>
      </div>

      <div className="w-full px-8 h-12 flex items-center gap-8 bg-[var(--bg-card)] overflow-x-auto">
        <nav className="flex gap-8 h-full whitespace-nowrap">
          {(role === 'guest' || role === 'user') && (
            <a href={companyName} target="_blank" rel="noopener noreferrer" className="h-full flex items-center gap-2 px-1 text-sm font-black tracking-tight text-[var(--text-main)] hover:text-[var(--accent)] transition-all border-b-2 border-transparent hover:border-[var(--accent)]">
              <SafeIcon icon={FiIcons.FiGlobe} /> Home
            </a>
          )}

          {navLinks.map(link => (
            <NavLink
              key={link.path}
              to={link.path}
              className={({ isActive }) => `h-full flex items-center relative px-1 text-sm font-bold tracking-tight transition-all ${isActive ? 'text-[var(--accent)]' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
            >
              {({ isActive }) => (
                <>
                  {link.name}
                  {isActive && (
                    <motion.div layoutId="header-nav-tab" className="absolute bottom-0 left-0 w-full h-0.5 bg-[var(--accent)] rounded-full" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      <NavigationMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </header>
  );
};

export default Header;
