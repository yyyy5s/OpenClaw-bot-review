const normalizeBasePath = (input) => {
  if (!input || input === '/') return '';
  const trimmed = String(input).trim();
  if (!trimmed) return '';
  const withoutTrailingSlash = trimmed.replace(/\/+$/, '');
  return withoutTrailingSlash.startsWith('/') ? withoutTrailingSlash : `/${withoutTrailingSlash}`;
};

const basePath = normalizeBasePath(process.env.NEXT_BASE_PATH || process.env.BASE_PATH || '');

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  ...(basePath ? { basePath } : {}),
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
};
export default nextConfig;
