import type { Metadata } from "next";
import { IBM_Plex_Sans } from "next/font/google";
import "./globals.css";
import { StoreProvider } from "@/components/shell/StoreProvider";
import { ToastHost } from "@/components/shell/ToastHost";
import { ModuleSwitcher } from "@/components/shell/ModuleSwitcher";

const ibmPlex = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-ibm-plex",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Mesa+ · Sistema de Restaurante",
  description:
    "PDV e painel administrativo para restaurante — gestão de mesas, comandas e garçons.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={ibmPlex.variable}>
      <body className="min-h-screen bg-app-bg font-sans text-ink antialiased">
        <StoreProvider>
          {children}
          <ModuleSwitcher />
          <ToastHost />
        </StoreProvider>
      </body>
    </html>
  );
}
