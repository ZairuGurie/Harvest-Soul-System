import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth/session";
import { isStaff } from "@/lib/auth/roles";
import Image from "next/image";
import Card from "@/components/ui/Card";
import LoginForm from "./LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const nextPath = params.next && params.next.startsWith("/") ? params.next : "/dashboard";

  // Only send already-authenticated staff to the dashboard (never on stale cookies alone).
  const user = await getAuthUser();
  if (user && isStaff(user.role)) {
    redirect(nextPath.startsWith("/dashboard") ? nextPath : "/dashboard");
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md p-8" accent>
        <div className="mb-6 flex flex-col items-center text-center">
          <Image
            src="/harvest-souls-logo.png"
            alt="Harvest Souls"
            width={80}
            height={80}
            className="mb-3 rounded-full ring-2 ring-harvest-gold/50"
            style={{ width: "auto", height: "auto" }}
            priority
          />
          <h1 className="text-2xl font-bold text-harvest-blue-dark dark:text-white">
            Staff Sign In
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Harvest Souls Mission Christian Church
          </p>
        </div>
        <LoginForm nextPath={nextPath} />
      </Card>
    </div>
  );
}
