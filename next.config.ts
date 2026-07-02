import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /** Pin the workspace root explicitly — this repo sits alongside a
   *  sibling project with its own lockfile, which otherwise makes
   *  Turbopack guess (and warn) about which directory is the root. */
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
