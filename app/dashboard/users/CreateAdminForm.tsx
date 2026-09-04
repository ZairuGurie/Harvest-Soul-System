"use client";

import { useActionState, useState } from "react";
import { createAdminUser, type UserActionState } from "./actions";
import Button from "@/components/ui/Button";

const initial: UserActionState = null;

const field =
  "w-full rounded-lg border px-3 py-2 text-sm dark:bg-slate-950 dark:border-slate-700";

export default function CreateAdminForm() {
  const [state, action, pending] = useActionState(createAdminUser, initial);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2">
      <div>
        <label className="mb-1 block text-sm">Full name</label>
        <input name="display_name" required className={field} />
      </div>
      <div>
        <label className="mb-1 block text-sm">Email</label>
        <input name="email" type="email" required className={field} />
      </div>
      <div>
        <label className="mb-1 block text-sm" htmlFor="temp-password">
          Temporary password
        </label>
        <div className="relative">
          <input
            id="temp-password"
            name="password"
            type={showPassword ? "text" : "password"}
            required
            minLength={10}
            autoComplete="new-password"
            className={`${field} pr-11`}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
            aria-label={showPassword ? "Hide password" : "Show password"}
            title={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm">Role</label>
        <select name="role" defaultValue="ADMIN" className={field}>
          <option value="ADMIN">Admin</option>
          <option value="EDITOR">Editor</option>
          <option value="MEMBER">Member</option>
        </select>
      </div>
      <div>
        <label className="mb-1 block text-sm">Birthday (optional)</label>
        <input name="birthday" type="date" className={field} />
      </div>
      <div className="flex items-center gap-3 sm:col-span-2">
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? "Creating…" : "Create account"}
        </Button>
        {state?.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
        {state?.success ? <p className="text-sm text-emerald-700">{state.success}</p> : null}
      </div>
    </form>
  );
}
