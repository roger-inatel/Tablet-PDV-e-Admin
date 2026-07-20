import type { IconName } from "@/components/ui/Icon";

export interface AdminNavItem {
  key: string;
  href: string;
  label: string;
  icon: IconName;
  kicker: string;
  title: string;
}

// Shared admin navigation config — drives the sidebar links and each page
// header. Labels/kickers/titles are user-facing copy (pt-BR).
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
    key: "gestao",
    href: "/admin/dashboard",
    label: "Painel gerencial",
    icon: "chart",
    kicker: "Gestão",
    title: "Painel gerencial",
  },
  {
    key: "checks",
    href: "/admin/checks",
    label: "Comandas",
    icon: "printer",
    kicker: "Operação",
    title: "Comandas & caixa",
  },
  {
    key: "removals",
    href: "/admin/removals",
    label: "Remoções",
    icon: "trash",
    kicker: "Operação",
    title: "Remoções de itens",
  },
  {
    key: "audit",
    href: "/admin/audit",
    label: "Auditoria",
    icon: "clipboard",
    kicker: "Gestão",
    title: "Auditoria de remoções",
  },
  {
    key: "tables",
    href: "/admin/tables",
    label: "Mesas",
    icon: "grid",
    kicker: "Operação",
    title: "Mesas do salão",
  },
  {
    key: "waiters",
    href: "/admin/waiters",
    label: "Garçons",
    icon: "users",
    kicker: "Cadastros",
    title: "Garçons",
  },
  {
    key: "products",
    href: "/admin/products",
    label: "Produtos",
    icon: "box",
    kicker: "Cadastros",
    title: "Produtos",
  },
  {
    key: "stations",
    href: "/admin/stations",
    label: "Setores",
    icon: "flame",
    kicker: "Sistema",
    title: "Setores & estações",
  },
];
