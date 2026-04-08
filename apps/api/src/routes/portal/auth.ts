import { Hono } from "hono";
import bcrypt from "bcryptjs";
import { prisma } from "@madecreative/db";
import {
  generateTokens,
  verifyRefreshToken,
  generateAccessToken,
} from "../../lib/auth.js";
import { ClientLoginSchema } from "@madecreative/shared";

const app = new Hono();

// POST /portal/auth/login
app.post("/login", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = ClientLoginSchema.safeParse(body);

  if (!parsed.success) {
    return c.json(
      {
        success: false,
        error: "Validation error",
        details: parsed.error.flatten(),
      },
      400
    );
  }

  const { email, password } = parsed.data;

  const client = await prisma.client.findUnique({ where: { email } });
  if (!client) {
    return c.json({ success: false, error: "Invalid credentials" }, 401);
  }

  if (client.status === "CHURNED" || client.status === "REFUNDED") {
    return c.json(
      {
        success: false,
        error: "Account is not active. Please contact support.",
      },
      403
    );
  }

  const isValid = await bcrypt.compare(password, client.passwordHash);
  if (!isValid) {
    return c.json({ success: false, error: "Invalid credentials" }, 401);
  }

  // Update last login
  await prisma.client.update({
    where: { id: client.id },
    data: { lastLoginAt: new Date() },
  });

  const tokens = await generateTokens({
    sub: client.id,
    email: client.email,
    role: "STANDARD",
    type: "client",
  });

  return c.json({
    success: true,
    data: {
      ...tokens,
      user: {
        id: client.id,
        email: client.email,
        companyName: client.companyName,
        contactName: client.contactName,
        status: client.status,
        language: client.language,
      },
    },
  });
});

// POST /portal/auth/refresh
app.post("/refresh", async (c) => {
  const body = await c.req.json().catch(() => null);
  const refreshToken = body?.refreshToken as string | undefined;

  if (!refreshToken) {
    return c.json({ success: false, error: "Refresh token required" }, 400);
  }

  try {
    const payload = await verifyRefreshToken(refreshToken);

    if (payload.type !== "client") {
      return c.json({ success: false, error: "Invalid token type" }, 401);
    }

    const client = await prisma.client.findUnique({
      where: { id: payload.sub },
    });

    if (!client) {
      return c.json({ success: false, error: "User not found" }, 401);
    }

    if (client.status === "CHURNED" || client.status === "REFUNDED") {
      return c.json({ success: false, error: "Account is not active" }, 403);
    }

    const accessToken = await generateAccessToken({
      sub: client.id,
      email: client.email,
      role: "STANDARD",
      type: "client",
    });

    return c.json({
      success: true,
      data: { accessToken, expiresIn: 15 * 60 },
    });
  } catch {
    return c.json({ success: false, error: "Invalid refresh token" }, 401);
  }
});

// POST /portal/auth/logout
app.post("/logout", async (c) => {
  return c.json({ success: true, message: "Logged out successfully" });
});

export default app;
