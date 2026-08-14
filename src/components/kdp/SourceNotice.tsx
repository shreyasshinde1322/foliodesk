import { KDP_SOURCES } from "@/lib/kdp/specifications";

export function SourceNotice() {
  return (
    <aside
      className="rounded-lg border border-line bg-paper-deep/70 p-4 text-sm text-ink"
      role="note"
    >
      <p>
        Specifications are based on Amazon KDP&apos;s published paperback cover
        guidance and may change. Always verify your final files in KDP before
        publishing.
      </p>
      <p className="mt-2">
        This is an independent tool and is not affiliated with or endorsed by
        Amazon.
      </p>
      <p className="mt-2">
        Official references:{" "}
        <a
          className="text-accent underline underline-offset-2"
          href={KDP_SOURCES.paperbackCover}
          rel="noreferrer"
          target="_blank"
        >
          Create a Paperback Cover
        </a>
        ,{" "}
        <a
          className="text-accent underline underline-offset-2"
          href={KDP_SOURCES.paperbackGuidelines}
          rel="noreferrer"
          target="_blank"
        >
          Paperback Submission Guidelines
        </a>
        , and the{" "}
        <a
          className="text-accent underline underline-offset-2"
          href={KDP_SOURCES.coverCalculator}
          rel="noreferrer"
          target="_blank"
        >
          KDP Cover Calculator
        </a>
        .
      </p>
    </aside>
  );
}
