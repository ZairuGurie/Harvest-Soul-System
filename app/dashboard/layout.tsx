import { requireStaff } from "@/lib/auth/session";
import DashboardSidebar from "@/components/dashboard/Sidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireStaff();

  return (
    <div className="fixed inset-0 z-[100] flex bg-slate-100 dark:bg-slate-950">
      <DashboardSidebar
        name={user.profile.display_name || "Staff"}
        email={user.email}
        role={user.role}
      />
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-6 py-8">{children}</div>
      </div>
    </div>
  );
}
