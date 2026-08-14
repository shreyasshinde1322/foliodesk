import Link from "next/link";
import type { GuideEntry } from "@/data/guides";

export function GuideCard({ guide }: { guide: GuideEntry }) {
  return (
    <Link
      className="block h-full rounded-[var(--radius-md)] border border-border bg-surface p-5 shadow-[var(--shadow-subtle)] transition-[border-color] duration-[var(--ease-fast)] hover:border-primary/40"
      href={guide.href}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
        Guide
      </p>
      <h3 className="mt-2 font-serif text-xl tracking-tight">{guide.title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        {guide.description}
      </p>
    </Link>
  );
}
