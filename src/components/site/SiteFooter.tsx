import type { ReactNode } from "react";
import Link from "next/link";
import {
  CATEGORY_NAV,
  getToolsBySlugs,
  QUICK_SEARCH_SLUGS,
} from "@/data/tools/registry";
import { KDP_SOURCES } from "@/lib/kdp/specifications";

export function SiteFooter() {
  const popular = getToolsBySlugs([...QUICK_SEARCH_SLUGS]);
  const year = new Date().getFullYear();

  return (
    <footer className="mt-20 border-t border-border bg-white/70 backdrop-blur-sm">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-2 lg:grid-cols-5">
        <FooterCol title="Product">
          {CATEGORY_NAV.map((item) => (
            <Link href={item.href} key={item.href}>
              {item.category === "privacy" ? "Privacy" : item.label.replace(" & Media", "")}
            </Link>
          ))}
        </FooterCol>
        <FooterCol title="Popular tools">
          {popular.map((tool) => (
            <Link href={tool.route} key={tool.slug}>
              {tool.name}
            </Link>
          ))}
        </FooterCol>
        <FooterCol title="Resources">
          <Link href="/help">Help</Link>
          <Link href="/faq">FAQ</Link>
          <Link href="/guides">Guides</Link>
          <Link href="/whats-new">What&apos;s New</Link>
        </FooterCol>
        <FooterCol title="Company">
          <Link href="/about">About</Link>
          <Link href="/contact">Contact</Link>
          <Link href="/feedback">Feedback</Link>
        </FooterCol>
        <FooterCol title="Legal">
          <Link href="/privacy">Privacy Policy</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/cookies">Cookie Policy</Link>
          <Link href="/disclaimer">Disclaimer</Link>
          <Link href="/acceptable-use">Acceptable Use</Link>
          <Link href="/dmca">DMCA</Link>
        </FooterCol>
      </div>
      <div className="border-t border-border">
        <div className="mx-auto max-w-6xl space-y-2 px-4 py-6 text-xs leading-relaxed text-muted sm:px-6">
          <p>© {year} FolioDesk. All rights reserved.</p>
          <p>
            FolioDesk is an independent toolkit and is not affiliated with or
            endorsed by Amazon. Amazon, Kindle, and KDP are trademarks of their
            respective owners. Always verify print files in{" "}
            <a
              className="underline underline-offset-2 transition-colors hover:text-primary"
              href={KDP_SOURCES.coverCalculator}
              rel="noreferrer"
              target="_blank"
            >
              KDP
            </a>{" "}
            before publishing.
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
        {title}
      </p>
      <div className="mt-3 grid gap-2 text-sm text-text [&_a]:hover:text-primary">
        {children}
      </div>
    </div>
  );
}
