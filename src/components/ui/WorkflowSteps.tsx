export function WorkflowSteps({
  steps,
  current = 0,
}: {
  steps: string[];
  current?: number;
}) {
  return (
    <ol className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {steps.map((step, index) => {
        const active = index === current;
        return (
          <li
            className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 ${
              active
                ? "border-primary/25 bg-primary/[0.06]"
                : "border-border bg-white"
            }`}
            key={step}
          >
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${
                active ? "bg-primary text-white" : "bg-paper-deep text-muted"
              }`}
            >
              {index + 1}
            </span>
            <span
              className={`text-[13px] font-medium ${
                active ? "text-text" : "text-muted"
              }`}
            >
              {step}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
