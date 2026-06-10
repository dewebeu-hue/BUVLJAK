import type { ReactNode } from "react";

export function NeedsEdit({ children }: { children: ReactNode }) {
  return <span className="font-bold text-red-600">{children}</span>;
}

export function LegalPage({
  eyebrow,
  title,
  subtitle,
  children
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <main className="bg-[#fbfcf7] px-4 py-8 sm:px-6 sm:py-12">
      <article className="mx-auto max-w-4xl">
        <header className="rounded-lg border border-moss/12 bg-white p-5 shadow-sm sm:p-7">
          <span className="inline-flex rounded-full bg-moss/10 px-3 py-1 text-sm font-black text-mossDark">
            {eyebrow}
          </span>
          <h1 className="mt-4 text-4xl font-black leading-tight text-ink sm:text-5xl">{title}</h1>
          <p className="mt-4 max-w-3xl text-base font-semibold leading-relaxed text-ink/68 sm:text-lg">
            {subtitle}
          </p>
          <p className="mt-4 rounded-lg border border-honey/28 bg-honey/14 p-4 text-sm font-bold leading-relaxed text-ink/70">
            Ova stranica je beta placeholder za lokalno testiranje i nije zamjena za odvjetnički dokument.
          </p>
        </header>

        <div className="mt-5 grid gap-4 sm:mt-6">{children}</div>
      </article>
    </main>
  );
}

export function LegalSection({
  title,
  children,
  tone = "default"
}: {
  title: string;
  children: ReactNode;
  tone?: "default" | "notice";
}) {
  return (
    <section
      className={`rounded-lg border p-5 shadow-sm sm:p-6 ${
        tone === "notice" ? "border-honey/34 bg-honey/14" : "border-ink/10 bg-white"
      }`}
    >
      <h2 className="text-2xl font-black leading-tight text-ink">{title}</h2>
      <div className="mt-4 space-y-3 text-sm font-semibold leading-relaxed text-ink/72 sm:text-base">{children}</div>
    </section>
  );
}

export function LegalList({ items }: { items: ReactNode[] }) {
  return (
    <ul className="grid gap-2 pl-5">
      {items.map((item, index) => (
        <li key={index} className="list-disc">
          {item}
        </li>
      ))}
    </ul>
  );
}
