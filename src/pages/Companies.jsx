import React, { useState } from 'react';
import { useData, MOCK_USERS } from '../contexts/DataContext';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import { motion, AnimatePresence } from 'framer-motion';

const Companies = () => {
  const { companies, addCompany, updateCompany, deleteCompany, updateCompanyAllowance } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCredModalOpen, setIsCredModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: '', adminName: '', adminEmail: '', adminPhone: '' });
  const [activeCreds, setActiveCreds] = useState(null);
  
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('alphabetical');

  const openAddModal = () => {
    setEditingId(null);
    setFormData({ name: '', adminName: '', adminEmail: '', adminPhone: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (company) => {
    setEditingId(company.id);
    setFormData({ name: company.name, adminName: company.adminName, adminEmail: company.adminEmail, adminPhone: company.adminPhone });
    setIsModalOpen(true);
  };

  const openCredentialsModal = (company) => {
    const tempPassword = Math.random().toString(36).slice(-8) + "A1!";
    const link = window.location.origin + window.location.pathname + '#/account';
    const message = `Welcome to the ${company.name} Workspace!\n\nHello ${company.adminName},\n\nYour administrative account has been successfully provisioned. Please use the temporary credentials below to log in for the first time.\n\nTemporary Password: ${tempPassword}\n\nFor security purposes, please change your password immediately upon logging in.\nAccess your account settings here: ${link}\n\nBest regards,\nThe Infrastructure Team`;
    setActiveCreds({ company, message });
    setIsCredModalOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.name.trim() || !formData.adminEmail.trim()) return;
    if (editingId) updateCompany(editingId, formData);
    else addCompany(formData);
    setIsModalOpen(false);
  };

  const handleDelete = (id) => {
    const confirmation = window.prompt("Type 'DELETE' to confirm removing this company.");
    if (confirmation === 'DELETE') {
      deleteCompany(id);
    }
  };

  const handleAllowanceChange = (id, value) => {
    const val = parseInt(value, 10);
    if (!isNaN(val) && val >= 0) {
      updateCompanyAllowance(id, val);
    }
  };

  const filteredCompanies = companies.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase())).sort((a, b) => {
    if (sortBy === 'alphabetical') return a.name.localeCompare(b.name);
    if (sortBy === 'highest-workspace') return b.workspacesAllowed - a.workspacesAllowed;
    if (sortBy === 'lowest-workspace') return a.workspacesAllowed - b.workspacesAllowed;
    return 0;
  });

  return (
    <div className="w-full p-10 space-y-10 bg-[var(--bg-main)] min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-black tracking-tighter uppercase text-[var(--text-main)]">Companies Directory</h1>
          <p className="text-[var(--text-muted)] font-bold">Global Administration: Manage all tenant organizations.</p>
        </div>
        <div className="flex flex-wrap gap-4 items-center w-full md:w-auto">
          <div className="relative flex-1 md:flex-none">
            <SafeIcon icon={FiIcons.FiSearch} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input 
              type="text" 
              placeholder="Search companies..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full md:w-64 pl-9 pr-4 py-3 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl text-sm font-bold focus:outline-none focus:border-[var(--accent)]" 
            />
          </div>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-[var(--accent)]">
            <option value="alphabetical">Alphabetical (A-Z)</option>
            <option value="highest-workspace">Highest Workspaces</option>
            <option value="lowest-workspace">Lowest Workspaces</option>
          </select>
          <button onClick={openAddModal} className="bg-[var(--accent)] text-[var(--accent-foreground)] px-6 py-3 rounded-xl font-black shadow-xl flex items-center gap-3 hover:scale-[1.02] transition-all">
            <SafeIcon icon={FiIcons.FiPlus} className="text-lg" /> REGISTER
          </button>
        </div>
      </div>

      <div className="bg-[var(--bg-card)] rounded-3xl border border-[var(--border-color)] overflow-hidden shadow-2xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[var(--bg-main)] border-b border-[var(--border-color)] text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">
              <th className="p-8">Company Name</th>
              <th className="p-8">Users</th>
              <th className="p-8">Workspaces (Used/Allowed)</th>
              <th className="p-8">Primary Admin</th>
              <th className="p-8">Contact Info</th>
              <th className="p-8 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCompanies.map((company) => {
              const usersCount = MOCK_USERS.filter(u => u.company === company.name).length;
              return (
                <tr key={company.id} className="border-b border-[var(--border-color)] last:border-0 hover:bg-[var(--bg-main)]/50 transition-colors">
                  <td className="p-8">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-[var(--accent)]/10 text-[var(--accent)] flex items-center justify-center font-black text-xl shadow-inner">
                        {company.name.charAt(0)}
                      </div>
                      <p className="font-black text-lg text-[var(--text-main)]">{company.name}</p>
                    </div>
                  </td>
                  <td className="p-8">
                    <span className="font-bold text-sm text-[var(--text-main)] px-3 py-1 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg">
                      {usersCount} Users
                    </span>
                  </td>
                  <td className="p-8">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-[var(--text-main)]">{company.workspacesUsed}</span>
                      <span className="text-[var(--text-muted)] font-bold">/</span>
                      <input 
                        type="number" 
                        min="0"
                        value={company.workspacesAllowed} 
                        onChange={(e) => handleAllowanceChange(company.id, e.target.value)}
                        className="w-16 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg px-2 py-1 text-sm font-bold focus:outline-none focus:border-[var(--accent)] text-[var(--text-main)]"
                      />
                    </div>
                  </td>
                  <td className="p-8">
                    <span className="font-bold text-sm text-[var(--text-main)]">{company.adminName}</span>
                  </td>
                  <td className="p-8">
                    <div className="flex flex-col space-y-1">
                      <span className="text-xs font-bold text-[var(--text-muted)] flex items-center gap-2">
                        <SafeIcon icon={FiIcons.FiMail} /> {company.adminEmail}
                      </span>
                      <span className="text-xs font-bold text-[var(--text-muted)] flex items-center gap-2">
                        <SafeIcon icon={FiIcons.FiPhone} /> {company.adminPhone}
                      </span>
                    </div>
                  </td>
                  <td className="p-8 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openCredentialsModal(company)} title="Generate Credentials" className="p-3 text-[var(--text-muted)] hover:text-indigo-500 hover:bg-indigo-500/10 rounded-xl transition-all">
                        <SafeIcon icon={FiIcons.FiKey} className="text-lg" />
                      </button>
                      <button onClick={() => openEditModal(company)} title="Edit Company" className="p-3 text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-[var(--accent)]/10 rounded-xl transition-all">
                        <SafeIcon icon={FiIcons.FiEdit2} className="text-lg" />
                      </button>
                      <button onClick={() => handleDelete(company.id)} title="Delete Company" className="p-3 text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all">
                        <SafeIcon icon={FiIcons.FiTrash2} className="text-lg" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filteredCompanies.length === 0 && (
              <tr>
                <td colSpan="6" className="p-10 text-center text-[var(--text-muted)] font-bold text-sm">No companies found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[2rem] w-full max-w-2xl shadow-2xl p-10">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black tracking-tighter text-[var(--text-main)]">{editingId ? 'Edit Company' : 'Register New Company'}</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-[var(--bg-main)] text-[var(--text-main)] rounded-lg transition-all">
                  <SafeIcon icon={FiIcons.FiX} className="text-xl" />
                </button>
              </div>
              <div className="space-y-6">
                <div>
                  <label className="text-xs font-black uppercase text-[var(--text-muted)] tracking-widest block mb-2">Company Name</label>
                  <input type="text" className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-[var(--accent)] text-[var(--text-main)]" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Acme Corp" />
                </div>
                <div>
                  <label className="text-xs font-black uppercase text-[var(--text-muted)] tracking-widest block mb-2">Admin Contact Name</label>
                  <input type="text" className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-[var(--accent)] text-[var(--text-main)]" value={formData.adminName} onChange={e => setFormData({ ...formData, adminName: e.target.value })} placeholder="e.g. John Doe" />
                </div>
                <div>
                  <label className="text-xs font-black uppercase text-[var(--text-muted)] tracking-widest block mb-2">Admin Email Address</label>
                  <input type="email" className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-[var(--accent)] text-[var(--text-main)]" value={formData.adminEmail} onChange={e => setFormData({ ...formData, adminEmail: e.target.value })} placeholder="admin@company.com" />
                </div>
                <div>
                  <label className="text-xs font-black uppercase text-[var(--text-muted)] tracking-widest block mb-2">Admin Contact Number</label>
                  <input type="text" className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-[var(--accent)] text-[var(--text-main)]" value={formData.adminPhone} onChange={e => setFormData({ ...formData, adminPhone: e.target.value })} placeholder="+1-555-0100" />
                </div>
                <button onClick={handleSubmit} className="w-full py-4 rounded-xl bg-[var(--accent)] text-[var(--accent-foreground)] font-black text-sm shadow-xl hover:scale-[1.02] transition-all mt-4">
                  {editingId ? 'SAVE CHANGES' : 'REGISTER COMPANY'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isCredModalOpen && activeCreds && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[2rem] w-full max-w-2xl shadow-2xl p-10">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-black tracking-tighter text-[var(--text-main)] flex items-center gap-3">
                  <SafeIcon icon={FiIcons.FiKey} className="text-[var(--accent)]" /> Generated Credentials
                </h3>
                <button onClick={() => setIsCredModalOpen(false)} className="p-2 hover:bg-[var(--bg-main)] text-[var(--text-main)] rounded-lg transition-all">
                  <SafeIcon icon={FiIcons.FiX} className="text-xl" />
                </button>
              </div>
              <p className="text-[var(--text-muted)] font-bold text-sm mb-6">Copy this message and send it securely to the new company administrator.</p>
              <div className="bg-[var(--bg-main)] border border-[var(--border-color)] rounded-2xl p-6 relative group">
                <pre className="text-sm font-medium text-[var(--text-main)] whitespace-pre-wrap font-sans">{activeCreds.message}</pre>
                <button onClick={() => { navigator.clipboard.writeText(activeCreds.message); alert("Message copied to clipboard!"); }} className="absolute top-4 right-4 bg-[var(--bg-card)] border border-[var(--border-color)] p-2 rounded-lg text-[var(--text-main)] hover:text-[var(--accent)] hover:border-[var(--accent)] transition-all shadow-sm" title="Copy to Clipboard" >
                  <SafeIcon icon={FiIcons.FiCopy} />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Companies;