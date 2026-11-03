import Link from "next/link";
import type { Raffle, RaffleCount } from "@/lib/types";
import { money } from "@/lib/utils";

const STUB = "5.25rem"; // alto del talón (debajo de la línea perforada)

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
  const taken = sold + reserved;
  const left = raffle.total_tickets - taken;
  const pct = Math.round((taken / raffle.total_tickets) * 100);
  const finished = raffle.status === "finished";

  return (
    <Link
      href={href}
      className="ticket group block transition-transform duration-200 hover:-translate-y-1"
      style={{ ["--cut" as string]: `calc(100% - ${STUB})` }}
    >
      <div className="relative m-2 mb-0 aspect-[4/3] overflow-hidden rounded-xl bg-gold-soft">
        {raffle.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={raffle.image_url}
            alt={raffle.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-7xl">{raffle.icon}</div>
        )}
        {finished && (
          <span className="absolute inset-x-0 bottom-0 bg-ink/80 py-1.5 text-center text-sm font-semibold text-white">
            Sorteo finalizado
          </span>
        )}
      </div>

      <div className="px-4 pb-4 pt-3">
        <h3 className="text-lg font-extrabold leading-snug">
          <span className="mr-1.5">{raffle.icon}</span>
          {raffle.title}
        </h3>
        {raffle.draw_date && (
          <p className="mt-0.5 text-sm text-gray-500">
            Sorteo en vivo el {new Date(raffle.draw_date + "T12:00:00").toLocaleDateString("es-PE", { day: "numeric", month: "long" })}
          </p>
        )}
      </div>

      <div className="ticket-perf" />

      <div className="flex items-center gap-4 px-4" style={{ height: STUB }}>
        <div className="shrink-0">
          <p className="text-xs text-gray-500">Por número</p>
          <p className="text-2xl font-extrabold tracking-tight text-brand">{money(raffle.price)}</p>
        </div>
        <div className="min-w-0 flex-1">
          <div className="h-2 overflow-hidden rounded-full bg-paper">
            <div className="h-full rounded-full bg-linear-to-r from-gold to-orange" style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-1.5 text-xs text-gray-600">
            {finished ? `${taken} de ${raffle.total_tickets} vendidos` : `Quedan ${left} de ${raffle.total_tickets}`}
          </p>
        </div>
      </div>
    </Link>
  );
}
