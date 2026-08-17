import type { PagesFunction } from "@cloudflare/workers-types";
import type { Env } from "../../_shared/auth";

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);
  const search = (url.searchParams.get("q") || "").toLowerCase();
  const companyId = url.searchParams.get("company_id");

  let sql = `SELECT w.id, w.slug, w.name, w.company_id,
                    c.name as company_name, c.slug as company_slug, c.logo_url as company_logo_url
             FROM workspaces w
             JOIN companies c ON c.id = w.company_id
             WHERE c.banned = 0`;
  const params: any[] = [];

  if (companyId) {
    sql += " AND w.company_id = ?";
    params.push(companyId);
  }

  if (search) {
    sql += " AND (LOWER(w.name) LIKE ? OR LOWER(w.slug) LIKE ? OR LOWER(c.name) LIKE ?)";
    const like = `%${search}%`;
    params.push(like, like, like);
  }

  sql += " ORDER BY c.name, w.name";

  const { results } = await context.env.DB.prepare(sql).bind(...params).all();
  return Response.json({ workspaces: results || [] });
};
