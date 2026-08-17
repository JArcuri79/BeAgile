import type { PagesFunction } from "@cloudflare/workers-types";
import type { Env } from "../../_shared/auth";

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);
  const search = (url.searchParams.get("q") || "").toLowerCase();

  let sql = "SELECT id, slug, name, logo_url FROM companies WHERE banned = 0";
  const params: any[] = [];

  if (search) {
    sql += " AND (LOWER(name) LIKE ? OR LOWER(slug) LIKE ?)";
    const like = `%${search}%`;
    params.push(like, like);
  }

  sql += " ORDER BY name";

  const { results } = await context.env.DB.prepare(sql).bind(...params).all();
  return Response.json({ companies: results || [] });
};
