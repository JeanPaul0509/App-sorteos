"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function Header({ phone, isAdmin }: { phone: string; isAdmin: boolean }) {
  const router = useRouter();
  const path = usePathname();

  async function logout() {
    await createClient().auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  const link = (href: string, label: string) => (
    <Link
      href={href}
      className={`rounded-full px-3 py-1.5 text-sm font-medium ${
        path.startsWith(href) ? "bg-white text-violet-700" : "text-white/90 hover:bg-white/15"
      }`}
    >
      {label}
    </Link>
  );

  return (
    <header className="sticky top-0 z-30 bg-violet-700 shadow-md">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 px-4 py-3">
        <Link href="/sorteos" className="text-lg font-extrabold text-white">
          🎟️ Sorteos
        </Link>
        <nav className="flex flex-wrap items-center gap-1">
          {link("/sorteos", "Sorteos")}
          {link("/mis-numeros", "Mis números")}
          {isAdmin && link("/admin", "⚙️ Admin")}
          <button
            onClick={logout}
            title={phone}
            className="rounded-full px-3 py-1.5 text-sm text-white/80 hover:bg-white/15"
          >
            Salir
          </button>
        </nav>
      </div>
    </header>
  );
}
