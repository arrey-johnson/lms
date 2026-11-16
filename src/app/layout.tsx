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
  title: "Promptstack Classroom",
  description:
    "Build career-ready skills with courses made by Promptstack. Take free courses or buy the ones that move you forward — and train your whole team in one purchase.",
  icons: {
    icon: [{ url: "/brand/favicon-32.png", sizes: "32x32", type: "image/png" }],
    apple: [{ url: "/brand/icon-192.png", sizes: "192x192", type: "image/png" }],
  },
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
        <link rel="preload" href="/brand/icon.png" as="image" type="image/png" />
      </head>
      <body className="min-h-full bg-background font-sans text-foreground" suppressHydrationWarning>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
