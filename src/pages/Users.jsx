import React, { useEffect, useMemo, useState } from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import { authClient } from '../lib/auth-client';
import { useAuth } from '../contexts/AuthContext';

const ROLES = ['superuser', 'admin', 'crew', 'user'];
const ROLE_LABELS = {
  superuser: 'global admin',
  admin: 'admin',
  crew: 'crew',
  user: 'user',
};

const formatRole = (r) => ROLE_LABELS[r] || r;

const Users = () => {
  const { role: myRole, currentUser } = useAuth();
  const isGlobalAdmin = myRole === 'global_admin';

  const [users, setUsers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [editing, setEditing] = useState(null);
  const [actioning, setActioning] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [confirmText, setConfirmText] = useState('');

  const fetchJson = async (url, opts = {}) => {
    const res = await fetch(url, { credentials: 'include', ...opts });
    if (!res.ok) throw new Error(await res.text());
    return res.json().catch(() => ({}));
  };

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await authClient.admin.listUsers({ limit: 100 });
      setUsers(data?.users || []);
    } catch (err) {
      setError(err?.message || 'Failed to load users.');
    } finally {
      setLoading(false);
    }
  };

  const loadCompanies = async () => {
    try {
      const data = await fetchJson('/api/companies');
      setCompanies(data.companies || []);
    } catch (err) {
      setCompanies([]);
    }
  };

  useEffect(() => {
    load();
    loadCompanies();
  }, []);

  const filteredUsers = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return (users || [])
      .filter(
        (u) =>
          (u.name || '').toLowerCase().includes(q) ||
          (u.email || '').toLowerCase().includes(q)
      )
      .sort((a, b) => {
        if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '');
        if (sortBy === 'role') return (a.role || '').localeCompare(b.role || '');
        if (sortBy === 'status') return (a.banned ? 1 : 0) - (b.banned ? 1 : 0);
        return 0;
      });
  }, [users, searchQuery, sortBy]);

  const companyOptions = useMemo(() => {
    if (isGlobalAdmin) return companies;
    return companies.filter((c) => c.id === currentUser?.company);
  }, [companies, isGlobalAdmin, currentUser]);

  const companyName = (companyId) => {
    const found = companies.find((c) => c.id === companyId);
    return found?.name || companyId || '-';
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!editing) return;
    setActioning('save');
    try {
      const payload = {
        userId: editing.id,
        data: { name: editing.name, role: editing.role, company: editing.company },
      };
      if (authClient.admin.updateUser) {
        await authClient.admin.updateUser(payload);
      } else {
        await fetch('/api/auth/admin/update-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload),
        });
      }
      await load();
      setEditing(null);
    } catch (err) {
      setError(err?.message || 'Failed to update user.');
    } finally {
      setActioning(null);
    }
  };

  const toggleBan = async (user) => {
    setActioning(user.id);
    try {
      if (user.banned) {
        await authClient.admin.unbanUser({ userId: user.id });
      } else {
        await authClient.admin.banUser({ userId: user.id });
      }
      await load();
    } catch (err) {
      setError(err?.message || 'Failed to update user status.');
    } finally {
      setActioning(null);
    }
  };

  const startDelete = (user) => {
    setDeleting(user);
    setConfirmText('');
  };

  const confirmDelete = async () => {
    if (confirmText !== 'DELETE' || !deleting) return;
    setActioning('delete');
    setError('');
    try {
      await authClient.admin.removeUser({ userId: deleting.id });
      setDeleting(null);
      setConfirmText('');
      await load();
    } catch (err) {
      setError(err?.message || 'Failed to delete user.');
    } finally {
      setActioning(null);
    }
  };

  const removeUser = (user) => startDelete(user);

  const startEdit = (user) => {
    setEditing({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      company: user.company || '',
    });
  };

  return (
    <div className="w-full p-10 space-y-10 bg-[var(--bg-main)] min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-black tracking-tighter uppercase">User Ecosystem</h1>
          <p className="text-[var(--text-muted)] font-bold">Manage permissions and team access levels.</p>
        </div>
        <div className="flex flex-wrap gap-4 items-center w-full md:w-auto">
          <div className="relative flex-1 md:flex-none">
            <SafeIcon icon={FiIcons.FiSearch} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full md:w-64 pl-9 pr-4 py-3 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl text-sm font-bold focus:outline-none focus:border-[var(--accent)]"
            />
          </div>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-[var(--accent)]">
            <option value="name">Alphabetical (A-Z)</option>
            <option value="role">By Role</option>
            <option value="status">By Status</option>
          </select>
          <button onClick={load} disabled={loading} className="bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-muted)] px-4 py-3 rounded-xl font-black shadow-xl flex items-center gap-3 hover:scale-[1.02] transition-all disabled:opacity-50">
            <SafeIcon icon={FiIcons.FiRefreshCw} className={`text-lg ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 font-bold text-sm">
          {error}
        </div>
      )}

      <div className="bg-[var(--bg-card)] rounded-3xl border border-[var(--border-color)] overflow-hidden shadow-2xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[var(--bg-main)] border-b border-[var(--border-color)] text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">
              <th className="p-6">Identity</th>
              <th className="p-6">Email</th>
              <th className="p-6">Company</th>
              <th className="p-6">Role</th>
              <th className="p-6">Status</th>
              <th className="p-6">Joined</th>
              <th className="p-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id} className="border-b border-[var(--border-color)] last:border-0 hover:bg-[var(--bg-main)]/50 transition-colors group">
                <td className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 text-[var(--accent)] flex items-center justify-center font-black text-xl shadow-inner">
                      {(user.name || '?').charAt(0)}
                    </div>
                    <p className="font-black text-lg">{user.name}</p>
                  </div>
                </td>
                <td className="p-6">
                  <p className="text-sm font-bold text-[var(--text-muted)]">{user.email}</p>
                </td>
                <td className="p-6">
                  <p className="text-sm font-bold text-[var(--text-muted)]">{companyName(user.company)}</p>
                </td>
                <td className="p-6">
                  <span className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border bg-[var(--bg-main)] border-[var(--border-color)]">
                    {formatRole(user.role)}
                  </span>
                </td>
                <td className="p-6">
                  <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${user.banned ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-green-500/10 text-green-500 border-green-500/20'}`}>
                    {user.banned ? 'Blocked' : 'Active'}
                  </span>
                </td>
                <td className="p-6">
                  <span className="text-sm font-bold text-[var(--text-muted)]">
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}
                  </span>
                </td>
                <td className="p-6 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => startEdit(user)}
                      disabled={actioning === user.id}
                      className="px-3 py-2 rounded-xl text-xs font-black uppercase tracking-widest bg-[var(--bg-main)] border border-[var(--border-color)] hover:text-[var(--accent)] hover:border-[var(--accent)] transition-all disabled:opacity-50"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => toggleBan(user)}
                      disabled={actioning === user.id}
                      className={`px-3 py-2 rounded-xl text-xs font-black uppercase tracking-widest border transition-all disabled:opacity-50 ${user.banned ? 'bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20'}`}
                    >
                      {user.banned ? 'Unblock' : 'Block'}
                    </button>
                    <button
                      onClick={() => removeUser(user)}
                      disabled={actioning === user.id}
                      className="px-3 py-2 rounded-xl text-xs font-black uppercase tracking-widest bg-red-500 text-white hover:bg-red-600 transition-all disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredUsers.length === 0 && (
              <tr>
                <td colSpan="7" className="p-10 text-center text-[var(--text-muted)] font-bold text-sm">
                  {loading ? 'Loading users...' : 'No users found.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[var(--bg-card)] w-full max-w-md rounded-3xl border border-red-500/20 shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3 text-red-500">
              <SafeIcon icon={FiIcons.FiAlertTriangle} className="w-6 h-6" />
              <h2 className="text-xl font-black tracking-tighter uppercase">Delete User</h2>
            </div>
            <p className="text-sm font-bold text-[var(--text-muted)]">
              This will permanently delete <strong className="text-[var(--text)]">{deleting.name} ({deleting.email})</strong>. Type <strong>DELETE</strong> to confirm.
            </p>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Type DELETE"
              className="w-full bg-[var(--bg-main)] border border-red-500/20 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-red-500"
            />
            <div className="flex justify-end gap-3">
              <button onClick={() => { setDeleting(null); setConfirmText(''); }} className="px-5 py-3 rounded-xl font-bold border border-[var(--border-color)] text-[var(--text-muted)] hover:bg-[var(--bg-main)]">Cancel</button>
              <button
                onClick={confirmDelete}
                disabled={confirmText !== 'DELETE' || actioning === 'delete'}
                className="bg-red-500 text-white px-6 py-3 rounded-xl font-black shadow-xl hover:scale-[1.02] transition-all disabled:opacity-50"
              >
                {actioning === 'delete' ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <form onSubmit={handleSave} className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl shadow-2xl p-8 w-full max-w-md space-y-6">
            <h2 className="text-2xl font-black tracking-tighter uppercase">Edit User</h2>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Name</label>
              <input
                type="text"
                value={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-[var(--accent)]"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Email</label>
              <input
                type="email"
                value={editing.email}
                readOnly
                className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-sm font-bold text-[var(--text-muted)] cursor-not-allowed"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Company</label>
              {companyOptions.length === 0 ? (
                <input
                  type="text"
                  value={companyName(editing.company)}
                  readOnly
                  className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-sm font-bold text-[var(--text-muted)] cursor-not-allowed"
                />
              ) : (
                <select
                  value={editing.company || ''}
                  onChange={(e) => setEditing({ ...editing, company: e.target.value })}
                  disabled={!isGlobalAdmin}
                  className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-[var(--accent)] disabled:cursor-not-allowed disabled:text-[var(--text-muted)]"
                >
                  <option value="">No company</option>
                  {companyOptions.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              )}
              {!isGlobalAdmin && (
                <p className="text-[10px] font-bold text-[var(--text-muted)]">Only global admins can change company.</p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Role</label>
              <select
                value={editing.role}
                onChange={(e) => setEditing({ ...editing, role: e.target.value })}
                className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-[var(--accent)]"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>{formatRole(r)}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-4 pt-2">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="flex-1 py-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] font-black text-sm uppercase tracking-widest hover:border-[var(--accent)] transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actioning === 'save'}
                className="flex-1 py-3 rounded-xl bg-[var(--accent)] text-[var(--accent-foreground)] font-black text-sm uppercase tracking-widest shadow-xl hover:scale-[1.02] transition-all disabled:opacity-60"
              >
                {actioning === 'save' ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Users;
