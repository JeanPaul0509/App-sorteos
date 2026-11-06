"use client";

import { useState } from "react";

/** Imagen que, si el enlace falla, muestra el ícono del premio en vez del ícono roto del navegador. */
export default function SafeImg({
  src,
  alt,
  icon,
  className = "",
  iconClassName = "text-5xl",
}: {
  src: string | null | undefined;
  alt: string;
  icon: string;
  className?: string;
  iconClassName?: string;
}) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <span className={`flex h-full w-full items-center justify-center ${iconClassName}`} role="img" aria-label={alt}>
        {icon}
      </span>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} className={className} onError={() => setFailed(true)} />;
}
