import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';

const Landing = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    navigate(`/projects?search=${encodeURIComponent(query.trim())}`);
  };

  return (
    <div className="w-full min-h-[calc(100vh-124px)] flex flex-col items-center justify-start bg-[var(--bg-main)] p-10">
      <div className="w-full flex justify-end">
        <form onSubmit={handleSearch} className="relative w-full max-w-md">
          <SafeIcon icon={FiIcons.FiSearch} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Search company projects..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl text-sm font-bold focus:outline-none focus:border-[var(--accent)]"
          />
        </form>
      </div>
      <div className="flex-1 flex items-center justify-center w-full">
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-black tracking-tighter uppercase text-[var(--text-main)]">BeAgile</h1>
          <p className="text-[var(--text-muted)] font-bold">Landing page. Use the menu to navigate.</p>
        </div>
      </div>
    </div>
  );
};

export default Landing;
