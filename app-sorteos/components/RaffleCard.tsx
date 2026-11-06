import Link from "next/link";
import type { Raffle, RaffleCount } from "@/lib/types";
import SafeImg from "@/components/SafeImg";
import { isPastDate, money, num, pad, plural, soldPercent } from "@/lib/utils";

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
  const buyers = Number(count?.buyers ?? 0);
  // La barra avanza con los tickets vendidos (pagados)
  const pct = soldPercent(sold, raffle.total_tickets);
  const finished = raffle.status === "finished";
  const dateText = !raffle.draw_date
    ? null
    : !finished && isPastDate(raffle.draw_date)
      ? "Fecha del sorteo por confirmar"
      : `Sorteo en vivo el ${new Date(raffle.draw_date + "T12:00:00").toLocaleDateString("es-PE", { day: "numeric", month: "long" })}`;

  return (
    <Link
      href={href}
      className="ticket group flex h-full flex-col transition-transform duration-200 hover:-translate-y-1"
      style={{ ["--cut" as string]: `calc(100% - ${STUB})` }}
    >
      <div className="relative m-2 mb-0 aspect-[4/3] overflow-hidden rounded-xl bg-gold-soft">
        <SafeImg
          src={raffle.image_url}
          alt={raffle.title}
          icon={raffle.icon}
          iconClassName="text-7xl"
          className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]"
        />
        {finished && (
          <span className="absolute inset-x-0 bottom-0 bg-ink/80 py-1.5 text-center text-sm font-semibold text-white">
            {raffle.winner_number != null
              ? `🏆 Ganó el ${pad(raffle.winner_number, raffle.total_tickets)}${raffle.winner_display ? ` · ${raffle.winner_display}` : ""}`
              : "Sorteo finalizado"}
          </span>
        )}
      </div>

      <div className="px-4 pb-4 pt-3">
        <h3 className="line-clamp-3 text-lg font-extrabold leading-snug [overflow-wrap:anywhere]" title={raffle.title}>
          <span className="mr-1.5">{raffle.icon}</span>
          {raffle.title}
        </h3>
        {dateText && <p className="mt-0.5 text-sm text-gray-500">{dateText}</p>}
      </div>

      <div className="ticket-perf mt-auto" />

      <div className="flex items-center gap-4 px-4" style={{ height: STUB }}>
        <div className="shrink-0">
          <p className="text-xs text-gray-500">Por número</p>
          <p className="text-2xl font-extrabold tracking-tight">{money(raffle.price)}</p>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <span className="min-w-0 truncate text-sm font-extrabold">{pct.label} vendido</span>
            <span
              className="flex shrink-0 items-center gap-1 whitespace-nowrap text-sm font-semibold text-gray-600"
              title={plural(buyers, "persona compró", "personas compraron")}
            >
              <svg viewBox="0 0 20 20" className="h-4 w-4 fill-current" aria-hidden>
                <path d="M10 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm0 2c-4.4 0-7 2.2-7 4.5V18h14v-1.5c0-2.3-2.6-4.5-7-4.5Z" />
              </svg>
              {num(buyers)}
              <span className="sr-only">{buyers === 1 ? "persona compró" : "personas compraron"}</span>
            </span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-paper">
            <div className="h-full rounded-full bg-gold" style={{ width: `${pct.width}%` }} />
          </div>
        </div>
      </div>
    </Link>
  );
}
