import React, { useEffect, useMemo, useState } from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import { useAuth } from '../contexts/AuthContext';
import { useWorkspace } from '../contexts/WorkspaceContext';

const WorkspaceUsers = () => {
  const { role, currentUser } = useAuth();
  const { currentCompany, currentWorkspace, members, refresh } = useWorkspace();
  const [companyUsers, setCompanyUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [adding, setAdding] = useState(null);
  const [error, setError] = useState('');

  const canManage = role === 'global_admin' || role === 'admin';

  useEffect(() => {
    if (!currentCompany || !canManage) return;
    fetch(`/api/users?company_id=${currentCompany.id}`, { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => setCompanyUsers(data.users || []))
      .catch((err) => setError(err.message));
  }, [currentCompany, canManage]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return (members || []).filter(
      (m) =>
        (m.name || '').toLowerCase().includes(q) ||
        (m.email || '').toLowerCase().includes(q)
    );
  }, [members, search]);

  const addMember = async (user) => {
    if (!currentWorkspace) return;
    setAdding(user.id);
    try {
      const res = await fetch('/api/workspace-members', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspace_id: currentWorkspace.id, user_id: user.id }),
      });
      if (!res.ok) throw new Error(await res.text());
      await refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setAdding(null);
    }
  };

  const removeMember = async (userId) => {
    if (!currentWorkspace) return;
    if (!window.confirm('Remove this user from the workspace?')) return;
    try {
      await fetch(`/api/workspace-members?workspace_id=${currentWorkspace.id}&user_id=${userId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      await refresh();
    } catch (err) {
      setError(err.message);
    }
  };

  const availableUsers = useMemo(() => {
    const memberIds = new Set((members || []).map((m) => m.id));
    return (companyUsers || []).filter(
      (u) => !memberIds.has(u.id) && ['admin', 'crew'].includes(u.role)
    );
  }, [companyUsers, members]);

  return (
    <div className="w-full p-10 space-y-8 bg-[var(--bg-main)] min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tighter uppercase">Workspace Users</h1>
          <p className="text-[var(--text-muted)] font-bold">
            {currentWorkspace ? `${currentWorkspace.name} / ${currentCompany?.name}` : 'No workspace selected'}
          </p>
        </div>
        <div className="relative w-full md:w-64">
          <SafeIcon icon={FiIcons.FiSearch} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Search members..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-3 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl text-sm font-bold focus:outline-none focus:border-[var(--accent)]"
          />
        </div>
      </div>

      {error && <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 font-bold text-sm">{error}</div>}

      {canManage && availableUsers.length > 0 && (
        <div className="bg-[var(--bg-card)] p-6 rounded-3xl border border-[var(--border-color)] shadow-2xl space-y-4">
          <h2 className="text-xl font-black tracking-tighter uppercase">Add from company</h2>
          <div className="flex flex-wrap gap-4 items-center">
            <select
              value={adding || ''}
              onChange={(e) => setAdding(e.target.value)}
              className="bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-[var(--accent)]"
            >
              <option value="">Select user</option>
              {availableUsers.map((u) => (
                <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
              ))}
            </select>
            <button
              onClick={() => {
                const user = availableUsers.find((u) => u.id === adding);
                if (user) addMember(user);
              }}
              disabled={!adding}
              className="bg-[var(--accent)] text-[var(--accent-foreground)] px-6 py-3 rounded-xl font-black shadow-xl hover:scale-[1.02] transition-all disabled:opacity-50"
            >
              Add to workspace
            </button>
          </div>
        </div>
      )}

      <div className="bg-[var(--bg-card)] rounded-3xl border border-[var(--border-color)] overflow-hidden shadow-2xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[var(--bg-main)] border-b border-[var(--border-color)] text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">
              <th className="p-6">Name</th>
              <th className="p-6">Email</th>
              <th className="p-6">Role</th>
              <th className="p-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((m) => (
              <tr key={m.id} className="border-b border-[var(--border-color)] last:border-0 hover:bg-[var(--bg-main)]/50 transition-colors">
                <td className="p-6 font-black text-lg">{m.name}</td>
                <td className="p-6 text-sm font-bold text-[var(--text-muted)]">{m.email}</td>
                <td className="p-6">
                  <span className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border bg-[var(--bg-main)] border-[var(--border-color)]">
                    {m.role}
                  </span>
                </td>
                <td className="p-6 text-right">
                  {canManage && m.id !== currentUser?.id && (
                    <button
                      onClick={() => removeMember(m.id)}
                      className="px-3 py-2 rounded-xl text-xs font-black uppercase tracking-widest bg-red-500 text-white hover:bg-red-600 transition-all"
                    >
                      Remove
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan="4" className="p-10 text-center text-[var(--text-muted)] font-bold text-sm">No members in this workspace.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default WorkspaceUsers;
