export function SegmentedControl<T extends string>({
  name,
  value,
  onChange,
  options,
  labelledBy,
}: {
  name: string;
  value: T;
  onChange: (value: T) => void;
  labelledBy?: string;
  options: Array<{ value: T; label: string; hint?: string; disabled?: boolean }>;
}) {
  return (
    <div
      aria-labelledby={labelledBy}
      className={`mt-1 grid gap-1 rounded-[var(--radius-md)] border border-border bg-paper-deep p-1 ${
        options.length === 3 ? "grid-cols-3" : "grid-cols-2"
      }`}
      id={name}
      role="radiogroup"
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            aria-checked={selected}
            className={`rounded-[var(--radius-sm)] px-3 py-2 text-sm font-medium transition-[background-color,color] duration-[var(--ease-fast)] ${
              selected
                ? "bg-surface text-text shadow-[var(--shadow-subtle)]"
                : "text-muted hover:text-text"
            } ${option.disabled ? "opacity-70" : ""}`}
            disabled={option.disabled && !selected}
            key={option.value}
            name={name}
            onClick={() => onChange(option.value)}
            role="radio"
            type="button"
          >
            <span className="block">{option.label}</span>
            {option.hint ? (
              <span className="mt-0.5 block text-[11px] font-normal text-muted">
                {option.hint}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
