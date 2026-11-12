"use client";

import { Suspense } from "react";
import { ThemeProvider } from "@/components/theme-provider";
import { NavigationProgress } from "@/components/navigation-progress";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <Suspense fallback={null}>
        <NavigationProgress />
      </Suspense>
      {children}
    </ThemeProvider>
  );
}
