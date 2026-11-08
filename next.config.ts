import type { NextConfig } from "next";

// The admin is a static console: it ships as plain files and talks to the Go
// backend from the browser. No Node server runs in production, so there is no
// server-side attack surface (middleware, server actions, RSC endpoints).
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  poweredByHeader: false,
  reactStrictMode: true,
};

export default nextConfig;
