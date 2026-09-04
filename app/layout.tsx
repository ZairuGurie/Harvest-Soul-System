import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import MobileNav from "../components/layout/MobileNav";
import { getAuthUser } from "@/lib/auth/session";
import { isStaff } from "@/lib/auth/roles";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Harvest Souls Mission Christian Church",
    template: "%s | Harvest Souls",
  },
  description:
    "Harvest Souls Mission Christian Church — Growing in faith. Serving in love. Macanhan, Carmen, Cagayan de Oro City.",
  icons: {
    icon: [{ url: "/harvest-souls-logo.png", type: "image/png" }],
    apple: [{ url: "/harvest-souls-logo.png", type: "image/png" }],
  },
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const user = await getAuthUser();
  const headerUser = user
    ? {
        name: user.profile.display_name || user.email,
        role: user.role,
        isStaff: isStaff(user.role),
      }
    : null;

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Header user={headerUser} />
        <main className="flex-1 w-full">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</div>
        </main>
        <Footer />
        <MobileNav />
      </body>
    </html>
  );
}
