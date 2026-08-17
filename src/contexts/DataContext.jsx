import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useWorkspace } from './WorkspaceContext';
import { useAuth } from './AuthContext';

const DataContext = createContext();

const columnMap = {
  project_list: 'Planned',
  my_list: 'In Progress',
  completed: 'Completed',
  reviewed: 'Reviewed',
};

const stageToColumn = (stage) => columnMap[stage] || 'Planned';

const columnToStage = (col) => {
  const found = Object.entries(columnMap).find(([, c]) => c === col);
  return found ? found[0] : 'project_list';
};

export const DataProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const { currentWorkspace, members } = useWorkspace() || {};
  const workspaceId = currentWorkspace?.id;
  const companyId = currentWorkspace?.company_id;

  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [links, setLinks] = useState([]);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);

  const refreshTasks = useCallback(async () => {
    if (!workspaceId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/public/tasks?workspace_id=${workspaceId}`, { credentials: 'include' });
      const data = await res.json();
      setTasks(data.tasks || []);
    } catch (e) {
      console.error('Failed to load tasks', e);
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    refreshTasks();
  }, [refreshTasks]);

  const addTask = async (item) => {
    if (!workspaceId || !companyId) return;
    const body = {
      company_id: companyId,
      workspace_id: workspaceId,
      stage: item.stage,
      type: item.type,
      title: item.title,
      description: item.desc ?? item.description ?? '',
      category: item.category ?? '',
      severity: item.severity ?? '',
      priority: item.priority ?? '',
    };
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.task) setTasks(prev => [...prev, data.task]);
      return data.task;
    } catch (e) {
      console.error('Failed to add task', e);
    }
  };

  const updateTask = async (id, updates) => {
    try {
      const res = await fetch('/api/tasks', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates }),
      });
      const data = await res.json();
      if (data.task) setTasks(prev => prev.map(t => t.id === data.task.id ? data.task : t));
      return data.task;
    } catch (e) {
      console.error('Failed to update task', e);
    }
  };

  const deleteTask = async (id) => {
    try {
      await fetch(`/api/tasks?id=${id}`, { method: 'DELETE', credentials: 'include' });
      setTasks(prev => prev.filter(t => t.id !== id));
    } catch (e) {
      console.error('Failed to delete task', e);
    }
  };

  const addComment = async (taskId, text) => {
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task_id: taskId, text }),
      });
      const data = await res.json();
      return data.comment;
    } catch (e) {
      console.error('Failed to add comment', e);
    }
  };

  const addVote = async (taskId) => {
    try {
      const res = await fetch('/api/votes', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task_id: taskId }),
      });
      const data = await res.json();
      if (data.task) setTasks(prev => prev.map(t => t.id === data.task.id ? data.task : t));
    } catch (e) {
      console.error('Failed to vote', e);
    }
  };

  const addRoadmap = (item) => addTask({ ...item, stage: 'roadmap', type: 'feature' });
  const addBug = (item) => addTask({ ...item, stage: 'bugs_log', type: 'bug' });
  const addKanbanItem = (item) => addTask({ ...item, stage: 'project_list', type: item.type || 'task' });

  const addToDevList = async (item, type) => {
    await updateTask(item.id, { stage: 'project_list' });
  };

  const assignToMe = async (itemId) => {
    await updateTask(itemId, {
      stage: 'my_list',
      allocated_to: currentUser?.id,
      allocated_to_name: currentUser?.name || currentUser?.email || 'User',
      allocated_to_role: currentUser?.role || 'user',
    });
  };

  const markCompleted = (itemId) => updateTask(itemId, { stage: 'completed' });
  const markReviewed = (itemId) => updateTask(itemId, { stage: 'reviewed' });
  const publishToChangelog = (item) => updateTask(item.id, { stage: 'changelog' });

  const updateKanbanColumn = (id, newColumn) => {
    const stage = columnToStage(newColumn);
    return updateTask(id, { stage });
  };

  const updateTaskAssignee = async (id, assigneeName) => {
    const user = members?.find(m => m.name === assigneeName);
    const updates = {
      allocated_to: user?.id,
      allocated_to_name: user?.name || assigneeName,
      allocated_to_role: user?.role || 'user',
    };
    await updateTask(id, updates);
  };

  const pushAllReviewedToChangelog = async () => {
    const reviewed = tasks.filter(t => t.stage === 'reviewed');
    for (const task of reviewed) {
      await updateTask(task.id, { stage: 'changelog' });
    }
  };

  const updateEisenhower = (id, type, quadrant) => {
    const priorityMap = {
      'Urgent & Important': 'DO FIRST',
      'Important & Not Urgent': 'SCHEDULE',
      'Urgent & Not Important': 'DELEGATE',
      'Not Urgent & Not Important': 'ELIMINATE'
    };
    const category = type === 'roadmap' ? (priorityMap[quadrant] || '') : '';
    const severity = type !== 'roadmap' && quadrant === 'Urgent & Important' ? 'High' : '';
    updateTask(id, { priority: quadrant, category, severity });
  };

  const sortDataByEisenhower = (type) => {
    const weight = { 'Urgent & Important': 4, 'Important & Not Urgent': 3, 'Urgent & Not Important': 2, 'Not Urgent & Not Important': 1, '': 0 };
    const stage = type === 'roadmap' ? 'roadmap' : 'bugs_log';
    setTasks(prev => {
      const sorted = [...prev].sort((a, b) => (weight[b.priority || ''] || 0) - (weight[a.priority || ''] || 0));
      return sorted;
    });
  };

  const addProject = (project) => setProjects(prev => [...prev, { ...project, id: Date.now(), expectedEndDate: project.expectedEndDate || '', actualEndDate: '', progress: 0 }]);
  const updateProjectDates = () => {};

  const addCompany = (company) => setCompanies(prev => [...prev, { ...company, id: Date.now(), workspacesUsed: 0, workspacesAllowed: 5 }]);
  const updateCompany = (id, formData) => setCompanies(prev => prev.map(c => c.id === id ? { ...c, ...formData } : c));
  const deleteCompany = (id) => setCompanies(prev => prev.filter(c => c.id !== id));
  const updateCompanyAllowance = (id, allowance) => setCompanies(prev => prev.map(c => c.id === id ? { ...c, workspacesAllowed: allowance } : c));

  const addNote = (note) => setNotes(prev => [...prev, { ...note, id: Date.now(), createdAt: new Date().toISOString() }]);
  const addLink = (link) => setLinks(prev => [...prev, { ...link, id: Date.now(), createdAt: new Date().toISOString() }]);

  const roadmap = useMemo(() =>
    tasks.filter(t => t.stage === 'roadmap').map(t => ({
      ...t,
      desc: t.description,
      status: t.stage,
      eisenhower: t.priority || '',
    })),
  [tasks]);

  const bugs = useMemo(() =>
    tasks.filter(t => t.stage === 'bugs_log').map(t => ({
      ...t,
      desc: t.description,
      status: t.stage,
      eisenhower: t.priority || '',
    })),
  [tasks]);

  const kanban = useMemo(() =>
    tasks.filter(t => ['project_list', 'my_list', 'completed', 'reviewed'].includes(t.stage)).map(t => ({
      ...t,
      column: stageToColumn(t.stage),
      assignee: t.allocated_to_name || 'Unassigned',
    })),
  [tasks]);

  const changelog = useMemo(() =>
    tasks.filter(t => t.stage === 'changelog').map(t => ({
      ...t,
      version: 'Latest',
      date: t.released_at ? t.released_at.split('T')[0] : '',
      author: t.submitted_by_name || 'Unknown',
      tag: t.type || 'Released',
      note: t.title,
    })),
  [tasks]);

  const activeProject = currentWorkspace || projects[0] || null;

  return (
    <DataContext.Provider value={{
      projects, setActiveProject: () => {}, activeProject, updateProjectDates,
      companies, setCompanies,
      roadmap, bugs, kanban, changelog, links, notes,
      tasks, members, loading, refreshTasks,
      updateEisenhower, sortDataByEisenhower, addToDevList,
      assignToMe, markCompleted, markReviewed, updateTaskAssignee, publishToChangelog, updateKanbanColumn,
      addKanbanItem, addNote, addLink, pushAllReviewedToChangelog,
      addProject, addCompany, updateCompany, deleteCompany, updateCompanyAllowance,
      addRoadmap, addBug, addTask, updateTask, deleteTask, addComment, addVote,
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
};
