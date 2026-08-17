import React, { useState, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { motion, AnimatePresence } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';

const Roadmap = () => {
  const { role } = useAuth();
  const { roadmap, addToDevList, updateEisenhower, sortDataByEisenhower, kanban } = useData();
  const [selectedItem, setSelectedItem] = useState(roadmap[0]);
  const [isEisenhower, setIsEisenhower] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('All');

  const isPrivileged = true;
  const isLeadership = true;

  const filteredRoadmap = useMemo(() => {
    return roadmap.filter(item => {
      const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTag = selectedTag === 'All' || item.category === selectedTag || item.status === selectedTag;
      return matchesSearch && matchesTag;
    });
  }, [roadmap, searchQuery, selectedTag]);

  const handleExportCSV = () => {
    const headers = ['ID', 'Category', 'Title', 'Description', 'Status', 'Upvotes'];
    const csvContent = [
      headers.join(','),
      ...filteredRoadmap.map(item => [
        item.id,
        `"${item.category}"`,
        `"${item.title.replace(/"/g, '""')}"`,
        `"${(item.desc || '').replace(/"/g, '""')}"`,
        `"${item.status}"`,
        item.upvotes
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `roadmap_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDragStart = (e, item) => {
    e.dataTransfer.setData('taskId', item.id);
  };

  const handleDrop = (e, quadrant) => {
    const taskId = parseInt(e.dataTransfer.getData('taskId'));
    updateEisenhower(taskId, 'roadmap', quadrant);
  };

  const handleSort = () => {
    sortDataByEisenhower('roadmap');
    setIsEisenhower(false);
  };

  return (
    <div className="w-full h-[calc(100vh-124px)] flex overflow-hidden">
      <div className="w-1/3 xl:w-1/4 border-r border-[var(--border-color)] flex flex-col bg-[var(--bg-main)]">
        <div className="p-6 border-b border-[var(--border-color)] bg-[var(--bg-card)]">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-xl font-black tracking-tight uppercase">Roadmap</h1>
            <div className="flex gap-2">
              {isLeadership && (
                <button 
                  onClick={() => setIsEisenhower(!isEisenhower)}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-black border transition-all flex items-center gap-2 ${isEisenhower ? 'bg-purple-600 text-white border-purple-600 shadow-lg' : 'bg-purple-600/10 text-purple-600 border-purple-600/20 hover:bg-purple-600 hover:text-white'}`}
                >
                  <SafeIcon icon={FiIcons.FiGrid} /> EISENHOWER
                </button>
              )}
              {isPrivileged && (
                <button onClick={handleExportCSV} className="bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-main)] p-2 rounded-xl flex items-center justify-center hover:bg-[var(--border-color)] transition-all">
                  <SafeIcon icon={FiIcons.FiDownload} />
                </button>
              )}
            </div>
          </div>
          <div className="relative">
            <SafeIcon icon={FiIcons.FiSearch} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input type="text" placeholder="Search features..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-sm" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredRoadmap.map(item => (
            <div 
              key={item.id} 
              draggable={isEisenhower}
              onDragStart={(e) => handleDragStart(e, item)}
              onClick={() => !isEisenhower && setSelectedItem(item)} 
              className={`p-5 rounded-2xl border cursor-pointer transition-all ${selectedItem?.id === item.id && !isEisenhower ? 'border-[var(--accent)] bg-[var(--bg-card)] shadow-xl translate-x-1' : 'border-transparent bg-[var(--bg-card)] hover:border-[var(--accent)]/30'} ${isEisenhower ? 'cursor-grab active:cursor-grabbing' : ''}`}
            >
              <div className="flex justify-between items-start mb-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-[var(--accent)]">{item.category}</span>
                {item.eisenhower && <span className="w-2 h-2 rounded-full bg-[var(--accent)] shadow-[0_0_8px_var(--accent)]" />}
              </div>
              <h3 className="font-bold text-sm leading-tight">{item.title}</h3>
            </div>
          ))}
        </div>
      </div>
      
      <div className="flex-1 bg-[var(--bg-card)] flex flex-col relative overflow-hidden">
        <AnimatePresence mode="wait">
          {isEisenhower ? (
            <motion.div key="eisenhower" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="flex-1 p-8 flex flex-col">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-black tracking-tighter">Eisenhower Priority Matrix</h2>
                <button onClick={handleSort} className="bg-purple-600 text-white px-8 py-4 rounded-2xl font-black shadow-2xl hover:scale-105 transition-all flex items-center gap-3">
                  <SafeIcon icon={FiIcons.FiCheck} /> SORT & APPLY
                </button>
              </div>
              <div className="flex-1 grid grid-cols-2 grid-rows-2 gap-4">
                {[
                  { id: 'Urgent & Important', label: 'Do First', desc: 'Urgent & Important', color: 'border-red-500/20 bg-red-500/5' },
                  { id: 'Important & Not Urgent', label: 'Schedule', desc: 'Important & Not Urgent', color: 'border-blue-500/20 bg-blue-500/5' },
                  { id: 'Urgent & Not Important', label: 'Delegate', desc: 'Urgent & Not Important', color: 'border-orange-500/20 bg-orange-500/5' },
                  { id: 'Not Urgent & Not Important', label: 'Eliminate', desc: 'Not Important & Not Urgent', color: 'border-gray-500/20 bg-gray-500/5' }
                ].map(q => (
                  <div 
                    key={q.id}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handleDrop(e, q.id)}
                    className={`rounded-[2rem] border-2 border-dashed flex flex-col p-8 transition-all hover:border-purple-500 group ${q.color}`}
                  >
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="font-black text-xl tracking-tighter uppercase">{q.label}</h4>
                      <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em]">{q.desc}</span>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-2">
                      {roadmap.filter(r => r.eisenhower === q.id).map(r => (
                        <div key={r.id} className="bg-[var(--bg-card)] p-3 rounded-xl border border-[var(--border-color)] text-xs font-bold shadow-sm">
                          {r.title}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ) : selectedItem ? (
            <motion.div key={selectedItem.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex-1 flex flex-col h-full">
              <div className="p-10 border-b border-[var(--border-color)]">
                <div className="flex justify-between items-start">
                  <div className="space-y-4">
                    <span className="px-3 py-1 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] text-[10px] font-black uppercase tracking-widest">{selectedItem.category}</span>
                    <h2 className="text-4xl font-black tracking-tighter">{selectedItem.title}</h2>
                    <p className="text-[var(--text-muted)] text-xl leading-relaxed max-w-3xl">{selectedItem.desc}</p>
                  </div>
                  <button onClick={() => addToDevList(selectedItem, 'Feature')} className="bg-purple-600 text-white px-8 py-4 rounded-2xl font-black shadow-xl hover:scale-105 transition-all flex items-center gap-3">
                    <SafeIcon icon={FiIcons.FiArrowRight} /> Push to Project List
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-[var(--text-muted)] font-black uppercase tracking-widest">Select a feature</div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Roadmap;