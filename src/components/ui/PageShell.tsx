import type { ReactNode } from "react";

export function PageShell({
  children,
  className = "",
  id = "main",
}: {
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <main className={`mx-auto w-full max-w-6xl px-4 sm:px-6 ${className}`} id={id}>
      {children}
    </main>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="max-w-2xl">
      {eyebrow ? (
        <p className="text-sm font-semibold uppercase tracking-[0.12em] text-primary">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="mt-2 font-serif text-3xl font-semibold tracking-tight text-text sm:text-4xl">
        {title}
      </h2>
      {description ? (
        <p className="mt-3 text-base leading-relaxed text-muted">{description}</p>
      ) : null}
    </div>
  );
}
