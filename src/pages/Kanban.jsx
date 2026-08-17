import React, { useState } from 'react';
import { useData, MOCK_USERS } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';

const Kanban = () => {
  const { role } = useAuth();
  const { kanban, updateKanbanColumn, publishToChangelog, pushAllReviewedToChangelog, updateTaskAssignee } = useData();
  const [selectedItem, setSelectedItem] = useState(null);
  const columns = ['Planned', 'In Progress', 'Completed', 'Reviewed'];

  const isPrivileged = true;
  const isAdminOnly = true;

  return (
    <div className="w-full h-[calc(100vh-124px)] flex flex-col overflow-hidden">
      <div className="px-8 py-4 bg-[var(--bg-card)] border-b border-[var(--border-color)] flex justify-between items-center shrink-0">
        <h2 className="text-xl font-black uppercase tracking-tighter text-[var(--text-main)]">Workflow Board</h2>
        {isPrivileged && (
          <button className="bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-main)] px-4 py-2 rounded-xl flex items-center gap-2 font-black text-xs hover:bg-[var(--border-color)] transition-all" >
            <SafeIcon icon={FiIcons.FiDownload} /> EXPORT BOARD
          </button>
        )}
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Board Container: Flexible with horizontal scroll */}
        <div className="flex-1 flex gap-6 p-8 overflow-x-auto bg-[var(--bg-main)] custom-scrollbar">
          {columns.map(col => (
            <div key={col} className="min-w-[300px] w-[300px] flex flex-col shrink-0">
              <div className="flex justify-between items-center mb-6 px-2 shrink-0">
                <h3 className="font-black uppercase tracking-tighter text-xs flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[var(--accent)] shadow-[0_0_8px_var(--accent)]" /> {col}
                </h3>
                <div className="flex items-center gap-3">
                  {col === 'Reviewed' && isAdminOnly && (
                    <button onClick={pushAllReviewedToChangelog} className="text-[10px] font-black uppercase text-[var(--accent)] bg-[var(--accent)]/10 px-2 py-1 rounded hover:bg-[var(--accent)] transition-all border border-[var(--accent)]/20"> Push All </button>
                  )}
                  <span className="bg-[var(--bg-card)] border border-[var(--border-color)] px-2.5 py-1 rounded-lg text-[10px] font-black shadow-sm text-[var(--text-muted)]"> {kanban.filter(k => k.column === col).length} </span>
                </div>
              </div>
              
              <div className="flex-1 space-y-4 overflow-y-auto pb-6 no-scrollbar">
                {kanban.filter(k => k.column === col).map(item => (
                  <motion.div 
                    layoutId={`kanban-${item.id}`} 
                    key={item.id} 
                    onClick={() => setSelectedItem(item)} 
                    className={`bg-[var(--bg-card)] p-4 rounded-2xl border cursor-pointer transition-all ${selectedItem?.id === item.id ? 'border-[var(--accent)] ring-4 ring-[var(--accent)]/10 shadow-2xl scale-[1.02]' : 'border-[var(--border-color)] hover:border-[var(--accent)]/40 hover:shadow-lg'}`}
                  >
                    <h4 className="font-bold text-xs mb-4 leading-tight text-[var(--text-main)]">{item.title}</h4>
                    <div className="flex justify-between items-center pt-3 border-t border-[var(--border-color)]/50">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-[var(--accent)]/10 text-[var(--accent)] flex items-center justify-center text-[8px] font-black uppercase border border-[var(--accent)]/20"> {item.assignee.charAt(0)} </div>
                        <span className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-wider truncate max-w-[120px]">{item.assignee}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Optimized Right Sidebar: Fixed width to prevent overlap */}
        <div className="w-[320px] shrink-0 border-l border-[var(--border-color)] bg-[var(--bg-card)] flex flex-col shadow-[-10px_0_30px_rgba(0,0,0,0.05)] relative z-10">
          <AnimatePresence mode="wait">
            {selectedItem ? (
              <motion.div key="task-details" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 20, opacity: 0 }} className="flex flex-col h-full absolute inset-0 bg-[var(--bg-card)]">
                <div className="p-6 border-b border-[var(--border-color)] flex justify-between items-center bg-[var(--bg-main)]/30">
                  <h2 className="font-black text-lg tracking-tighter uppercase">Task Control</h2>
                  <button onClick={() => setSelectedItem(null)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-500 hover:text-white border border-[var(--border-color)] transition-all">
                    <SafeIcon icon={FiIcons.FiX} />
                  </button>
                </div>
                <div className="flex-1 p-6 space-y-8 overflow-y-auto">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] block">Workflow State</label>
                    <div className="grid grid-cols-2 gap-2">
                      {columns.map(c => (
                        <button key={c} onClick={() => updateKanbanColumn(selectedItem.id, c)} className={`px-2 py-2.5 rounded-xl text-[9px] font-black border tracking-wider transition-all ${selectedItem.column === c ? 'bg-[var(--accent)] text-[var(--accent-foreground)] border-[var(--accent)] shadow-md' : 'bg-[var(--bg-main)] border-[var(--border-color)] hover:border-[var(--accent)]'}`}> {c.toUpperCase()} </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] block">Assignee</label>
                    <select value={selectedItem.assignee} onChange={(e) => updateTaskAssignee(selectedItem.id, e.target.value)} className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-xs font-bold focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/10" >
                      <option value="Unassigned">Unassigned</option>
                      {MOCK_USERS.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
                    </select>
                  </div>
                  <div className="p-5 bg-[var(--bg-main)] rounded-2xl border border-[var(--border-color)] space-y-3">
                    <h3 className="text-sm font-black leading-tight tracking-tight text-[var(--text-main)]">{selectedItem.title}</h3>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-[var(--accent)]/10 text-[var(--accent)] text-[8px] font-black uppercase">{selectedItem.type}</span>
                    </div>
                  </div>
                  {selectedItem.column === 'Reviewed' && isAdminOnly && (
                    <button onClick={() => { publishToChangelog(selectedItem); setSelectedItem(null); }} className="w-full py-4 bg-green-600 text-white rounded-xl font-black shadow-xl shadow-green-600/20 flex items-center justify-center gap-2 tracking-widest text-[10px] hover:scale-[1.02] active:scale-95 transition-all">
                      <SafeIcon icon={FiIcons.FiSend} className="text-base" /> PUBLISH TO CHANGELOG </button>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div key="team-members" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col h-full absolute inset-0 bg-[var(--bg-card)]">
                <div className="p-6 border-b border-[var(--border-color)] bg-[var(--bg-main)]/30">
                  <h2 className="font-black text-lg tracking-tighter flex items-center gap-2 uppercase">
                    <SafeIcon icon={FiIcons.FiUsers} className="text-[var(--accent)]" /> Project Team
                  </h2>
                </div>
                <div className="flex-1 p-6 space-y-3 overflow-y-auto custom-scrollbar">
                  {MOCK_USERS.map(user => (
                    <div key={user.id} className="bg-[var(--bg-card)] p-4 rounded-2xl border border-[var(--border-color)] shadow-sm flex items-center gap-3 hover:border-[var(--accent)]/50 hover:shadow-md transition-all group">
                      <div className="w-10 h-10 rounded-xl bg-[var(--bg-main)] text-[var(--accent)] flex items-center justify-center font-black text-sm shadow-inner group-hover:bg-[var(--accent)] group-hover:text-white transition-colors">
                        {user.name.charAt(0)}
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <h4 className="font-bold text-[11px] text-[var(--text-main)] truncate">{user.name}</h4>
                        <p className="text-[8px] font-black uppercase text-[var(--text-muted)] tracking-widest truncate">{user.role}</p>
                      </div>
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                    </div>
                  ))}
                </div>
                <div className="p-6 border-t border-[var(--border-color)] bg-[var(--bg-main)]/10">
                  <p className="text-[10px] font-black text-[var(--text-muted)] uppercase text-center tracking-widest">Active Node Members</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Kanban;