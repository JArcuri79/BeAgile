import React, { useState, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { motion, AnimatePresence } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';

const Links = () => {
  const { role } = useAuth();
  const { links, addLink } = useData();
  const [selectedLink, setSelectedLink] = useState(links[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('All');
  
  // Add Link State
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({ name: '', url: '', notes: '', tags: [] });
  const [tagInput, setTagInput] = useState('');

  const allTags = useMemo(() => {
    const tags = new Set(['All']);
    links.forEach(l => l.tags?.forEach(t => tags.add(t)));
    return Array.from(tags);
  }, [links]);

  const filteredLinks = links.filter(l => {
    const matchesSearch = l.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         l.notes.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTag = selectedTag === 'All' || l.tags?.includes(selectedTag);
    return matchesSearch && matchesTag;
  });

  const handleAddTag = (e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!formData.tags.includes(tagInput.trim())) {
        setFormData({ ...formData, tags: [...formData.tags, tagInput.trim()] });
      }
      setTagInput('');
    }
  };

  const removeTag = (tag) => {
    setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) });
  };

  const handleSubmit = () => {
    if (!formData.name.trim() || !formData.url.trim()) return;
    addLink(formData);
    setFormData({ name: '', url: '', notes: '', tags: [] });
    setIsAdding(false);
  };

  const handleExportCSV = () => {
    if (filteredLinks.length === 0) {
      alert("No links found to export with current filters.");
      return;
    }
    
    const headers = ['Resource Name', 'URL', 'Notes', 'Tags'];
    const csvContent = [
      headers.join(','),
      ...filteredLinks.map(l => `"${l.name.replace(/"/g, '""')}","${l.url}","${(l.notes || '').replace(/"/g, '""')}","${(l.tags || []).join('; ')}"`)
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = `workspace_links_${new Date().toISOString().split('T')[0]}.csv`;
    downloadLink.style.display = 'none';
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full h-[calc(100vh-124px)] flex overflow-hidden">
      <div className="w-1/3 xl:w-1/4 border-r border-[var(--border-color)] flex flex-col bg-[var(--bg-main)]">
        <div className="p-6 border-b border-[var(--border-color)] bg-[var(--bg-card)]">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-xl font-black tracking-tight uppercase">Resource Links</h1>
            <div className="flex gap-2">
              <button 
                onClick={handleExportCSV} 
                className="bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-main)] p-2 rounded-xl flex items-center justify-center hover:bg-[var(--border-color)] transition-all"
                title="Export Filtered Links to CSV"
              >
                <SafeIcon icon={FiIcons.FiDownload} />
              </button>
              {(role === 'crew' || role === 'admin' || role === 'global_admin') && (
                <button onClick={() => { setIsAdding(true); setSelectedLink(null); }} className="bg-[var(--accent)] text-[var(--accent-foreground)] px-4 py-2 rounded-xl text-xs font-black shadow-lg flex items-center gap-2 hover:scale-105 transition-all">
                  <SafeIcon icon={FiIcons.FiPlus} /> NEW
                </button>
              )}
            </div>
          </div>
          <div className="space-y-4">
            <div className="relative">
              <SafeIcon icon={FiIcons.FiSearch} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input 
                type="text" 
                placeholder="Search links..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-sm focus:outline-none focus:border-[var(--accent)]" 
              />
            </div>
            {/* Tag Cloud */}
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
          {filteredLinks.map(item => (
            <div 
              key={item.id} 
              onClick={() => { setSelectedLink(item); setIsAdding(false); }}
              className={`p-5 rounded-2xl border cursor-pointer transition-all ${selectedLink?.id === item.id ? 'border-[var(--accent)] bg-[var(--bg-card)] shadow-xl translate-x-1' : 'border-transparent bg-[var(--bg-card)] hover:border-[var(--accent)]/30'}`}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-lg bg-[var(--accent)]/10 flex items-center justify-center text-[var(--accent)]">
                  <SafeIcon icon={FiIcons.FiLink} />
                </div>
                <h3 className="font-bold text-sm leading-tight truncate flex-1">{item.name}</h3>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {item.tags?.map(tag => (
                  <span key={tag} className="text-[9px] font-black uppercase tracking-tighter text-[var(--accent)] bg-[var(--accent)]/5 px-1.5 py-0.5 rounded">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
          {filteredLinks.length === 0 && (
            <div className="p-6 text-center text-[var(--text-muted)] text-sm font-bold">No links found.</div>
          )}
        </div>
      </div>

      <div className="flex-1 bg-[var(--bg-card)] flex flex-col relative overflow-y-auto">
        <AnimatePresence mode="wait">
          {isAdding ? (
            <motion.div key="add-form" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="p-10 max-w-3xl">
              <h2 className="text-3xl font-black tracking-tighter mb-8 text-[var(--text-main)]">Add New Resource Link</h2>
              <div className="space-y-6">
                <div>
                  <label className="text-xs font-black uppercase text-[var(--text-muted)] tracking-widest block mb-3">Resource Name *</label>
                  <input type="text" className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-2xl px-6 py-4 text-sm font-bold focus:outline-none focus:border-[var(--accent)] text-[var(--text-main)]" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Figma Designs" />
                </div>
                <div>
                  <label className="text-xs font-black uppercase text-[var(--text-muted)] tracking-widest block mb-3">URL *</label>
                  <input type="url" className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-2xl px-6 py-4 text-sm font-bold focus:outline-none focus:border-[var(--accent)] text-[var(--text-main)]" value={formData.url} onChange={e => setFormData({ ...formData, url: e.target.value })} placeholder="https://..." />
                </div>
                <div>
                  <label className="text-xs font-black uppercase text-[var(--text-muted)] tracking-widest block mb-3">Tags (Press Enter)</label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {formData.tags.map(tag => (
                      <span key={tag} className="bg-[var(--accent)] text-[var(--accent-foreground)] px-3 py-1.5 rounded-xl text-[10px] font-black uppercase flex items-center gap-2">
                        {tag}
                        <button onClick={() => removeTag(tag)} className="hover:scale-125 transition-transform"><SafeIcon icon={FiIcons.FiX} /></button>
                      </span>
                    ))}
                  </div>
                  <input 
                    type="text" 
                    className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-2xl px-6 py-4 text-sm font-bold focus:outline-none focus:border-[var(--accent)] text-[var(--text-main)]" 
                    value={tagInput} 
                    onChange={e => setTagInput(e.target.value)} 
                    onKeyDown={handleAddTag}
                    placeholder="Type tag and press Enter..." 
                  />
                </div>
                <div>
                  <label className="text-xs font-black uppercase text-[var(--text-muted)] tracking-widest block mb-3">Notes / Description</label>
                  <textarea className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-[var(--accent)] min-h-[150px] resize-none text-[var(--text-main)]" value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} placeholder="Optional context about this link..." />
                </div>
                <div className="flex gap-4 pt-4">
                  <button onClick={handleSubmit} className="px-8 py-4 rounded-xl bg-[var(--accent)] text-[var(--accent-foreground)] font-black text-sm shadow-xl hover:scale-[1.02] transition-all">
                    SAVE LINK
                  </button>
                  <button onClick={() => { setIsAdding(false); setSelectedLink(links[0]); }} className="px-8 py-4 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] font-black text-sm hover:bg-[var(--border-color)] transition-all text-[var(--text-main)]">
                    CANCEL
                  </button>
                </div>
              </div>
            </motion.div>
          ) : selectedLink ? (
            <motion.div key={selectedLink.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="p-10 flex flex-col gap-8 h-full">
              <div className="border-b border-[var(--border-color)] pb-8">
                <div className="flex flex-wrap gap-2 mb-4">
                  {selectedLink.tags?.map(tag => (
                    <span key={tag} className="px-3 py-1 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] text-[10px] font-black uppercase tracking-widest border border-[var(--accent)]/20">
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-[var(--accent)]/10 flex items-center justify-center text-[var(--accent)] text-2xl shadow-inner">
                    <SafeIcon icon={FiIcons.FiExternalLink} />
                  </div>
                  <h2 className="text-4xl font-black tracking-tighter text-[var(--text-main)]">{selectedLink.name}</h2>
                </div>
                
                <div className="flex items-center gap-4 mt-6">
                  <a href={selectedLink.url} target="_blank" rel="noopener noreferrer" className="bg-[var(--accent)] text-[var(--accent-foreground)] px-6 py-3 rounded-xl font-black shadow-lg flex items-center gap-2 hover:scale-[1.02] transition-all">
                    OPEN LINK <SafeIcon icon={FiIcons.FiArrowUpRight} />
                  </a>
                  <button 
                    onClick={() => { navigator.clipboard.writeText(selectedLink.url); alert('URL Copied!'); }}
                    className="bg-[var(--bg-main)] border border-[var(--border-color)] px-6 py-3 rounded-xl font-black flex items-center gap-2 hover:bg-[var(--border-color)] transition-all text-[var(--text-main)]"
                  >
                    <SafeIcon icon={FiIcons.FiCopy} /> COPY URL
                  </button>
                </div>
              </div>
              
              <div className="flex-1 bg-[var(--bg-main)]/50 rounded-3xl border border-[var(--border-color)] p-8">
                <h4 className="text-xs font-black uppercase text-[var(--text-muted)] tracking-widest mb-4">Context & Notes</h4>
                {selectedLink.notes ? (
                  <p className="text-lg leading-relaxed text-[var(--text-main)] font-medium whitespace-pre-wrap">{selectedLink.notes}</p>
                ) : (
                  <p className="text-[var(--text-muted)] italic font-bold">No additional notes provided for this link.</p>
                )}
              </div>
            </motion.div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-[var(--text-muted)] font-black uppercase tracking-widest">Select a link to view details</div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Links;