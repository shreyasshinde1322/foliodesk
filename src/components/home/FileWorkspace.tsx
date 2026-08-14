import { FileTypeIcon } from "@/components/icons/FileTypeIcon";

export function FileWorkspace() {
  const items = [
    { type: "pdf" as const, label: "PDF" },
    { type: "word" as const, label: "Word" },
    { type: "excel" as const, label: "Excel" },
    { type: "book" as const, label: "KDP" },
  ];
  return (
    <div aria-hidden="true" className="mx-auto grid w-full max-w-xs grid-cols-2 gap-4">
      {items.map((item) => (
        <div
          className="flex items-center gap-3 rounded-[var(--radius-md)] border border-border bg-white px-4 py-4"
          key={item.label}
        >
          <FileTypeIcon size="md" type={item.type} />
          <span className="text-sm font-medium text-text">{item.label}</span>
        </div>
      ))}
    </div>
  );
}
