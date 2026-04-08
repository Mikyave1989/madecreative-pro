// Vercel serverless entry point for the MadeCreative API.
// @vercel/node (esbuild) bundles this file + all imports into a single Lambda,
// tracing through workspace packages (@madecreative/*) from TypeScript source.
import { handle } from "@hono/node-server/vercel";
import app from "../apps/api/src/app.js";

export default handle(app);
