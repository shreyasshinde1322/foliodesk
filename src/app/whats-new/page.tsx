import type { Metadata } from "next";
import Link from "next/link";
import { CHANGELOG } from "@/data/changelog";
import { ContentPage, legalMetadata } from "@/components/layout/ContentPage";

export const metadata: Metadata = legalMetadata(
  "What's New",
  "Shipped FolioDesk features. No invented release history.",
);

export default function WhatsNewPage() {
  return (
    <ContentPage title="What's New">
      <ul className="grid gap-4">
        {CHANGELOG.map((entry) => (
          <li
            className="rounded-[var(--radius-md)] border border-border bg-surface p-4"
            key={`${entry.date}-${entry.title}`}
          >
            <p className="text-xs text-muted">
              <time dateTime={entry.date}>{entry.date}</time>
              {entry.badge ? ` · ${entry.badge}` : ""}
            </p>
            <p className="mt-1 font-medium text-text">{entry.title}</p>
            <p className="mt-1 text-sm">{entry.description}</p>
            <Link className="mt-2 inline-block text-sm font-semibold" href={entry.href}>
              Open tool →
            </Link>
          </li>
        ))}
      </ul>
    </ContentPage>
  );
}
