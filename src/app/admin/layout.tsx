"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/Button";

type Status = "checking" | "authed";

/**
 * Guarda de rota do /admin (client-side). Verifica a sessão em /api/auth/verify
 * e redireciona para /admin/login se inválida/expirada. A própria página de
 * login é isenta da verificação (senão entraria em loop de redirecionamento).
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const isLoginRoute = pathname === "/admin/login";
  const [status, setStatus] = useState<Status>(
    isLoginRoute ? "authed" : "checking",
  );

  useEffect(() => {
    if (isLoginRoute) return;
    let active = true;
    fetch("/api/auth/verify")
      .then((res) => {
        if (!active) return;
        if (res.ok) setStatus("authed");
        else router.replace("/admin/login");
      })
      .catch(() => {
        if (active) router.replace("/admin/login");
      });
    return () => {
      active = false;
    };
  }, [isLoginRoute, pathname, router]);

  if (isLoginRoute) {
    return <>{children}</>;
  }

  if (status === "checking") {
    return (
      <div className="py-16 text-center text-sm text-guild-muted">
        Verificando sessão…
      </div>
    );
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/admin/login");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-guild-border pb-3">
        <nav className="flex flex-wrap items-center gap-4">
          <Link
            href="/admin/dashboard"
            className="font-heading text-sm uppercase tracking-wide text-guild-goldsoft transition-colors hover:text-guild-gold"
          >
            ⚜ Mestre
          </Link>
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-xs uppercase tracking-wide transition-colors hover:text-guild-goldsoft ${
                pathname.startsWith(item.href)
                  ? "text-guild-gold"
                  : "text-guild-muted"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <Button type="button" variant="ghost" onClick={handleLogout}>
          Sair
        </Button>
      </div>
      {children}
    </div>
  );
}

const NAV = [
  { href: "/admin/dashboard", label: "Painel" },
  { href: "/admin/management/sessions", label: "Sessões" },
  { href: "/admin/management/adventurers", label: "Aventureiros" },
  { href: "/admin/management/loose-ends", label: "Fios Soltos" },
  { href: "/admin/management/story-plans", label: "Roteiros" },
];
