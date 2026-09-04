import Image from "next/image";
import Link from "next/link";

type LogoProps = {
  size?: number;
  showText?: boolean;
  className?: string;
};

export default function Logo({ size = 40, showText = true, className = "" }: LogoProps) {
  return (
    <Link href="/" className={`inline-flex items-center gap-3 ${className}`}>
      <Image
        src="/harvest-souls-logo.png"
        alt="Harvest Souls Mission Christian Church"
        width={size}
        height={size}
        className="rounded-full object-cover shadow-sm ring-2 ring-harvest-gold/40"
        style={{ width: size, height: "auto" }}
        priority
      />
      {showText ? (
        <div className="leading-tight">
          <span className="block text-base font-bold text-harvest-blue dark:text-sky-300">
            Harvest Souls
          </span>
          <span className="hidden sm:block text-[10px] font-medium uppercase tracking-wide text-harvest-green dark:text-emerald-300">
            Mission Christian Church
          </span>
        </div>
      ) : null}
    </Link>
  );
}
