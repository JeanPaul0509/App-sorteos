/** Muestra el texto de términos: "## " = título, "- " = viñeta, línea vacía = nuevo párrafo. */
export default function TermsText({ text }: { text: string }) {
  const blocks = text.replace(/\r/g, "").split(/\n{2,}/);
  return (
    <div className="space-y-4 text-[15px] leading-relaxed text-gray-700 [overflow-wrap:anywhere]">
      {blocks.map((block, i) => {
        const lines = block.split("\n").filter((l) => l.trim() !== "");
        return (
          <div key={i} className="space-y-2">
            {(() => {
              const out: React.ReactNode[] = [];
              let bullets: string[] = [];
              const flush = () => {
                if (bullets.length)
                  out.push(
                    <ul key={`u${out.length}`} className="list-disc space-y-1 pl-5">
                      {bullets.map((b, j) => (
                        <li key={j}>{b}</li>
                      ))}
                    </ul>
                  );
                bullets = [];
              };
              lines.forEach((l, j) => {
                const t = l.trim();
                if (t.startsWith("## ")) {
                  flush();
                  out.push(
                    <h2 key={`h${j}`} className="pt-2 text-lg font-extrabold text-ink">
                      {t.slice(3)}
                    </h2>
                  );
                } else if (t.startsWith("- ")) {
                  bullets.push(t.slice(2));
                } else {
                  flush();
                  out.push(<p key={`p${j}`}>{t}</p>);
                }
              });
              flush();
              return out;
            })()}
          </div>
        );
      })}
    </div>
  );
}
