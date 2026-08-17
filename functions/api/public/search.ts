import type { PagesFunction } from "@cloudflare/workers-types";
import type { Env } from "../../_shared/auth";

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);
  const q = (url.searchParams.get("q") || "").trim().toLowerCase();

  if (!q) {
    return Response.json({ results: [] });
  }

  const like = `%${q}%`;
  const companies = await context.env.DB.prepare(
    `SELECT id, slug, name, logo_url, 'company' as type
     FROM companies
     WHERE banned = 0 AND (LOWER(name) LIKE ? OR LOWER(slug) LIKE ?)
     ORDER BY name`
  ).bind(like, like).all();

  const workspaces = await context.env.DB.prepare(
    `SELECT w.id, w.slug, w.name, w.company_id,
            c.name as company_name, c.slug as company_slug, c.logo_url as company_logo_url,
            'workspace' as type
     FROM workspaces w
     JOIN companies c ON c.id = w.company_id
     WHERE c.banned = 0 AND (LOWER(w.name) LIKE ? OR LOWER(w.slug) LIKE ? OR LOWER(c.name) LIKE ?)
     ORDER BY c.name, w.name`
  ).bind(like, like, like).all();

  return Response.json({
    results: [...(companies.results || []), ...(workspaces.results || [])],
  });
};
