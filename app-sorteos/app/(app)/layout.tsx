import { redirect } from "next/navigation";
import Header from "@/components/Header";
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
    <>
      <Header phone={profile?.phone ?? ""} isAdmin={profile?.role === "admin"} />
      <main className="mx-auto max-w-5xl px-4 pb-32 pt-6">{children}</main>
    </>
  );
}
