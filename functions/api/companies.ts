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
  if (role === "global_admin") {
    const { results } = await context.env.DB.prepare(
      "SELECT * FROM companies ORDER BY name"
    ).all();
    return Response.json({ companies: results || [] });
  }

  if (role === "admin" && session.user.company) {
    const { results } = await context.env.DB.prepare(
      "SELECT * FROM companies WHERE id = ?"
    ).bind(session.user.company).all();
    return Response.json({ companies: results || [] });
  }

  return Response.json({ companies: [] });
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const auth = createAuth(context.env);
  const session = await getSession(auth, context.request.headers);
  if (!session?.user) return new Response("Unauthorized", { status: 401 });

  const role = session.user.role === "superuser" ? "global_admin" : session.user.role;
  if (role !== "global_admin") {
    return new Response("Forbidden", { status: 403 });
  }

  const body: any = await context.request.json().catch(() => ({}));
  const { slug, name, admin_email, admin_name, admin_phone, workspaces_allowed } = body;
  if (!slug || !name) {
    return new Response("slug and name required", { status: 400 });
  }

  const id = crypto.randomUUID();
  const allowed = typeof workspaces_allowed === "number" ? workspaces_allowed : 3;

  try {
    await context.env.DB.prepare(
      `INSERT INTO companies (id, slug, name, admin_email, admin_name, admin_phone, workspaces_allowed)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).bind(id, slug, name, admin_email || null, admin_name || null, admin_phone || null, allowed).run();

    const { results } = await context.env.DB.prepare(
      "SELECT * FROM companies WHERE id = ?"
    ).bind(id).all();
    return Response.json({ company: results?.[0] });
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
  const { id, name, admin_email, admin_name, admin_phone, workspaces_allowed, banned } = body;
  if (!id) return new Response("id required", { status: 400 });

  const { results } = await context.env.DB.prepare(
    "SELECT * FROM companies WHERE id = ?"
  ).bind(id).all();
  const company: any = results?.[0];
  if (!company) return new Response("Not found", { status: 404 });

  if (role !== "global_admin" && (role !== "admin" || session.user.company !== id)) {
    return new Response("Forbidden", { status: 403 });
  }

  const allowed = typeof workspaces_allowed === "number" ? workspaces_allowed : company.workspaces_allowed;
  const isBanned = typeof banned === "boolean" ? (banned ? 1 : 0) : company.banned;

  try {
    await context.env.DB.prepare(
      `UPDATE companies
       SET name = ?, admin_email = ?, admin_name = ?, admin_phone = ?, workspaces_allowed = ?, banned = ?
       WHERE id = ?`
    ).bind(
      name ?? company.name,
      admin_email ?? company.admin_email,
      admin_name ?? company.admin_name,
      admin_phone ?? company.admin_phone,
      allowed,
      isBanned,
      id
    ).run();

    const { results: updated } = await context.env.DB.prepare(
      "SELECT * FROM companies WHERE id = ?"
    ).bind(id).all();
    return Response.json({ company: updated?.[0] });
  } catch (err: any) {
    return Response.json({ error: err.message || String(err) }, { status: 500 });
  }
};

export const onRequestDelete: PagesFunction<Env> = async (context) => {
  const auth = createAuth(context.env);
  const session = await getSession(auth, context.request.headers);
  if (!session?.user) return new Response("Unauthorized", { status: 401 });

  const role = session.user.role === "superuser" ? "global_admin" : session.user.role;
  if (role !== "global_admin") {
    return new Response("Forbidden", { status: 403 });
  }

  const url = new URL(context.request.url);
  const id = url.searchParams.get("id");
  if (!id) return new Response("id required", { status: 400 });

  try {
    const { results } = await context.env.DB.prepare(
      "SELECT * FROM companies WHERE id = ?"
    ).bind(id).all();
    if (!results?.length) return new Response("Not found", { status: 404 });

    // delete workspaces and memberships first to avoid orphaned rows
    const workspaceIds = await context.env.DB.prepare(
      "SELECT id FROM workspaces WHERE company_id = ?"
    ).bind(id).all();
    const ids = (workspaceIds.results || []).map((r: any) => r.id);

    if (ids.length) {
      const placeholders = ids.map(() => "?").join(",");
      await context.env.DB.prepare(
        `DELETE FROM workspace_members WHERE workspace_id IN (${placeholders})`
      ).bind(...ids).run();
      await context.env.DB.prepare(
        "DELETE FROM workspaces WHERE company_id = ?"
      ).bind(id).run();
    }

    await context.env.DB.prepare("DELETE FROM companies WHERE id = ?").bind(id).run();
    return new Response(null, { status: 204 });
  } catch (err: any) {
    return Response.json({ error: err.message || String(err) }, { status: 500 });
  }
};
