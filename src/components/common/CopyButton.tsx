"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

export function CopyButton({
  value,
  label = "Copy",
}: {
  value: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      const area = document.createElement("textarea");
      area.value = value;
      document.body.append(area);
      area.select();
      document.execCommand("copy");
      area.remove();
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    }
  }

  return (
    <button
      className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-2.5 py-1 text-xs font-medium text-muted shadow-[var(--shadow-subtle)] transition-colors hover:border-primary/40 hover:text-text"
      onClick={() => void copy()}
      type="button"
    >
      {copied ? (
        <Check aria-hidden="true" className="h-3.5 w-3.5 text-primary" />
      ) : (
        <Copy aria-hidden="true" className="h-3.5 w-3.5" />
      )}
      {copied ? "Copied" : label}
    </button>
  );
}
