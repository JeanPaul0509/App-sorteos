export default function Legend({ showSelected = false }: { showSelected?: boolean }) {
  const item = (cls: string, label: string) => (
    <span className="flex items-center gap-1.5">
      <span className={`ball ${cls} h-5 w-5 text-[0px]`}>·</span>
      {label}
    </span>
  );
  return (
    <div className="mb-4 flex flex-wrap gap-4 text-sm text-gray-600">
      {item("ball-available", "Disponible")}
      {showSelected && item("ball-selected", "Tu selección")}
      {item("ball-reserved", "Reservado (en espera de pago)")}
      {item("ball-sold", "Vendido")}
    </div>
  );
}
