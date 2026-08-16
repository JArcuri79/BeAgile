import React, { useEffect, useState } from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';

const Companies = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ slug: '', name: '', admin_email: '', admin_name: '', admin_phone: '', workspaces_allowed: 3 });
  const [creating, setCreating] = useState(false);

  const [editingCompany, setEditingCompany] = useState(null);
  const [deletingCompany, setDeletingCompany] = useState(null);
  const [confirmText, setConfirmText] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchJson = async (url, opts = {}) => {
    const res = await fetch(url, { credentials: 'include', ...opts });
    if (!res.ok) throw new Error(await res.text());
    return res.json().catch(() => ({}));
  };

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchJson('/api/companies');
      setCompanies(data.companies || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const create = async (e) => {
    e.preventDefault();
    if (!form.slug || !form.name) return;
    setCreating(true);
    try {
      await fetchJson('/api/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, workspaces_allowed: Number(form.workspaces_allowed) }),
      });
      setForm({ slug: '', name: '', admin_email: '', admin_name: '', admin_phone: '', workspaces_allowed: 3 });
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const startEdit = (company) => {
    setEditingCompany({
      ...company,
      workspaces_allowed: company.workspaces_allowed ?? 3,
    });
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await fetchJson('/api/companies', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingCompany.id,
          name: editingCompany.name,
          admin_email: editingCompany.admin_email,
          admin_name: editingCompany.admin_name,
          admin_phone: editingCompany.admin_phone,
          workspaces_allowed: Number(editingCompany.workspaces_allowed),
        }),
      });
      setEditingCompany(null);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const startDelete = (company) => {
    setDeletingCompany(company);
    setConfirmText('');
  };

  const confirmDelete = async () => {
    if (confirmText !== 'DELETE') return;
    setDeleting(true);
    setError('');
    try {
      const res = await fetch(`/api/companies?id=${deletingCompany.id}`, { method: 'DELETE', credentials: 'include' });
      if (!res.ok) throw new Error(await res.text());
      setDeletingCompany(null);
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
          <h1 className="text-4xl font-black tracking-tighter uppercase">Companies</h1>
          <p className="text-[var(--text-muted)] font-bold">Enrol companies and allocate workspaces.</p>
        </div>
      </div>

      {error && <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 font-bold text-sm">{error}</div>}

      <form onSubmit={create} className="bg-[var(--bg-card)] p-6 rounded-3xl border border-[var(--border-color)] shadow-2xl space-y-4">
        <h2 className="text-xl font-black tracking-tighter uppercase">Create company</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <input type="text" placeholder="company-slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-[var(--accent)]" required />
          <input type="text" placeholder="Company name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-[var(--accent)]" required />
          <input type="email" placeholder="Admin email" value={form.admin_email} onChange={(e) => setForm({ ...form, admin_email: e.target.value })} className="bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-[var(--accent)]" />
          <input type="text" placeholder="Admin name" value={form.admin_name} onChange={(e) => setForm({ ...form, admin_name: e.target.value })} className="bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-[var(--accent)]" />
          <input type="text" placeholder="Admin phone" value={form.admin_phone} onChange={(e) => setForm({ ...form, admin_phone: e.target.value })} className="bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-[var(--accent)]" />
          <input type="number" placeholder="Workspace allowance" value={form.workspaces_allowed} onChange={(e) => setForm({ ...form, workspaces_allowed: e.target.value })} className="bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-[var(--accent)]" />
        </div>
        <button
          type="submit"
          disabled={creating}
          className="bg-[var(--accent)] text-[var(--accent-foreground)] px-6 py-3 rounded-xl font-black shadow-xl hover:scale-[1.02] transition-all disabled:opacity-50"
        >
          {creating ? 'Creating...' : 'Create Company'}
        </button>
      </form>

      <div className="bg-[var(--bg-card)] rounded-3xl border border-[var(--border-color)] overflow-hidden shadow-2xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[var(--bg-main)] border-b border-[var(--border-color)] text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">
              <th className="p-6">Name</th>
              <th className="p-6">Slug</th>
              <th className="p-6">Admin Name</th>
              <th className="p-6">Admin Email</th>
              <th className="p-6">Allowance</th>
              <th className="p-6">Actions</th>
            </tr>
          </thead>
          <tbody>
            {companies.map((c) => (
              <tr key={c.id} className="border-b border-[var(--border-color)] last:border-0 hover:bg-[var(--bg-main)]/50 transition-colors">
                <td className="p-6 font-black text-lg">{c.name}</td>
                <td className="p-6 text-sm font-bold text-[var(--text-muted)]">{c.slug}</td>
                <td className="p-6 text-sm font-bold text-[var(--text-muted)]">{c.admin_name || '-'}</td>
                <td className="p-6 text-sm font-bold text-[var(--text-muted)]">{c.admin_email || '-'}</td>
                <td className="p-6 text-sm font-bold text-[var(--text-muted)]">{c.workspaces_allowed}</td>
                <td className="p-6">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => startEdit(c)}
                      className="p-2 rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--accent)] hover:border-[var(--accent)] transition-colors"
                      title="Edit"
                    >
                      <SafeIcon name="Edit2" className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => startDelete(c)}
                      className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500/20 transition-colors"
                      title="Delete"
                    >
                      <SafeIcon name="Trash2" className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {companies.length === 0 && (
              <tr>
                <td colSpan="6" className="p-10 text-center text-[var(--text-muted)] font-bold text-sm">{loading ? 'Loading...' : 'No companies yet.'}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editingCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[var(--bg-card)] w-full max-w-2xl rounded-3xl border border-[var(--border-color)] shadow-2xl p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-black tracking-tighter uppercase">Edit Company</h2>
              <button onClick={() => setEditingCompany(null)} className="p-2 text-[var(--text-muted)] hover:text-[var(--accent)]">
                <SafeIcon name="X" className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={saveEdit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input type="text" value={editingCompany.name} onChange={(e) => setEditingCompany({ ...editingCompany, name: e.target.value })} className="bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-[var(--accent)]" required />
              <input type="email" placeholder="Admin email" value={editingCompany.admin_email || ''} onChange={(e) => setEditingCompany({ ...editingCompany, admin_email: e.target.value })} className="bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-[var(--accent)]" />
              <input type="text" placeholder="Admin name" value={editingCompany.admin_name || ''} onChange={(e) => setEditingCompany({ ...editingCompany, admin_name: e.target.value })} className="bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-[var(--accent)]" />
              <input type="text" placeholder="Admin phone" value={editingCompany.admin_phone || ''} onChange={(e) => setEditingCompany({ ...editingCompany, admin_phone: e.target.value })} className="bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-[var(--accent)]" />
              <input type="number" placeholder="Workspace allowance" value={editingCompany.workspaces_allowed} onChange={(e) => setEditingCompany({ ...editingCompany, workspaces_allowed: e.target.value })} className="bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-[var(--accent)]" />
              <div className="md:col-span-2 flex justify-end gap-3">
                <button type="button" onClick={() => setEditingCompany(null)} className="px-5 py-3 rounded-xl font-bold border border-[var(--border-color)] text-[var(--text-muted)] hover:bg-[var(--bg-main)]">Cancel</button>
                <button type="submit" disabled={saving} className="bg-[var(--accent)] text-[var(--accent-foreground)] px-6 py-3 rounded-xl font-black shadow-xl hover:scale-[1.02] transition-all disabled:opacity-50">{saving ? 'Saving...' : 'Save Changes'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deletingCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[var(--bg-card)] w-full max-w-md rounded-3xl border border-red-500/20 shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3 text-red-500">
              <SafeIcon name="AlertTriangle" className="w-6 h-6" />
              <h2 className="text-xl font-black tracking-tighter uppercase">Delete Company</h2>
            </div>
            <p className="text-sm font-bold text-[var(--text-muted)]">
              This will permanently delete <strong className="text-[var(--text)]">{deletingCompany.name}</strong> and all its workspaces and members. Type <strong>DELETE</strong> to confirm.
            </p>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Type DELETE"
              className="w-full bg-[var(--bg-main)] border border-red-500/20 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-red-500"
            />
            <div className="flex justify-end gap-3">
              <button onClick={() => { setDeletingCompany(null); setConfirmText(''); }} className="px-5 py-3 rounded-xl font-bold border border-[var(--border-color)] text-[var(--text-muted)] hover:bg-[var(--bg-main)]">Cancel</button>
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

export default Companies;
