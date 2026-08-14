"use client";

import {
  SPINE_TEXT_CLEARANCE_GUIDANCE,
  SPINE_TEXT_GUIDANCE,
} from "@/lib/kdp/specifications";
import { formatCoverDimensionsCopy } from "@/lib/kdp/copy-dimensions";
import { formatPair, unitToInches } from "@/lib/kdp/unit-conversion";
import type { PaperbackCoverDimensions } from "@/lib/kdp/types";
import { CopyButton } from "./CopyButton";

const HINTS: Record<number, string> = {
  1: "Total width and height of the cover file, including front, back, spine, and wrap.",
  2: "Visible front cover after trimming. The back cover uses the same size.",
  3: "Keep text and important images inside this area so they are not trimmed or shifted into the spine.",
  4: "Extra artwork beyond the trim on the top, bottom, and outside edges.",
  5: "Minimum 0.125 in inset from the trim line for cover text. Safe area and margin share the same inner dashed line.",
  6: "Spine width and trim height.",
  7: "Keep spine text inside this area, with clearance from each spine fold.",
  8: "At least 0.0625 in / 1.6 mm from each edge of the spine.",
  9: "Keep this region clear. Official KDP templates use a 0.25 in barcode margin around a 2.000 x 1.200 in barcode.",
};

export function ResultsPanel({
  dimensions,
  trimName,
  pageTurnLabel,
}: {
  dimensions: PaperbackCoverDimensions;
  trimName: string;
  pageTurnLabel: string;
}) {
  const unit = dimensions.unit;
  const inches = (value: number) => unitToInches(value, unit);
  const copyText = formatCoverDimensionsCopy(dimensions, {
    trimName,
    pageTurn: pageTurnLabel,
  });

  const fullCover = formatPair(
    inches(dimensions.fullCoverWidth),
    inches(dimensions.fullCoverHeight),
    unit,
  );
  const spine = formatPair(
    inches(dimensions.spineWidth),
    inches(dimensions.spineHeight),
    unit,
  );

  const rest = [
    {
      n: 2,
      label: "Front Cover",
      value: formatPair(
        inches(dimensions.frontCoverWidth),
        inches(dimensions.frontCoverHeight),
        unit,
      ),
    },
    {
      n: 3,
      label: "Safe Area",
      value: formatPair(
        inches(dimensions.safeArea.width),
        inches(dimensions.safeArea.height),
        unit,
      ),
    },
    {
      n: 4,
      label: "Bleed",
      value: formatPair(inches(dimensions.bleed), inches(dimensions.bleed), unit),
    },
    {
      n: 5,
      label: "Margin",
      value: formatPair(inches(dimensions.margin), inches(dimensions.margin), unit),
    },
    {
      n: 7,
      label: "Spine Safe Area",
      value: formatPair(
        inches(dimensions.spineSafeAreaWidth),
        inches(dimensions.spineSafeAreaHeight),
        unit,
      ),
    },
    {
      n: 8,
      label: "Spine Margin",
      value: formatPair(
        inches(dimensions.spineMargin),
        inches(dimensions.spineMargin),
        unit,
      ),
    },
    {
      n: 9,
      label: "Barcode Margin",
      value: formatPair(
        inches(dimensions.barcodeMargin),
        inches(dimensions.barcodeMargin),
        unit,
      ),
    },
  ];

  return (
    <section
      aria-live="polite"
      className="surface-raised rounded-[var(--radius-md)] border border-border bg-surface p-5"
      id="results"
    >
      <div className="flex items-start justify-between gap-3">
        <h2 className="font-serif text-xl">Cover dimensions</h2>
        <CopyButton label="Copy Dimensions" value={copyText} />
      </div>
      <p className="mt-1 text-sm text-muted">
        Numbers match the diagram markers. Copy any value individually.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <HighlightCard hint={HINTS[1]} label="Full cover" n={1} value={fullCover} />
        <HighlightCard hint={HINTS[6]} label="Spine" n={6} value={spine} />
      </div>
      <ul className="mt-4 grid gap-2 sm:grid-cols-2">
        {rest.map((row) => (
          <li
            className="flex items-start justify-between gap-3 rounded-[var(--radius-sm)] border border-border px-3 py-2.5"
            key={row.n}
            title={HINTS[row.n]}
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                {row.n}. {row.label}
              </p>
              <p className="mt-1 font-mono text-sm">{row.value}</p>
              <span className="sr-only">{HINTS[row.n]}</span>
            </div>
            <CopyButton value={row.value} />
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-muted">
        Barcode size on the downloadable template is 2.000 x 1.200 in, matching
        the official KDP cover calculator template.
      </p>
      <div
        className={`mt-4 rounded-[var(--radius-sm)] border p-3 text-sm ${
          dimensions.spineTextEligible
            ? "border-success/30 bg-success/5"
            : "border-warning/30 bg-warning/5"
        }`}
      >
        <p className="font-semibold">
          {dimensions.spineTextEligible
            ? "Spine text is eligible for this page count."
            : "Spine text is not available for this page count."}
        </p>
        <p className="mt-1 text-muted">{SPINE_TEXT_GUIDANCE}</p>
        <p className="mt-1 text-muted">{SPINE_TEXT_CLEARANCE_GUIDANCE}</p>
      </div>
    </section>
  );
}

function HighlightCard({
  n,
  label,
  value,
  hint,
}: {
  n: number;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-[var(--radius-md)] border border-border bg-paper-deep/40 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            {n}. {label}
          </p>
          <p className="mt-2 font-serif text-2xl tracking-tight sm:text-3xl">
            {value}
          </p>
          <p className="mt-2 text-xs text-muted">{hint}</p>
        </div>
        <CopyButton value={value} />
      </div>
    </div>
  );
}
