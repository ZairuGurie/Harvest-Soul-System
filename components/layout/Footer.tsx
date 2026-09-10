import Link from "next/link";
import Image from "next/image";

const footerLinkClass =
  "hs-motion hover:text-harvest-blue dark:hover:text-sky-300";

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-12 w-full border-t border-harvest-gold/30 bg-harvest-cream/90 backdrop-blur dark:bg-slate-900/90">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 md:flex-row md:justify-between">
          <div className="flex items-start gap-4">
            <Image
              src="/harvest-souls-logo.png"
              alt="Harvest Souls logo"
              width={64}
              height={64}
              className="hs-motion rounded-full object-cover ring-2 ring-harvest-gold/40 hover:ring-harvest-gold/70 hover:shadow-md"
              style={{ width: 64, height: "auto" }}
            />
            <div>
              <h3 className="text-lg font-semibold text-harvest-blue dark:text-sky-300">
                Harvest Souls Mission Christian Church
              </h3>
              <p className="mt-1 text-sm text-harvest-green-dark dark:text-emerald-300">
                Growing in faith. Serving in love.
              </p>
              <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                Macanhan, Carmen, Cagayan de Oro City
              </p>
              <p className="mt-1 text-xs text-harvest-green italic dark:text-emerald-400">
                &ldquo;Therefore go and make disciples of all nations.&rdquo; — Matthew 28:19
              </p>
            </div>
          </div>

          <div className="flex gap-8 sm:gap-12">
            <div>
              <h4 className="text-sm font-semibold text-harvest-blue dark:text-sky-300">Explore</h4>
              <ul className="mt-2 space-y-1.5 text-sm text-harvest-green-dark dark:text-emerald-200">
                <li>
                  <Link href="/posts" className={footerLinkClass}>
                    Posts
                  </Link>
                </li>
                <li>
                  <Link href="/sermons" className={footerLinkClass}>
                    Sermons
                  </Link>
                </li>
                <li>
                  <Link href="/songs" className={footerLinkClass}>
                    Songs
                  </Link>
                </li>
                <li>
                  <Link href="/bible" className={footerLinkClass}>
                    Bible
                  </Link>
                </li>
                <li>
                  <Link href="/guidance" className={footerLinkClass}>
                    AI Guidance
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-harvest-blue dark:text-sky-300">Contact</h4>
              <ul className="mt-2 text-sm text-harvest-green-dark dark:text-emerald-200">
                <li>contact@harvestsoulschurch.org</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-6 border-t border-harvest-gold/20 pt-4 text-sm text-slate-500 dark:text-slate-400">
          © {year} Harvest Souls Mission Christian Church Incorporated. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
