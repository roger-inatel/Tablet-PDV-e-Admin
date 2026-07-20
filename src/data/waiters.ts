import type { Waiter } from "@/types";

// Staff seed: the 4 waiters + the manager (cashier/panel).
// `roleLabel` is user-facing copy and stays in pt-BR.
//
// `codVend` must reference an existing RL_EMPRESA_VENDEDOR.COD_VEND — an
// unknown value breaks the FK and drops the ERP order write. Only the sellers
// that actually exist in the database are mapped; the rest stay undefined and
// simply record the order without seller attribution.
export const WAITERS: Waiter[] = [
  {
    id: "carlos",
    name: "Carlos Lima",
    initials: "CL",
    color: "#2563eb",
    login: "@carlos",
    pin: "1234",
    role: "waiter",
    roleLabel: "Garçom",
    status: "ACTIVE",
    phone: "(11) 98888-1234",
    codVend: 1,
  },
  {
    id: "marina",
    name: "Marina Souza",
    initials: "MS",
    color: "#0d9488",
    login: "@marina",
    pin: "2222",
    role: "waiter",
    roleLabel: "Garçonete",
    status: "ACTIVE",
    phone: "(11) 98888-2222",
    codVend: 1101,
  },
  {
    id: "bruno",
    name: "Bruno Alves",
    initials: "BA",
    color: "#b45309",
    login: "@bruno",
    pin: "3333",
    role: "waiter",
    roleLabel: "Garçom",
    status: "ACTIVE",
    phone: "(11) 98888-3333",
  },
  {
    id: "julia",
    name: "Júlia Reis",
    initials: "JR",
    color: "#7c3aed",
    login: "@julia",
    pin: "4444",
    role: "waiter",
    roleLabel: "Garçonete",
    status: "ON_BREAK",
    phone: "(11) 98888-4444",
    note: "Retorna do intervalo às 18h.",
  },
  {
    id: "renata",
    name: "Renata Prado",
    initials: "RP",
    color: "#1f4e79",
    login: "@renata",
    pin: "9999",
    role: "manager",
    roleLabel: "Gerente",
    status: "ACTIVE",
    phone: "(11) 98888-9999",
  },
];
