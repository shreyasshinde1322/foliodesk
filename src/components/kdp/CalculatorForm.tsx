"use client";

import { Field } from "@/components/forms/Field";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import {
  getPageCountRange,
  isPaperAvailable,
  PAPERBACK_TRIM_SIZES,
  PAPER_UNAVAILABLE_REASON,
} from "@/data/kdp/specifications";
import { papersFor } from "@/engines/kdp/binding-profiles";
import type { FormInput } from "@/engines/kdp/validate-cover";
import type {
  InteriorType,
  PageTurnDirection,
  PaperType,
  ValidationIssue,
} from "@/lib/kdp/types";

const fieldClass =
  "mt-1 w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-text shadow-[var(--shadow-subtle)] transition-[border-color,box-shadow] focus:border-primary focus:shadow-[0_0_0_3px_rgba(79,70,229,0.12)] disabled:cursor-not-allowed disabled:bg-paper-deep disabled:text-muted";

export function CalculatorForm({
  value,
  onChange,
  issues,
  onCalculate,
  onDownload,
  canDownload,
}: {
  value: FormInput;
  onChange: (next: FormInput) => void;
  issues: ValidationIssue[];
  onCalculate: () => void;
  onDownload: () => void;
  canDownload: boolean;
}) {
  const range = getPageCountRange(
    value.trimId,
    value.interiorType,
    value.paperType,
  );
  const pageError = issues.find((issue) => issue.field === "pageCount");
  const rangeHint = issues.find((issue) => issue.field === "pageCountRange");
  const bindingError = issues.find((issue) => issue.field === "bindingType");
  const trimError = issues.find((issue) => issue.field === "trimSize");

  function set<K extends keyof FormInput>(key: K, next: FormInput[K]) {
    const updated = { ...value, [key]: next };
    if (key === "interiorType" || key === "bindingType") {
      const interior =
        key === "interiorType" ? (next as InteriorType) : updated.interiorType;
      if (!papersFor(updated.bindingType, interior).includes(updated.paperType)) {
        updated.paperType = "white";
      }
    }
    onChange(updated);
  }

  return (
    <form
      className="surface-raised rounded-2xl border border-border bg-white p-5"
      onSubmit={(event) => {
        event.preventDefault();
        onCalculate();
      }}
    >
      <h2 className="font-serif text-xl">Enter Your Book Information</h2>
      <div className="mt-4 grid gap-4">
        <Field
          error={bindingError?.message}
          htmlFor="bindingType"
          label="Binding type"
        >
          <SegmentedControl
            labelledBy="bindingType"
            name="bindingType"
            onChange={(next) => set("bindingType", next)}
            options={[
              { value: "paperback" as const, label: "Paperback" },
              {
                value: "hardcover" as const,
                label: "Hardcover",
                hint: "Coming soon",
              },
            ]}
            value={value.bindingType}
          />
          {value.bindingType === "hardcover" ? (
            <p className="mt-2 text-sm text-warning">
              Hardcover measurements are not implemented yet. Switch to
              paperback to calculate wrap dimensions.
            </p>
          ) : null}
        </Field>

        <Field label="Interior type" htmlFor="interiorType">
          <select
            className={fieldClass}
            id="interiorType"
            onChange={(event) =>
              set("interiorType", event.target.value as InteriorType)
            }
            value={value.interiorType}
          >
            <option value="black_and_white">Black & White</option>
            <option value="standard_color">Standard Color</option>
            <option value="premium_color">Premium Color</option>
          </select>
        </Field>

        <Field label="Paper type" htmlFor="paperType">
          <select
            className={fieldClass}
            id="paperType"
            onChange={(event) =>
              set("paperType", event.target.value as PaperType)
            }
            value={value.paperType}
          >
            {(["white", "cream", "groundwood"] as PaperType[]).map((paper) => {
              const available = isPaperAvailable(value.interiorType, paper);
              return (
                <option disabled={!available} key={paper} value={paper}>
                  {paper === "white"
                    ? "White paper"
                    : paper === "cream"
                      ? "Cream paper"
                      : "Groundwood paper"}
                  {available ? "" : " — not available for this interior"}
                </option>
              );
            })}
          </select>
          {!isPaperAvailable(value.interiorType, value.paperType) ? (
            <p className="mt-1 text-sm text-error">
              This paper type is not available for the selected interior.{" "}
              {PAPER_UNAVAILABLE_REASON[value.interiorType][value.paperType]}
            </p>
          ) : null}
        </Field>

        <Field label="Reading Direction" htmlFor="pageTurn">
          <select
            className={fieldClass}
            id="pageTurn"
            onChange={(event) =>
              set("pageTurnDirection", event.target.value as PageTurnDirection)
            }
            value={value.pageTurnDirection}
          >
            <option value="ltr">Left to Right</option>
            <option value="rtl">Right to Left</option>
          </select>
        </Field>

        <Field label="Measurement units" htmlFor="units">
          <SegmentedControl
            labelledBy="units"
            name="units"
            onChange={(next) => set("units", next)}
            options={[
              { value: "in" as const, label: "In" },
              { value: "mm" as const, label: "mm" },
              { value: "cm" as const, label: "cm" },
            ]}
            value={value.units}
          />
        </Field>

        <Field
          error={trimError?.message}
          htmlFor="trimSize"
          label="Interior trim size"
        >
          <select
            className={fieldClass}
            id="trimSize"
            onChange={(event) => set("trimId", event.target.value)}
            value={value.trimId}
          >
            <optgroup label="Common sizes">
              {PAPERBACK_TRIM_SIZES.filter((size) => size.group === "common").map(
                (size) => (
                  <option key={size.id} value={size.id}>
                    {size.displayName}
                    {size.orientation !== "portrait"
                      ? ` (${size.orientation})`
                      : ""}
                  </option>
                ),
              )}
            </optgroup>
            <optgroup label="Additional published sizes">
              {PAPERBACK_TRIM_SIZES.filter(
                (size) => size.group === "additional",
              ).map((size) => (
                <option key={size.id} value={size.id}>
                  {size.displayName}
                </option>
              ))}
            </optgroup>
          </select>
          <p className="mt-1 text-xs text-muted">
            Sizes listed in current KDP paperback submission guidelines. This is
            not a claim that the catalog can never change.
          </p>
        </Field>

        <Field
          error={pageError?.message}
          hint={
            rangeHint?.message ??
            (range
              ? `Supported range for this configuration: ${range.min}–${range.max} pages.`
              : undefined)
          }
          htmlFor="pageCount"
          label="Page count"
        >
          <input
            aria-invalid={Boolean(pageError)}
            autoComplete="off"
            className={fieldClass}
            id="pageCount"
            inputMode="numeric"
            onChange={(event) => set("pageCountRaw", event.target.value)}
            placeholder="250"
            value={value.pageCountRaw}
          />
        </Field>
      </div>

      <button
        className="btn-primary mt-5 w-full"
        type="submit"
      >
        Calculate dimensions
      </button>
      <button
        className="btn-secondary mt-2 w-full"
        disabled={!canDownload}
        onClick={onDownload}
        type="button"
      >
        Download Template
      </button>
    </form>
  );
}
