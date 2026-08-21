import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  redirects: async () => [
    { source: "/v2", destination: "/", permanent: true },
  ],
};

export default nextConfig;
