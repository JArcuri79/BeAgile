import type { PagesFunction } from "@cloudflare/workers-types";
import { createAuth, type Env } from "../_shared/auth";

async function getSession(auth: any, headers: Headers) {
  try {
    return await auth.api.getSession({ headers });
  } catch {
    return null;
  }
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const auth = createAuth(context.env);
  const session = await getSession(auth, context.request.headers);
  if (!session?.user) return new Response("Unauthorized", { status: 401 });

  const role = session.user.role === "superuser" ? "global_admin" : session.user.role;
  const companyId = session.user.company;
  const url = new URL(context.request.url);
  const requestedCompany = url.searchParams.get("company_id");

  if (role === "global_admin") {
    let sql = "SELECT w.*, c.name as company_name, c.slug as company_slug FROM workspaces w JOIN companies c ON c.id = w.company_id";
    const params: any[] = [];
    if (requestedCompany) {
      sql += " WHERE w.company_id = ?";
      params.push(requestedCompany);
    }
    sql += " ORDER BY c.name, w.name";
    const { results } = await context.env.DB.prepare(sql).bind(...params).all();
    return Response.json({ workspaces: results || [] });
  }

  if (role === "admin" && companyId) {
    const target = requestedCompany || companyId;
    if (target !== companyId) return new Response("Forbidden", { status: 403 });
    const { results } = await context.env.DB.prepare(
      `SELECT w.*, c.name as company_name, c.slug as company_slug FROM workspaces w
       JOIN companies c ON c.id = w.company_id
       WHERE w.company_id = ? ORDER BY w.name`
    ).bind(target).all();
    return Response.json({ workspaces: results || [] });
  }

  // crew/user: list workspaces they are members of
  const { results } = await context.env.DB.prepare(
    `SELECT w.*, c.name as company_name, c.slug as company_slug
     FROM workspaces w
     JOIN companies c ON c.id = w.company_id
     JOIN workspace_members wm ON wm.workspace_id = w.id
     WHERE wm.user_id = ?
     ORDER BY w.name`
  ).bind(session.user.id).all();
  return Response.json({ workspaces: results || [] });
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const auth = createAuth(context.env);
  const session = await getSession(auth, context.request.headers);
  if (!session?.user) return new Response("Unauthorized", { status: 401 });

  const role = session.user.role === "superuser" ? "global_admin" : session.user.role;
  const body: any = await context.request.json().catch(() => ({}));
  const { company_id, slug, name } = body;
  if (!company_id || !slug || !name) {
    return new Response("company_id, slug and name required", { status: 400 });
  }

  if (role !== "global_admin") {
    if (role !== "admin" || session.user.company !== company_id) {
      return new Response("Forbidden", { status: 403 });
    }
  }

  // workspace limit check for non-global
  if (role !== "global_admin") {
    const { results } = await context.env.DB.prepare(
      "SELECT (SELECT COUNT(*) FROM workspaces WHERE company_id = ?) as used, workspaces_allowed FROM companies WHERE id = ?"
    ).bind(company_id, company_id).all();
    const row: any = results?.[0];
    if (row && row.used >= row.workspaces_allowed) {
      return new Response("Workspace limit reached", { status: 403 });
    }
  }

  const id = crypto.randomUUID();
  try {
    await context.env.DB.prepare(
      `INSERT INTO workspaces (id, company_id, slug, name)
       VALUES (?, ?, ?, ?)`
    ).bind(id, company_id, slug, name).run();
    const { results } = await context.env.DB.prepare(
      `SELECT w.*, c.name as company_name, c.slug as company_slug FROM workspaces w
       JOIN companies c ON c.id = w.company_id
       WHERE w.id = ?`
    ).bind(id).all();
    return Response.json({ workspace: results?.[0] });
  } catch (err: any) {
    return Response.json({ error: err.message || String(err) }, { status: 500 });
  }
};

export const onRequestPatch: PagesFunction<Env> = async (context) => {
  const auth = createAuth(context.env);
  const session = await getSession(auth, context.request.headers);
  if (!session?.user) return new Response("Unauthorized", { status: 401 });

  const role = session.user.role === "superuser" ? "global_admin" : session.user.role;
  const body: any = await context.request.json().catch(() => ({}));
  const { id, name, slug } = body;
  if (!id) return new Response("id required", { status: 400 });

  const { results } = await context.env.DB.prepare(
    "SELECT * FROM workspaces WHERE id = ?"
  ).bind(id).all();
  const workspace: any = results?.[0];
  if (!workspace) return new Response("Not found", { status: 404 });

  if (role !== "global_admin" && (role !== "admin" || session.user.company !== workspace.company_id)) {
    return new Response("Forbidden", { status: 403 });
  }

  try {
    await context.env.DB.prepare(
      `UPDATE workspaces
       SET name = ?, slug = ?
       WHERE id = ?`
    ).bind(
      name ?? workspace.name,
      slug ?? workspace.slug,
      id
    ).run();

    const { results: updated } = await context.env.DB.prepare(
      `SELECT w.*, c.name as company_name, c.slug as company_slug FROM workspaces w
       JOIN companies c ON c.id = w.company_id
       WHERE w.id = ?`
    ).bind(id).all();
    return Response.json({ workspace: updated?.[0] });
  } catch (err: any) {
    return Response.json({ error: err.message || String(err) }, { status: 500 });
  }
};

export const onRequestDelete: PagesFunction<Env> = async (context) => {
  const auth = createAuth(context.env);
  const session = await getSession(auth, context.request.headers);
  if (!session?.user) return new Response("Unauthorized", { status: 401 });

  const role = session.user.role === "superuser" ? "global_admin" : session.user.role;
  const url = new URL(context.request.url);
  const id = url.searchParams.get("id");
  if (!id) return new Response("id required", { status: 400 });

  const { results } = await context.env.DB.prepare(
    "SELECT * FROM workspaces WHERE id = ?"
  ).bind(id).all();
  const workspace: any = results?.[0];
  if (!workspace) return new Response("Not found", { status: 404 });

  if (role !== "global_admin" && (role !== "admin" || session.user.company !== workspace.company_id)) {
    return new Response("Forbidden", { status: 403 });
  }

  try {
    await context.env.DB.prepare(
      "DELETE FROM workspace_members WHERE workspace_id = ?"
    ).bind(id).run();
    await context.env.DB.prepare(
      "DELETE FROM workspaces WHERE id = ?"
    ).bind(id).run();
    return new Response(null, { status: 204 });
  } catch (err: any) {
    return Response.json({ error: err.message || String(err) }, { status: 500 });
  }
};
