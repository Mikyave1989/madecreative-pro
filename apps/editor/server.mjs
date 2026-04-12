import { createRequestHandler } from "@remix-run/node";
import express from "express";
import { readFileSync } from "fs";
import { join } from "path";

const PORT = process.env.PORT || 5173;
const BUILD_DIR = "./build";

const app = express();

// Required headers for WebContainers
app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  next();
});

// Static files
app.use(express.static(join(BUILD_DIR, "client"), { maxAge: "1h" }));

// Remix handler
const build = await import(join(BUILD_DIR, "server", "index.js"));
app.all("*", createRequestHandler({ build, mode: process.env.NODE_ENV }));

app.listen(PORT, "0.0.0.0", () => {
  console.log(`MadeCreative Editor running on http://0.0.0.0:${PORT}`);
});
