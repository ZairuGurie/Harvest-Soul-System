"use client";

import { useActionState } from "react";
import { updateUser, type UserActionState } from "./actions";
import Button from "@/components/ui/Button";

const initial: UserActionState = null;

export default function EditUserForm({
  userId,
  displayName,
  role,
  birthday,
  isActive,
}: {
  userId: string;
  displayName: string;
  role: string;
  birthday: string;
  isActive: boolean;
}) {
  const [state, action, pending] = useActionState(updateUser, initial);

  return (
    <form action={action} className="grid gap-2 sm:grid-cols-2">
      <input type="hidden" name="user_id" value={userId} />
      <input
        name="display_name"
        defaultValue={displayName}
        required
        className="rounded-lg border px-3 py-2 text-sm dark:bg-slate-950 dark:border-slate-700"
      />
      <select
        name="role"
        defaultValue={role}
        className="rounded-lg border px-3 py-2 text-sm dark:bg-slate-950 dark:border-slate-700"
      >
        <option value="SUPER_ADMIN">Super Admin</option>
        <option value="ADMIN">Admin</option>
        <option value="EDITOR">Editor</option>
        <option value="WORSHIP_LEADER">Worship Leader</option>
        <option value="MEMBER">Member</option>
      </select>
      <input
        name="birthday"
        type="date"
        defaultValue={birthday}
        className="rounded-lg border px-3 py-2 text-sm dark:bg-slate-950 dark:border-slate-700"
      />
      <label className="inline-flex items-center gap-2 text-sm">
        <input type="checkbox" name="is_active" defaultChecked={isActive} />
        Active
      </label>
      <div className="sm:col-span-2 flex items-center gap-3">
        <Button type="submit" variant="outline" disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </Button>
        {state?.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
        {state?.success ? <p className="text-sm text-emerald-700">{state.success}</p> : null}
      </div>
    </form>
  );
}
