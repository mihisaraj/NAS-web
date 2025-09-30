const backendOrigin =
  process.env.NEXT_PUBLIC_API_URL || process.env.HTS_NAS_BACKEND_ORIGIN || '';
const trimmedOrigin = backendOrigin.replace(/\/$/, '');
const backendApiBase = trimmedOrigin
  ? trimmedOrigin.endsWith('/api')
    ? trimmedOrigin
    : `${trimmedOrigin}/api`
  : '';

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    externalDir: true,
  },
  async rewrites() {
    if (!backendApiBase) {
      return [];
    }

    return [
      {
        source: '/api/:path*',
        destination: `${backendApiBase}/:path*`,
      },
    ];
  },
};

export default nextConfig;
