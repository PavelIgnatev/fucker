/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  api: {
    responseLimit: false,
  },
  serverActions: {
    bodySizeLimit: "10mb",
  },
  experimental: {
    serverActions: {
        bodySizeLimit: '10mb',
    }
}
};

export default nextConfig;
