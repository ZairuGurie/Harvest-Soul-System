"use client";

import { useActionState } from "react";
import type { ContentState } from "./content-actions";
import Button from "@/components/ui/Button";

type Props = {
  action: (prev: ContentState, formData: FormData) => Promise<ContentState>;
  children: React.ReactNode;
  submitLabel?: string;
};

const initial: ContentState = null;

export default function ContentForm({ action, children, submitLabel = "Save" }: Props) {
  const [state, formAction, pending] = useActionState(action, initial);

  return (
    <form action={formAction} className="space-y-3">
      {children}
      <div className="flex items-center gap-3">
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? "Saving…" : submitLabel}
        </Button>
        {state?.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
        {state?.success ? <p className="text-sm text-emerald-700">{state.success}</p> : null}
      </div>
    </form>
  );
}
