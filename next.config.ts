import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  redirects: async () => [
    { source: "/v2", destination: "/", permanent: true },
    // canonical domain: the auto-assigned .vercel.app URL redirects to 1iad.com
    {
      source: "/:path*",
      has: [{ type: "host", value: "1iad.vercel.app" }],
      destination: "https://1iad.com/:path*",
      permanent: true,
    },
  ],
};

export default nextConfig;
