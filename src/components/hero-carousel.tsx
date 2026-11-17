"use client";

import { useEffect, useState } from "react";
import { Clapperboard } from "lucide-react";
import { cn } from "@/lib/utils";

const slides = [
  {
    image: "/images/sample-recorded-class.jpg",
    eyebrow: "Catalog · Every career path",
    title: "Tech, finance, forex, marketing — and more",
    description:
      "One classroom for the skills professionals need next, built by Promptstack.",
  },
  {
    image: "/images/slide-design-systems.jpg",
    eyebrow: "Method · Guided practice",
    title: "Train with a tutor, not a playlist",
    description:
      "Interactive lessons and mastery checkpoints make sure the skill sticks.",
  },
  {
    image: "/images/slide-data-literacy.jpg",
    eyebrow: "Method · Real workflows",
    title: "Practice the work you’ll actually do",
    description:
      "Hands-on labs and reusable systems — not theory you’ll forget.",
  },
  {
    image: "/images/slide-product-design.jpg",
    eyebrow: "Method · Teams",
    title: "Upskill people who ship work",
    description:
      "Give your team a shared training system — with proof of mastery.",
  },
];

export function HeroCarousel() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(() => {
      setIndex((current) => (current + 1) % slides.length);
    }, 4500);
    return () => window.clearInterval(id);
  }, [paused]);

  return (
    <div
      className="relative aspect-[16/10] max-h-[280px] overflow-hidden rounded-xl bg-slate-900 sm:max-h-[320px] lg:aspect-[5/3] lg:max-h-[340px]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {slides.map((slide, i) => (
        <div
          key={slide.image}
          className={cn(
            "absolute inset-0 transition-opacity duration-700 ease-out",
            i === index ? "opacity-100" : "opacity-0"
          )}
          aria-hidden={i !== index}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={slide.image}
            alt={slide.title}
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-slate-950/40" />
          <div className="relative flex h-full flex-col justify-between p-4 text-white sm:p-5">
            <div className="flex items-center gap-2 text-xs text-blue-50 sm:text-sm">
              <Clapperboard className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              {slide.eyebrow}
            </div>
            <div className="max-w-md">
              <p className="font-[family-name:var(--font-display)] text-xl leading-tight sm:text-2xl">
                {slide.title}
              </p>
              <p className="mt-1 line-clamp-2 text-xs text-slate-300 sm:text-sm">
                {slide.description}
              </p>
            </div>
          </div>
        </div>
      ))}

      <div className="absolute bottom-3 right-3 z-10 flex items-center gap-2 sm:bottom-4 sm:right-4">
        {slides.map((slide, i) => (
          <button
            key={slide.image}
            type="button"
            aria-label={`Show slide ${i + 1}`}
            onClick={() => setIndex(i)}
            className={cn(
              "h-1.5 rounded-full transition-all",
              i === index
                ? "w-6 bg-blue-300"
                : "w-1.5 bg-white/50 hover:bg-white/80"
            )}
          />
        ))}
      </div>
    </div>
  );
}
