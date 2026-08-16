import type { PagesFunction } from "@cloudflare/workers-types";
import { createAuth, type Env } from "../_shared/auth";

async function getSession(auth: any, headers: Headers) {
  try {
    return await auth.api.getSession({ headers });
  } catch {
    return null;
  }
}

const SPECIALS = "#@?><£$%&";

function validatePassword(password: string) {
  if (password.length < 12) return "Password must be at least 12 characters";
  if (password.length > 128) return "Password must be at most 128 characters";
  if (!/[A-Z]/.test(password)) return "Password must contain an uppercase letter";
  if (!/[a-z]/.test(password)) return "Password must contain a lowercase letter";
  if (!/[0-9]/.test(password)) return "Password must contain a number";
  if (!new RegExp(`[\\${SPECIALS.replace(/[\]]/g, "\\]")}]`).test(password)) {
    return `Password must contain a special character: ${SPECIALS}`;
  }
  return null;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const auth = createAuth(context.env);
  const url = new URL(context.request.url);
  const path = url.pathname;

  if (path.endsWith("/confirm")) {
    const body: any = await context.request.json().catch(() => ({}));
    const { token, email, newPassword } = body;
    if (!token || !email || !newPassword) {
      return new Response("token, email and newPassword required", { status: 400 });
    }

    const validation = validatePassword(newPassword);
    if (validation) return new Response(validation, { status: 400 });

    const { results } = await context.env.DB.prepare(
      "SELECT * FROM password_resets WHERE token = ?"
    ).bind(token).all();
    const reset: any = results?.[0];
    if (!reset) return new Response("Invalid or expired token", { status: 400 });
    if (reset.used) return new Response("Token already used", { status: 400 });
    if (reset.expires_at < Math.floor(Date.now() / 1000)) {
      return new Response("Token expired", { status: 400 });
    }
    if (reset.email !== email) {
      return new Response("Email does not match", { status: 400 });
    }

    try {
      const res = await auth.api.resetPassword({
        body: { token, newPassword },
        headers: context.request.headers,
      });

      if (res.status !== true && res.status !== 200) {
        return new Response("Failed to reset password", { status: 500 });
      }
    } catch (err: any) {
      return new Response(err?.message || "Failed to reset password", { status: 400 });
    }

    await context.env.DB.prepare(
      "UPDATE password_resets SET used = 1 WHERE token = ?"
    ).bind(token).run();

    return Response.json({ status: true, mobile_token: reset.mobile_token });
  }

  // Admin generate reset link
  const session = await getSession(auth, context.request.headers);
  if (!session?.user) return new Response("Unauthorized", { status: 401 });

  const role = session.user.role === "superuser" ? "global_admin" : session.user.role;
  if (role !== "global_admin" && role !== "admin") {
    return new Response("Forbidden", { status: 403 });
  }

  const body: any = await context.request.json().catch(() => ({}));
  const { userId } = body;
  if (!userId) return new Response("userId required", { status: 400 });

  const user = await auth.api.getUser({
    query: { userId },
    headers: context.request.headers,
  }).catch(() => null);

  if (!user || !user.email) {
    return new Response("User not found", { status: 404 });
  }

  // company scoping: admin can only reset own company users
  if (role === "admin" && user.company !== session.user.company) {
    return new Response("Forbidden", { status: 403 });
  }

  const base = context.env.BETTER_AUTH_BASE_URL || new URL(context.request.url).origin;
  const redirectTo = `${base}/reset-password`;

  try {
    await auth.api.requestPasswordReset({
      body: { email: user.email, redirectTo },
      headers: context.request.headers,
    });
  } catch (err: any) {
    return Response.json({ error: err?.message || "Failed to request reset" }, { status: 500 });
  }

  const { results } = await context.env.DB.prepare(
    "SELECT * FROM password_resets WHERE user_id = ? AND used = 0 ORDER BY created_at DESC LIMIT 1"
  ).bind(user.id).all();
  const row: any = results?.[0];

  if (!row) {
    return Response.json({ error: "Token not generated" }, { status: 500 });
  }

  const link = `${base}/#/reset-password?token=${encodeURIComponent(row.token)}&mobile=${encodeURIComponent(row.mobile_token)}`;

  return Response.json({
    token: row.token,
    mobile_token: row.mobile_token,
    email: row.email,
    link,
    expires_at: row.expires_at,
  });
};

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);
  const token = url.searchParams.get("token");
  if (!token) return new Response("token required", { status: 400 });

  const { results } = await context.env.DB.prepare(
    "SELECT email, used, expires_at FROM password_resets WHERE token = ?"
  ).bind(token).all();
  const row: any = results?.[0];
  if (!row) return new Response("Invalid token", { status: 404 });
  if (row.used) return new Response("Token already used", { status: 400 });
  if (row.expires_at < Math.floor(Date.now() / 1000)) return new Response("Token expired", { status: 400 });

  return Response.json({ email: row.email });
};
