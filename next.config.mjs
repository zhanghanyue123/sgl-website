/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [{
      source: "/:path*",
      has: [{ type: "host", value: "theseagulllabs.com" }],
      destination: "https://www.theseagulllabs.com/:path*",
      permanent: true
    }];
  }
};
export default nextConfig;
