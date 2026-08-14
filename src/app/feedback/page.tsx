"use client";

import { useState } from "react";
import { Breadcrumb } from "@/components/site/Breadcrumb";
import { PageShell } from "@/components/ui/PageShell";

export default function FeedbackPage() {
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);

  return (
    <PageShell className="py-10">
      <Breadcrumb
        items={[{ href: "/", label: "Home" }, { label: "Feedback" }]}
      />
      <h1 className="mt-6 font-serif text-4xl tracking-tight">Send Feedback</h1>
      <p className="mt-3 max-w-2xl text-muted">
        Tell us what would make these tools better. Messages are not stored on
        this site yet—copy the text and send it through the channel you prefer.
      </p>
      <form
        className="mt-8 max-w-xl"
        onSubmit={(event) => {
          event.preventDefault();
          void navigator.clipboard.writeText(message).then(() => {
            setCopied(true);
          });
        }}
      >
        <label className="text-sm font-medium" htmlFor="feedback">
          Your feedback
        </label>
        <textarea
          className="mt-1 min-h-40 w-full rounded-[var(--radius-md)] border border-border bg-surface px-3 py-2 text-sm"
          id="feedback"
          onChange={(event) => {
            setMessage(event.target.value);
            setCopied(false);
          }}
          value={message}
        />
        <button
          className="btn-primary mt-4"
          type="submit"
        >
          Copy feedback
        </button>
        {copied ? (
          <p className="mt-2 text-sm text-success">Copied to clipboard.</p>
        ) : null}
      </form>
    </PageShell>
  );
}
