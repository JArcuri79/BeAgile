import React, { useState, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';

const ProjectList = () => {
  const { role } = useAuth();
  const { kanban, assignToMe, addKanbanItem } = useData();
  const devItems = kanban.filter(k => k.column === 'Planned');
  const [selectedItem, setSelectedItem] = useState(devItems[0]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ title: '', desc: '', type: 'Feature' });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('All');

  const allTags = useMemo(() => {
    const tags = new Set(['All']);
    devItems.forEach(item => {
      if (item.type) tags.add(item.type);
      if (item.assignee) tags.add(item.assignee);
    });
    return Array.from(tags);
  }, [devItems]);

  const filteredItems = devItems.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || item.type.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTag = selectedTag === 'All' || item.type === selectedTag || item.assignee === selectedTag;
    return matchesSearch && matchesTag;
  });

  const handleSubmit = () => {
    if (!formData.title.trim()) return;
    addKanbanItem(formData);
    setFormData({ title: '', desc: '', type: 'Feature' });
    setIsModalOpen(false);
  };

  const handleExportCSV = () => {
    const headers = ['ID', 'Type', 'Title', 'Description', 'Assignee', 'Status'];
    const csvContent = [
      headers.join(','),
      ...filteredItems.map(item => [
        item.id,
        `"${item.type}"`,
        `"${item.title.replace(/"/g, '""')}"`,
        `"${(item.desc || '').replace(/"/g, '""')}"`,
        `"${item.assignee || 'Unassigned'}"`,
        `"${item.column}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `project_tasks_${new Date().toISOString().split('T')[0]}.csv`);
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
            <h1 className="text-xl font-black tracking-tight uppercase">Project List</h1>
            <div className="flex gap-2">
              {isPrivileged && (
                <button onClick={handleExportCSV} className="bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-main)] p-2 rounded-xl flex items-center justify-center hover:bg-[var(--border-color)] transition-all">
                  <SafeIcon icon={FiIcons.FiDownload} />
                </button>
              )}
              {isPrivileged && (
                <button onClick={() => setIsModalOpen(true)} className="bg-[var(--accent)] text-[var(--accent-foreground)] px-4 py-2 rounded-xl text-xs font-black shadow-lg flex items-center gap-2 hover:scale-105 transition-all">
                  <SafeIcon icon={FiIcons.FiPlus} /> TASK
                </button>
              )}
            </div>
          </div>
          <div className="space-y-4">
            <div className="relative">
              <SafeIcon icon={FiIcons.FiSearch} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input type="text" placeholder="Search tasks..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-sm" />
            </div>
            <div className="flex flex-wrap gap-1.5 overflow-x-auto no-scrollbar pb-1">
              {allTags.map(tag => (
                <button key={tag} onClick={() => setSelectedTag(tag)} className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${selectedTag === tag ? 'bg-[var(--accent)] text-[var(--accent-foreground)] border-[var(--accent)]' : 'bg-[var(--bg-main)] text-[var(--text-muted)] border-[var(--border-color)] hover:border-[var(--accent)]'}`} >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredItems.map(item => (
            <div key={item.id} onClick={() => setSelectedItem(item)} className={`p-5 rounded-2xl border cursor-pointer transition-all ${selectedItem?.id === item.id ? 'border-[var(--accent)] bg-[var(--bg-card)] shadow-xl translate-x-1' : 'border-transparent bg-[var(--bg-card)] hover:border-[var(--accent)]/30'}`} >
              <div className="flex justify-between items-start mb-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-[var(--accent)]">{item.type}</span>
              </div>
              <h3 className="font-bold text-sm leading-tight">{item.title}</h3>
            </div>
          ))}
        </div>
      </div>
      
      <div className="flex-1 bg-[var(--bg-card)] flex flex-col relative">
        <AnimatePresence mode="wait">
          {selectedItem ? (
            <motion.div key={selectedItem.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex-1 flex flex-col h-full">
              <div className="p-10 border-b border-[var(--border-color)]">
                <div className="flex justify-between items-start">
                  <div className="space-y-4">
                    <span className="px-3 py-1 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] text-[10px] font-black uppercase tracking-widest">PLANNED TASK</span>
                    <h2 className="text-4xl font-black tracking-tighter">{selectedItem.title}</h2>
                    <p className="text-[var(--text-muted)] text-xl leading-relaxed max-w-3xl">This item is ready for development. Assign it to yourself to start working.</p>
                  </div>
                  <button onClick={() => { assignToMe(selectedItem.id); setSelectedItem(null); }} className="bg-[var(--accent)] text-[var(--accent-foreground)] px-8 py-4 rounded-2xl font-black shadow-xl hover:scale-[1.02] transition-all" >
                    Push to My List
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-[var(--text-muted)]">Select an item to view details</div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ProjectList;