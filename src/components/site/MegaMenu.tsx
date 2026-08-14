"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import {
  CATEGORY_META,
  CATEGORY_NAV,
  getGroupedTools,
} from "@/data/tools/registry";
import { ToolVisual } from "@/components/icons/ToolVisual";
import type { ToolCategory } from "@/types/tools";

export function MegaMenu() {
  const pathname = usePathname();
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<number | null>(null);
  const [open, setOpen] = useState<ToolCategory | null>(null);
  const [seenPath, setSeenPath] = useState(pathname);
  if (pathname !== seenPath) {
    setSeenPath(pathname);
    setOpen(null);
  }

  function clearTimer() {
    if (closeTimer.current) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }

  function scheduleClose() {
    clearTimer();
    closeTimer.current = window.setTimeout(() => setOpen(null), 160);
  }

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(null);
    }
    function onClick(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(null);
      }
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, []);

  return (
    <div className="hidden lg:block" ref={rootRef}>
      <ul className="flex h-14 items-stretch gap-1" role="menubar">
        {CATEGORY_NAV.map((item, index) => {
          const isOpen = open === item.category;
          const active = pathname.startsWith(item.href);
          const groups = getGroupedTools(item.category);
          const meta = CATEGORY_META[item.category];
          const columns = Math.min(Math.max(groups.length, 1), 3);
          const align =
            index === 0 ? "left" : index === CATEGORY_NAV.length - 1 ? "right" : "center";

          return (
            <li
              className="relative flex"
              key={item.category}
              onMouseEnter={() => {
                clearTimer();
                setOpen(item.category);
              }}
              onMouseLeave={scheduleClose}
              role="none"
            >
              <button
                aria-controls={`${menuId}-${item.category}`}
                aria-expanded={isOpen}
                aria-haspopup="true"
                aria-label={item.label}
                className={`inline-flex items-center gap-1 whitespace-nowrap border-b-2 px-3 text-[13px] font-medium transition-colors ${
                  isOpen || active
                    ? "border-primary text-primary"
                    : "border-transparent text-muted hover:text-text"
                }`}
                onClick={() =>
                  setOpen((current) =>
                    current === item.category ? null : item.category,
                  )
                }
                onFocus={() => {
                  clearTimer();
                  setOpen(item.category);
                }}
                role="menuitem"
                type="button"
              >
                {item.shortLabel}
                <ChevronDown
                  aria-hidden="true"
                  className={`h-3.5 w-3.5 transition-transform ${isOpen ? "rotate-180" : ""}`}
                />
              </button>
              {isOpen ? (
                <div
                  className={`absolute top-full z-[80] pt-1.5 ${
                    align === "left"
                      ? "left-0"
                      : align === "right"
                        ? "right-0"
                        : "left-1/2 -translate-x-1/2"
                  }`}
                  id={`${menuId}-${item.category}`}
                  role="menu"
                >
                  <div className="relative w-max max-w-[min(92vw,40rem)] rounded-2xl border border-border bg-white p-4 shadow-[var(--shadow-elevated)] ring-1 ring-black/[0.02]">
                    <span
                      aria-hidden="true"
                      className={`absolute -top-1.5 h-3 w-3 rotate-45 border-l border-t border-border bg-white ${
                        align === "left"
                          ? "left-7"
                          : align === "right"
                            ? "right-7"
                            : "left-1/2 -translate-x-1/2"
                      }`}
                    />
                    <p className="relative mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
                      {item.label}
                    </p>
                    <div
                      className={`relative grid gap-x-8 gap-y-4 ${
                        columns === 3
                          ? "grid-cols-3"
                          : columns === 2
                            ? "grid-cols-2"
                            : "grid-cols-1"
                      }`}
                    >
                      {groups.map((group) => (
                        <section className="min-w-[10.5rem]" key={group.id}>
                          <h3 className="mb-2 text-[11px] font-medium text-muted">
                            {group.label}
                          </h3>
                          <ul className="grid gap-px">
                            {group.tools.map((tool) => (
                              <li key={tool.slug}>
                                <Link
                                  className="flex items-center gap-2 rounded-lg px-1 py-1.5 text-[13px] text-text transition-colors hover:bg-primary-soft/70"
                                  href={tool.route}
                                  role="menuitem"
                                >
                                  <ToolVisual size="sm" tool={tool} />
                                  {tool.name}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </section>
                      ))}
                    </div>
                    <Link
                      className="relative mt-3 inline-flex text-[12px] font-semibold text-primary"
                      href={meta.href}
                    >
                      View all {meta.label} tools →
                    </Link>
                  </div>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
