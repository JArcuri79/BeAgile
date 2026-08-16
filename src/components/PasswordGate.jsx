import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import { useAuth } from '../contexts/AuthContext';
import { authClient } from '../lib/auth-client';

const PasswordGate = ({ children, title = 'Security Check' }) => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [verified, setVerified] = useState(false);
  const [authPassword, setAuthPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAuth = async (e) => {
    e.preventDefault();
    if (!authPassword) return;
    setLoading(true);
    setError('');
    try {
      const result = await authClient.signIn.email({
        email: currentUser?.email,
        password: authPassword,
        rememberMe: false,
      });
      if (result.error) throw new Error(result.error.message || 'Incorrect password');
      setVerified(true);
    } catch (err) {
      setError(err.message || 'Incorrect password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (verified) return <>{children}</>;

  return (
    <div className="w-full min-h-[calc(100vh-124px)] flex items-center justify-center bg-[var(--bg-main)] p-4">
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-10 rounded-[2rem] shadow-2xl max-w-md w-full">
        <div className="w-16 h-16 rounded-2xl bg-[var(--accent)]/10 text-[var(--accent)] flex items-center justify-center text-3xl mb-6 mx-auto">
          <SafeIcon icon={FiIcons.FiLock} />
        </div>
        <h2 className="text-2xl font-black text-center mb-2 text-[var(--text-main)]">{title}</h2>
        <p className="text-[var(--text-muted)] text-sm font-bold text-center mb-8">
          Enter your current password to access this area.
        </p>

        {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs font-bold text-center">{error}</div>}

        <form onSubmit={handleAuth} className="space-y-4">
          <input
            type="password"
            value={authPassword}
            onChange={(e) => setAuthPassword(e.target.value)}
            placeholder="Current password..."
            className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-[var(--accent)] text-[var(--text-main)] text-center tracking-widest"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-xl bg-[var(--accent)] text-[var(--accent-foreground)] font-black text-sm shadow-xl hover:scale-[1.02] transition-all disabled:opacity-50"
          >
            {loading ? 'AUTHENTICATING...' : 'AUTHENTICATE'}
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-full py-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-muted)] font-black text-xs tracking-widest hover:border-[var(--accent)] transition-all"
          >
            Cancel
          </button>
        </form>
      </div>
    </div>
  );
};

export default PasswordGate;
