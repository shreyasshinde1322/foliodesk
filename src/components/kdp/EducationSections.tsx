import {
  KDP_SPEC_VERSION,
  PAPERBACK_BLEED_INCHES,
  SPINE_COEFFICIENTS_INCHES,
} from "@/lib/kdp/specifications";

    export function HowToSection() {
  return (
    <section className="mt-4">
      <h2 className="font-serif text-3xl">
        How to calculate your KDP paperback cover size
      </h2>
      <p className="mt-3 max-w-3xl text-muted">
        A paperback wrap cover is one file: back cover, spine, and front cover,
        plus bleed. The trim size is the finished book after printing. The spine
        grows with page count and paper thickness. Bleed is extra artwork that
        gets trimmed so color can reach the edge.
      </p>
      <ol className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
        {[
          "Select paperback binding, interior type, paper, trim size, and page-turn direction.",
          "Enter the page count of your formatted interior PDF.",
          "The tool multiplies page count by the KDP spine coefficient for that interior and paper.",
          "Bleed of 0.125 in is added on the top, bottom, and outside edges.",
          "Full cover width is bleed + back + spine + front + bleed. Height is bleed + trim height + bleed.",
          "Download the SVG, PNG, or PDF template and use it as a guide layer in your design software.",
          "Keep important text inside the safe area, and confirm the final PDF in KDP before publishing.",
        ].map((step, index) => (
          <li
            className="rounded-lg border border-line bg-panel p-4"
            key={step}
          >
            <span className="text-xs font-semibold uppercase tracking-wide text-accent">
              Step {index + 1}
            </span>
            <p className="mt-1">{step}</p>
          </li>
        ))}
      </ol>
      <dl className="mt-8 grid gap-4 sm:grid-cols-2">
        <Term
          name="Trim size"
          definition="The width and height of the finished book after it is trimmed. Front and back covers each match this size."
        />
        <Term
          name="Spine width"
          definition="The thickness of the bound book, calculated from page count and the published paper coefficient. It sits between the back and front covers."
        />
        <Term
          name="Bleed"
          definition={`Extra artwork beyond the trim. Current KDP paperback cover guidance uses ${PAPERBACK_BLEED_INCHES} in (3.2 mm) on the top, bottom, and outside edges.`}
        />
        <Term
          name="Safe area"
          definition="The live area inside the trim, inset 0.125 in. Keep text here. On the diagram, safe area and margin share one inner dashed line — the second unlabeled dotted line was removed."
        />
        <Term
          name="Full cover dimensions"
          definition="The complete wrap file size you should set in your design document, including both outside bleeds, both covers, and the spine."
        />
      </dl>
    </section>
  );
}

export function FormulaSection() {
  const bw = SPINE_COEFFICIENTS_INCHES.black_and_white;
  const premium = SPINE_COEFFICIENTS_INCHES.premium_color.white;
  const standard = SPINE_COEFFICIENTS_INCHES.standard_color.white;

  return (
    <section className="mt-16">
      <h2 className="font-serif text-3xl">How the calculation works</h2>
      <p className="mt-3 max-w-3xl text-muted">
        Calculations run in the browser using inches internally, then convert
        for display. Spec version {KDP_SPEC_VERSION}.
      </p>
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <FormulaCard title="Spine Width">
          Page Count × KDP Spine Coefficient
        </FormulaCard>
        <FormulaCard title="Full Cover Width">
          Bleed + Back Cover + Spine + Front Cover + Bleed
        </FormulaCard>
        <FormulaCard title="Full Cover Height">
          Bleed + Trim Height + Bleed
        </FormulaCard>
      </div>
      <div className="mt-6 overflow-x-auto rounded-xl border border-line bg-panel">
        <table className="min-w-full text-left text-sm">
          <caption className="sr-only">
            KDP paperback spine coefficients in inches per page
          </caption>
          <thead className="bg-paper-deep text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Interior</th>
              <th className="px-4 py-3 font-medium">Paper</th>
              <th className="px-4 py-3 font-medium">Coefficient (in/page)</th>
            </tr>
          </thead>
          <tbody>
            <Row interior="Black & White" paper="White" value={bw.white} />
            <Row interior="Black & White" paper="Cream" value={bw.cream} />
            <Row
              interior="Black & White"
              paper="Groundwood"
              value={bw.groundwood}
            />
            <Row interior="Premium Color" paper="White" value={premium} />
            <Row interior="Standard Color" paper="White" value={standard} />
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Term({ name, definition }: { name: string; definition: string }) {
  return (
    <div className="rounded-lg border border-line bg-panel p-4">
      <dt className="font-semibold">{name}</dt>
      <dd className="mt-1 text-sm text-muted">{definition}</dd>
    </div>
  );
}

function FormulaCard({
  title,
  children,
}: {
  title: string;
  children: string;
}) {
  return (
    <div className="rounded-xl border border-line bg-panel p-5">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted">
        {title}
      </h3>
      <p className="mt-3 font-serif text-xl leading-snug">{children}</p>
    </div>
  );
}

function Row({
  interior,
  paper,
  value,
}: {
  interior: string;
  paper: string;
  value: number | undefined;
}) {
  return (
    <tr className="border-t border-line">
      <td className="px-4 py-3">{interior}</td>
      <td className="px-4 py-3">{paper}</td>
      <td className="px-4 py-3 font-mono">{value ?? "—"}</td>
    </tr>
  );
}
