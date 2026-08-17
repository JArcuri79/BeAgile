import type { PagesFunction } from "@cloudflare/workers-types";
import { createAuth, type Env } from "../_shared/auth";
import { logAudit } from "../_shared/audit";

async function getSession(auth: any, headers: Headers) {
  try {
    return await auth.api.getSession({ headers });
  } catch {
    return null;
  }
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
  const auth = createAuth(context.env);
  const session = await getSession(auth, context.request.headers);

  const url = new URL(context.request.url);
  const workspaceId = url.searchParams.get("workspace_id");
  const companyId = url.searchParams.get("company_id");

  let sql = "SELECT * FROM tasks";
  const params: any[] = [];

  if (workspaceId) {
    sql += " WHERE workspace_id = ?";
    params.push(workspaceId);
  } else if (companyId) {
    sql += " WHERE company_id = ?";
    params.push(companyId);
  } else {
    sql += " WHERE 1=1";
  }

  sql += " ORDER BY created_at DESC";

  const { results } = await context.env.DB.prepare(sql).bind(...params).all();
  return Response.json({ tasks: results || [] });
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const auth = createAuth(context.env);
  const session = await getSession(auth, context.request.headers);
  if (!session?.user) return new Response("Unauthorized", { status: 401 });

  const body: any = await context.request.json().catch(() => ({}));
  const { company_id, workspace_id, stage = "roadmap", type, title, description, category, severity, priority } = body;

  if (!company_id || !workspace_id || !type || !title) {
    return new Response("company_id, workspace_id, type and title required", { status: 400 });
  }

  const workspace = await getWorkspace(context.env.DB, workspace_id);
  if (!workspace) return new Response("Workspace not found", { status: 404 });

  if (!(await canAccessWorkspace(context.env.DB, session, workspace))) {
    return new Response("Forbidden", { status: 403 });
  }

  const user = session.user;
  const role = user.role === "superuser" ? "global_admin" : user.role;
  const userId = user.id;
  const userName = user.name || user.email || "User";

  const uuid = crypto.randomUUID();
  const id = crypto.randomUUID();
  const ts = now();

  try {
    await context.env.DB.prepare(
      `INSERT INTO tasks
       (uuid, company_id, workspace_id, stage, type, title, description, category, severity, priority,
        submitted_by, submitted_by_name, submitted_by_role, submitted_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      uuid, company_id, workspace_id, stage, type, title, description || "", category || "", severity || "", priority || "",
      userId, userName, role, ts, ts, ts
    ).run();

    const { results } = await context.env.DB.prepare("SELECT * FROM tasks WHERE uuid = ?").bind(uuid).all();
    const task = results?.[0];

    await logAudit(context.env.DB, userId, user.email || "", "task.create", task?.id || uuid, title);
    return Response.json({ task });
  } catch (err: any) {
    return Response.json({ error: err.message || String(err) }, { status: 500 });
  }
};

export const onRequestPatch: PagesFunction<Env> = async (context) => {
  const auth = createAuth(context.env);
  const session = await getSession(auth, context.request.headers);
  if (!session?.user) return new Response("Unauthorized", { status: 401 });

  const body: any = await context.request.json().catch(() => ({}));
  const id = body.id;
  if (!id) return new Response("id required", { status: 400 });

  const { results } = await context.env.DB.prepare("SELECT * FROM tasks WHERE id = ?").bind(id).all();
  const task: any = results?.[0];
  if (!task) return new Response("Not found", { status: 404 });

  const workspace = await getWorkspace(context.env.DB, task.workspace_id);
  if (!workspace) return new Response("Workspace not found", { status: 404 });

  if (!(await canAccessWorkspace(context.env.DB, session, workspace))) {
    return new Response("Forbidden", { status: 403 });
  }

  const role = session.user.role === "superuser" ? "global_admin" : session.user.role;

  const fields = ["title", "description", "category", "severity", "priority", "type", "allocated_to", "allocated_to_name", "allocated_to_role"];
  const updates: Record<string, any> = {};

  for (const f of fields) {
    if (body[f] !== undefined) updates[f] = body[f];
  }

  if (body.allocated_to && !task.allocated_at) {
    updates.allocated_at = now();
  }

  if (body.stage) {
    updates.stage = body.stage;
    updates.updated_at = now();

    const ts = now();
    if (body.stage === "my_list" && !task.allocated_at) {
      updates.allocated_at = ts;
      if (body.allocated_to) {
        updates.allocated_to = body.allocated_to;
        updates.allocated_to_name = body.allocated_to_name || session.user.name || session.user.email || "User";
        updates.allocated_to_role = body.allocated_to_role || "user";
      } else if (!task.allocated_to) {
        updates.allocated_to = session.user.id;
        updates.allocated_to_name = session.user.name || session.user.email || "User";
        updates.allocated_to_role = role;
      }
    }

    if (body.stage === "completed" && !task.completed_at) updates.completed_at = ts;
    if (body.stage === "reviewed" && !task.reviewed_at) updates.reviewed_at = ts;
    if (body.stage === "changelog" && !task.released_at) {
      if (role !== "admin" && role !== "global_admin") {
        return new Response("Forbidden: only admin can publish to changelog", { status: 403 });
      }
      updates.released_at = ts;
    }
  }

  if (Object.keys(updates).length === 0) {
    return new Response("No fields to update", { status: 400 });
  }

  const setClause = Object.keys(updates).map(k => `${k} = ?`).join(", ");
  const values = Object.values(updates);

  try {
    await context.env.DB.prepare(`UPDATE tasks SET ${setClause}, updated_at = ? WHERE id = ?`).bind(
      ...values, now(), id
    ).run();

    const { results: updated } = await context.env.DB.prepare("SELECT * FROM tasks WHERE id = ?").bind(id).all();
    const row = updated?.[0];

    await logAudit(context.env.DB, session.user.id, session.user.email || "", "task.update", id, `${updates.stage || "fields"}`);
    return Response.json({ task: row });
  } catch (err: any) {
    return Response.json({ error: err.message || String(err) }, { status: 500 });
  }
};

export const onRequestDelete: PagesFunction<Env> = async (context) => {
  const auth = createAuth(context.env);
  const session = await getSession(auth, context.request.headers);
  if (!session?.user) return new Response("Unauthorized", { status: 401 });

  const url = new URL(context.request.url);
  const id = url.searchParams.get("id");
  if (!id) return new Response("id required", { status: 400 });

  const { results } = await context.env.DB.prepare("SELECT * FROM tasks WHERE id = ?").bind(id).all();
  const task: any = results?.[0];
  if (!task) return new Response("Not found", { status: 404 });

  const workspace = await getWorkspace(context.env.DB, task.workspace_id);
  if (!workspace) return new Response("Workspace not found", { status: 404 });

  if (!(await canAccessWorkspace(context.env.DB, session, workspace))) {
    return new Response("Forbidden", { status: 403 });
  }

  const role = session.user.role === "superuser" ? "global_admin" : session.user.role;
  if (role !== "global_admin" && role !== "admin" && task.submitted_by !== session.user.id) {
    return new Response("Forbidden", { status: 403 });
  }

  try {
    await context.env.DB.prepare("DELETE FROM task_votes WHERE task_uuid = ?").bind(task.uuid).run();
    await context.env.DB.prepare("DELETE FROM task_comments WHERE task_uuid = ?").bind(task.uuid).run();
    await context.env.DB.prepare("DELETE FROM tasks WHERE id = ?").bind(id).run();
    await logAudit(context.env.DB, session.user.id, session.user.email || "", "task.delete", id, task.title);
    return new Response(null, { status: 204 });
  } catch (err: any) {
    return Response.json({ error: err.message || String(err) }, { status: 500 });
  }
};
