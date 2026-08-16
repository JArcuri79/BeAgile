import type { D1Database } from "@cloudflare/workers-types";

export async function logAudit(
  db: D1Database,
  userId: string,
  userEmail: string,
  action: string,
  target: string,
  details = ""
) {
  const id = crypto.randomUUID();
  try {
    await db.prepare(
      `INSERT INTO audit_log (id, user_id, user_email, action, target, details, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).bind(id, userId, userEmail, action, target, details, Math.floor(Date.now() / 1000)).run();
  } catch (e) {
    console.error("audit log failed", e);
  }
}

export async function checkRateLimit(
  db: D1Database,
  key: string,
  type: string,
  maxAttempts: number,
  windowSeconds: number
): Promise<boolean> {
  const now = Math.floor(Date.now() / 1000);
  const windowStart = now - windowSeconds;

  try {
    const { results } = await db.prepare(
      "SELECT * FROM rate_limits WHERE key = ? AND type = ?"
    ).bind(key, type).all();

    const row: any = results?.[0];
    if (!row || row.window_start < windowStart) {
      await db.prepare(
        `INSERT OR REPLACE INTO rate_limits (id, key, type, count, window_start)
         VALUES (?, ?, ?, 1, ?)`
      ).bind(crypto.randomUUID(), key, type, now).run();
      return true;
    }

    if (row.count >= maxAttempts) {
      return false;
    }

    await db.prepare(
      "UPDATE rate_limits SET count = count + 1 WHERE key = ? AND type = ?"
    ).bind(key, type).run();
    return true;
  } catch (e) {
    console.error("rate limit check failed", e);
    return true;
  }
}
