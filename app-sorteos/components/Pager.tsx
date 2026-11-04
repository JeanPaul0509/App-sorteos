"use client";

export const PAGE_SIZE = 100;

/** Flechitas para pasar de 100 en 100: ‹ 1 › */
export default function Pager({
  page,
  pages,
  first,
  last,
  onChange,
}: {
  page: number; // empieza en 0
  pages: number;
  first?: number; // primer número visible
  last?: number; // último número visible
  onChange: (p: number) => void;
}) {
  if (pages <= 1) return null;
  const arrow =
    "flex h-11 w-11 items-center justify-center rounded-full border border-line bg-white text-xl font-bold text-ink transition hover:border-gold disabled:opacity-30 disabled:hover:border-line";

  return (
    <div className="mt-5 flex flex-col items-center gap-1.5">
      <div className="flex items-center gap-3">
        <button className={arrow} onClick={() => onChange(page - 1)} disabled={page === 0} aria-label="Anteriores 100">
          ‹
        </button>
        <label className="relative">
          <span className="sr-only">Elegir grupo de números</span>
          <select
            value={page}
            onChange={(e) => onChange(Number(e.target.value))}
            className="h-11 min-w-14 cursor-pointer appearance-none rounded-full bg-brand px-5 text-center text-lg font-extrabold text-gold"
          >
            {Array.from({ length: pages }, (_, i) => (
              <option key={i} value={i} className="bg-white text-ink">
                {i + 1}
              </option>
            ))}
          </select>
        </label>
        <button
          className={arrow}
          onClick={() => onChange(page + 1)}
          disabled={page >= pages - 1}
          aria-label="Siguientes 100"
        >
          ›
        </button>
      </div>
      <p className="text-xs text-gray-500">
        {first !== undefined && <>Números {first} al {last} · </>}página {page + 1} de {pages}
      </p>
    </div>
  );
}
