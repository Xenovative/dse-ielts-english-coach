import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Pin the tracing root to this project — a stray lockfile in the home
  // directory otherwise makes Next.js infer the wrong workspace root.
  outputFileTracingRoot: dirname(fileURLToPath(import.meta.url)),
  // TalkingHead ships as ESM (.mjs) and imports three/addons/* — transpile for webpack.
  transpilePackages: ["@met4citizen/talkinghead", "three"],
  // Keep optional native/server-only packages (e.g. vosk) out of the client bundle.
  serverExternalPackages: [],
};

export default nextConfig;
