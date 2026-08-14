"use client";

import { useId, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { CATEGORY_META, searchTools } from "@/data/tools/registry";
import { ToolVisual } from "@/components/icons/ToolVisual";

export function GlobalSearch({
  variant = "header",
  autoFocus = false,
}: {
  variant?: "header" | "hero";
  autoFocus?: boolean;
}) {
  const router = useRouter();
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const results = useMemo(() => searchTools(query).slice(0, 8), [query]);

  function go(index = active) {
    const tool = results[index];
    if (!tool) return;
    setOpen(false);
    setQuery("");
    router.push(tool.route);
  }

  return (
    <div className={`relative ${variant === "hero" ? "w-full" : "w-full"}`}>
      <label className="sr-only" htmlFor={`${listId}-search`}>
        Search for a tool
      </label>
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
      />
      <input
        aria-activedescendant={
          open && results[active] ? `${listId}-opt-${active}` : undefined
        }
        aria-autocomplete="list"
        aria-controls={listId}
        aria-expanded={open && results.length > 0}
        autoComplete="off"
        autoFocus={autoFocus}
        className={`w-full border border-border bg-surface pl-9 pr-8 text-sm text-text placeholder:text-muted ${
          variant === "hero"
            ? "rounded-[var(--radius-md)] py-3.5 shadow-[var(--shadow-card)]"
            : "h-9 rounded-full py-0"
        }`}
        id={`${listId}-search`}
        onBlur={() => {
          window.setTimeout(() => setOpen(false), 120);
        }}
        onChange={(event) => {
          setQuery(event.target.value);
          setActive(0);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setOpen(true);
            setActive((index) =>
              results.length ? (index + 1) % results.length : 0,
            );
          } else if (event.key === "ArrowUp") {
            event.preventDefault();
            setOpen(true);
            setActive((index) =>
              results.length
                ? (index - 1 + results.length) % results.length
                : 0,
            );
          } else if (event.key === "Enter") {
            event.preventDefault();
            go();
          } else if (event.key === "Escape") {
            setOpen(false);
            setQuery("");
            inputRef.current?.blur();
          }
        }}
        placeholder={variant === "hero" ? "Search for a tool..." : "Search tools"}
        ref={inputRef}
        role="combobox"
        value={query}
      />
      {query ? (
        <button
          aria-label="Clear search"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted hover:text-text"
          onClick={() => {
            setQuery("");
            inputRef.current?.focus();
          }}
          type="button"
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}
      {open && query.trim() ? (
        <ul
          className="absolute z-50 mt-2 max-h-80 w-full overflow-auto rounded-2xl border border-border bg-white p-1 shadow-[var(--shadow-elevated)]"
          id={listId}
          role="listbox"
        >
          {results.length === 0 ? (
            <li className="px-3 py-3 text-sm text-muted">No matching tools.</li>
          ) : (
            results.map((tool, index) => (
              <li
                aria-selected={index === active}
                className={`rounded-[var(--radius-sm)] ${
                  index === active ? "bg-primary-soft/70" : ""
                }`}
                id={`${listId}-opt-${index}`}
                key={tool.slug}
                role="option"
              >
                <Link
                  className="flex items-start gap-3 px-3 py-2"
                  href={tool.route}
                  onMouseEnter={() => setActive(index)}
                >
                  <span className="mt-0.5 shrink-0">
                    <ToolVisual size="sm" tool={tool} />
                  </span>
                  <span>
                    <span className="block text-sm font-medium">{tool.name}</span>
                    <span className="block text-[11px] uppercase tracking-wide text-muted">
                      {CATEGORY_META[tool.category].label}
                    </span>
                    <span className="mt-0.5 block text-xs text-muted">
                      {tool.description}
                    </span>
                  </span>
                </Link>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  );
}
