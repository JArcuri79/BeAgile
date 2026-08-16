import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

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

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const mobile = searchParams.get('mobile');

  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (mobile) {
      localStorage.setItem('mobile_token', mobile);
    }
    if (!token) {
      setLoading(false);
      setError('Invalid or missing reset token.');
      return;
    }
    fetch(`/api/password-reset?token=${encodeURIComponent(token)}`, { credentials: 'include' })
      .then(async (res) => {
        if (!res.ok) throw new Error(await res.text());
        return res.json();
      })
      .then((data) => {
        setEmail(data.email || '');
      })
      .catch((err) => setError(err.message || 'Invalid or expired token.'))
      .finally(() => setLoading(false));
  }, [token, mobile]);

  const hint = useMemo(() => {
    if (!newPassword) return '';
    return validatePassword(newPassword);
  }, [newPassword]);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!email || !newPassword || !confirm) {
      setError('All fields are required');
      return;
    }
    if (newPassword !== confirm) {
      setError('Passwords do not match');
      return;
    }
    const v = validatePassword(newPassword);
    if (v) {
      setError(v);
      return;
    }

    setValidating(true);
    try {
      const res = await fetch('/api/password-reset/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ token, email, newPassword }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json().catch(() => ({}));
      if (data.mobile_token) localStorage.setItem('mobile_token', data.mobile_token);
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Failed to reset password.');
    } finally {
      setValidating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-main)] p-4">
        <p className="text-[var(--text-muted)] font-bold">Validating token...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-main)] p-4">
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-10 rounded-3xl shadow-2xl w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-black tracking-tighter uppercase">Reset Password</h1>
          <p className="text-[var(--text-muted)] font-bold text-sm">Choose a strong new password.</p>
        </div>

        {error && <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 font-bold text-sm">{error}</div>}

        {success ? (
          <div className="space-y-4 text-center">
            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-500 font-bold text-sm">
              Password reset successfully. You can now sign in.
            </div>
            <button
              onClick={() => navigate('/login')}
              className="w-full py-4 rounded-xl bg-[var(--accent)] text-[var(--accent-foreground)] font-black text-sm shadow-xl hover:scale-[1.02] transition-all"
            >
              Go to Login
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-[var(--accent)]"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-[var(--accent)]"
                required
              />
              {hint && <p className="text-[10px] text-red-500 font-bold">{hint}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Confirm New Password</label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-[var(--accent)]"
                required
              />
            </div>
            <button
              type="submit"
              disabled={validating}
              className="w-full py-4 rounded-xl bg-[var(--accent)] text-[var(--accent-foreground)] font-black text-sm shadow-xl hover:scale-[1.02] transition-all disabled:opacity-50"
            >
              {validating ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
