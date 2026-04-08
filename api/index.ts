// Vercel serverless entry point for the MadeCreative API.
// @vercel/node (esbuild/nft) bundles this file + all imports into a single Lambda.
import { handle } from "@hono/node-server/vercel";
import app from "../apps/api/src/app.js";

export default handle(app);
