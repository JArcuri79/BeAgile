import React from 'react';
import { useWorkspace } from '../contexts/WorkspaceContext';

const Dashboard = () => {
  const { currentCompany, currentWorkspace, loading } = useWorkspace();

  return (
    <div className="w-full min-h-[calc(100vh-124px)] flex items-center justify-center bg-[var(--bg-main)] p-10">
      <div className="text-center space-y-6 max-w-lg">
        <h1 className="text-4xl font-black tracking-tighter uppercase text-[var(--text-main)]">
          {currentWorkspace?.name || 'Workspace'}
        </h1>
        {currentCompany && (
          <p className="text-[var(--text-muted)] font-bold">{currentCompany.name}</p>
        )}
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-10 shadow-xl">
          <p className="text-[var(--text-muted)] font-bold">
            {loading ? 'Loading workspace...' : 'This workspace is empty. Use the menu to add content.'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
