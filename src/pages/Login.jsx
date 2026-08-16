import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

const Login = () => {
  const { companyName } = useTheme();
  const { login, isAuthenticated, currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await login(email, password);
      if (result.success) {
        navigate(from, { replace: true });
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err?.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full min-h-[calc(100vh-124px)] flex items-center justify-center bg-[var(--bg-main)] p-4">
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-12 rounded-[2.5rem] shadow-2xl max-w-md w-full text-center">
        <div className="w-20 h-20 rounded-3xl bg-[var(--accent)] flex items-center justify-center text-[var(--accent-foreground)] shadow-xl mx-auto mb-8">
          <SafeIcon icon={FiIcons.FiZap} className="text-4xl" />
        </div>
        <h1 className="text-3xl font-black tracking-tighter mb-2 text-[var(--text-main)]">Welcome Back</h1>
        <p className="text-[var(--text-muted)] font-bold text-sm mb-10">Sign in to {companyName || 'BeAgile'} Workspace</p>
        
        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div>
            <input 
              type="email" 
              placeholder="Email Address" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl px-4 py-4 text-sm font-bold focus:outline-none focus:border-[var(--accent)] text-[var(--text-main)]" 
            />
          </div>
          <div>
            <input 
              type="password" 
              placeholder="Password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl px-4 py-4 text-sm font-bold focus:outline-none focus:border-[var(--accent)] text-[var(--text-main)]" 
            />
          </div>

          {error && (
            <p className="text-red-500 text-xs font-bold text-center">{error}</p>
          )}

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full py-4 rounded-xl bg-[var(--accent)] text-[var(--accent-foreground)] font-black text-sm shadow-xl hover:scale-[1.02] transition-all mt-4 disabled:opacity-60"
          >
            {isLoading ? 'AUTHENTICATING...' : 'SIGN IN TO NODE'}
          </button>
        </form>

        <div className="mt-8 text-left space-y-2">
          <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Live Accounts</p>
          <div className="text-[10px] text-[var(--text-muted)] font-mono bg-[var(--bg-main)] p-3 rounded-xl border border-[var(--border-color)] space-y-1">
            <p>therestaurantsocialtv@gmail.com (global admin) — superuser123</p>
            <p>gen50.student01@gmail.com (admin) — superuser123</p>
            <p>haringeylearns@gmail.com (crew) — superuser123</p>
          </div>
          <p className="text-[10px] text-[var(--text-muted)] font-bold">For testing only. Change after first login.</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
