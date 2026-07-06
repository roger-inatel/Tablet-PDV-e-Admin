/** @type {import('next').NextConfig} */
const nextConfig = {
  // Demo/MVP front-end: don't let lint warnings block the production build.
  // Run `npm run lint` manually to see them.
  eslint: { ignoreDuringBuilds: true },

  // v2 route migration: old bookmarks keep working.
  async redirects() {
    return [
      { source: "/pdv", destination: "/garcom", permanent: false },
      { source: "/pdv/mesa/:id", destination: "/garcom/mesa/:id", permanent: false },
      { source: "/admin/impressoras", destination: "/admin/setores", permanent: false },
    ];
  },
};

export default nextConfig;
