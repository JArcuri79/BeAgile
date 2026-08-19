import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';

const Landing = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    fetch('/api/public/companies')
      .then(r => r.json())
      .then(data => setPartners((data.companies || []).slice(0, 6)))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(() => {
      fetch(`/api/public/search?q=${encodeURIComponent(query.trim())}`)
        .then(r => r.json())
        .then(data => setResults(data.results || []))
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }, 250);
  }, [query]);

  const handleSelect = (item) => {
    if (item.type === 'company') {
      navigate(`/${item.slug}`);
    } else {
      navigate(`/${item.company_slug}/${item.slug}/roadmap`);
    }
  };

  const PlaceholderLogo = ({ name, logoUrl }) => {
    if (logoUrl) {
      return <img src={logoUrl} alt={name} className="w-10 h-10 rounded-xl object-cover" />;
    }
    return (
      <div className="w-10 h-10 rounded-xl bg-[var(--accent)] text-[var(--accent-foreground)] flex items-center justify-center font-black text-sm shadow-sm">
        {name?.charAt(0).toUpperCase() || '?'}
      </div>
    );
  };

  const placeholderCount = Math.max(0, 6 - partners.length);

  return (
    <div className="w-full min-h-[calc(100vh-124px)] bg-[var(--bg-main)] flex flex-col items-center py-10 px-6">
      <div className="w-full max-w-4xl mx-auto space-y-10">
        <div className="text-center space-y-4">
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-[var(--text-main)]">
            BeAgile
          </h1>
          <p className="text-lg md:text-xl font-bold text-[var(--text-muted)] max-w-2xl mx-auto leading-relaxed">
            Project management organised in workspaces. Collect ideas, track bugs, plan releases, and ship better software — all in one shared workspace.
          </p>
        </div>

        <div className="relative w-full max-w-2xl mx-auto">
          <SafeIcon icon={FiIcons.FiSearch} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Search companies and workspace projects..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl text-sm font-bold text-[var(--text-main)] focus:outline-none focus:border-[var(--accent)]"
          />
          {query.trim() && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl shadow-2xl z-50 py-2 text-left overflow-hidden">
              {loading && (
                <div className="px-4 py-3 text-xs font-bold text-[var(--text-muted)]">Searching...</div>
              )}
              {!loading && results.length === 0 && (
                <div className="px-4 py-3 text-xs font-bold text-[var(--text-muted)]">No results found</div>
              )}
              {results.map((item) => (
                <button
                  key={`${item.type}-${item.id}`}
                  onClick={() => handleSelect(item)}
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-[var(--bg-main)] transition-all text-left"
                >
                  <PlaceholderLogo name={item.name} logoUrl={item.logo_url || item.company_logo_url} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-[var(--text-main)] truncate">{item.name}</div>
                    <div className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest">
                      {item.type === 'company' ? 'Company' : `${item.company_name || 'Workspace'} / Project`}
                    </div>
                  </div>
                  <SafeIcon icon={FiIcons.FiArrowRight} className="text-[var(--text-muted)]" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4 text-[var(--text-muted)]">
          <div className="flex items-center gap-2 px-4 py-2 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl text-xs font-black">
            <SafeIcon icon={FiIcons.FiBox} /> Shared Workspaces
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl text-xs font-black">
            <SafeIcon icon={FiIcons.FiGitPullRequest} /> Roadmap & Bugs
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl text-xs font-black">
            <SafeIcon icon={FiIcons.FiZap} /> Kanban Delivery
          </div>
        </div>

        <div className="w-full max-w-2xl mx-auto">
          <h2 className="text-center text-2xl font-black tracking-tight text-[var(--text-main)] mb-6">
            Companies using BeAgile
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {partners.map((company) => (
              <button
                key={company.id}
                onClick={() => navigate(`/${company.slug}`)}
                className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-[var(--accent)] transition-all group"
              >
                <div className="w-16 h-16 rounded-2xl overflow-hidden bg-[var(--bg-main)] border border-[var(--border-color)] flex items-center justify-center group-hover:scale-105 transition-all">
                  {company.logo_url ? (
                    <img src={company.logo_url} alt={company.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl font-black text-[var(--accent)]">{company.name?.charAt(0).toUpperCase() || '?'}</span>
                  )}
                </div>
                <span className="text-xs font-bold text-[var(--text-main)] text-center leading-tight">{company.name}</span>
              </button>
            ))}
            {Array.from({ length: placeholderCount }).map((_, i) => (
              <div key={`placeholder-${i}`} className="flex flex-col items-center gap-3 p-4 rounded-2xl opacity-50 bg-[var(--bg-card)] border border-dashed border-[var(--border-color)]">
                <div className="w-16 h-16 rounded-2xl bg-[var(--bg-main)] border border-dashed border-[var(--border-color)] flex items-center justify-center">
                  <SafeIcon icon={FiIcons.FiImage} className="text-[var(--text-muted)]" />
                </div>
                <span className="text-xs font-bold text-[var(--text-muted)] text-center">Your Company</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;
