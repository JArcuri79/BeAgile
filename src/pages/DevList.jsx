import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';

const DevList = () => {
  const { role } = useAuth();
  const { kanban, assignToMe, addKanbanItem } = useData();
  const devItems = kanban.filter(k => k.column === 'Planned');
  const [selectedItem, setSelectedItem] = useState(devItems[0]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ title: '', desc: '', type: 'Feature' });

  const handleSubmit = () => {
    if (!formData.title.trim()) return;
    addKanbanItem(formData);
    setFormData({ title: '', desc: '', type: 'Feature' });
    setIsModalOpen(false);
  };

  return (
    <div className="w-full h-[calc(100vh-124px)] flex overflow-hidden">
      <div className="w-1/3 xl:w-1/4 border-r border-[var(--border-color)] flex flex-col bg-[var(--bg-main)]">
        <div className="p-6 border-b border-[var(--border-color)] bg-[var(--bg-card)]">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-xl font-black tracking-tight uppercase">Development List</h1>
            {role === 'admin' && (
              <button onClick={() => setIsModalOpen(true)} className="bg-[var(--accent)] text-[var(--accent-foreground)] px-4 py-2 rounded-xl text-xs font-black shadow-lg flex items-center gap-2 hover:scale-105 transition-all">
                <SafeIcon icon={FiIcons.FiPlus} /> ADD TASK
              </button>
            )}
          </div>
          <div className="relative">
            <SafeIcon icon={FiIcons.FiSearch} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input type="text" placeholder="Search dev items..." className="w-full pl-9 pr-4 py-2 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-sm" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {devItems.map(item => (
            <div 
              key={item.id} 
              onClick={() => setSelectedItem(item)}
              className={`p-5 rounded-2xl border cursor-pointer transition-all ${selectedItem?.id === item.id ? 'border-[var(--accent)] bg-[var(--bg-card)] shadow-xl translate-x-1' : 'border-transparent bg-[var(--bg-card)] hover:border-[var(--accent)]/30'}`}
            >
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
                  
                  <button 
                    onClick={() => {
                      assignToMe(selectedItem.id);
                      setSelectedItem(null);
                    }}
                    className="bg-[var(--accent)] text-[var(--accent-foreground)] px-8 py-4 rounded-2xl font-black shadow-xl hover:scale-[1.02] transition-all"
                  >
                    Push to My List
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-[var(--text-muted)]">Select an item to view details</div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 sm:p-6">
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[2.5rem] w-[95vw] max-w-[1400px] shadow-[0_0_100px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col md:flex-row max-h-[90vh]">
                <div className="flex-1 p-8 sm:p-12 overflow-y-auto">
                  <div className="flex justify-between items-center mb-10">
                    <h3 className="text-3xl sm:text-4xl font-black tracking-tighter">New Development Task</h3>
                    <button onClick={() => setIsModalOpen(false)} className="w-12 h-12 rounded-full hover:bg-[var(--bg-main)] flex items-center justify-center border border-[var(--border-color)] transition-all">
                      <SafeIcon icon={FiIcons.FiX} className="text-xl" />
                    </button>
                  </div>
                  
                  <div className="space-y-8">
                    <div>
                      <label className="text-xs font-black uppercase text-[var(--text-muted)] tracking-widest block mb-3">Task Name</label>
                      <input type="text" className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-2xl px-6 py-4 text-lg font-bold focus:outline-none focus:ring-4 focus:ring-[var(--accent)]/10 focus:border-[var(--accent)] transition-all" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="What needs to be done?" />
                    </div>
                    <div>
                      <label className="text-xs font-black uppercase text-[var(--text-muted)] tracking-widest block mb-3">Implementation Details</label>
                      <textarea 
                        className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-2xl px-6 py-4 text-base focus:outline-none focus:ring-4 focus:ring-[var(--accent)]/10 focus:border-[var(--accent)] transition-all min-h-[200px] overflow-hidden resize-none" 
                        value={formData.desc} 
                        onChange={e => {
                          setFormData({...formData, desc: e.target.value});
                          e.target.style.height = 'auto';
                          e.target.style.height = e.target.scrollHeight + 'px';
                        }} 
                        placeholder="Provide technical details, constraints, and requirements..." 
                      />
                    </div>
                  </div>
                </div>

                <div className="w-full md:w-[400px] bg-[var(--bg-main)] border-l border-[var(--border-color)] p-8 sm:p-12 flex flex-col justify-between gap-10 overflow-y-auto">
                  <div className="space-y-8">
                    <div>
                      <label className="text-xs font-black uppercase text-[var(--text-muted)] tracking-widest block mb-3">Task Type</label>
                      <select className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-[var(--accent)]" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                        <option>Feature</option>
                        <option>Bug</option>
                        <option>Task</option>
                      </select>
                    </div>
                    <div className="p-6 rounded-2xl bg-indigo-500/5 border border-indigo-500/10">
                      <p className="text-[10px] font-black text-indigo-500 uppercase mb-2">Planning Rule</p>
                      <p className="text-xs text-[var(--text-muted)] leading-relaxed font-medium">Adding tasks here puts them directly into the 'Planned' column of the Kanban board.</p>
                    </div>
                  </div>
                  
                  <button onClick={handleSubmit} className="w-full py-5 rounded-2xl bg-indigo-600 text-white font-black text-sm shadow-xl hover:scale-[1.02] active:scale-95 transition-all">
                    CREATE TASK
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default DevList;