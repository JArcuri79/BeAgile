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
