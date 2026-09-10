import Image from "next/image";
import Link from "next/link";

type LogoProps = {
  size?: number;
  showText?: boolean;
  className?: string;
};

export default function Logo({ size = 40, showText = true, className = "" }: LogoProps) {
  return (
    <Link
      href="/"
      className={`hs-motion group inline-flex items-center gap-3 rounded-lg hover:opacity-95 ${className}`}
    >
      <Image
        src="/harvest-souls-logo.png"
        alt="Harvest Souls Mission Christian Church"
        width={size}
        height={size}
        className="rounded-full object-cover shadow-sm ring-2 ring-harvest-gold/40 transition-all duration-200 group-hover:scale-[1.04] group-hover:ring-harvest-gold/70 group-hover:shadow-md"
        style={{ width: size, height: "auto" }}
        priority
      />
      {showText ? (
        <div className="leading-tight">
          <span className="block text-base font-bold text-harvest-blue transition-colors duration-200 group-hover:text-harvest-blue-dark dark:text-sky-300 dark:group-hover:text-sky-200">
            Harvest Souls
          </span>
          <span className="hidden text-[10px] font-medium tracking-wide text-harvest-green uppercase sm:block dark:text-emerald-300">
            Mission Christian Church
          </span>
        </div>
      ) : null}
    </Link>
  );
}
