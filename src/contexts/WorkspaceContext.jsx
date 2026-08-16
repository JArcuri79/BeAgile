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

  const loadCompanies = async () => {
    const data = await fetchJson('/api/companies');
    setCompanies(data.companies || []);
  };

  const loadWorkspaces = async () => {
    const data = await fetchJson('/api/workspaces');
    setWorkspaces(data.workspaces || []);
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
      const mem = await fetchJson(`/api/workspace-members?workspace_id=${workspace.id}`);
      setMembers(mem.members || []);
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
