"use client";

import { unitToInches } from "@/lib/kdp/unit-conversion";
import type { CoverPanel, PaperbackCoverDimensions } from "@/lib/kdp/types";

export function CoverDiagram({
  dimensions,
  zoom = 1,
}: {
  dimensions: PaperbackCoverDimensions;
  zoom?: number;
}) {
  const unit = dimensions.unit;
  const fullW = unitToInches(dimensions.fullCoverWidth, unit);
  const fullH = unitToInches(dimensions.fullCoverHeight, unit);
  const bleed = unitToInches(dimensions.bleed, unit);
  const spineW = unitToInches(dimensions.spineWidth, unit);
  const trimW = unitToInches(dimensions.trimWidth, unit);
  const trimH = unitToInches(dimensions.trimHeight, unit);
  const live = unitToInches(dimensions.safeArea.kdpMinimumFromTrim, unit);
  const spineClear = unitToInches(dimensions.safeArea.spineClearance, unit);
  const barcodeW = unitToInches(dimensions.barcodeArea.width, unit);
  const barcodeH = unitToInches(dimensions.barcodeArea.height, unit);
  const barcodeM = unitToInches(dimensions.barcodeArea.margin, unit);

  const minVisualSpine = fullW * 0.04;
  const visualSpine = Math.max(spineW, minVisualSpine);
  const notToScale = visualSpine > spineW + 0.0001;
  const visualFullW = fullW - spineW + visualSpine;
  const spineScale = visualSpine / spineW;

  const leftW = dimensions.layout.left === "spine" ? visualSpine : trimW;
  const panels: Array<{ panel: CoverPanel; x: number; width: number }> = [
    { panel: dimensions.layout.left, x: bleed, width: leftW },
    { panel: "spine", x: bleed + leftW, width: visualSpine },
    {
      panel: dimensions.layout.right,
      x: bleed + leftW + visualSpine,
      width: trimW,
    },
  ];
  const back = panels.find((panel) => panel.panel === "back");
  const front = panels.find((panel) => panel.panel === "front");
  const spine = panels.find((panel) => panel.panel === "spine");
  const nearSpine = Boolean(back && back.x > bleed);
  const bW = Math.min(barcodeW, (back?.width ?? trimW) - barcodeM * 2);
  const bH = Math.min(barcodeH, trimH - barcodeM * 2);
  const barcodeX = back
    ? nearSpine
      ? back.x + barcodeM
      : back.x + back.width - barcodeM - bW
    : 0;
  const barcodeY = bleed + trimH - barcodeM - bH;

  const padX = 0.55;
  const padY = 0.7;
  const viewW = visualFullW + padX * 2;
  const viewH = fullH + padY * 2;

  return (
    <section className="rounded-[var(--radius-md)] border border-border bg-surface p-5 shadow-[var(--shadow-subtle)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-serif text-xl">Cover template preview</h2>
          <p className="text-sm text-muted">
            Numbers match the dimension tables. Safe area and margin share the
            same inner dashed boundary.{" "}
            {notToScale
              ? "Visual preview — spine widened for readability, not to scale."
              : "Proportions follow the calculated wrap."}
          </p>
        </div>
        <Legend />
      </div>
      <div className="mt-4 overflow-x-auto bg-[#ececec] p-2">
        <div
          className="origin-top-left"
          style={{ transform: `scale(${zoom})`, width: `${100 / zoom}%` }}
        >
        <svg
          aria-labelledby="diagramTitle"
          className="min-w-[42rem] w-full bg-white"
          role="img"
          viewBox={`${-padX} ${-padY} ${viewW} ${viewH}`}
        >
          <title id="diagramTitle">Numbered paperback wrap diagram</title>
          <rect fill="#f3b6ae" height={fullH} width={visualFullW} x="0" y="0" />
          {panels.map((panel) => {
            const insetX = panel.panel === "spine" ? spineClear * spineScale : live;
            return (
              <rect
                fill="#ffffff"
                height={Math.max(trimH - live * 2, 0)}
                key={`live-${panel.panel}`}
                width={Math.max(panel.width - insetX * 2, 0)}
                x={panel.x + insetX}
                y={bleed + live}
              />
            );
          })}
          <rect
            fill="none"
            height={fullH}
            stroke="#111"
            strokeDasharray="0.07 0.05"
            strokeWidth="0.02"
            width={visualFullW}
            x="0"
            y="0"
          />
          <rect
            fill="none"
            height={trimH}
            stroke="#111"
            strokeWidth="0.028"
            width={visualFullW - bleed * 2}
            x={bleed}
            y={bleed}
          />
          {panels.map((panel) => {
            const insetX = panel.panel === "spine" ? spineClear * spineScale : live;
            return (
              <rect
                fill="none"
                height={Math.max(trimH - live * 2, 0)}
                key={`safe-${panel.panel}`}
                stroke="#111"
                strokeDasharray="0.08 0.05"
                strokeWidth="0.016"
                width={Math.max(panel.width - insetX * 2, 0)}
                x={panel.x + insetX}
                y={bleed + live}
              />
            );
          })}
          {spine ? (
            <>
              <line
                stroke="#1d4ed8"
                strokeDasharray="0.08 0.05"
                strokeWidth="0.02"
                x1={spine.x}
                x2={spine.x}
                y1={bleed}
                y2={bleed + trimH}
              />
              <line
                stroke="#1d4ed8"
                strokeDasharray="0.08 0.05"
                strokeWidth="0.02"
                x1={spine.x + spine.width}
                x2={spine.x + spine.width}
                y1={bleed}
                y2={bleed + trimH}
              />
            </>
          ) : null}
          <rect
            fill="#f5d76e"
            height={bH}
            stroke="#111"
            strokeWidth="0.015"
            width={bW}
            x={barcodeX}
            y={barcodeY}
          />
          <BarcodeIcon x={barcodeX + bW * 0.18} y={barcodeY + bH * 0.28} />

          <Marker n={1} x={visualFullW + 0.22} y={fullH / 2} />
          {front ? (
            <Marker n={2} x={front.x + front.width - 0.28} y={bleed + 0.35} />
          ) : null}
          {front ? (
            <Marker
              n={3}
              x={front.x + front.width / 2}
              y={bleed + live + 0.28}
            />
          ) : null}
          <Marker n={4} x={visualFullW - 0.18} y={bleed / 2} />
          {front ? (
            <Marker n={5} x={front.x + 0.32} y={bleed + live + 0.28} />
          ) : null}
          {spine ? (
            <Marker n={6} x={spine.x + spine.width / 2} y={bleed + 0.45} />
          ) : null}
          {spine ? (
            <Marker
              n={7}
              x={spine.x + spine.width / 2}
              y={bleed + trimH / 2}
            />
          ) : null}
          {spine ? (
            <Marker
              n={8}
              x={spine.x + spine.width + 0.2}
              y={bleed + trimH / 2}
            />
          ) : null}
          <Marker n={9} x={barcodeX + bW + 0.18} y={barcodeY + bH / 2} />

          {back ? (
            <text
              fill="#444"
              fontSize="0.2"
              textAnchor="middle"
              x={back.x + back.width / 2}
              y={bleed + trimH / 2}
            >
              BACK COVER
            </text>
          ) : null}
          {front ? (
            <text
              fill="#444"
              fontSize="0.2"
              textAnchor="middle"
              x={front.x + front.width / 2}
              y={bleed + trimH / 2 + 0.5}
            >
              FRONT COVER
            </text>
          ) : null}
        </svg>
        </div>
      </div>
    </section>
  );
}

