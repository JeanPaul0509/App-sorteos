import Link from "next/link";
import { redirect } from "next/navigation";
import { CartProvider } from "@/components/CartProvider";
import Header from "@/components/Header";
import SocialLinks from "@/components/SocialLinks";
import { createClient } from "@/lib/supabase/server";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("phone, role")
    .eq("id", user.id)
    .single();

  return (
    <CartProvider>
      <Header phone={profile?.phone ?? ""} isAdmin={profile?.role === "admin"} />
      <main className="mx-auto max-w-5xl px-4 pb-10 pt-6">{children}</main>
      <footer className="mx-auto flex max-w-5xl flex-col items-center gap-3 border-t border-white/10 px-4 pb-32 pt-8 text-sm text-white/50">
        <SocialLinks />
        <p>Tora · Pollo aderezado, belleza y sorteos</p>
        <Link href="/terminos" className="underline decoration-white/30 underline-offset-4 hover:text-white">
          Términos y condiciones
        </Link>
      </footer>
    </CartProvider>
  );
}
