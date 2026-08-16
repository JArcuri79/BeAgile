import React, { useEffect, useState } from 'react';
import { NavLink, useParams } from 'react-router-dom';
import SafeIcon from '../common/SafeIcon';
import { useAuth } from '../contexts/AuthContext';

const Projects = () => {
  const { role, currentUser } = useAuth();
  const { companySlug } = useParams();
  const isGlobal = !companySlug;
  const [companies, setCompanies] = useState([]);
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ company_id: '', slug: '', name: '' });
  const [creating, setCreating] = useState(false);

  const [editingWorkspace, setEditingWorkspace] = useState(null);
  const [deletingWorkspace, setDeletingWorkspace] = useState(null);
  const [confirmText, setConfirmText] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const canCreate = role === 'global_admin' || role === 'admin';
  const isGlobalAdmin = role === 'global_admin';

  const canManage = (w) => isGlobalAdmin || (role === 'admin' && currentUser?.company === w.company_id);

  const fetchJson = async (url, opts = {}) => {
    const res = await fetch(url, { credentials: 'include', ...opts });
    if (!res.ok) throw new Error(await res.text());
    return res.json().catch(() => ({}));
  };

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [c, w] = await Promise.all([
        fetchJson('/api/companies'),
        fetchJson('/api/workspaces'),
      ]);
      setCompanies(c.companies || []);
      let list = w.workspaces || [];
      const company = (c.companies || []).find((co) => co.slug === companySlug);
      if (companySlug) {
        list = list.filter((ws) => ws.company_id === company?.id);
      }
      setWorkspaces(list);
      if (company) {
        setForm((f) => ({ ...f, company_id: company.id }));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [companySlug, role, currentUser]);

  const create = async (e) => {
    e.preventDefault();
    if (!form.company_id || !form.slug || !form.name) return;
    setCreating(true);
    try {
      await fetchJson('/api/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      setForm({ company_id: companySlug ? form.company_id : '', slug: '', name: '' });
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const startEdit = (w) => {
    setEditingWorkspace({ ...w });
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await fetchJson('/api/workspaces', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingWorkspace.id,
          name: editingWorkspace.name,
          slug: editingWorkspace.slug,
        }),
      });
      setEditingWorkspace(null);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const startDelete = (w) => {
    setDeletingWorkspace(w);
    setConfirmText('');
  };

  const confirmDelete = async () => {
    if (confirmText !== 'DELETE') return;
    setDeleting(true);
    setError('');
    try {
      const res = await fetch(`/api/workspaces?id=${deletingWorkspace.id}`, { method: 'DELETE', credentials: 'include' });
      if (!res.ok) throw new Error(await res.text());
      setDeletingWorkspace(null);
      setConfirmText('');
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="w-full p-10 space-y-8 bg-[var(--bg-main)] min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tighter uppercase">{isGlobal ? 'All Workspaces' : 'Company Workspaces'}</h1>
          <p className="text-[var(--text-muted)] font-bold">
            {isGlobal ? 'Every workspace across every company.' : 'Workspaces for your company.'}
          </p>
        </div>
      </div>

      {error && <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 font-bold text-sm">{error}</div>}

      {canCreate && (
        <form onSubmit={create} className="bg-[var(--bg-card)] p-6 rounded-3xl border border-[var(--border-color)] shadow-2xl space-y-4">
          <h2 className="text-xl font-black tracking-tighter uppercase">Create workspace</h2>
          <div className="flex flex-wrap gap-4 items-end">
            {isGlobalAdmin && (
              <select
                value={form.company_id}
                onChange={(e) => setForm({ ...form, company_id: e.target.value })}
                className="bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-[var(--accent)]"
                required
              >
                <option value="">Select company</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            )}
            <input
              type="text"
              placeholder="workspace-slug"
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              className="bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-[var(--accent)]"
              required
            />
            <input
              type="text"
              placeholder="Workspace name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-[var(--accent)]"
              required
            />
            <button
              type="submit"
              disabled={creating}
              className="bg-[var(--accent)] text-[var(--accent-foreground)] px-6 py-3 rounded-xl font-black shadow-xl hover:scale-[1.02] transition-all disabled:opacity-50"
            >
              {creating ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      )}

      <div className="bg-[var(--bg-card)] rounded-3xl border border-[var(--border-color)] overflow-hidden shadow-2xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[var(--bg-main)] border-b border-[var(--border-color)] text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">
              <th className="p-6">Workspace</th>
              <th className="p-6">Slug</th>
              <th className="p-6">Company</th>
              <th className="p-6">Created</th>
              <th className="p-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {workspaces.map((w) => (
              <tr key={w.id} className="border-b border-[var(--border-color)] last:border-0 hover:bg-[var(--bg-main)]/50 transition-colors">
                <td className="p-6 font-black text-lg">{w.name}</td>
                <td className="p-6 text-sm font-bold text-[var(--text-muted)]">{w.slug}</td>
                <td className="p-6 text-sm font-bold text-[var(--text-muted)]">{w.company_name}</td>
                <td className="p-6 text-sm font-bold text-[var(--text-muted)]">{w.created_at ? new Date(w.created_at).toLocaleDateString() : '-'}</td>
                <td className="p-6 text-right">
                  <div className="flex justify-end items-center gap-3">
                    <NavLink
                      to={`/${w.company_slug || w.company_id}/${w.slug}`}
                      className="px-4 py-2 rounded-xl bg-[var(--accent)] text-[var(--accent-foreground)] font-black text-xs uppercase tracking-widest shadow-xl hover:scale-[1.02] transition-all"
                    >
                      Open
                    </NavLink>
                    {canManage(w) && (
                      <>
                        <button
                          onClick={() => startEdit(w)}
                          className="p-2 rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--accent)] hover:border-[var(--accent)] transition-colors"
                          title="Edit"
                        >
                          <SafeIcon name="Edit2" className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => startDelete(w)}
                          className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500/20 transition-colors"
                          title="Delete"
                        >
                          <SafeIcon name="Trash2" className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {workspaces.length === 0 && (
              <tr>
                <td colSpan="5" className="p-10 text-center text-[var(--text-muted)] font-bold text-sm">{loading ? 'Loading...' : 'No workspaces found.'}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editingWorkspace && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[var(--bg-card)] w-full max-w-lg rounded-3xl border border-[var(--border-color)] shadow-2xl p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-black tracking-tighter uppercase">Edit Workspace</h2>
              <button onClick={() => setEditingWorkspace(null)} className="p-2 text-[var(--text-muted)] hover:text-[var(--accent)]">
                <SafeIcon name="X" className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={saveEdit} className="space-y-4">
              <input
                type="text"
                placeholder="Workspace name"
                value={editingWorkspace.name}
                onChange={(e) => setEditingWorkspace({ ...editingWorkspace, name: e.target.value })}
                className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-[var(--accent)]"
                required
              />
              <input
                type="text"
                placeholder="workspace-slug"
                value={editingWorkspace.slug}
                onChange={(e) => setEditingWorkspace({ ...editingWorkspace, slug: e.target.value })}
                className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-[var(--accent)]"
                required
              />
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setEditingWorkspace(null)} className="px-5 py-3 rounded-xl font-bold border border-[var(--border-color)] text-[var(--text-muted)] hover:bg-[var(--bg-main)]">Cancel</button>
                <button type="submit" disabled={saving} className="bg-[var(--accent)] text-[var(--accent-foreground)] px-6 py-3 rounded-xl font-black shadow-xl hover:scale-[1.02] transition-all disabled:opacity-50">{saving ? 'Saving...' : 'Save Changes'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deletingWorkspace && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[var(--bg-card)] w-full max-w-md rounded-3xl border border-red-500/20 shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3 text-red-500">
              <SafeIcon name="AlertTriangle" className="w-6 h-6" />
              <h2 className="text-xl font-black tracking-tighter uppercase">Delete Workspace</h2>
            </div>
            <p className="text-sm font-bold text-[var(--text-muted)]">
              This will permanently delete <strong className="text-[var(--text)]">{deletingWorkspace.name}</strong> and all its members. Type <strong>DELETE</strong> to confirm.
            </p>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Type DELETE"
              className="w-full bg-[var(--bg-main)] border border-red-500/20 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-red-500"
            />
            <div className="flex justify-end gap-3">
              <button onClick={() => { setDeletingWorkspace(null); setConfirmText(''); }} className="px-5 py-3 rounded-xl font-bold border border-[var(--border-color)] text-[var(--text-muted)] hover:bg-[var(--bg-main)]">Cancel</button>
              <button
                onClick={confirmDelete}
                disabled={confirmText !== 'DELETE' || deleting}
                className="bg-red-500 text-white px-6 py-3 rounded-xl font-black shadow-xl hover:scale-[1.02] transition-all disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;
