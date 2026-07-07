/** @type {import('next').NextConfig} */
const nextConfig = {
  // Demo/MVP front-end: don't let lint warnings block the production build.
  // Run `pnpm lint` manually to see them.
  eslint: { ignoreDuringBuilds: true },

  // Route migration: old bookmarks (PT-named and legacy /pdv) keep working.
  async redirects() {
    return [
      // legacy /pdv era
      { source: "/pdv", destination: "/waiter", permanent: false },
      { source: "/pdv/mesa/:id", destination: "/waiter/table/:id", permanent: false },
      { source: "/admin/impressoras", destination: "/admin/stations", permanent: false },
      // PT -> EN route rename
      { source: "/garcom", destination: "/waiter", permanent: false },
      { source: "/garcom/mesa/:id", destination: "/waiter/table/:id", permanent: false },
      { source: "/kds/cozinha", destination: "/kds/kitchen", permanent: false },
      { source: "/admin/comandas", destination: "/admin/checks", permanent: false },
      { source: "/admin/garcons", destination: "/admin/waiters", permanent: false },
      { source: "/admin/mesas", destination: "/admin/tables", permanent: false },
      { source: "/admin/produtos", destination: "/admin/products", permanent: false },
      { source: "/admin/setores", destination: "/admin/stations", permanent: false },
    ];
  },
};

export default nextConfig;
