import React, { useState } from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import { useAuth } from '../contexts/AuthContext';
import { authClient } from '../lib/auth-client';

const SPECIALS = "#@?><£$%&";

function validatePassword(password) {
  if (password.length < 12) return "Password must be at least 12 characters";
  if (password.length > 128) return "Password must be at most 128 characters";
  if (!/[A-Z]/.test(password)) return "Password must contain an uppercase letter";
  if (!/[a-z]/.test(password)) return "Password must contain a lowercase letter";
  if (!/[0-9]/.test(password)) return "Password must contain a number";
  if (!new RegExp(`[\\${SPECIALS.replace(/[\]]/g, "\\]")}]`).test(password)) {
    return `Password must contain a special character: ${SPECIALS}`;
  }
  return null;
}

const AccountSettings = () => {
  const { currentUser } = useAuth();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authPassword, setAuthPassword] = useState('');

  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [message, setMessage] = useState(null);
  const [checking, setChecking] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    if (!authPassword) return;
    setChecking(true);
    setMessage(null);
    try {
      const result = await authClient.signIn.email({
        email: currentUser?.email,
        password: authPassword,
        rememberMe: false,
      });
      if (result.error) throw new Error(result.error.message || 'Incorrect password');
      setIsAuthenticated(true);
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Incorrect password.' });
    } finally {
      setChecking(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setMessage(null);

    if (passwords.new !== passwords.confirm) {
      setMessage({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    const v = validatePassword(passwords.new);
    if (v) {
      setMessage({ type: 'error', text: v });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          currentPassword: passwords.current,
          newPassword: passwords.new,
          revokeOtherSessions: true,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      setMessage({ type: 'success', text: 'Password updated successfully.' });
      setPasswords({ current: '', new: '', confirm: '' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to update password.' });
    } finally {
      setSaving(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="w-full min-h-[calc(100vh-124px)] flex items-center justify-center bg-[var(--bg-main)] p-4">
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-10 rounded-[2rem] shadow-2xl max-w-md w-full">
          <div className="w-16 h-16 rounded-2xl bg-[var(--accent)]/10 text-[var(--accent)] flex items-center justify-center text-3xl mb-6 mx-auto">
            <SafeIcon icon={FiIcons.FiLock} />
          </div>
          <h2 className="text-2xl font-black text-center mb-2 text-[var(--text-main)]">Security Check</h2>
          <p className="text-[var(--text-muted)] text-sm font-bold text-center mb-8">Enter your current password to access account settings.</p>

          {message?.type === 'error' && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs font-bold text-center">{message.text}</div>}

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
              disabled={checking}
              className="w-full py-4 rounded-xl bg-[var(--accent)] text-[var(--accent-foreground)] font-black text-sm shadow-xl hover:scale-[1.02] transition-all disabled:opacity-50"
            >
              {checking ? 'AUTHENTICATING...' : 'AUTHENTICATE'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full p-10 space-y-10 bg-[var(--bg-main)] min-h-screen">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-black tracking-tighter uppercase text-[var(--text-main)]">Account Settings</h1>
        <p className="text-[var(--text-muted)] font-bold">Manage your identity and security credentials.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="bg-[var(--bg-card)] rounded-3xl border border-[var(--border-color)] p-10 shadow-xl space-y-8 h-fit">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[var(--accent)]/10 flex items-center justify-center text-[var(--accent)]">
              <SafeIcon icon={FiIcons.FiUser} className="text-2xl" />
            </div>
            <h2 className="text-2xl font-black tracking-tight text-[var(--text-main)]">Profile Information</h2>
          </div>
          <div className="space-y-6">
            <div>
              <label className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest block mb-2">Display Name</label>
              <div className="px-4 py-3 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-sm font-bold text-[var(--text-main)]">
                {currentUser?.name || '-'}
              </div>
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest block mb-2">Email Address</label>
              <div className="px-4 py-3 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-sm font-bold text-[var(--text-main)]">
                {currentUser?.email || '-'}
              </div>
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest block mb-2">Role</label>
              <div className="px-4 py-3 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-sm font-bold text-[var(--text-main)]">
                {currentUser?.role || 'user'}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[var(--bg-card)] rounded-3xl border border-[var(--border-color)] p-10 shadow-xl space-y-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[var(--accent)]/10 flex items-center justify-center text-[var(--accent)]">
              <SafeIcon icon={FiIcons.FiShield} className="text-2xl" />
            </div>
            <h2 className="text-2xl font-black tracking-tight text-[var(--text-main)]">Update Password</h2>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-6">
            <div>
              <label className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest block mb-2">Current Password</label>
              <input type="password" value={passwords.current} onChange={(e) => setPasswords({ ...passwords, current: e.target.value })} className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-[var(--accent)] text-[var(--text-main)]" />
            </div>
            <div className="pt-4 border-t border-[var(--border-color)]">
              <label className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest block mb-2">New Password</label>
              <input type="password" value={passwords.new} onChange={(e) => setPasswords({ ...passwords, new: e.target.value })} className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-[var(--accent)] text-[var(--text-main)]" />
              <p className="mt-1 text-[10px] text-[var(--text-muted)] font-bold">
                12+ characters, upper &amp; lower, a number, and one of {SPECIALS}
              </p>
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest block mb-2">Confirm New Password</label>
              <input type="password" value={passwords.confirm} onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })} className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-[var(--accent)] text-[var(--text-main)]" />
            </div>

            {message && (
              <div className={`p-4 rounded-xl text-xs font-bold ${message.type === 'error' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-green-500/10 text-green-500 border border-green-500/20'}`}>
                {message.text}
              </div>
            )}

            <button type="submit" disabled={saving} className="w-full py-4 rounded-xl bg-[var(--accent)] text-[var(--accent-foreground)] font-black text-sm shadow-xl hover:scale-[1.02] transition-all disabled:opacity-50">
              {saving ? 'UPDATING...' : 'UPDATE CREDENTIALS'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AccountSettings;
