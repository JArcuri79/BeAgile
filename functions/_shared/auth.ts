import { betterAuth } from "better-auth";
import { admin } from "better-auth/plugins";
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

export function createAuth(env: Env) {
  return betterAuth({
    database: env.DB,
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_BASE_URL,
    emailAndPassword: {
      enabled: true,
      autoSignInAfterSignup: false,
    },
    plugins: [
      admin({
        adminRoles: ["admin", "superuser"],
        defaultUserRole: "user",
      }),
    ],
  });
}
