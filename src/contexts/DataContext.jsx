import React, { createContext, useContext, useState } from 'react';
import { useWorkspace } from './WorkspaceContext';
import { useAuth } from './AuthContext';

const DataContext = createContext();

export const MOCK_USERS = [
  { id: 'u1', name: 'Admin User', email: 'admin@beagile.com', role: 'Admin', status: 'Active', lastSeen: '2 mins ago', company: 'Acme Corp' },
  { id: 'u2', name: 'Sarah Jenkins', email: 'sarah.j@beagile.com', role: 'Team Member', status: 'Active', lastSeen: '1 hour ago', company: 'Acme Corp' },
  { id: 'u3', name: 'John Marcus', email: 'j.marcus@beagile.com', role: 'End User', status: 'Inactive', lastSeen: '3 days ago', company: 'Globex Inc' },
  { id: 'u4', name: 'Elena Vance', email: 'evance@beagile.com', role: 'Team Member', status: 'Active', lastSeen: 'Online', company: 'Globex Inc' },
];

const initialProjects = [
  { 
    id: 1, 
    name: 'Alpha Redesign', 
    company: 'Acme Corp', 
    startDate: '2023-10-01', 
    expectedEndDate: '2024-03-01', 
    actualEndDate: '',
    status: 'In Progress', 
    progress: 65 
  },
  { id: 2, name: 'Beta Launch', company: 'Acme Corp', startDate: '2023-11-01', expectedEndDate: '2024-05-01', actualEndDate: '', status: 'Planned', progress: 10 },
];

const initialCompanies = [
  { id: 1, name: 'Acme Corp', adminName: 'John Doe', adminEmail: 'john@acme.com', adminPhone: '+1-555-0100', workspacesUsed: 2, workspacesAllowed: 5 },
  { id: 2, name: 'Globex Inc', adminName: 'Jane Smith', adminEmail: 'jane@globex.com', adminPhone: '+1-555-0200', workspacesUsed: 4, workspacesAllowed: 5 },
];

const initialRoadmap = [
  { id: 1, title: 'Dark Mode Support', desc: 'Add system-wide dark mode', status: 'Planned', category: 'Feature', upvotes: 45, comments: 12, eisenhower: '' },
  { id: 2, title: 'API Integration', desc: 'External data sync', status: 'Planned', category: 'Dev', upvotes: 30, comments: 5, eisenhower: '' }
];

const initialBugs = [
  { id: 101, title: 'Login Page Crash', desc: 'App crashes on mobile login', status: 'Unverified', severity: 'High', upvotes: 8, comments: 2, eisenhower: '' }
];

const initialKanban = [
  { id: 201, title: 'Dark Mode Support', column: 'Planned', assignee: 'Unassigned', type: 'Feature' },
  { id: 202, title: 'Legacy Cleanup', column: 'Completed', assignee: 'Sarah Jenkins', type: 'Task' }
];

const initialChangelog = [
  { id: 301, version: 'v1.2.0', date: '2023-10-25', author: 'Alex', tag: 'Feature Added', note: 'Introduced Kanban boards.' },
  { id: 302, version: 'v1.2.1', date: '2023-11-05', author: 'Admin User', tag: 'Bug Fix', note: 'Legacy Cleanup completed.' }
];

