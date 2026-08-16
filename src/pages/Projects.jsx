import React, { useEffect, useMemo, useState } from 'react';
import { NavLink, useParams } from 'react-router-dom';
import * as FiIcons from 'react-icons/fi';
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

  const canCreate = role === 'global_admin' || role === 'admin';
  const isGlobalAdmin = role === 'global_admin';

  const fetchJson = async (url, opts = {}) => {
    const res = await fetch(url, { credentials: 'include', ...opts });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
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
              <th className="p-6">Company</th>
              <th className="p-6">Created</th>
              <th className="p-6 text-right">Open</th>
            </tr>
          </thead>
          <tbody>
            {workspaces.map((w) => (
              <tr key={w.id} className="border-b border-[var(--border-color)] last:border-0 hover:bg-[var(--bg-main)]/50 transition-colors">
                <td className="p-6 font-black text-lg">{w.name}</td>
                <td className="p-6 text-sm font-bold text-[var(--text-muted)]">{w.company_name}</td>
                <td className="p-6 text-sm font-bold text-[var(--text-muted)]">{w.created_at ? new Date(w.created_at).toLocaleDateString() : '-'}</td>
                <td className="p-6 text-right">
                  <NavLink
                    to={`/${w.company_slug || w.company_id}/${w.slug}`}
                    className="px-4 py-2 rounded-xl bg-[var(--accent)] text-[var(--accent-foreground)] font-black text-xs uppercase tracking-widest shadow-xl hover:scale-[1.02] transition-all"
                  >
                    Open
                  </NavLink>
                </td>
              </tr>
            ))}
            {workspaces.length === 0 && (
              <tr>
                <td colSpan="4" className="p-10 text-center text-[var(--text-muted)] font-bold text-sm">{loading ? 'Loading...' : 'No workspaces found.'}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Projects;
