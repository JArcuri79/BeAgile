import type { PagesFunction } from "@cloudflare/workers-types";
import type { Env } from "../../_shared/auth";

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);
  const workspaceId = url.searchParams.get("workspace_id");
  const companyId = url.searchParams.get("company_id");

  let sql = "SELECT * FROM tasks WHERE is_public = 1";
  const params: any[] = [];

  if (workspaceId) {
    sql += " AND workspace_id = ?";
    params.push(workspaceId);
  } else if (companyId) {
    sql += " AND company_id = ?";
    params.push(companyId);
  }

  sql += " ORDER BY created_at DESC";

  const { results } = await context.env.DB.prepare(sql).bind(...params).all();
  return Response.json({ tasks: results || [] });
};
