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

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);
  const taskId = url.searchParams.get("task_id");
  if (!taskId) return new Response("task_id required", { status: 400 });

  const { results } = await context.env.DB.prepare(
    `SELECT id, uuid, task_uuid, user_id, user_name, user_role, text, created_at
     FROM task_comments
     WHERE task_uuid = (SELECT uuid FROM tasks WHERE id = ?)
     ORDER BY created_at ASC`
  ).bind(taskId).all();

  return Response.json({ comments: results || [] });
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const auth = createAuth(context.env);
  const session = await getSession(auth, context.request.headers);
  if (!session?.user) return new Response("Unauthorized", { status: 401 });

  const body: any = await context.request.json().catch(() => ({}));
  const { task_id, text } = body;
  if (!task_id || !text?.trim()) {
    return new Response("task_id and text required", { status: 400 });
  }

  const task = await getTask(context.env.DB, task_id);
  if (!task) return new Response("Task not found", { status: 404 });

  const workspace = await getWorkspace(context.env.DB, task.workspace_id);
  if (!workspace) return new Response("Workspace not found", { status: 404 });

  if (!(await canAccessWorkspace(context.env.DB, session, workspace))) {
    return new Response("Forbidden", { status: 403 });
  }

  const role = session.user.role === "superuser" ? "global_admin" : session.user.role;
  const userName = session.user.name || session.user.email || "User";

  const uuid = crypto.randomUUID();

  try {
    await context.env.DB.prepare(
      `INSERT INTO task_comments (id, uuid, task_uuid, user_id, user_name, user_role, text, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(uuid, uuid, task.uuid, session.user.id, userName, role, text.trim(), now()).run();

    await context.env.DB.prepare(
      "UPDATE tasks SET comments_count = comments_count + 1, updated_at = ? WHERE id = ?"
    ).bind(now(), task.id).run();

    const { results } = await context.env.DB.prepare(
      "SELECT id, uuid, task_uuid, user_id, user_name, user_role, text, created_at FROM task_comments WHERE uuid = ?"
    ).bind(uuid).all();

    return Response.json({ comment: results?.[0] });
  } catch (err: any) {
    return Response.json({ error: err.message || String(err) }, { status: 500 });
  }
};
