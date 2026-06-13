/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // i18n: French is the primary locale for lenue.paris
  i18n: {
    locales: ["fr", "en"],
    defaultLocale: "fr",
  },
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
