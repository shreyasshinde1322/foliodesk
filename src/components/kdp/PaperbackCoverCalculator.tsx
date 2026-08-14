"use client";

import { useMemo, useState } from "react";
import { CalculatorForm } from "@/components/kdp/CalculatorForm";
import { CoverDiagram } from "@/components/kdp/CoverDiagram";
import { ResultsPanel } from "@/components/kdp/ResultsPanel";
import { SourceNotice } from "@/components/kdp/SourceNotice";
import { TemplateControls } from "@/components/kdp/TemplateControls";
import { tryCalculateCoverDimensions } from "@/engines/kdp/cover-calculator";
import {
  downloadBlob,
  generateCoverTemplatePdf,
  generateCoverTemplatePng,
  generateCoverTemplateSvg,
  templateFilename,
} from "@/engines/kdp/template";
import { DEFAULT_TRIM_ID, getTrimSizeById } from "@/data/kdp/specifications";
import type { TemplateOptions } from "@/types/kdp";
import {
  validateCoverForm,
  type FormInput,
} from "@/engines/kdp/validate-cover";

const DEFAULT_FORM: FormInput = {
  bindingType: "paperback",
  interiorType: "black_and_white",
  paperType: "cream",
  pageCountRaw: "250",
  trimId: DEFAULT_TRIM_ID,
  pageTurnDirection: "ltr",
  units: "in",
};

const DEFAULT_TEMPLATE: TemplateOptions = {
  showMeasurements: true,
  showLabels: true,
  showBleed: true,
  showSafeArea: true,
  showBarcodeArea: true,
};

export function CoverCalculator() {
  const [form, setForm] = useState<FormInput>(DEFAULT_FORM);
  const [template, setTemplate] = useState<TemplateOptions>(DEFAULT_TEMPLATE);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);

  const issues = useMemo(() => validateCoverForm(form), [form]);
  const trim = getTrimSizeById(form.trimId);
  const pageCount = Number.parseInt(form.pageCountRaw.trim(), 10);

  const calculation = useMemo(() => {
    if (issues.length > 0 || !trim || !Number.isInteger(pageCount)) {
      return null;
    }
    const result = tryCalculateCoverDimensions({
      trimWidth: trim.widthInches,
      trimHeight: trim.heightInches,
      pageCount,
      interiorType: form.interiorType,
      paperType: form.paperType,
      units: form.units,
      pageTurnDirection: form.pageTurnDirection,
      bindingType: form.bindingType,
    });
    return result.ok ? result.value : null;
  }, [form, issues.length, pageCount, trim]);

  function scrollToResults() {
    document.getElementById("results")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  async function download(kind: "svg" | "png" | "pdf") {
    if (!calculation || !trim) {
      setDownloadError("Enter valid book specifications before downloading a template.");
      return;
    }
    setDownloadError(null);
    const name = templateFilename(
      trim.id,
      calculation.pageCount,
      calculation.paperType,
      kind,
    );
    try {
      if (kind === "svg") {
        const svg = generateCoverTemplateSvg(calculation, template);
        downloadBlob(
          new Blob([svg], { type: "image/svg+xml;charset=utf-8" }),
          name,
        );
        return;
      }
      if (kind === "pdf") {
        const pdf = generateCoverTemplatePdf(calculation, template);
        downloadBlob(
          new Blob([pdf.slice()], {
            type: "application/pdf",
          }),
          name,
        );
        return;
      }
      const png = await generateCoverTemplatePng(calculation, template);
      downloadBlob(png, name);
    } catch {
      setDownloadError("The template could not be generated in this browser.");
    }
  }

  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(18rem,22rem)_1fr] lg:items-start">
      <CalculatorForm
        canDownload={Boolean(calculation)}
        issues={issues}
        onCalculate={scrollToResults}
        onChange={setForm}
        onDownload={() => void download("png")}
        value={form}
      />
      <div className="grid gap-6">
        {calculation ? (
          <>
            <ResultsPanel
              dimensions={calculation}
              pageTurnLabel={
                form.pageTurnDirection === "ltr"
                  ? "Left to Right"
                  : "Right to Left"
              }
              trimName={trim?.displayName ?? ""}
            />
              <CoverDiagram dimensions={calculation} zoom={zoom} />
            <TemplateControls
              dimensions={calculation}
              disabled={false}
              onChange={setTemplate}
              onDownloadPdf={() => void download("pdf")}
              onDownloadPng={() => void download("png")}
              onDownloadSvg={() => void download("svg")}
              onZoom={setZoom}
              options={template}
              zoom={zoom}
            />
          </>
        ) : (
          <div className="rounded-[var(--radius-md)] border border-dashed border-border bg-surface p-6">
            <h2 className="font-serif text-xl">Results unavailable</h2>
            <p className="mt-2 text-sm text-muted">
              Fix the highlighted fields to calculate cover dimensions. Invalid
              combinations are not used to generate a template.
            </p>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-error">
              {issues
                .filter((issue) => issue.field !== "paperTypeReason")
                .map((issue) => (
                  <li key={`${issue.field}-${issue.message}`}>{issue.message}</li>
                ))}
            </ul>
          </div>
        )}
        {downloadError ? (
          <p className="text-sm text-error" role="alert">
            {downloadError}
          </p>
        ) : null}
        <SourceNotice />
      </div>
    </div>
  );
}

export const PaperbackCoverCalculator = CoverCalculator;
