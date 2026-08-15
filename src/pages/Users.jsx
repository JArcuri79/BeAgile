import React, { useState } from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import { MOCK_USERS } from '../contexts/DataContext';

const Users = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('alphabetical');

  const filteredUsers = MOCK_USERS.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  ).sort((a, b) => {
    if (sortBy === 'alphabetical') return a.name.localeCompare(b.name);
    if (sortBy === 'company') return a.company.localeCompare(b.company);
    if (sortBy === 'role') return a.role.localeCompare(b.role);
    return 0;
  });

  return (
    <div className="w-full p-10 space-y-10 bg-[var(--bg-main)] min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-black tracking-tighter uppercase">User Ecosystem</h1>
          <p className="text-[var(--text-muted)] font-bold">Manage permissions and team access levels.</p>
        </div>
        <div className="flex flex-wrap gap-4 items-center w-full md:w-auto">
          <div className="relative flex-1 md:flex-none">
            <SafeIcon icon={FiIcons.FiSearch} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input 
              type="text" 
              placeholder="Search users..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full md:w-64 pl-9 pr-4 py-3 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl text-sm font-bold focus:outline-none focus:border-[var(--accent)]" 
            />
          </div>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-[var(--accent)]">
            <option value="alphabetical">Alphabetical (A-Z)</option>
            <option value="company">By Company</option>
            <option value="role">By Role</option>
          </select>
          <button className="bg-[var(--accent)] text-[var(--accent-foreground)] px-6 py-3 rounded-xl font-black shadow-xl shadow-[var(--accent)]/20 flex items-center gap-3 hover:scale-[1.02] transition-all">
            <SafeIcon icon={FiIcons.FiUserPlus} className="text-lg" /> INVITE
          </button>
        </div>
      </div>

      <div className="bg-[var(--bg-card)] rounded-3xl border border-[var(--border-color)] overflow-hidden shadow-2xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[var(--bg-main)] border-b border-[var(--border-color)] text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">
              <th className="p-8">Company</th>
              <th className="p-8">Identity</th>
              <th className="p-8">Role Mapping</th>
              <th className="p-8">Node Status</th>
              <th className="p-8">Last Sync</th>
              <th className="p-8 text-right">Operations</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id} className="border-b border-[var(--border-color)] last:border-0 hover:bg-[var(--bg-main)]/50 transition-colors group">
                <td className="p-8">
                  <span className="font-bold text-sm text-[var(--text-main)] px-3 py-1.5 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg">
                    {user.company}
                  </span>
                </td>
                <td className="p-8">
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 rounded-2xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 text-[var(--accent)] flex items-center justify-center font-black text-xl shadow-inner">
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-black text-lg group-hover:text-[var(--accent)] transition-colors">{user.name}</p>
                      <p className="text-xs font-bold text-[var(--text-muted)] mt-1">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="p-8">
                  <select defaultValue={user.role} className="bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl px-4 py-2 text-xs font-black uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20">
                    <option>Admin</option>
                    <option>Team Member</option>
                    <option>End User</option>
                  </select>
                </td>
                <td className="p-8">
                  <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${user.status === 'Active' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-gray-500/10 text-gray-500 border-gray-500/20'}`}>
                    {user.status}
                  </span>
                </td>
                <td className="p-8">
                  <span className="text-sm font-bold text-[var(--text-muted)]">{user.lastSeen}</span>
                </td>
                <td className="p-8 text-right">
                  <button className="p-3 text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-[var(--accent)]/10 rounded-xl transition-all">
                    <SafeIcon icon={FiIcons.FiMoreVertical} className="text-xl" />
                  </button>
                </td>
              </tr>
            ))}
            {filteredUsers.length === 0 && (
              <tr>
                <td colSpan="6" className="p-10 text-center text-[var(--text-muted)] font-bold text-sm">No users found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Users;