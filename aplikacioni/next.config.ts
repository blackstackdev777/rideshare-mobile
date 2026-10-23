import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/sw.js", headers: [
      { key: "Cache-Control", value: "no-store, max-age=0" },
      { key: "Service-Worker-Allowed", value: "/" },
      { key: "X-Content-Type-Options", value: "nosniff" },
    ] }];
  },
};
export default nextConfig;
