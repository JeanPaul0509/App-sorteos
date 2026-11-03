"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Brand from "@/components/Brand";
import { createClient } from "@/lib/supabase/client";

export default function Header({ phone, isAdmin }: { phone: string; isAdmin: boolean }) {
  const router = useRouter();
  const path = usePathname();

  async function logout() {
    await createClient().auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  const link = (href: string, label: string) => {
    const active = path.startsWith(href);
    return (
      <Link
        href={href}
        aria-current={active ? "page" : undefined}
        className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
          active ? "bg-white/10 text-gold" : "text-white/80 hover:text-white"
        }`}
      >
        {label}
      </Link>
    );
  };

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-brand">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 px-4 py-3">
        <Brand light />
        <nav className="flex flex-wrap items-center gap-0.5">
          {link("/sorteos", "Sorteos")}
          {link("/mis-numeros", "Mis números")}
          {isAdmin && link("/admin", "Admin")}
          <button
            onClick={logout}
            title={phone ? `Sesión: ${phone}` : undefined}
            className="rounded-lg px-3 py-2 text-sm text-white/60 hover:text-white"
          >
            Salir
          </button>
        </nav>
      </div>
    </header>
  );
}
