import Brand from "@/components/Brand";
import SocialLinks from "@/components/SocialLinks";

export default function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-10">
        <div className="anim-rise mb-8 flex justify-center">
          <Brand light size="lg" />
        </div>
        <div className="ticket auth-ticket p-7" style={{ ["--cut" as string]: "calc(100% - 3.75rem)" }}>
          <h1 className="text-2xl font-extrabold">{title}</h1>
          <p className="mb-6 mt-1 text-sm text-gray-500">{subtitle}</p>
          {children}
          <div className="ticket-perf" style={{ margin: "1.75rem -0.9rem 0" }} />
          <p className="pt-4 text-center text-xs text-gray-500">
            Tu celular solo se usa para contactarte si ganas.
          </p>
        </div>
        <ul className="anim-rise mt-8 space-y-2 text-sm text-white/70" style={{ ["--delay" as string]: "450ms" }}>
          <li className="flex gap-2"><span className="text-gold">✓</span>Cada pago lo confirmamos uno por uno.</li>
          <li className="flex gap-2"><span className="text-gold">✓</span>El sorteo se hace en vivo, con la lista de compradores.</li>
          <li className="flex gap-2"><span className="text-gold">✓</span>Ves el estado de tus números en todo momento.</li>
        </ul>
        <SocialLinks className="mt-8 justify-center" />
      </div>
    </div>
  );
}
