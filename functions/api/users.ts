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
  const workspaceId = url.searchParams.get("workspace_id");
  const requestedCompany = url.searchParams.get("company_id");

  if (role === "global_admin") {
    let sql = "SELECT id, name, email, role, company, banned, createdAt FROM user";
    const where: string[] = [];
    const params: any[] = [];
    if (workspaceId) {
      sql = `SELECT u.id, u.name, u.email, u.role, u.company, u.banned, u.createdAt FROM user u
             INNER JOIN workspace_members wm ON wm.user_id = u.id
             WHERE wm.workspace_id = ?`;
      params.push(workspaceId);
    } else {
      if (requestedCompany) {
        where.push("company = ?");
        params.push(requestedCompany);
      }
      if (where.length) sql += " WHERE " + where.join(" AND ");
    }
    const { results } = await context.env.DB.prepare(sql).bind(...params).all();
    return Response.json({ users: results || [] });
  }

  if (role === "admin") {
    if (workspaceId) {
      const { results } = await context.env.DB.prepare(`
        SELECT u.id, u.name, u.email, u.role, u.company, u.banned, u.createdAt
        FROM user u
        INNER JOIN workspace_members wm ON wm.user_id = u.id
        INNER JOIN workspaces w ON w.id = wm.workspace_id
        WHERE wm.workspace_id = ? AND w.company_id = ?
      `).bind(workspaceId, companyId).all();
      return Response.json({ users: results || [] });
    }
    const { results } = await context.env.DB.prepare(
      "SELECT id, name, email, role, company, banned, createdAt FROM user WHERE company = ?"
    ).bind(companyId).all();
    return Response.json({ users: results || [] });
  }

  return Response.json({ users: [] });
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
  const { name, email, password, role: userRole, company } = body;
  if (!name || !email || !password || !userRole) {
    return new Response("Missing fields", { status: 400 });
  }

  let targetCompany = company;
  if (role === "admin") {
    targetCompany = session.user.company;
    if (!["admin", "crew"].includes(userRole)) {
      return new Response("Admins can only create admin or crew", { status: 403 });
    }
  }

  if (role === "global_admin" && !targetCompany) {
    return new Response("Company required", { status: 400 });
  }

  try {
    const res: any = await auth.api.createUser({
      body: {
        name,
        email,
        password,
        role: userRole,
        data: {
          company: targetCompany,
        },
      },
    });
    return Response.json({ user: res?.user, password });
  } catch (err: any) {
    return Response.json({ error: err.message || String(err) }, { status: 500 });
  }
};
