"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Brand from "@/components/Brand";
import { useCart } from "@/components/CartProvider";
import { createClient } from "@/lib/supabase/client";

export default function Header({ phone, isAdmin }: { phone: string; isAdmin: boolean }) {
  const router = useRouter();
  const path = usePathname();
  const { count } = useCart();

  async function logout() {
    await createClient().auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  const link = (href: string, label: string, match: string = href) => {
    const active = path.startsWith(match);
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
    <header className="sticky top-0 z-30 border-b border-gold/25 bg-brand/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 px-4 py-3">
        <Brand light />
        <nav className="flex flex-wrap items-center gap-0.5">
          {link("/tienda", "Tienda")}
          {link("/sorteos", "Sorteos")}
          {link("/mis-pedidos", "Pedidos")}
          {link("/carrito", count > 0 ? `🛒 ${count}` : "🛒")}
          {isAdmin && link("/admin/pedidos", "Admin", "/admin")}
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
