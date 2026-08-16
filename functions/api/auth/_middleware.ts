import type { PagesFunction } from "@cloudflare/workers-types";
import { createAuth, type Env } from "../../_shared/auth";
import { checkRateLimit } from "../../_shared/audit";

export const onRequest: PagesFunction<Env> = async (context) => {
  const auth = createAuth(context.env);
  if ((auth as any).$context) {
    context.waitUntil((auth as any).$context);
  }

  const url = new URL(context.request.url);
  const isLogin =
    context.request.method === "POST" &&
    (url.pathname.endsWith("/sign-in/email") || url.pathname.endsWith("/sign-in"));

  if (isLogin) {
    const ip = context.request.headers.get("CF-Connecting-IP") ||
               context.request.headers.get("X-Forwarded-For")?.split(",")[0]?.trim() ||
               "unknown";
    const allowed = await checkRateLimit(context.env.DB, `login:${ip}`, "login", 10, 300);
    if (!allowed) {
      return new Response("Too many login attempts. Try again later.", { status: 429 });
    }
  }

  return auth.handler(context.request);
};
