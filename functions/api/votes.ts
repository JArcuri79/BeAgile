import type { PagesFunction } from "@cloudflare/workers-types";
import { createAuth, type Env } from "../_shared/auth";

async function getSession(auth: any, headers: Headers) {
  try {
    return await auth.api.getSession({ headers });
  } catch {
    return null;
  }
}

async function getTask(db: any, id: string) {
  const { results } = await db.prepare("SELECT * FROM tasks WHERE id = ?").bind(id).all();
  return results?.[0] || null;
}

async function getWorkspace(db: any, id: string) {
  const { results } = await db.prepare("SELECT * FROM workspaces WHERE id = ?").bind(id).all();
  return results?.[0] || null;
}

async function canAccessWorkspace(db: any, session: any, workspace: any) {
  if (!session?.user) return false;
  const role = session.user.role === "superuser" ? "global_admin" : session.user.role;
  if (role === "global_admin") return true;
  if (role === "admin" && session.user.company === workspace.company_id) return true;
  const { results } = await db.prepare(
    "SELECT COUNT(*) as c FROM workspace_members WHERE workspace_id = ? AND user_id = ?"
  ).bind(workspace.id, session.user.id).all();
  return (results?.[0]?.c || 0) > 0;
}

function now() {
  return new Date().toISOString();
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const auth = createAuth(context.env);
  const session = await getSession(auth, context.request.headers);
  if (!session?.user) return new Response("Unauthorized", { status: 401 });

  const body: any = await context.request.json().catch(() => ({}));
  const { task_id } = body;
  if (!task_id) return new Response("task_id required", { status: 400 });

  const task = await getTask(context.env.DB, task_id);
  if (!task) return new Response("Task not found", { status: 404 });

  const workspace = await getWorkspace(context.env.DB, task.workspace_id);
  if (!workspace) return new Response("Workspace not found", { status: 404 });

  if (!(await canAccessWorkspace(context.env.DB, session, workspace))) {
    return new Response("Forbidden", { status: 403 });
  }

  try {
    await context.env.DB.prepare(
      `INSERT INTO task_votes (task_uuid, user_id, created_at)
       VALUES (?, ?, ?)
       ON CONFLICT(task_uuid, user_id) DO NOTHING`
    ).bind(task.uuid, session.user.id, now()).run();

    await context.env.DB.prepare(
      `UPDATE tasks
       SET upvotes = (SELECT COUNT(*) FROM task_votes WHERE task_uuid = ?),
           updated_at = ?
       WHERE id = ?`
    ).bind(task.uuid, now(), task.id).run();

    const { results } = await context.env.DB.prepare("SELECT * FROM tasks WHERE id = ?").bind(task.id).all();
    return Response.json({ task: results?.[0] });
  } catch (err: any) {
    return Response.json({ error: err.message || String(err) }, { status: 500 });
  }
};
