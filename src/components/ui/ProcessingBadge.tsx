import type { ProcessingType } from "@/types/tools";

const COPY: Record<ProcessingType, { label: string; detail: string }> = {
  local: {
    label: "Local processing",
    detail: "Processed in your browser.",
  },
  server: {
    label: "Server processing",
    detail: "Temporarily processed on our processing infrastructure.",
  },
  hybrid: {
    label: "Processing varies",
    detail: "This listing may use local or server processing when it ships.",
  },
};

export function ProcessingBadge({
  type,
  compact = false,
}: {
  type: ProcessingType;
  compact?: boolean;
}) {
  const copy = COPY[type];
  return (
    <span
      className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-2.5 py-1 text-xs text-muted"
      title={copy.detail}
    >
      <span
        aria-hidden="true"
        className={`h-1.5 w-1.5 rounded-full ${
          type === "local"
            ? "bg-success"
            : type === "server"
              ? "bg-info"
              : "bg-warning"
        }`}
      />
      <span className="font-medium text-text">{copy.label}</span>
      {compact ? null : (
        <span className="hidden sm:inline">{copy.detail}</span>
      )}
    </span>
  );
}
