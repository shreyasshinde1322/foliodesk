import Link from "next/link";
import type { GuideEntry } from "@/data/guides";

export function GuideCard({ guide }: { guide: GuideEntry }) {
  return (
    <Link
      className="card-hover block h-full rounded-2xl border border-border bg-white p-5 hover:border-primary/30"
      href={guide.href}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
        Guide
      </p>
      <h3 className="mt-2 font-serif text-xl tracking-tight">{guide.title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        {guide.description}
      </p>
    </Link>
  );
}
