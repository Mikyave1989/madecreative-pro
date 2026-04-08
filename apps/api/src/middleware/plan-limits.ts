// PRD v4: single plan — no per-plan limits. This middleware is a no-op passthrough.
import type { Context, Next } from "hono";
import type { JwtPayload } from "@madecreative/shared";

type Variables = { jwtPayload: JwtPayload };
type LimitResource = "websites" | "chatbots";

export function checkPlanLimit(_resource: LimitResource) {
  return async (_c: Context<{ Variables: Variables }>, next: Next): Promise<Response | void> => {
    await next();
  };
}
