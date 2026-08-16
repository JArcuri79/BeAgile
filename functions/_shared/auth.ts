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
