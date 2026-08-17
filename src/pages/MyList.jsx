import React, { useState, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';

const MyList = () => {
  const { kanban, markCompleted, markReviewed, updateTaskAssignee, members } = useData();
  const { currentUser } = useAuth();
  const [selectedId, setSelectedId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('All');

  const myItems = useMemo(() => kanban.filter(k =>
    k.allocated_to === currentUser?.id &&
    (k.allocated_to_role || '') === (currentUser?.role || '') &&
    (k.column === 'In Progress' || k.column === 'Completed')
  ), [kanban, currentUser]);
  
  const allTags = useMemo(() => {
    const tags = new Set(['All']);
    myItems.forEach(item => {
      if (item.type) tags.add(item.type);
      if (item.column) tags.add(item.column);
    });
    return Array.from(tags);
  }, [myItems]);

  const filteredItems = myItems.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTag = selectedTag === 'All' || item.type === selectedTag || item.column === selectedTag;
    return matchesSearch && matchesTag;
  });

  const selectedItem = useMemo(() => kanban.find(k => k.id === selectedId) || filteredItems[0], [kanban, selectedId, filteredItems]);

  const handleAction = () => {
    if (!selectedItem) return;
    if (selectedItem.column === 'In Progress') {
      markCompleted(selectedItem.id);
    } else {
      markReviewed(selectedItem.id);
      setSelectedId(null);
    }
  };

  return (
    <div className="w-full h-[calc(100vh-124px)] flex overflow-hidden">
      <div className="w-1/3 xl:w-1/4 border-r border-[var(--border-color)] flex flex-col bg-[var(--bg-main)]">
        <div className="p-6 border-b border-[var(--border-color)] bg-[var(--bg-card)]">
          <h1 className="text-xl font-black tracking-tight uppercase mb-4">My Active Tasks</h1>
          <div className="space-y-4">
            <div className="relative">
              <SafeIcon icon={FiIcons.FiSearch} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input 
                type="text" 
                placeholder="Search my tasks..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-sm focus:outline-none focus:border-[var(--accent)]" 
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
          {filteredItems.map(item => (
            <div key={item.id} onClick={() => setSelectedId(item.id)} className={`p-5 rounded-2xl border cursor-pointer transition-all ${selectedItem?.id === item.id ? 'border-[var(--accent)] bg-[var(--bg-card)] shadow-xl translate-x-1' : 'border-transparent bg-[var(--bg-card)] hover:border-[var(--accent)]/30'}`} >
              <div className="flex justify-between items-start mb-3">
                <span className={`text-[10px] font-black uppercase tracking-widest ${item.column === 'Completed' ? 'text-green-500' : 'text-[var(--accent)]'}`}> {item.column} </span>
              </div>
              <h3 className="font-bold text-sm leading-tight">{item.title}</h3>
            </div>
          ))}
          {filteredItems.length === 0 && (
            <div className="p-10 text-center opacity-40 font-bold text-sm">No tasks found.</div>
          )}
        </div>
      </div>
      <div className="flex-1 bg-[var(--bg-card)] flex flex-col">
        <AnimatePresence mode="wait">
          {selectedItem ? (
            <motion.div key={selectedItem.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex-1 flex flex-col h-full">
              <div className="p-10 border-b border-[var(--border-color)]">
                <div className="flex justify-between items-start">
                  <div className="space-y-4">
                    <span className="px-3 py-1 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] text-[10px] font-black uppercase tracking-widest">ASSIGNED TO ME</span>
                    <h2 className="text-4xl font-black tracking-tighter">{selectedItem.title}</h2>
                    <div className="flex items-center gap-4">
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Assignee</p>
                        <select value={selectedItem.allocated_to_name || 'Unassigned'} onChange={(e) => updateTaskAssignee(selectedItem.id, e.target.value)} className="bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg px-3 py-1.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20" >
                          <option value="Unassigned">Unassigned</option>
                          {members?.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
                          {currentUser?.name && !members?.some(u => u.name === currentUser.name) && (
                            <option value={currentUser.name}>{currentUser.name} ({currentUser.role})</option>
                          )}
                        </select>
                      </div>
                    </div>
                  </div>
                  <button onClick={handleAction} className={`px-10 py-5 rounded-2xl font-black shadow-xl transition-all flex items-center gap-2 ${selectedItem.column === 'Completed' ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`} >
                    <SafeIcon icon={selectedItem.column === 'Completed' ? FiIcons.FiEye : FiIcons.FiCheckCircle} className="text-xl" /> {selectedItem.column === 'Completed' ? 'REVIEW TASK' : 'COMPLETE TASK'}
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-[var(--text-muted)]">Select a task from your list</div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default MyList;