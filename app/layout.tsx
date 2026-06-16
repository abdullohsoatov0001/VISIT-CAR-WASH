import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";

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
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[#F8FAFF] text-slate-900 antialiased overflow-x-hidden">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
