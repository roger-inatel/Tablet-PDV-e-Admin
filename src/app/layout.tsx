import type { Metadata } from "next";
import { IBM_Plex_Sans } from "next/font/google";
import "./globals.css";
import { StoreProvider } from "@/components/shell/StoreProvider";
import { RealtimeBridge } from "@/components/shell/RealtimeBridge";
import { ToastHost } from "@/components/shell/ToastHost";
import { DevSwitcher } from "@/components/shell/DevSwitcher";
import { QueryProvider } from "@/providers/query-provider";

const ibmPlex = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-ibm-plex",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Mesa+ · Sistema de Restaurante",
  description:
    "PDV, KDS e painel administrativo para restaurante — mesas, comandas, pedidos e fechamento.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={ibmPlex.variable}>
      <body className="min-h-screen bg-app-bg font-sans text-ink antialiased">
        <QueryProvider>
          <StoreProvider>
            <RealtimeBridge />
            {children}
            <ToastHost />
            <DevSwitcher />
          </StoreProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
