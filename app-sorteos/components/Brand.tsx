import Link from "next/link";

/** Monograma G: trazo redondeado de champán sobre carbón con borde fino. Mismo dibujo que el ícono de la pestaña. */
function Monogram({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <rect width="64" height="64" rx="15" fill="#1d1814" />
      <rect x="1" y="1" width="62" height="62" rx="14" fill="none" stroke="#d6ad5a" strokeOpacity="0.45" strokeWidth="2" />
      <path
        d="M41.7 22.3 A13.75 13.75 0 1 0 45.75 32 H34"
        fill="none"
        stroke="#d6ad5a"
        strokeWidth="5.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function Brand({ light = false, size = "md" }: { light?: boolean; size?: "md" | "lg" }) {
  return (
    <Link
      href="/tienda"
      aria-label="Gekko, ir al inicio"
      className="flex items-center gap-2.5 rounded-lg"
    >
      <Monogram className={size === "lg" ? "h-12 w-12" : "h-8 w-8"} />
      <span className={`brand ${size === "lg" ? "text-3xl" : "text-xl"} ${light ? "text-white" : "text-ink"}`}>
        Gek<span className="text-gold">ko</span>
      </span>
    </Link>
  );
}