function Marker({ n, x, y }: { n: number; x: number; y: number }) {
  return (
    <g>
      <circle cx={x} cy={y} fill="#111" r="0.16" />
      <text
        fill="#fff"
        fontFamily="var(--font-source-sans), sans-serif"
        fontSize="0.15"
        fontWeight="700"
        textAnchor="middle"
        x={x}
        y={y + 0.05}
      >
        {n}
      </text>
    </g>
  );
}

function BarcodeIcon({ x, y }: { x: number; y: number }) {
  const bars = [0.04, 0.02, 0.05, 0.02, 0.03, 0.06, 0.02, 0.04, 0.03];
  let offset = 0;
  return (
    <g>
      {bars.map((width, index) => {
        const rect = (
          <rect
            fill="#111"
            height="0.42"
            key={index}
            width={width}
            x={x + offset}
            y={y}
          />
        );
        offset += width + 0.025;
        return rect;
      })}
    </g>
  );
}

function Legend() {
  return (
    <ul className="grid gap-1 text-xs text-muted">
      <li className="flex items-center gap-2">
        <span aria-hidden="true" className="h-3 w-5 bg-[#f3b6ae] ring-1 ring-ink/40" />
        Bleed / out of live
      </li>
      <li className="flex items-center gap-2">
        <span aria-hidden="true" className="h-3 w-5 border-2 border-ink bg-white" />
        Trim (solid)
      </li>
      <li className="flex items-center gap-2">
        <span aria-hidden="true" className="h-3 w-5 border border-dashed border-ink bg-white" />
        Safe area / margin (one dashed line)
      </li>
      <li className="flex items-center gap-2">
        <span aria-hidden="true" className="h-3 w-5 bg-[#f5d76e] ring-1 ring-ink/40" />
        Barcode
      </li>
    </ul>
  );
}
