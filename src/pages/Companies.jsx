import React, { useEffect, useState } from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';

const Companies = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ slug: '', name: '', admin_email: '', admin_name: '', admin_phone: '', workspaces_allowed: 3 });
  const [creating, setCreating] = useState(false);

  const fetchJson = async (url, opts = {}) => {
    const res = await fetch(url, { credentials: 'include', ...opts });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
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
              <th className="p-6">Admin</th>
              <th className="p-6">Allowance</th>
            </tr>
          </thead>
          <tbody>
            {companies.map((c) => (
              <tr key={c.id} className="border-b border-[var(--border-color)] last:border-0 hover:bg-[var(--bg-main)]/50 transition-colors">
                <td className="p-6 font-black text-lg">{c.name}</td>
                <td className="p-6 text-sm font-bold text-[var(--text-muted)]">{c.slug}</td>
                <td className="p-6 text-sm font-bold text-[var(--text-muted)]">
                  {c.admin_name || '-'}<br />
                  <span className="text-[10px]">{c.admin_email || '-'}</span>
                </td>
                <td className="p-6 text-sm font-bold text-[var(--text-muted)]">{c.workspaces_allowed}</td>
              </tr>
            ))}
            {companies.length === 0 && (
              <tr>
                <td colSpan="4" className="p-10 text-center text-[var(--text-muted)] font-bold text-sm">{loading ? 'Loading...' : 'No companies yet.'}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Companies;
