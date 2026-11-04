export default function GroupLinkBanner({ url }: { url: string }) {
  return (
    <div className="card flex flex-wrap items-center justify-between gap-3 border-green-200 bg-green-50 p-4">
      <div>
        <p className="font-bold text-green-900">✅ Tu pago está confirmado</p>
        <p className="text-sm text-green-900/80">
          Únete al grupo del sorteo para enterarte de la fecha y ver el sorteo en vivo.
        </p>
      </div>
      <a href={url} target="_blank" rel="noreferrer" className="btn btn-green">
        Unirme al grupo de WhatsApp
      </a>
    </div>
  );
}
