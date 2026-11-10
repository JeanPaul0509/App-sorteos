import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { MyTicket } from "@/lib/types";
import SafeImg from "@/components/SafeImg";
import { buildWhatsAppUrl, money, pad, plural } from "@/lib/utils";

export const dynamic = "force-dynamic";

const LABEL = { available: "Disponible", reserved: "🟡 Esperando pago", sold: "✅ Pagado" };

export default async function MisNumerosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const [{ data }, { data: profile }] = await Promise.all([
    supabase.rpc("my_tickets"),
    supabase.from("profiles").select("phone").eq("id", user!.id).single(),
  ]);
  const rows = (data ?? []) as MyTicket[];

  const groups = new Map<string, MyTicket[]>();
  rows.forEach((t) => groups.set(t.raffle_id, [...(groups.get(t.raffle_id) ?? []), t]));

  // Fotos de los premios
  const ids = [...groups.keys()];
  const { data: imgs } = ids.length
    ? await supabase.from("raffles").select("id, image_url, status, winner_number").in("id", ids)
    : { data: [] as { id: string; image_url: string | null; status: string; winner_number: number | null }[] };
  const info = new Map((imgs ?? []).map((r) => [r.id, r]));

  return (
    <div>
      <h1 className="mb-6 text-2xl font-extrabold">Mis números</h1>
      {groups.size === 0 && (
        <div className="card p-10 text-center text-gray-500">
          Aún no tienes números.{" "}
          <Link href="/sorteos" className="font-semibold text-violet-700">
            Ver sorteos
          </Link>
        </div>
      )}
      <div className="space-y-4">
        {[...groups.values()].map((list) => {
          const first = list[0];
          const pending = list.filter((t) => t.status === "reserved");
          const groupUrl = list.find((t) => t.group_url)?.group_url;
          const winNum = info.get(first.raffle_id)?.winner_number;
          const iWon = winNum != null && list.some((t) => t.number === winNum && t.status === "sold");
          return (
            <div key={first.raffle_id} className="card p-5">
              <Link href={`/sorteos/${first.raffle_id}`} className="group flex items-center gap-4">
                <span className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-gold-soft sm:h-24 sm:w-24">
                  <SafeImg
                    src={info.get(first.raffle_id)?.image_url}
                    alt={first.raffle_title}
                    icon={first.raffle_icon}
                    iconClassName="text-4xl"
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </span>
                <span className="min-w-0">
                  <span className="block text-lg font-bold leading-snug [overflow-wrap:anywhere]">
                    {first.raffle_icon} {first.raffle_title}
                  </span>
                  <span className="block text-sm text-gray-500">
                    {plural(list.length, "número", "números")}
                    {info.get(first.raffle_id)?.status === "finished" ? " · sorteo finalizado" : ""}
                  </span>
                </span>
              </Link>
              <div className="mt-4 flex flex-wrap gap-2">
                {list.map((t) => (
                  <span key={t.number} title={LABEL[t.status]} className={`ball ball-${t.status} w-12`}>
                    {pad(t.number, t.total_tickets)}
                  </span>
                ))}
              </div>
              {iWon && (
                <div className="mt-4 rounded-xl p-4 text-[#3a2a06]" style={{ background: "linear-gradient(135deg, #f1dca8, #d6ad5a 60%, #b08a3e)" }}>
                  <p className="text-lg font-extrabold">🏆 ¡Ganaste con el número {pad(winNum!, first.total_tickets)}!</p>
                  <p className="text-sm">Te contactaremos a tu celular para coordinar la entrega del premio.</p>
                </div>
              )}
              {!iWon && winNum != null && (
                <p className="mt-4 rounded-xl bg-paper p-3 text-sm text-gray-700">
                  Este sorteo ya tiene ganador: el número {pad(winNum, first.total_tickets)}. ¡Suerte en el próximo!
                </p>
              )}
              {groupUrl && (
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-green-50 p-3 text-sm text-green-900">
                  <span>✅ Pago confirmado. Únete al grupo del sorteo.</span>
                  <a href={groupUrl} target="_blank" rel="noreferrer" className="btn btn-green py-2 text-sm">
                    Unirme al grupo de WhatsApp
                  </a>
                </div>
              )}
              {pending.length > 0 && (
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-yellow-50 p-3 text-sm">
                  <span>
                    {plural(pending.length, "número esperando", "números esperando")} confirmación de pago ·{" "}
                    {money(pending.length * Number(first.price))}
                  </span>
                  <a
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-green py-2 text-sm"
                    href={buildWhatsAppUrl({
                      raffleTitle: first.raffle_title,
                      numbers: pending.map((t) => t.number),
                      totalTickets: first.total_tickets,
                      price: Number(first.price),
                      name: pending[0].buyer_name ?? "",
                      phone: profile?.phone ?? "",
                    })}
                  >
                    📲 Reenviar por WhatsApp
                  </a>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
