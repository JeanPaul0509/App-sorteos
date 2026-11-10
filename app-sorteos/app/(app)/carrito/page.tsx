import CartView from "@/components/CartView";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function CarritoPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("phone").eq("id", user!.id).single();
  return <CartView phone={profile?.phone ?? ""} />;
}
