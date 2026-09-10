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
    icon: [
      { url: "/favicon-16x16.png?v=2", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png?v=2", sizes: "32x32", type: "image/png" },
      { url: "/favicon.png?v=2", type: "image/png" },
      { url: "/harvest-souls-logo-transparent.png?v=2", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon.png?v=2", sizes: "180x180", type: "image/png" }],
    shortcut: ["/favicon.png?v=2"],
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
