"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { BrandLoader } from "@/components/brand-loader";

export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [barVisible, setBarVisible] = useState(false);
  const [overlayVisible, setOverlayVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const hideTimer = useRef<number | null>(null);
  const tickTimer = useRef<number | null>(null);
  const overlayTimer = useRef<number | null>(null);
  const safetyTimer = useRef<number | null>(null);
  const activeRef = useRef(false);
  const routeKey = `${pathname}?${searchParams?.toString() ?? ""}`;

  const clearTimers = () => {
    if (hideTimer.current) window.clearTimeout(hideTimer.current);
    if (tickTimer.current) window.clearInterval(tickTimer.current);
    if (overlayTimer.current) window.clearTimeout(overlayTimer.current);
    if (safetyTimer.current) window.clearTimeout(safetyTimer.current);
    hideTimer.current = null;
    tickTimer.current = null;
    overlayTimer.current = null;
    safetyTimer.current = null;
  };

  const finish = useCallback(() => {
    if (!activeRef.current && !barVisible) return;
    activeRef.current = false;
    setProgress(100);
    setOverlayVisible(false);
    hideTimer.current = window.setTimeout(() => {
      setBarVisible(false);
      setProgress(0);
    }, 200);
    if (tickTimer.current) window.clearInterval(tickTimer.current);
    if (overlayTimer.current) window.clearTimeout(overlayTimer.current);
    if (safetyTimer.current) window.clearTimeout(safetyTimer.current);
    tickTimer.current = null;
    overlayTimer.current = null;
    safetyTimer.current = null;
  }, [barVisible]);

  const start = useCallback(() => {
    if (activeRef.current) return;
    activeRef.current = true;
    clearTimers();
    setBarVisible(true);
    setOverlayVisible(false);
    setProgress(14);
    tickTimer.current = window.setInterval(() => {
      setProgress((p) => (p >= 88 ? p : p + Math.max(1, (90 - p) * 0.1)));
    }, 160);
    // Only show full branded overlay if navigation takes a moment
    overlayTimer.current = window.setTimeout(() => {
      if (activeRef.current) setOverlayVisible(true);
    }, 140);
    safetyTimer.current = window.setTimeout(() => {
      finish();
    }, 12000);
  }, [finish]);

  useEffect(() => {
    finish();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeKey]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const target = event.target as HTMLElement | null;
      const anchor = target?.closest("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) {
        return;
      }
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;

      try {
        const url = new URL(href, window.location.href);
        if (url.origin !== window.location.origin) return;

        const nextPath = url.pathname;
        const nextSearch = url.searchParams.toString();
        const currentSearch = window.location.search.replace(/^\?/, "");
        if (nextPath === window.location.pathname && nextSearch === currentSearch) {
          return;
        }
        start();
      } catch {
        // ignore
      }
    };

    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      clearTimers();
    };
  }, [start]);

  if (!barVisible && !overlayVisible) return null;

  return (
    <>
      {barVisible ? (
        <div className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-1 bg-blue-100/80 dark:bg-slate-800">
          <div
            className="h-full bg-gradient-to-r from-blue-700 via-blue-500 to-sky-400 transition-[width] duration-150 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      ) : null}
      {overlayVisible ? (
        <div className="fixed inset-0 z-[99] flex items-center justify-center bg-white/80 backdrop-blur-[3px] dark:bg-slate-950/75">
          <BrandLoader label="Opening…" />
        </div>
      ) : null}
    </>
  );
}
