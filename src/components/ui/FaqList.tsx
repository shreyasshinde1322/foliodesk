"use client";

import type { FaqItem } from "@/data/faq";

export function FaqList({ items }: { items: FaqItem[] }) {
  return (
    <div className="divide-y divide-border border-y border-border">
      {items.map((item) => (
        <details className="group py-4" key={item.question}>
          <summary className="cursor-pointer list-none font-medium text-text marker:content-none [&::-webkit-details-marker]:hidden">
            <span className="flex items-start justify-between gap-4">
              {item.question}
              <span
                aria-hidden="true"
                className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border text-muted transition-[transform,color,background-color] duration-[var(--ease-fast)] group-open:rotate-45 group-open:border-primary group-open:bg-primary-soft group-open:text-primary"
              >
                +
              </span>
            </span>
          </summary>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted">
            {item.answer}
          </p>
        </details>
      ))}
    </div>
  );
}
