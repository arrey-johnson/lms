"use client";

import { useEffect, useRef } from "react";
import videojs from "video.js";
import "video.js/dist/video-js.css";
import { saveProgressAction } from "@/lib/actions/progress";
import { COMPLETION_THRESHOLD } from "@/lib/module-access";

interface VideoPlayerProps {
  src: string;
  moduleId: string;
  initialPosition?: number;
  poster?: string | null;
  onCompleted?: () => void;
}

export function VideoPlayer({
  src,
  moduleId,
  initialPosition = 0,
  poster,
  onCompleted,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const playerRef = useRef<any>(null);
  const lastSavedRef = useRef(0);
  const completedRef = useRef(false);
  const onCompletedRef = useRef(onCompleted);
  onCompletedRef.current = onCompleted;

  useEffect(() => {
    if (!videoRef.current) return;
    completedRef.current = false;

    const videoElement = document.createElement("video-js");
    videoElement.classList.add("vjs-big-play-centered", "vjs-fluid");
    videoRef.current.appendChild(videoElement);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const player: any = videojs(videoElement, {
      controls: true,
      autoplay: false,
      preload: "auto",
      fluid: true,
      playbackRates: [0.75, 1, 1.25, 1.5, 1.75, 2],
      sources: [{ src, type: guessMime(src) }],
      poster: poster || undefined,
    });

    playerRef.current = player;

    player.ready(() => {
      if (initialPosition > 0) {
        player.currentTime(initialPosition);
      }
    });

    const persist = async (force = false, markComplete = false) => {
      const duration = player.duration() || 0;
      const current = player.currentTime() || 0;
      if (!duration || current <= 0) return;

      const now = Date.now();
      if (!force && now - lastSavedRef.current < 5000) return;
      lastSavedRef.current = now;

      const pct = markComplete ? 100 : (current / duration) * 100;
      const completed = markComplete || pct >= COMPLETION_THRESHOLD;

      const result = await saveProgressAction({
        moduleId,
        watchedPercentage: pct,
        lastPosition: markComplete ? duration : current,
        completed,
      });

      if (result?.success && completed && !completedRef.current) {
        completedRef.current = true;
        onCompletedRef.current?.();
      }
    };

    player.on("timeupdate", () => {
      void persist(false);
    });
    player.on("pause", () => {
      void persist(true);
    });
    player.on("ended", () => {
      void persist(true, true);
    });

    return () => {
      void persist(true);
      if (playerRef.current) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
  }, [src, moduleId, initialPosition, poster]);

  return (
    <div data-vjs-player className="overflow-hidden rounded-xl bg-black shadow-lg">
      <div ref={videoRef} />
    </div>
  );
}

function guessMime(src: string) {
  const clean = src.split("?")[0].toLowerCase();
  if (clean.endsWith(".webm")) return "video/webm";
  if (clean.endsWith(".mov")) return "video/quicktime";
  return "video/mp4";
}
