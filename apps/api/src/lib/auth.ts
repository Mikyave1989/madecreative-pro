import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import type { JwtPayload, TokenPair } from "@madecreative/shared";
import { JWT_CONFIG } from "@madecreative/shared";

function getAccessSecret(): Uint8Array {
  const secret = process.env["JWT_SECRET"];
  if (!secret) throw new Error("JWT_SECRET environment variable is not set");
  return new TextEncoder().encode(secret);
}

function getRefreshSecret(): Uint8Array {
  const secret = process.env["JWT_REFRESH_SECRET"];
  if (!secret)
    throw new Error("JWT_REFRESH_SECRET environment variable is not set");
  return new TextEncoder().encode(secret);
}

export async function generateTokens(payload: Omit<JwtPayload, "iat" | "exp">): Promise<TokenPair> {
  const now = Math.floor(Date.now() / 1000);

  const accessToken = await new SignJWT({ ...payload } as JWTPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt(now)
    .setExpirationTime(now + JWT_CONFIG.ACCESS_TOKEN_TTL_SECONDS)
    .sign(getAccessSecret());

  const refreshToken = await new SignJWT({ sub: payload.sub, type: payload.type } as JWTPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt(now)
    .setExpirationTime(now + JWT_CONFIG.REFRESH_TOKEN_TTL_SECONDS)
    .sign(getRefreshSecret());

  return {
    accessToken,
    refreshToken,
    expiresIn: JWT_CONFIG.ACCESS_TOKEN_TTL_SECONDS,
  };
}

export async function verifyAccessToken(token: string): Promise<JwtPayload> {
  try {
    const { payload } = await jwtVerify(token, getAccessSecret());
    return payload as unknown as JwtPayload;
  } catch {
    throw new Error("Invalid or expired access token");
  }
}

export async function verifyRefreshToken(
  token: string
): Promise<Pick<JwtPayload, "sub" | "type">> {
  try {
    const { payload } = await jwtVerify(token, getRefreshSecret());
    return payload as unknown as Pick<JwtPayload, "sub" | "type">;
  } catch {
    throw new Error("Invalid or expired refresh token");
  }
}

export async function generateAccessToken(
  payload: Omit<JwtPayload, "iat" | "exp">
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  return new SignJWT({ ...payload } as JWTPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt(now)
    .setExpirationTime(now + JWT_CONFIG.ACCESS_TOKEN_TTL_SECONDS)
    .sign(getAccessSecret());
}
