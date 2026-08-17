import React, { createContext, useContext, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from './AuthContext';

const WorkspaceContext = createContext();

export const WorkspaceProvider = ({ children }) => {
  const { role, currentUser } = useAuth();
  const { companySlug, workspaceSlug } = useParams();
  const [companies, setCompanies] = useState([]);
  const [workspaces, setWorkspaces] = useState([]);
  const [currentCompany, setCurrentCompany] = useState(null);
  const [currentWorkspace, setCurrentWorkspace] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchJson = async (url, options = {}) => {
    const res = await fetch(url, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options,
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  };

  const isGuest = !currentUser;

  const loadCompanies = async () => {
    const endpoint = isGuest ? '/api/public/companies' : '/api/companies';
    const data = await fetchJson(endpoint);
    setCompanies(data.companies || []);
  };

  const loadWorkspaces = async () => {
    const endpoint = isGuest ? '/api/public/workspaces' : '/api/workspaces';
    const data = await fetchJson(endpoint);
    setWorkspaces(data.workspaces || []);
  };

  const loadMembers = async (workspaceId) => {
    if (isGuest || !workspaceId) {
      setMembers([]);
      return;
    }
    const mem = await fetchJson(`/api/workspace-members?workspace_id=${workspaceId}`);
    setMembers(mem.members || []);
  };

  const loadCurrent = async () => {
    if (!companySlug) {
      setCurrentCompany(null);
      setCurrentWorkspace(null);
      return;
    }
    const company = companies.find((c) => c.slug === companySlug);
    if (company) setCurrentCompany(company);

    if (!workspaceSlug) {
      setCurrentWorkspace(null);
      return;
    }
    const workspace = workspaces.find((w) => w.slug === workspaceSlug && w.company_id === company?.id);
    if (workspace) {
      setCurrentWorkspace(workspace);
      await loadMembers(workspace.id);
    }
  };

  useEffect(() => {
    loadCompanies();
    loadWorkspaces();
  }, [role, currentUser]);

  useEffect(() => {
    loadCurrent();
  }, [companySlug, workspaceSlug, companies, workspaces]);

  return (
    <WorkspaceContext.Provider
      value={{
        companies,
        workspaces,
        currentCompany,
        currentWorkspace,
        members,
        loading,
        refresh: () => {
          loadCompanies();
          loadWorkspaces();
        },
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => useContext(WorkspaceContext);
