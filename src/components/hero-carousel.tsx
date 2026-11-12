"use client";

import { useEffect, useState } from "react";
import { Clapperboard } from "lucide-react";
import { cn } from "@/lib/utils";

const slides = [
  {
    image: "/images/sample-recorded-class.jpg",
    eyebrow: "Skill path · AI productivity",
    title: "Learn skills that compound",
    description: "Master practical AI workflows you can use across any career.",
  },
  {
    image: "/images/slide-design-systems.jpg",
    eyebrow: "Skill path · Design thinking",
    title: "Product principles that stick",
    description: "Turn vague ideas into clear product thinking with guided lessons.",
  },
  {
    image: "/images/slide-data-literacy.jpg",
    eyebrow: "Skill path · Data literacy",
    title: "Read the numbers with confidence",
    description: "Build decision-ready insight from raw information and dashboards.",
  },
  {
    image: "/images/slide-product-design.jpg",
    eyebrow: "Skill path · Product design",
    title: "Craft interfaces people love",
    description: "Level up communication, design, and delivery with AI-assisted practice.",
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
      className="relative aspect-video overflow-hidden rounded-xl bg-slate-900"
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
          <div className="relative flex h-full flex-col justify-between p-5 text-white">
            <div className="flex items-center gap-2 text-sm text-blue-50">
              <Clapperboard className="h-4 w-4" />
              {slide.eyebrow}
            </div>
            <div className="max-w-md">
              <p className="font-[family-name:var(--font-display)] text-2xl leading-tight">
                {slide.title}
              </p>
              <p className="mt-1 text-sm text-slate-300">{slide.description}</p>
            </div>
          </div>
        </div>
      ))}

      <div className="absolute bottom-4 right-4 z-10 flex items-center gap-2">
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
