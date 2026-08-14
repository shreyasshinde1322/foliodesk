import type { Metadata } from "next";
import Link from "next/link";
import {
  KDP_SPEC_VERSION,
  PAPERBACK_BLEED_INCHES,
  SPINE_COEFFICIENTS_INCHES,
} from "@/data/kdp/specifications";
import { ContentPage, legalMetadata } from "@/components/layout/ContentPage";

export const metadata: Metadata = legalMetadata(
  "How to prepare a KDP paperback cover",
  "Trim size, spine width, bleed, and how the FolioDesk calculator builds a wrap template.",
);

export default function KdpGuidePage() {
  const cream = SPINE_COEFFICIENTS_INCHES.black_and_white.cream;
  return (
    <ContentPage title="How to prepare a KDP paperback cover">
      <p>
        A paperback wrap is one file: back cover, spine, front cover, plus
        bleed. Use the{" "}
        <Link href="/kdp-cover-calculator">KDP Cover Calculator</Link> to size
        that file from trim, paper, and page count.
      </p>
      <h2>Trim size</h2>
      <p>
        Trim is the finished book after cutting. Front and back each match that
        width and height. Choose a size from the current KDP paperback list in
        the calculator.
      </p>
      <h2 id="spine">How KDP spine width is calculated</h2>
      <p>
        Spine width in inches is page count × the published coefficient for that
        interior and paper. Example: black-and-white cream paper uses {cream} in
        per page. There is no extra 0.06 in added on top of that product in this
        implementation. Spec version {KDP_SPEC_VERSION}.
      </p>
      <h2>Bleed and wrap</h2>
      <p>
        Paperback cover bleed is {PAPERBACK_BLEED_INCHES} in on the top, bottom,
        and outside edges. Full width is bleed + back + spine + front + bleed.
        Full height is bleed + trim height + bleed.
      </p>
      <h2>Template</h2>
      <p>
        Download SVG, PDF, or PNG from the same numbers. Keep text inside the
        safe area, leave the barcode box clear, and verify the file in KDP.
      </p>
    </ContentPage>
  );
}
