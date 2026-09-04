import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="w-full border-t border-harvest-gold/30 bg-harvest-cream/90 dark:bg-slate-900/90 backdrop-blur mt-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row md:justify-between gap-6">
          <div className="flex items-start gap-4">
            <Image
              src="/harvest-souls-logo.png"
              alt="Harvest Souls logo"
              width={64}
              height={64}
              className="rounded-full object-cover ring-2 ring-harvest-gold/40"
              style={{ width: 64, height: "auto" }}
            />
            <div>
              <h3 className="text-lg font-semibold text-harvest-blue dark:text-sky-300">
                Harvest Souls Mission Christian Church
              </h3>
              <p className="text-sm text-harvest-green-dark dark:text-emerald-300 mt-1">
                Growing in faith. Serving in love.
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
                Macanhan, Carmen, Cagayan de Oro City
              </p>
              <p className="text-xs text-harvest-green dark:text-emerald-400 mt-1 italic">
                &ldquo;Therefore go and make disciples of all nations.&rdquo; — Matthew 28:19
              </p>
            </div>
          </div>

          <div className="flex gap-8">
            <div>
              <h4 className="text-sm font-semibold text-harvest-blue dark:text-sky-300">Explore</h4>
              <ul className="mt-2 text-sm text-harvest-green-dark dark:text-emerald-200 space-y-1">
                <li><Link href="/posts" className="hover:text-harvest-blue">Posts</Link></li>
                <li><Link href="/sermons" className="hover:text-harvest-blue">Sermons</Link></li>
                <li><Link href="/songs" className="hover:text-harvest-blue">Songs</Link></li>
                <li><Link href="/bible" className="hover:text-harvest-blue">Bible</Link></li>
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

        <div className="mt-6 pt-4 border-t border-harvest-gold/20 text-sm text-slate-500 dark:text-slate-400">
          © {year} Harvest Souls Mission Christian Church Incorporated. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
