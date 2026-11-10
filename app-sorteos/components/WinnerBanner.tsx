import { pad } from "@/lib/utils";

/** Ganador publicado del sorteo (nombre abreviado por privacidad). */
export default function WinnerBanner({
  number,
  display,
  totalTickets,
  drawnAt,
  videoUrl,
}: {
  number: number;
  display: string | null | undefined;
  totalTickets: number;
  drawnAt: string | null | undefined;
  videoUrl: string | null | undefined;
}) {
  return (
    <section className="anim-rise card relative overflow-hidden border-gold/50 bg-brand p-6 text-white">
      <div className="flex flex-wrap items-center gap-5">
        <span
          className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full text-2xl font-extrabold text-[#3a2a06]"
          style={{ background: "linear-gradient(135deg, #f1dca8, #d6ad5a 55%, #b08a3e)" }}
        >
          {pad(number, totalTickets)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gold">🏆 Número ganador</p>
          <p className="text-2xl font-extrabold [overflow-wrap:anywhere]">
            {display ? `Ganó ${display}` : `Ganó el número ${pad(number, totalTickets)}`}
          </p>
          {drawnAt && (
            <p className="text-sm text-white/60">
              Sorteado el{" "}
              {new Date(drawnAt).toLocaleDateString("es-PE", { day: "numeric", month: "long", year: "numeric", timeZone: "America/Lima" })}
            </p>
          )}
        </div>
        {videoUrl && (
          <a href={videoUrl} target="_blank" rel="noreferrer" className="btn btn-gold shrink-0">
            ▶ Ver el sorteo en vivo
          </a>
        )}
      </div>
    </section>
  );
}
