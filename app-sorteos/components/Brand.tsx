import Link from "next/link";

export default function Brand({ light = false, size = "md" }: { light?: boolean; size?: "md" | "lg" }) {
  return (
    <Link
      href="/sorteos"
      aria-label="GoldenTicket, ir al inicio"
      className="flex items-center gap-2.5 rounded-lg"
    >
      <span className="brand-mark" style={size === "lg" ? { transform: "scale(1.35)" } : undefined} />
      <span className={`brand ${size === "lg" ? "text-3xl" : "text-xl"} ${light ? "text-white" : "text-ink"}`}>
        Golden<span className="text-gold">Ticket</span>
      </span>
    </Link>
  );
}
