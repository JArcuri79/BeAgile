import { betterAuth } from "better-auth";
import { admin } from "better-auth/plugins";
import { createAccessControl } from "better-auth/plugins/access";
import { adminAc, defaultStatements } from "better-auth/plugins/admin/access";
import type { D1Database } from "@cloudflare/workers-types";

export interface Env {
  DB: D1Database;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_BASE_URL: string;
  SUPERUSER_PASSWORD: string;
  ADMIN_PASSWORD: string;
  CREW_PASSWORD: string;
  SEED_SECRET: string;
}

const ac = createAccessControl(defaultStatements);

const superuserRole = ac.newRole(adminAc.statements);
const adminRole = ac.newRole(adminAc.statements);
const crewRole = ac.newRole({});
const userRole = ac.newRole({});

export function createAuth(env: Env) {
  return betterAuth({
    database: env.DB,
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_BASE_URL,
    emailAndPassword: {
      enabled: true,
      autoSignInAfterSignup: false,
      minPasswordLength: 12,
      maxPasswordLength: 128,
      resetPasswordTokenExpiresIn: 3 * 60,
      sendResetPassword: async (data, _request) => {
        const userId = data.user.id;
        const email = data.user.email;
        const token = data.token;
        const mobileToken = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');
        const nowSec = Math.floor(Date.now() / 1000);
        const expiresSec = nowSec + 3 * 60;
        const id = crypto.randomUUID();

        try {
          await env.DB.prepare(
            `DELETE FROM password_resets WHERE user_id = ? AND used = 0`
          ).bind(userId).run();

          await env.DB.prepare(
            `INSERT INTO password_resets (id, user_id, email, token, mobile_token, used, created_at, expires_at)
             VALUES (?, ?, ?, ?, ?, 0, ?, ?)`
          ).bind(id, userId, email, token, mobileToken, nowSec, expiresSec).run();
        } catch (e) {
          console.error("sendResetPassword: failed to store token", e);
        }
      },
    },
    user: {
      additionalFields: {
        company: {
          type: "string",
          required: false,
        },
      },
    },
    plugins: [
      admin({
        ac,
        roles: {
          superuser: superuserRole,
          admin: adminRole,
          crew: crewRole,
          user: userRole,
        },
        adminRoles: ["superuser", "admin"],
        defaultUserRole: "user",
      }),
    ],
  });
}
