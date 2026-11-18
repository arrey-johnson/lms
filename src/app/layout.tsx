import type { Metadata, Viewport } from "next";
import { Outfit, Fraunces } from "next/font/google";
import { AppProviders } from "@/components/app-providers";
import { PricingProvider } from "@/components/pricing-provider";
import { getPricing } from "@/lib/market";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f3f6fa" },
    { media: "(prefers-color-scheme: dark)", color: "#020617" },
  ],
};

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
    "Career skills that stick — technology, AI, finance, forex, digital marketing, management, and more. Promptstack Classroom trains you with guided practice, an interactive tutor, and mastery checkpoints. Train your whole team in one purchase.",
  icons: {
    icon: [{ url: "/brand/favicon-32.png", sizes: "32x32", type: "image/png" }],
    apple: [{ url: "/brand/icon-192.png", sizes: "192x192", type: "image/png" }],
  },
};

const themeInitScript = `(function(){try{var t=localStorage.getItem('lms-theme');if(t==='dark'||(t!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark');}}catch(e){}})();`;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pricing = await getPricing();
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
        <AppProviders>
          <PricingProvider initial={pricing}>{children}</PricingProvider>
        </AppProviders>
      </body>
    </html>
  );
}
