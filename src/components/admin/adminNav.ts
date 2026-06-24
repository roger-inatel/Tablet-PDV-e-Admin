import type { IconName } from "@/components/ui/Icon";

export interface AdminNavItem {
  key: string;
  href: string;
  label: string;
  icon: IconName;
  kicker: string;
  title: string;
}

// Shared admin navigation config — drives the sidebar links and each page header.
export const ADMIN_NAV: AdminNavItem[] = [
  {
    key: "dashboard",
    href: "/admin",
    label: "Dashboard",
    icon: "dashboard",
    kicker: "Operação",
    title: "Dashboard",
  },
  {
    key: "garcons",
    href: "/admin/garcons",
    label: "Garçons",
    icon: "users",
    kicker: "Cadastros",
    title: "Garçons",
  },
  {
    key: "mesas",
    href: "/admin/mesas",
    label: "Mesas",
    icon: "grid",
    kicker: "Operação",
    title: "Mesas do salão",
  },
  {
    key: "impressoras",
    href: "/admin/impressoras",
    label: "Impressoras",
    icon: "printer",
    kicker: "Sistema",
    title: "Impressoras & setores",
  },
  {
    key: "produtos",
    href: "/admin/produtos",
    label: "Produtos",
    icon: "box",
    kicker: "Cadastros",
    title: "Produtos",
  },
];
