import type { Metadata } from "next";
import { Outfit, Fraunces } from "next/font/google";
import { AppProviders } from "@/components/app-providers";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  title: "LearnSpace",
  description:
    "LearnSpace is the unique AI-powered learning platform where people acquire practical skills across many areas.",
};

const themeInitScript = `(function(){try{var t=localStorage.getItem('lms-theme');if(t==='dark'||(t!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark');}}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${outfit.variable} ${fraunces.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <link rel="preload" href="/images/learnspace-loader.svg" as="image" type="image/svg+xml" />
      </head>
      <body className="min-h-full bg-background font-sans text-foreground" suppressHydrationWarning>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
