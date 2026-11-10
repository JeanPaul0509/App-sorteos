"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/admin/pedidos", label: "Pedidos" },
  { href: "/admin/productos", label: "Productos" },
  { href: "/admin", label: "Sorteos", exact: true },
  { href: "/admin/ajustes", label: "Ajustes" },
];

export default function AdminTabs() {
  const path = usePathname();
  return (
    <nav aria-label="Secciones del administrador" className="mb-6 flex flex-wrap gap-2">
      {TABS.map((t) => {
        const active = t.exact ? path === t.href || path.startsWith("/admin/sorteos") || path === "/admin/nuevo" : path.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={active ? "page" : undefined}
            className={`btn py-2 text-sm ${active ? "bg-gold text-ink" : "bg-white/10 text-white"}`}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
