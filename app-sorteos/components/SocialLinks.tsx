"use client";

import { useEffect, useMemo, useState } from "react";
import { FaInstagram, FaTiktok, FaWhatsapp } from "react-icons/fa";
import { createClient } from "@/lib/supabase/client";
import type { SiteSettings } from "@/lib/types";

/** Íconos de redes sociales (solo aparecen los que el admin configuró). */
export default function SocialLinks({ className = "" }: { className?: string }) {
  const supabase = useMemo(() => createClient(), []);
  const [s, setS] = useState<SiteSettings | null>(null);

  useEffect(() => {
    supabase
      .from("site_settings")
      .select("whatsapp_url, instagram_url, tiktok_url")
      .eq("id", 1)
      .maybeSingle()
      .then(({ data }) => setS((data as SiteSettings) ?? null));
  }, [supabase]);

  const items = [
    { url: s?.whatsapp_url, label: "WhatsApp", Icon: FaWhatsapp, hover: "hover:bg-[#25D366]" },
    { url: s?.instagram_url, label: "Instagram", Icon: FaInstagram, hover: "hover:bg-[#E1306C]" },
    { url: s?.tiktok_url, label: "TikTok", Icon: FaTiktok, hover: "hover:bg-white hover:text-black" },
  ].filter((i) => i.url);

  if (items.length === 0) return null;

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {items.map(({ url, label, Icon, hover }) => (
        <a
          key={label}
          href={url!}
          target="_blank"
          rel="noreferrer"
          aria-label={label}
          title={label}
          className={`flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition ${hover}`}
        >
          <Icon className="h-5 w-5" />
        </a>
      ))}
    </div>
  );
}
