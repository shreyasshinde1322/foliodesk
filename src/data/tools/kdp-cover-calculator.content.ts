import { getToolBySlug } from "@/data/tools/registry";
import type { ToolDefinition } from "@/types/tools";

const tool = getToolBySlug("kdp-cover-calculator") as ToolDefinition;

export const KDP_COVER_CALCULATOR_CONTENT = {
  tool,
  eyebrow: "KDP Tools",
  heading: "KDP Cover Calculator",
  lede: "Calculate accurate cover, spine and full-wrap dimensions for your selected KDP configuration.",
  intro:
    "Enter trim size, interior, paper, and page count to get spine width, bleed, and full wrap size. Templates are generated in the browser from those same numbers. Hardcover uses the same tool when those specifications are implemented.",
  features: [
    {
      title: "Published paperback formulas",
      body: "Spine width uses KDP page-count coefficients. Bleed, wrap size, and barcode box follow the same published paperback guidance this project documents.",
    },
    {
      title: "Numbered wrap preview",
      body: "Front, back, spine, bleed, trim, and safe zones are labeled so you can match measurements to the diagram.",
    },
    {
      title: "Template export",
      body: "Download SVG for editing, PDF for print reference, or PNG for a quick check. All three use the same wrap geometry.",
    },
    {
      title: "One unified tool",
      body: "Paperback is implemented here. Hardcover is a binding option in the same calculator, not a separate page.",
    },
  ],
  howItWorks: [
    {
      title: "Calculate",
      body: "Choose binding, interior, paper, trim, units, and page count.",
    },
    {
      title: "Format",
      body: "Read full wrap, spine, and safe-area sizes, then copy what you need.",
    },
    {
      title: "Preview",
      body: "Toggle bleed, safe area, barcode, and labels on the wrap diagram.",
    },
    {
      title: "Export",
      body: "Download SVG, PDF, or PNG and confirm the file in KDP before publishing.",
    },
  ],
  why: [
    {
      title: "Local processing",
      body: "Inputs stay in the browser. There is no manuscript upload and no account.",
    },
    {
      title: "Traceable math",
      body: "Coefficients and wrap formulas are shown on this page so you can check the result.",
    },
  ],
  privacy:
    "This tool is local processing: trim size, paper, and page count are calculated in your browser. Templates are generated on-device. FolioDesk does not receive your book files through this calculator.",
  faqs: [
    {
      question: "Does this replace the official KDP calculator?",
      answer:
        "No. Use it to plan a wrap file, then confirm the same configuration in KDP before you upload.",
    },
    {
      question: "Why is hardcover listed?",
      answer:
        "Hardcover belongs in this same tool. Paperback measurements are live; hardcover stays marked coming soon until published hardcover specs are implemented.",
    },
    {
      question: "Which template format should I download?",
      answer:
        "SVG is best for vector design software, PDF is best for printing or placing as a guide, and PNG is best for a quick visual check.",
    },
  ],
};
