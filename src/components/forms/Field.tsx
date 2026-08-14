import type { ReactNode } from "react";

export function Field({
  label,
  htmlFor,
  children,
  error,
  hint,
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
  error?: string;
  hint?: string;
}) {
  const hintId = `${htmlFor}-hint`;
  const errorId = `${htmlFor}-error`;
  return (
    <div>
      <label className="text-sm font-medium" htmlFor={htmlFor}>
        {label}
      </label>
      <div
        aria-describedby={`${hint ? hintId : ""} ${error ? errorId : ""}`.trim()}
      >
        {children}
      </div>
      {error ? (
        <p className="mt-1 text-sm text-[#9b1c1c]" id={errorId} role="alert">
          {error}
        </p>
      ) : null}
      {hint && !error ? (
        <p className="mt-1 text-xs text-muted" id={hintId}>
          {hint}
        </p>
      ) : null}
      {hint && error && hint !== error ? (
        <p className="mt-1 text-xs text-muted" id={hintId}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}
