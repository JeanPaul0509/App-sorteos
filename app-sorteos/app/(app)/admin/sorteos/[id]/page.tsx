import Link from "next/link";
import { notFound } from "next/navigation";
import AdminBoard from "@/components/AdminBoard";
import GroupLinkEditor from "@/components/GroupLinkEditor";
import { createClient } from "@/lib/supabase/server";
import type { Raffle } from "@/lib/types";
import { money } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminRafflePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("raffles").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  const r = data as Raffle;

  return (
    <div>
      <Link href="/admin" className="text-sm text-gold">
        ← Volver al panel
      </Link>
      <h1 className="mt-2 text-2xl font-extrabold">
        {r.icon} {r.title}
      </h1>
      <p className="mb-5 text-white/60">
        {r.total_tickets} números · {money(r.price)} c/u
      </p>
      <div className="space-y-6">
        <GroupLinkEditor raffleId={r.id} />
        <AdminBoard raffle={r} />
      </div>
    </div>
  );
}
