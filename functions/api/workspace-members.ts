import type { PagesFunction } from "@cloudflare/workers-types";
import { createAuth, type Env } from "../_shared/auth";

async function getSession(auth: any, headers: Headers) {
  try {
    return await auth.api.getSession({ headers });
  } catch {
    return null;
  }
}

async function canAccessWorkspace(context: any, user: any, workspaceId: string) {
  const role = user.role === "superuser" ? "global_admin" : user.role;
  if (role === "global_admin") return true;

  const { results } = await context.env.DB.prepare(
    "SELECT company_id FROM workspaces WHERE id = ?"
  ).bind(workspaceId).all();
  const ws: any = results?.[0];
  if (!ws) return false;

  if (role === "admin" && user.company === ws.company_id) return true;
  if (role === "crew" || role === "user") {
    const { results: mem } = await context.env.DB.prepare(
      "SELECT 1 FROM workspace_members WHERE workspace_id = ? AND user_id = ?"
    ).bind(workspaceId, user.id).all();
    return (mem?.length || 0) > 0;
  }
  return false;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const auth = createAuth(context.env);
  const session = await getSession(auth, context.request.headers);
  if (!session?.user) return new Response("Unauthorized", { status: 401 });

  const url = new URL(context.request.url);
  const workspaceId = url.searchParams.get("workspace_id");
  if (!workspaceId) return new Response("workspace_id required", { status: 400 });

  if (!(await canAccessWorkspace(context, session.user, workspaceId))) {
    return new Response("Forbidden", { status: 403 });
  }

  const { results } = await context.env.DB.prepare(
    `SELECT u.id, u.name, u.email, u.role, u.company
     FROM user u
     INNER JOIN workspace_members wm ON wm.user_id = u.id
     WHERE wm.workspace_id = ?
     ORDER BY u.name`
  ).bind(workspaceId).all();
  return Response.json({ members: results || [] });
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const auth = createAuth(context.env);
  const session = await getSession(auth, context.request.headers);
  if (!session?.user) return new Response("Unauthorized", { status: 401 });

  const role = session.user.role === "superuser" ? "global_admin" : session.user.role;
  if (!["global_admin", "admin"].includes(role)) {
    return new Response("Forbidden", { status: 403 });
  }

  const body: any = await context.request.json().catch(() => ({}));
  const { workspace_id, user_id } = body;
  if (!workspace_id || !user_id) {
    return new Response("workspace_id and user_id required", { status: 400 });
  }

  const { results } = await context.env.DB.prepare(
    "SELECT company_id FROM workspaces WHERE id = ?"
  ).bind(workspace_id).all();
  const ws: any = results?.[0];
  if (!ws) return new Response("Workspace not found", { status: 404 });

  if (role !== "global_admin" && session.user.company !== ws.company_id) {
    return new Response("Forbidden", { status: 403 });
  }

  try {
    await context.env.DB.prepare(
      "INSERT OR IGNORE INTO workspace_members (workspace_id, user_id) VALUES (?, ?)"
    ).bind(workspace_id, user_id).run();
    return Response.json({ ok: true });
  } catch (err: any) {
    return Response.json({ error: err.message || String(err) }, { status: 500 });
  }
};

export const onRequestDelete: PagesFunction<Env> = async (context) => {
  const auth = createAuth(context.env);
  const session = await getSession(auth, context.request.headers);
  if (!session?.user) return new Response("Unauthorized", { status: 401 });

  const role = session.user.role === "superuser" ? "global_admin" : session.user.role;
  if (!["global_admin", "admin"].includes(role)) {
    return new Response("Forbidden", { status: 403 });
  }

  const url = new URL(context.request.url);
  const workspaceId = url.searchParams.get("workspace_id");
  const userId = url.searchParams.get("user_id");
  if (!workspaceId || !userId) {
    return new Response("workspace_id and user_id required", { status: 400 });
  }

  const { results } = await context.env.DB.prepare(
    "SELECT company_id FROM workspaces WHERE id = ?"
  ).bind(workspaceId).all();
  const ws: any = results?.[0];
  if (!ws) return new Response("Workspace not found", { status: 404 });

  if (role !== "global_admin" && session.user.company !== ws.company_id) {
    return new Response("Forbidden", { status: 403 });
  }

  await context.env.DB.prepare(
    "DELETE FROM workspace_members WHERE workspace_id = ? AND user_id = ?"
  ).bind(workspaceId, userId).run();

  return new Response(null, { status: 204 });
};
