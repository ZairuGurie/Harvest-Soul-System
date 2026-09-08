import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow LAN access during `next dev` (phone / other devices on 192.168.x.x)
  allowedDevOrigins: ["192.168.100.8", "127.0.0.1"],
  // Keep native ffmpeg binary out of Turbopack bundling (avoids \ROOT\... ENOENT).
  serverExternalPackages: ["ffmpeg-static"],
  experimental: {
    serverActions: {
      // Align with MEDIA_MAX_UPLOAD_BYTES default (100MB). Supabase plan may still be lower.
      bodySizeLimit: "100mb",
    },
    proxyClientMaxBodySize: "100mb",
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "saobzidnwpquvkfrqujs.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "i.ytimg.com",
        pathname: "/vi/**",
      },
    ],
  },
};

export default nextConfig;
