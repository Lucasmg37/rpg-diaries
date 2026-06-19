import type { Metadata } from "next";
import Link from "next/link";

import "./globals.css";

export const metadata: Metadata = {
  title: "Diário da Guilda",
  description:
    "Relatórios, análises e registros das jornadas dos aventureiros.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>
        {/* Cabeçalho global (sticky), no estilo do HTML de referência */}
        <header className="sticky top-0 z-50 border-b border-guild-border bg-guild-gradient bg-fixed py-8 text-center">
          <p className="eyebrow mb-2 tracking-[4px]">⚔ Crônica da Guilda ⚔</p>
          <Link
            href="/"
            className="font-heading text-2xl font-bold text-guild-gold transition-colors hover:text-guild-goldsoft sm:text-3xl"
          >
            Diário da Guilda
          </Link>
          <p className="mt-1 font-heading text-xs tracking-wide text-guild-muted">
            Relatórios, Análises e Registros dos Aventureiros
          </p>
        </header>

        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-8">
          <main>{children}</main>
          <footer className="mt-12 border-t border-guild-border pt-6 text-center text-sm italic text-guild-muted">
            Crônicas registradas pela guilda · geradas estaticamente
            <span className="mx-2 not-italic">·</span>
            <Link
              href="/design-system"
              className="not-italic transition-colors hover:text-guild-goldsoft"
            >
              Design System
            </Link>
            <span className="mx-2 not-italic">·</span>
            <Link
              href="/admin/dashboard"
              className="not-italic transition-colors hover:text-guild-goldsoft"
            >
              Área do Mestre
            </Link>
          </footer>
        </div>
      </body>
    </html>
  );
}
