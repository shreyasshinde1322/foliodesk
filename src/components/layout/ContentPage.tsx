import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Breadcrumb } from "@/components/site/Breadcrumb";
import { PageShell } from "@/components/ui/PageShell";

export function ContentPage({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <PageShell className="py-10">
      <Breadcrumb items={[{ href: "/", label: "Home" }, { label: title }]} />
      <article className="mt-6 max-w-3xl">
        <h1 className="font-serif text-4xl font-semibold tracking-tight">{title}</h1>
        <div className="prose-legal mt-6 space-y-4 text-base leading-relaxed text-muted [&_a]:font-medium [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 [&_h2]:mt-8 [&_h2]:font-serif [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:text-text">
          {children}
        </div>
      </article>
    </PageShell>
  );
}

export function legalMetadata(title: string, description: string): Metadata {
  return { title, description };
}
