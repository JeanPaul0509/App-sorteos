/** Boleto dorado decorativo del inicio: entra girando hacia el frente y un brillo lo recorre una vez. */
export default function HeroTicket() {
  return (
    <div className="hero-ticket" aria-hidden>
      <div className="hero-ticket-inner">
        <div className="flex items-center justify-between text-[0.7rem] font-semibold opacity-80">
          <span>Admite 1 ganador</span>
          <span>N.º 000777</span>
        </div>
        <p className="brand mt-3 text-[1.9rem]">GoldenTicket</p>
        <div className="my-3 border-t-2 border-dashed border-current opacity-30" />
        <div className="flex items-center justify-between text-xs font-semibold">
          <span>Sorteo en vivo</span>
          <span className="flex gap-1">
            {[7, 7, 7].map((n, i) => (
              <span key={i} className="flex h-6 w-6 items-center justify-center rounded-full bg-[#3a2a06] text-[0.7rem] text-gold">
                {n}
              </span>
            ))}
          </span>
        </div>
      </div>
    </div>
  );
}
