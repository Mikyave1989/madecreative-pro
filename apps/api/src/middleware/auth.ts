import type { Context, Next } from "hono";
import { verifyAccessToken } from "../lib/auth.js";
import type { JwtPayload } from "@madecreative/shared";

type Variables = {
  jwtPayload: JwtPayload;
};

export async function adminAuthMiddleware(
  c: Context<{ Variables: Variables }>,
  next: Next
): Promise<Response | void> {
  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return c.json({ success: false, error: "Missing authorization header" }, 401);
  }

  const token = authHeader.slice(7);

  try {
    const payload = await verifyAccessToken(token);

    if (payload.type !== "admin") {
      return c.json({ success: false, error: "Admin access required" }, 403);
    }

    c.set("jwtPayload", payload);
    await next();
  } catch {
    return c.json({ success: false, error: "Invalid or expired token" }, 401);
  }
}

export async function clientAuthMiddleware(
  c: Context<{ Variables: Variables }>,
  next: Next
): Promise<Response | void> {
  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return c.json({ success: false, error: "Missing authorization header" }, 401);
  }

  const token = authHeader.slice(7);

  try {
    const payload = await verifyAccessToken(token);

    if (payload.type !== "client") {
      return c.json({ success: false, error: "Client access required" }, 403);
    }

    c.set("jwtPayload", payload);
    await next();
  } catch {
    return c.json({ success: false, error: "Invalid or expired token" }, 401);
  }
}

export function requireRole(...roles: string[]) {
  return async (
    c: Context<{ Variables: Variables }>,
    next: Next
  ): Promise<Response | void> => {
    const payload = c.get("jwtPayload");
    if (!payload) {
      return c.json({ success: false, error: "Unauthorized" }, 401);
    }

    if (!roles.includes(payload.role)) {
      return c.json({ success: false, error: "Insufficient permissions" }, 403);
    }

    await next();
  };
}
