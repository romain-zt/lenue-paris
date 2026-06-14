/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // i18n routing: default + secondary locale, matching the CMS locales.
  i18n: {
    locales: ["en", "fr"],
    defaultLocale: "fr",
  },
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost', port: '9000' },
      { protocol: 'https', hostname: '*.amazonaws.com' },
    ],
  },
};

export default nextConfig;
