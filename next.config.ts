import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Fallback only — media uploads go direct to Supabase from the browser.
  experimental: {
    serverActions: {
      bodySizeLimit: "500mb",
    },
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
