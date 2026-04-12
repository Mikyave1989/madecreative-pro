import express from "express";
import { createRequestHandler } from "@remix-run/express";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 5173;

const app = express();

// WebContainers require these headers
app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  next();
});

// Static files from Remix client build
app.use(express.static(join(__dirname, "build", "client"), {
  maxAge: "1h",
  immutable: true,
}));

// Remix SSR handler
const build = await import("./build/server/index.js");
app.all("*", createRequestHandler({ build }));

app.listen(PORT, "0.0.0.0", () => {
  console.log(`MadeCreative Editor running on port ${PORT}`);
});
