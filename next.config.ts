import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Hide the Next.js "Rendering..." / route indicator in local dev
  devIndicators: false,
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
