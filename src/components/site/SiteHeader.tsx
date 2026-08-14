"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookMarked, ChevronDown, Menu, Search, X } from "lucide-react";
import {
  CATEGORY_META,
  CATEGORY_NAV,
  getGroupedTools,
} from "@/data/tools/registry";
import { GlobalSearch } from "@/components/site/GlobalSearch";
import { MegaMenu } from "@/components/site/MegaMenu";
import { ToolVisual } from "@/components/icons/ToolVisual";
import type { ToolCategory } from "@/types/tools";

export function SiteHeader() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [expanded, setExpanded] = useState<ToolCategory | null>(null);
  const [seenPath, setSeenPath] = useState(pathname);
  if (pathname !== seenPath) {
    setSeenPath(pathname);
    setMobileOpen(false);
    setSearchOpen(false);
    setExpanded(null);
  }

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <header className="sticky top-0 z-50 overflow-visible border-b border-border bg-white">
      <div className="relative mx-auto grid h-14 max-w-6xl grid-cols-[auto_1fr_auto] items-center gap-6 px-4 sm:px-6">
        <Link
          className="flex shrink-0 items-center gap-2 text-[15px] font-semibold tracking-tight text-text"
          href="/"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-white">
            <BookMarked aria-hidden="true" className="h-3.5 w-3.5" />
          </span>
          FolioDesk
        </Link>
        <nav aria-label="Primary" className="hidden min-w-0 justify-center overflow-visible lg:flex">
          <MegaMenu />
        </nav>
        <div className="flex items-center justify-end gap-2">
          <div className="hidden w-[11.5rem] md:block lg:w-[13rem]">
            <GlobalSearch />
          </div>
          <button
            aria-label="Search tools"
            className="rounded-[var(--radius-sm)] p-2 text-muted hover:bg-paper-deep hover:text-text md:hidden"
            onClick={() => {
              setSearchOpen((value) => !value);
              setMobileOpen(false);
            }}
            type="button"
          >
            <Search className="h-5 w-5" />
          </button>
          <Link
            className="hidden px-2 text-[13px] font-medium text-muted hover:text-text lg:inline"
            href="/about"
          >
            About
          </Link>
          <button
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            className="rounded-[var(--radius-sm)] p-2 text-muted hover:bg-paper-deep hover:text-text lg:hidden"
            onClick={() => {
              setMobileOpen((value) => !value);
              setSearchOpen(false);
            }}
            type="button"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
      {searchOpen ? (
        <div className="border-t border-border px-4 py-3 md:hidden">
          <GlobalSearch autoFocus variant="hero" />
        </div>
      ) : null}
      {mobileOpen ? (
        <div className="max-h-[calc(100dvh-3.5rem)] overflow-auto border-t border-[#e5e7eb] bg-white lg:hidden">
          <nav aria-label="Mobile" className="px-4 py-3">
            {CATEGORY_NAV.map((item) => {
              const isOpen = expanded === item.category;
              const groups = getGroupedTools(item.category);
              return (
                <div className="border-b border-border py-2" key={item.category}>
                  <button
                    aria-expanded={isOpen}
                    className="flex w-full items-center justify-between py-2 text-left text-base font-medium"
                    onClick={() =>
                      setExpanded((current) =>
                        current === item.category ? null : item.category,
                      )
                    }
                    type="button"
                  >
                    {item.shortLabel}
                    <ChevronDown
                      aria-hidden="true"
                      className={`h-4 w-4 text-muted transition-transform ${isOpen ? "rotate-180" : ""}`}
                    />
                  </button>
                  {isOpen ? (
                    <div className="pb-3">
                      {groups.map((group) => (
                        <div className="mt-3" key={group.id}>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
                            {group.label}
                          </p>
                          <ul className="mt-1">
                            {group.tools.map((tool) => (
                              <li key={tool.slug}>
                                <Link
                                  className="flex items-center gap-3 rounded-md py-2.5 text-sm"
                                  href={tool.route}
                                >
                                  <ToolVisual size="sm" tool={tool} />
                                  {tool.name}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                      <Link
                        className="mt-2 inline-block text-sm font-semibold text-primary"
                        href={CATEGORY_META[item.category].href}
                      >
                        View all →
                      </Link>
                    </div>
                  ) : null}
                </div>
              );
            })}
            <Link className="block py-3 text-base" href="/about">
              About
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
