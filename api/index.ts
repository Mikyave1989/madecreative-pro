// Vercel serverless entry point for the MadeCreative API.
// After `turbo build --filter=@madecreative/api`, all workspace packages
// are compiled and available via node_modules symlinks.
// @vercel/node bundles this file + all imports into a single Lambda.
export { default } from "../apps/api/dist/index.js";