export const DataProvider = ({ children }) => {
  const [projects, setProjects] = useState(initialProjects);
  const [activeProject, setActiveProject] = useState(initialProjects[0]);
  const [companies, setCompanies] = useState(initialCompanies);
  const [roadmap, setRoadmap] = useState(initialRoadmap);
  const [bugs, setBugs] = useState(initialBugs);
  const [kanban, setKanban] = useState(initialKanban);
  const [changelog, setChangelog] = useState(initialChangelog);
  const [links, setLinks] = useState([]);
  const [notes, setNotes] = useState([]);
  const { currentUser } = useAuth();

  const updateProjectDates = (id, field, value) => {
    setProjects(projects.map(p => p.id === id ? { ...p, [field]: value } : p));
    if (activeProject?.id === id) setActiveProject({ ...activeProject, [field]: value });
  };

  const addProject = (project) => {
    const newProject = {
      ...project,
      id: Date.now(),
      expectedEndDate: project.expectedEndDate || '',
      actualEndDate: '',
      progress: 0
    };
    setProjects(prev => [...prev, newProject]);
  };

  const updateEisenhower = (id, type, quadrant) => {
    const priorityMap = {
      'Urgent & Important': 'DO FIRST',
      'Important & Not Urgent': 'SCHEDULE',
      'Urgent & Not Important': 'DELEGATE',
      'Not Urgent & Not Important': 'ELIMINATE'
    };
    
    if (type === 'roadmap') {
      setRoadmap(roadmap.map(r => r.id === id ? { ...r, eisenhower: quadrant, category: priorityMap[quadrant] || r.category } : r));
    } else {
      setBugs(bugs.map(b => b.id === id ? { ...b, eisenhower: quadrant, severity: quadrant === 'Urgent & Important' ? 'High' : b.severity } : b));
    }
  };

  const sortDataByEisenhower = (type) => {
    const weight = { 'Urgent & Important': 4, 'Important & Not Urgent': 3, 'Urgent & Not Important': 2, 'Not Urgent & Not Important': 1, '': 0 };
    if (type === 'roadmap') {
      setRoadmap([...roadmap].sort((a, b) => weight[b.eisenhower || ''] - weight[a.eisenhower || '']));
    } else {
      setBugs([...bugs].sort((a, b) => weight[b.eisenhower || ''] - weight[a.eisenhower || '']));
    }
  };

  const addToDevList = (item, type) => {
    if (!kanban.find(k => k.id === item.id)) {
      setKanban(prev => [...prev, { ...item, id: item.id || Date.now(), column: 'Planned', assignee: 'Unassigned', type: type }]);
    }
  };

  const addRoadmap = (item) => {
    setRoadmap(prev => [...prev, { ...item, id: Date.now(), status: 'Planned', upvotes: 0, comments: 0, eisenhower: '' }]);
  };

  const addBug = (item) => {
    setBugs(prev => [...prev, { ...item, id: Date.now(), status: 'Unverified', upvotes: 0, comments: 0, eisenhower: '' }]);
  };

  const addKanbanItem = (item) => {
    setKanban(prev => [
      ...prev,
      {
        ...item,
        id: item.id || Date.now(),
        column: 'Planned',
        assignee: 'Unassigned',
        type: item.type || 'Task'
      }
    ]);
  };

  const updateTaskAssignee = (itemId, newAssignee) => setKanban(prev => prev.map(k => k.id === itemId ? { ...k, assignee: newAssignee } : k));
  const assignToMe = (itemId) => setKanban(prev => prev.map(k => k.id === itemId ? { ...k, column: 'In Progress', assignee: currentUser?.name || 'Admin User', assigneeRole: currentUser?.role || '' } : k));
  const markCompleted = (itemId) => setKanban(prev => prev.map(k => k.id === itemId ? { ...k, column: 'Completed' } : k));
  const markReviewed = (itemId) => setKanban(prev => prev.map(k => k.id === itemId ? { ...k, column: 'Reviewed' } : k));
  const updateKanbanColumn = (id, newColumn) => setKanban(kanban.map(k => k.id === id ? { ...k, column: newColumn } : k));

  const publishToChangelog = (item) => {
    setKanban(prev => prev.filter(k => k.id !== item.id));
    setChangelog([{ id: Date.now(), version: 'Latest', date: new Date().toISOString().split('T')[0], author: 'Admin User', tag: 'Released', note: `Published: ${item.title}` }, ...changelog]);
  };

  const pushAllReviewedToChangelog = () => {
    const reviewed = kanban.filter(k => k.column === 'Reviewed');
    if (!reviewed.length) return;

    const newEntries = reviewed.map((item, idx) => ({
      id: Date.now() + idx,
      version: 'Latest',
      date: new Date().toISOString().split('T')[0],
      author: 'Admin User',
      tag: 'Released',
      note: `Published: ${item.title}`
    }));

    setKanban(prev => prev.filter(k => k.column !== 'Reviewed'));
    setChangelog(prev => [...newEntries, ...prev]);
  };

  const addNote = (note) => {
    setNotes(prev => [
      ...prev,
      {
        ...note,
        id: Date.now(),
        createdAt: new Date().toISOString()
      }
    ]);
  };

  const addLink = (link) => {
    setLinks(prev => [
      ...prev,
      {
        ...link,
        id: Date.now(),
        createdAt: new Date().toISOString()
      }
    ]);
  };

  const addCompany = (company) => {
    setCompanies(prev => [
      ...prev,
      {
        ...company,
        id: Date.now(),
        workspacesUsed: 0,
        workspacesAllowed: 5
      }
    ]);
  };

  const updateCompany = (id, formData) => {
    setCompanies(prev => prev.map(c => c.id === id ? { ...c, ...formData } : c));
  };

  const deleteCompany = (id) => {
    setCompanies(prev => prev.filter(c => c.id !== id));
  };

  const updateCompanyAllowance = (id, allowance) => {
    setCompanies(prev => prev.map(c => c.id === id ? { ...c, workspacesAllowed: allowance } : c));
  };

  return (
    <DataContext.Provider value={{
      projects, setActiveProject, activeProject, updateProjectDates,
      companies, setCompanies,
      roadmap, bugs, kanban, changelog, links, notes,
      updateEisenhower, sortDataByEisenhower, addToDevList,
      assignToMe, markCompleted, markReviewed, updateTaskAssignee, publishToChangelog, updateKanbanColumn,
      addKanbanItem, addNote, addLink, pushAllReviewedToChangelog,
      addProject, addCompany, updateCompany, deleteCompany, updateCompanyAllowance,
      addRoadmap, addBug
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const ctx = useContext(DataContext);
  const ws = useWorkspace();
  const workspaceId = ws?.currentWorkspace?.id;

  const filter = (arr) => {
    if (!Array.isArray(arr)) return arr;
    if (!workspaceId) return arr;
    return arr.filter(item => item && (item.workspace_id === workspaceId || item.workspace_id === undefined || item.workspace_id === null));
  };

  const filtered = {
    projects: filter(ctx.projects),
    roadmap: filter(ctx.roadmap),
    bugs: filter(ctx.bugs),
    kanban: filter(ctx.kanban),
    changelog: filter(ctx.changelog),
    links: filter(ctx.links),
    notes: filter(ctx.notes),
    companies: filter(ctx.companies),
    activeProject: null,
    members: ws?.members || [],
  };

  filtered.activeProject = filtered.projects.find(p => p.id === ctx.activeProject?.id)
    || filtered.projects[0]
    || null;

  const withWorkspace = (item) => ({ ...item, workspace_id: workspaceId });

  return {
    ...ctx,
    ...filtered,
    workspaceId,
    members: ws?.members || [],
    addProject: (p) => workspaceId ? ctx.addProject(withWorkspace(p)) : ctx.addProject(p),
    addKanbanItem: (item) => workspaceId ? ctx.addKanbanItem(withWorkspace(item)) : ctx.addKanbanItem(item),
    addToDevList: (item, type) => workspaceId ? ctx.addToDevList(withWorkspace(item), type) : ctx.addToDevList(item, type),
    addNote: (n) => workspaceId ? ctx.addNote(withWorkspace(n)) : ctx.addNote(n),
    addLink: (l) => workspaceId ? ctx.addLink(withWorkspace(l)) : ctx.addLink(l),
    addRoadmap: (item) => workspaceId ? ctx.addRoadmap(withWorkspace(item)) : ctx.addRoadmap(item),
    addBug: (item) => workspaceId ? ctx.addBug(withWorkspace(item)) : ctx.addBug(item),
    addCompany: (c) => workspaceId ? ctx.addCompany({ ...c, id: Date.now() }) : ctx.addCompany(c),
  };
};
