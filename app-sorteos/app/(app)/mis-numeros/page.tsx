import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { MyTicket } from "@/lib/types";
import { buildWhatsAppUrl, money, pad } from "@/lib/utils";

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
          return (
            <div key={first.raffle_id} className="card p-5">
              <Link href={`/sorteos/${first.raffle_id}`} className="text-lg font-bold">
                {first.raffle_icon} {first.raffle_title}
              </Link>
              <div className="mt-3 flex flex-wrap gap-2">
                {list.map((t) => (
                  <span key={t.number} title={LABEL[t.status]} className={`ball ball-${t.status} w-12`}>
                    {pad(t.number, t.total_tickets)}
                  </span>
                ))}
              </div>
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
                    {pending.length} número(s) esperando confirmación de pago ·{" "}
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
