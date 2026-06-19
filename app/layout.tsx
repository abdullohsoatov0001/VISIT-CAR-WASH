import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "VISIT — Premium Mobile Car Wash",
  description: "Your car, cleaned wherever you are. Book a premium mobile car wash in minutes. Real-time tracking. Professional detailers at your door.",
  keywords: ["mobile car wash", "car detailing", "on-demand car wash", "car care"],
  authors: [{ name: "VISIT" }],
  creator: "VISIT",
  openGraph: {
    title: "VISIT — Premium Mobile Car Wash",
    description: "Your car, cleaned wherever you are.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "VISIT — Premium Mobile Car Wash",
    description: "Your car, cleaned wherever you are.",
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#FFFFFF",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`scroll-smooth ${inter.variable}`}>
      <body className="bg-[#F8FAFF] text-slate-900 antialiased overflow-x-hidden font-sans">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
