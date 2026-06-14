/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@repo/catalog"],
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.amazonaws.com",
      },
    ],
  },
};

export default nextConfig;
