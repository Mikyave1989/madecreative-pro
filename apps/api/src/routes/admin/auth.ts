import { Hono } from "hono";
import bcrypt from "bcryptjs";
import { prisma } from "@madecreative/db";
import { generateTokens, verifyRefreshToken, generateAccessToken } from "../../lib/auth.js";
import { AdminLoginSchema } from "@madecreative/shared";

const app = new Hono();

// POST /admin/auth/login
app.post("/login", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = AdminLoginSchema.safeParse(body);

  if (!parsed.success) {
    return c.json(
      { success: false, error: "Validation error", details: parsed.error.flatten() },
      400
    );
  }

  const { email, password } = parsed.data;

  const admin = await prisma.adminUser.findUnique({ where: { email } });
  if (!admin) {
    return c.json({ success: false, error: "Invalid credentials" }, 401);
  }

  const isValid = await bcrypt.compare(password, admin.passwordHash);
  if (!isValid) {
    return c.json({ success: false, error: "Invalid credentials" }, 401);
  }

  const tokens = await generateTokens({
    sub: admin.id,
    email: admin.email,
    role: admin.role,
    type: "admin",
  });

  return c.json({
    success: true,
    data: {
      ...tokens,
      user: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
      },
    },
  });
});

// POST /admin/auth/refresh
app.post("/refresh", async (c) => {
  const body = await c.req.json().catch(() => null);
  const refreshToken = body?.refreshToken as string | undefined;

  if (!refreshToken) {
    return c.json({ success: false, error: "Refresh token required" }, 400);
  }

  try {
    const payload = await verifyRefreshToken(refreshToken);

    const admin = await prisma.adminUser.findUnique({
      where: { id: payload.sub },
    });

    if (!admin) {
      return c.json({ success: false, error: "User not found" }, 401);
    }

    const accessToken = await generateAccessToken({
      sub: admin.id,
      email: admin.email,
      role: admin.role,
      type: "admin",
    });

    return c.json({
      success: true,
      data: {
        accessToken,
        expiresIn: 15 * 60,
      },
    });
  } catch {
    return c.json({ success: false, error: "Invalid refresh token" }, 401);
  }
});

// POST /admin/auth/logout
app.post("/logout", async (c) => {
  // With stateless JWT, logout is handled client-side
  // In production, add token to a Redis blocklist
  return c.json({ success: true, message: "Logged out successfully" });
});

export default app;
