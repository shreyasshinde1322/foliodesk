import { FileTypeIcon } from "@/components/icons/FileTypeIcon";

export function KdpBookVisual() {
  return (
    <div aria-hidden="true" className="relative mx-auto h-36 w-32 shrink-0">
      <div className="absolute inset-y-4 left-2 w-3 rounded-l-sm bg-primary" />
      <div className="absolute inset-y-2 right-1 left-5 overflow-hidden rounded-r-md border border-border bg-white shadow-[var(--shadow-card)]">
        <div className="absolute inset-x-4 top-5 h-1.5 rounded-full bg-paper-deep" />
        <div className="absolute inset-x-6 top-9 h-1 rounded-full bg-paper-deep" />
        <div className="absolute inset-x-6 top-12 h-1 rounded-full bg-paper-deep" />
        <div className="absolute bottom-3 right-3">
          <FileTypeIcon size="sm" type="book" />
        </div>
      </div>
    </div>
  );
}
