import { createAdminClient } from "@/lib/supabase/server";

export type BirthdayPerson = {
  id: string;
  display_name: string;
  birthday: string;
  day: number;
  notes?: string | null;
  source: "church" | "profile";
};

function monthDay(birthday: string) {
  const d = new Date(birthday + "T00:00:00");
  return { month: d.getMonth() + 1, day: d.getDate(), valid: !Number.isNaN(d.getTime()) };
}

/** Birthdays for the current calendar month (church list + optional profile birthdays). */
export async function getBirthdaysThisMonth(): Promise<BirthdayPerson[]> {
  try {
    const admin = createAdminClient();
    const now = new Date();
    const month = now.getMonth() + 1;
    const people: BirthdayPerson[] = [];

    const { data: churchRows } = await admin
      .from("church_birthdays")
      .select("id, display_name, birthday, notes, is_active")
      .eq("is_active", true)
      .not("birthday", "is", null);

    for (const row of churchRows ?? []) {
      if (!row.birthday) continue;
      const { month: m, day, valid } = monthDay(row.birthday);
      if (!valid || m !== month) continue;
      people.push({
        id: `church:${row.id}`,
        display_name: row.display_name || "Church Member",
        birthday: row.birthday,
        day,
        notes: row.notes,
        source: "church",
      });
    }

    // Also include staff/member profiles that have a birthday set (if column exists).
    const { data: profiles, error: profileError } = await admin
      .from("profiles")
      .select("id, display_name, birthday, is_active")
      .not("birthday", "is", null);

    if (!profileError && profiles) {
      const churchNames = new Set(
        people.map((p) => p.display_name.trim().toLowerCase())
      );

      for (const p of profiles) {
        if (p.is_active === false || !p.birthday) continue;
        const { month: m, day, valid } = monthDay(p.birthday);
        if (!valid || m !== month) continue;
        const name = (p.display_name || "Church Member").trim();
        // Avoid duplicate cards when the same person was also added to church_birthdays.
        if (churchNames.has(name.toLowerCase())) continue;
        people.push({
          id: `profile:${p.id}`,
          display_name: name,
          birthday: p.birthday,
          day,
          source: "profile",
        });
      }
    }

    return people.sort((a, b) => a.day - b.day || a.display_name.localeCompare(b.display_name));
  } catch {
    return [];
  }
}
