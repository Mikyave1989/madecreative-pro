// Minimal diagnostic endpoint — no imports, no Prisma, no workspace packages.
// If this works but api/index fails, the issue is in the imported modules.
import type { VercelRequest, VercelResponse } from "@vercel/node";

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.status(200).json({ pong: true, ts: Date.now() });
}
