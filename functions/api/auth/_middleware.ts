import type { PagesFunction } from "@cloudflare/workers-types";
import { createAuth, type Env } from "../../_shared/auth";

export const onRequest: PagesFunction<Env> = async (context) => {
  const auth = createAuth(context.env);
  if ((auth as any).$context) {
    context.waitUntil((auth as any).$context);
  }
  return auth.handler(context.request);
};
