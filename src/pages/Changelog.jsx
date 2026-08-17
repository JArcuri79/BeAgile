import React, { useState, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';

const Changelog = () => {
  const { role } = useAuth();
  const { changelog } = useData();
  const [selectedEntry, setSelectedEntry] = useState(changelog[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('All');

  const allTags = useMemo(() => {
    const tags = new Set(['All']);
    changelog.forEach(entry => {
      if (entry.tag) tags.add(entry.tag);
      if (entry.author) tags.add(entry.author);
    });
    return Array.from(tags);
  }, [changelog]);

  const filteredChangelog = changelog.filter(entry => {
    const matchesSearch = entry.version.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         entry.note.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTag = selectedTag === 'All' || entry.tag === selectedTag || entry.author === selectedTag;
    return matchesSearch && matchesTag;
  });

  const handleExportCSV = () => {
    const headers = ['Version', 'Date', 'Author', 'Tag', 'Notes'];
    const csvContent = [
      headers.join(','),
      ...filteredChangelog.map(item => [
        `"${item.version}"`,
        `"${item.date}"`,
        `"${item.author}"`,
        `"${item.tag}"`,
        `"${item.note.replace(/"/g, '""')}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `changelog_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isPrivileged = true;

  return (
    <div className="w-full h-[calc(100vh-124px)] flex overflow-hidden">
      <div className="w-1/3 xl:w-1/4 border-r border-[var(--border-color)] flex flex-col bg-[var(--bg-main)]">
        <div className="p-6 border-b border-[var(--border-color)] bg-[var(--bg-card)]">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-xl font-black tracking-tight uppercase">Releases</h1>
            {isPrivileged && (
              <button onClick={handleExportCSV} className="bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-main)] p-2 rounded-xl flex items-center justify-center hover:bg-[var(--border-color)] transition-all">
                <SafeIcon icon={FiIcons.FiDownload} />
              </button>
            )}
          </div>
          <div className="space-y-4">
            <div className="relative">
              <SafeIcon icon={FiIcons.FiSearch} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input 
                type="text" 
                placeholder="Search versions..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-sm focus:outline-none" 
              />
            </div>
            <div className="flex flex-wrap gap-1.5 overflow-x-auto no-scrollbar pb-1">
              {allTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${selectedTag === tag ? 'bg-[var(--accent)] text-[var(--accent-foreground)] border-[var(--accent)]' : 'bg-[var(--bg-main)] text-[var(--text-muted)] border-[var(--border-color)] hover:border-[var(--accent)]'}`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredChangelog.map(item => (
            <div key={item.id} onClick={() => setSelectedEntry(item)} className={`p-5 rounded-2xl border cursor-pointer transition-all ${selectedEntry?.id === item.id ? 'border-[var(--accent)] bg-[var(--bg-card)] shadow-xl translate-x-1' : 'border-transparent bg-[var(--bg-card)] hover:border-[var(--accent)]/30'}`} >
              <div className="flex justify-between items-start mb-3">
                <span className="text-sm font-black text-[var(--accent)]">{item.version}</span>
                <span className="text-[10px] font-bold text-[var(--text-muted)]">{item.date}</span>
              </div>
              <h3 className="font-bold text-sm leading-tight text-[var(--text-main)] truncate">{item.note}</h3>
            </div>
          ))}
          {filteredChangelog.length === 0 && (
            <div className="p-10 text-center opacity-40 font-bold text-sm">No releases found.</div>
          )}
        </div>
      </div>
      <div className="flex-1 bg-[var(--bg-card)] flex flex-col">
        <AnimatePresence mode="wait">
          {selectedEntry ? (
            <motion.div key={selectedEntry.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex-1 flex flex-col h-full" >
              <div className="p-10 border-b border-[var(--border-color)] bg-[var(--accent)]/[0.01]">
                <div className="flex justify-between items-start">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 rounded-full bg-[var(--accent)] text-[var(--accent-foreground)] text-[10px] font-black uppercase tracking-widest">{selectedEntry.version}</span>
                      <span className="px-3 py-1 rounded-full bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-muted)] text-[10px] font-black uppercase tracking-widest">{selectedEntry.tag}</span>
                    </div>
                    <h2 className="text-4xl font-black tracking-tighter">Release Notes</h2>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-[var(--text-muted)]">
              <p className="font-bold">Select a version to see what changed</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Changelog;