// Vercel serverless entry point — ESM (apps/api uses "type":"module")
import { handle } from "@hono/node-server/vercel";
import app from "../apps/api/src/app.js";

export default handle(app);
