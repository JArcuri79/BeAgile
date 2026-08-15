import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import { motion, AnimatePresence } from 'framer-motion';

const Projects = () => {
  const { projects, setActiveProject, companies, addProject } = useData();
  const { role } = useAuth();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [companyFilter, setCompanyFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [formData, setFormData] = useState({ name: '', company: companies[0]?.name || '', startDate: new Date().toISOString().split('T')[0], status: 'Planned' });

  // Simulate user's company (mocking a logged-in user tied to 'Acme Corp' unless Global Admin)
  const userCompany = role === 'global_admin' ? null : 'Acme Corp';

  const filteredProjects = projects.filter(p => {
    // 1. Enforce Role-Based Company Isolation
    if (userCompany && p.company !== userCompany) return false;
    
    // 2. Apply UI Filters
    if (companyFilter !== 'All' && p.company !== companyFilter) return false;
    if (statusFilter !== 'All' && p.status !== statusFilter) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    
    return true;
  });

  const handleProjectClick = (project) => {
    setActiveProject(project);
    navigate('/');
  };

  const handleAddProject = () => {
    if (!formData.name.trim()) return;
    addProject(formData);
    setIsModalOpen(false);
    setFormData({ ...formData, name: '' });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Planned': return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
      case 'In Progress': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'Live': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'Offline': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-[var(--bg-main)] text-[var(--text-muted)]';
    }
  };

  return (
    <div className="w-full p-10 space-y-10 bg-[var(--bg-main)] min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-4">
            <h1 className="text-4xl font-black tracking-tighter uppercase text-[var(--text-main)]">Projects Directory</h1>
            <span className="bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20 px-3 py-1 rounded-lg text-sm font-black">
              {filteredProjects.length}
            </span>
            {(role === 'admin' || role === 'global_admin') && (
              <button onClick={() => setIsModalOpen(true)} className="ml-4 bg-[var(--accent)] text-[var(--accent-foreground)] px-6 py-2.5 rounded-xl font-black shadow-lg flex items-center gap-2 hover:scale-[1.02] transition-all text-sm">
                <SafeIcon icon={FiIcons.FiPlus} /> NEW PROJECT
              </button>
            )}
          </div>
          <p className="text-[var(--text-muted)] font-bold">Select a project to load its workspace.</p>
        </div>

        <div className="flex flex-wrap gap-4 items-center w-full md:w-auto">
          <div className="relative flex-1 md:flex-none">
            <SafeIcon icon={FiIcons.FiSearch} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input type="text" placeholder="Search projects..." value={search} onChange={e => setSearch(e.target.value)} className="w-full md:w-64 pl-9 pr-4 py-3 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl text-sm font-bold focus:outline-none focus:border-[var(--accent)]" />
          </div>
          
          {role === 'global_admin' && (
            <select value={companyFilter} onChange={e => setCompanyFilter(e.target.value)} className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-[var(--accent)]">
              <option value="All">All Companies</option>
              {companies.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          )}

          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-[var(--accent)]">
            <option value="All">All Statuses</option>
            <option value="Planned">Planned</option>
            <option value="In Progress">In Progress</option>
            <option value="Live">Live</option>
            <option value="Offline">Offline</option>
          </select>
        </div>
      </div>

      <div className="bg-[var(--bg-card)] rounded-3xl border border-[var(--border-color)] overflow-hidden shadow-2xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[var(--bg-main)] border-b border-[var(--border-color)] text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">
              <th className="p-8">Project Name</th>
              <th className="p-8">Company</th>
              <th className="p-8">Start Date</th>
              <th className="p-8">Status</th>
              <th className="p-8 w-1/4">Completion</th>
            </tr>
          </thead>
          <tbody>
            {filteredProjects.map((project) => (
              <tr 
                key={project.id} 
                onClick={() => handleProjectClick(project)}
                className="border-b border-[var(--border-color)] last:border-0 hover:bg-[var(--bg-main)]/80 transition-colors cursor-pointer group"
              >
                <td className="p-8">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[var(--accent)]/10 text-[var(--accent)] flex items-center justify-center font-black text-lg shadow-inner group-hover:bg-[var(--accent)] group-hover:text-[var(--accent-foreground)] transition-all">
                      <SafeIcon icon={FiIcons.FiBriefcase} />
                    </div>
                    <p className="font-black text-lg text-[var(--text-main)] group-hover:text-[var(--accent)] transition-colors">{project.name}</p>
                  </div>
                </td>
                <td className="p-8">
                  <span className="text-sm font-bold text-[var(--text-main)] bg-[var(--bg-main)] px-3 py-1.5 rounded-lg border border-[var(--border-color)]">
                    {project.company}
                  </span>
                </td>
                <td className="p-8">
                  <span className="text-sm font-bold text-[var(--text-muted)] flex items-center gap-2">
                    <SafeIcon icon={FiIcons.FiCalendar} /> {project.startDate}
                  </span>
                </td>
                <td className="p-8">
                  <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusColor(project.status)}`}>
                    {project.status}
                  </span>
                </td>
                <td className="p-8">
                  <div className="flex items-center gap-4">
                    <div className="flex-1 h-3 bg-[var(--bg-main)] rounded-full overflow-hidden border border-[var(--border-color)]">
                      <div 
                        className="h-full bg-[var(--accent)] rounded-full transition-all duration-1000"
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                    <span className="text-xs font-black text-[var(--text-muted)] w-10 text-right">{project.progress}%</span>
                  </div>
                </td>
              </tr>
            ))}
            {filteredProjects.length === 0 && (
              <tr>
                <td colSpan="5" className="p-16 text-center text-[var(--text-muted)] font-bold">No projects found matching your filters.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[2rem] w-full max-w-lg shadow-2xl p-10">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black tracking-tighter text-[var(--text-main)]">Start New Project</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-[var(--bg-main)] text-[var(--text-main)] rounded-lg transition-all">
                  <SafeIcon icon={FiIcons.FiX} className="text-xl" />
                </button>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="text-xs font-black uppercase text-[var(--text-muted)] tracking-widest block mb-2">Project Name</label>
                  <input type="text" className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-[var(--accent)] text-[var(--text-main)]" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Website Redesign" />
                </div>
                
                {role === 'global_admin' && (
                  <div>
                    <label className="text-xs font-black uppercase text-[var(--text-muted)] tracking-widest block mb-2">Assign Company</label>
                    <select className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-[var(--accent)]" value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})}>
                      {companies.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                  </div>
                )}

                <div>
                  <label className="text-xs font-black uppercase text-[var(--text-muted)] tracking-widest block mb-2">Initial Status</label>
                  <select className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-[var(--accent)]" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                    <option value="Planned">Planned</option>
                    <option value="In Progress">In Progress</option>
                  </select>
                </div>

                <button onClick={handleAddProject} className="w-full py-4 rounded-xl bg-[var(--accent)] text-[var(--accent-foreground)] font-black text-sm shadow-xl hover:scale-[1.02] transition-all mt-4">
                  CREATE PROJECT
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Projects;