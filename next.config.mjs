/** @type {import('next').NextConfig} */
const nextConfig = {
  // Demo/MVP front-end: don't let lint warnings block the production build.
  // Run `npm run lint` manually to see them.
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
