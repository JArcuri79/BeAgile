-- Tasks, comments, and votes schema
-- Keeps all task lifecycle stages in one table.

CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  uuid TEXT NOT NULL UNIQUE,
  company_id TEXT NOT NULL,
  workspace_id TEXT NOT NULL,
  stage TEXT NOT NULL CHECK(stage IN (
    'roadmap', 'bugs_log', 'project_list', 'my_list',
    'completed', 'reviewed', 'changelog'
  )),
  type TEXT NOT NULL CHECK(type IN ('feature', 'bug', 'task')),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  severity TEXT,
  priority TEXT,

  submitted_by TEXT,
  submitted_by_name TEXT,
  submitted_by_role TEXT,
  submitted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

  allocated_to TEXT,
  allocated_to_name TEXT,
  allocated_to_role TEXT,
  allocated_at TEXT,

  completed_at TEXT,
  reviewed_at TEXT,
  released_at TEXT,

  upvotes INTEGER NOT NULL DEFAULT 0,
  comments_count INTEGER NOT NULL DEFAULT 0,
  is_public INTEGER NOT NULL DEFAULT 1,

  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tasks_company ON tasks(company_id);
CREATE INDEX IF NOT EXISTS idx_tasks_workspace ON tasks(workspace_id);
CREATE INDEX IF NOT EXISTS idx_tasks_stage ON tasks(stage);
CREATE INDEX IF NOT EXISTS idx_tasks_type ON tasks(type);
CREATE INDEX IF NOT EXISTS idx_tasks_allocated_to ON tasks(allocated_to);

CREATE TABLE IF NOT EXISTS task_comments (
  id TEXT PRIMARY KEY,
  uuid TEXT NOT NULL UNIQUE,
  task_uuid TEXT NOT NULL,
  user_id TEXT NOT NULL,
  user_name TEXT,
  user_role TEXT,
  text TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_task_comments_task ON task_comments(task_uuid);

CREATE TABLE IF NOT EXISTS task_votes (
  task_uuid TEXT NOT NULL,
  user_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (task_uuid, user_id)
);

-- Add a public logo URL to companies
ALTER TABLE companies ADD COLUMN logo_url TEXT;
