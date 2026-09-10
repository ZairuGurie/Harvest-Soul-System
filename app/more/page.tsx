import Link from "next/link";
import Button from "@/components/ui/Button";

const links = [
  {
    href: "/media",
    title: "Media",
    description: "Photos and videos from church life",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="9" cy="9" r="2" />
        <path d="m21 15-3.5-3.5a2 2 0 0 0-2.8 0L6 20" />
      </svg>
    ),
  },
  {
    href: "/sermons",
    title: "Sermons",
    description: "Watch and revisit recent messages",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <polygon points="6 3 20 12 6 21 6 3" />
      </svg>
    ),
  },
  {
    href: "/events",
    title: "Events",
    description: "Upcoming gatherings and activities",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4" />
        <path d="M8 2v4" />
        <path d="M3 10h18" />
      </svg>
    ),
  },
  {
    href: "/announcements",
    title: "Announcements",
    description: "Church notices and updates",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="m3 11 18-5v12L3 13v-2z" />
        <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
      </svg>
    ),
  },
  {
    href: "/guidance",
    title: "AI Guidance",
    description: "Scripture-grounded questions and devotionals",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M12 3v18" />
        <path d="M5 8h14" />
        <path d="M7 12h10" />
        <path d="M9 16h6" />
        <circle cx="12" cy="5" r="2" />
      </svg>
    ),
  },
  {
    href: "/search",
    title: "Search",
    description: "Find posts, sermons, and more",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
    ),
  },
  {
    href: "/login",
    title: "Staff Login",
    description: "Sign in to the control center",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
        <path d="M10 17l5-5-5-5" />
        <path d="M15 12H3" />
      </svg>
    ),
  },
];

export default function MorePage() {
  return (
    <div className="container mx-auto max-w-lg px-3 py-6 sm:px-4 sm:py-12">
      <section className="hs-motion overflow-hidden rounded-2xl border border-slate-200/70 bg-white/92 shadow-xl backdrop-blur-md transition-shadow duration-300 hover:shadow-2xl sm:rounded-3xl dark:border-white/10 dark:bg-[#0b1220]/92">
        <header className="border-b border-slate-200/70 px-5 py-5 sm:px-6 sm:py-6 dark:border-white/10">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold tracking-[0.2em] text-harvest-blue uppercase dark:text-emerald-300">
                Menu
              </p>
              <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                More
              </h1>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                Explore the rest of Harvest Souls
              </p>
            </div>
            <Button variant="ghost" href="/">
              Home
            </Button>
          </div>
        </header>

        <ul className="divide-y divide-slate-200/70 dark:divide-white/10">
          {links.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="hs-motion group flex items-center gap-4 px-5 py-4 sm:px-6 hover:bg-slate-50/90 dark:hover:bg-white/5"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-harvest-gradient text-white shadow-sm transition-transform duration-200 group-hover:scale-105 group-hover:shadow-md">
                  {link.icon}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-slate-900 transition-colors duration-200 group-hover:text-harvest-blue-dark dark:text-white dark:group-hover:text-emerald-200">
                    {link.title}
                  </span>
                  <span className="mt-0.5 block text-sm text-slate-500 dark:text-slate-400">
                    {link.description}
                  </span>
                </span>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="shrink-0 text-slate-400 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-harvest-blue dark:group-hover:text-emerald-300"
                  aria-hidden
                >
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
