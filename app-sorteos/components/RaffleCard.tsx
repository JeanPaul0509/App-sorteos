import Link from "next/link";
import type { Raffle, RaffleCount } from "@/lib/types";
import { money } from "@/lib/utils";

export default function RaffleCard({
  raffle,
  count,
  href,
}: {
  raffle: Raffle;
  count?: RaffleCount;
  href: string;
}) {
  const sold = Number(count?.sold ?? 0);
  const reserved = Number(count?.reserved ?? 0);
  const pct = Math.round(((sold + reserved) / raffle.total_tickets) * 100);

  return (
    <Link href={href} className="card group block overflow-hidden transition hover:-translate-y-1 hover:shadow-lg">
      <div className="relative aspect-[4/3] bg-violet-50">
        {raffle.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={raffle.image_url} alt={raffle.title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-7xl">{raffle.icon}</div>
        )}
        <span className="absolute left-3 top-3 flex h-11 w-11 items-center justify-center rounded-full bg-white text-2xl shadow">
          {raffle.icon}
        </span>
        <span className="absolute right-3 top-3 rounded-full bg-violet-700 px-3 py-1 text-sm font-bold text-white shadow">
          {money(raffle.price)}
        </span>
        {raffle.status === "finished" && (
          <span className="absolute inset-x-0 bottom-0 bg-gray-900/70 py-1 text-center text-sm font-semibold text-white">
            Finalizado
          </span>
        )}
      </div>
      <div className="p-4">
        <h3 className="text-lg font-bold leading-tight">{raffle.title}</h3>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100">
          <div className="h-full rounded-full bg-linear-to-r from-violet-600 to-fuchsia-500" style={{ width: `${pct}%` }} />
        </div>
        <p className="mt-1.5 text-xs text-gray-500">
          {sold + reserved} de {raffle.total_tickets} números tomados
        </p>
      </div>
    </Link>
  );
}
