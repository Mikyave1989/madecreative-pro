// Diagnostic: test workspace package import without Prisma
import { Hono } from "hono";
import { handle } from "@hono/node-server/vercel";
import { PLAN_PRICE } from "@madecreative/shared";

const app = new Hono();

app.get("/health", (c) =>
  c.json({ status: "ok", plan_price: PLAN_PRICE, ts: new Date().toISOString() })
);

export default handle(app);
