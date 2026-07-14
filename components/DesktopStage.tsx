"use client";

import { useEffect, useRef } from "react";

interface DesktopStageProps {
  supplierCount: number;
  championCount: number;
  requestCount: number;
}

export function DesktopStage({
  supplierCount,
  championCount,
  requestCount,
}: DesktopStageProps) {
  const tiltRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (reduce) return;

    const cleanups: (() => void)[] = [];

    /* ---------- Star parallax tilt ---------- */
    const tilt = tiltRef.current;
    const hero = document.getElementById("heroSection");
    if (tilt && hero) {
      const onMove = (e: MouseEvent) => {
        const r = hero.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        tilt.style.transform = `rotateY(${x * 26}deg) rotateX(${-y * 18}deg)`;
      };
      const onLeave = () => {
        tilt.style.transform = "";
      };
      hero.addEventListener("mousemove", onMove);
      hero.addEventListener("mouseleave", onLeave);
      cleanups.push(() => {
        hero.removeEventListener("mousemove", onMove);
        hero.removeEventListener("mouseleave", onLeave);
      });
    }

    /* ---------- Card 3D tilt on hover ---------- */
    const cards = document.querySelectorAll<HTMLElement>(".card-3d");
    cards.forEach((card) => {
      const onMove = (e: MouseEvent) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = `perspective(800px) rotateY(${x * 6}deg) rotateX(${-y * 6}deg) translateZ(4px)`;
      };
      const onLeave = () => {
        card.style.transform = "";
      };
      card.addEventListener("mousemove", onMove);
      card.addEventListener("mouseleave", onLeave);
      cleanups.push(() => {
        card.removeEventListener("mousemove", onMove);
        card.removeEventListener("mouseleave", onLeave);
      });
    });

    /* ---------- Scroll reveal ---------- */
    const reveals = document.querySelectorAll(".reveal");
    let io: IntersectionObserver | null = null;
    if (!("IntersectionObserver" in window)) {
      reveals.forEach((el) => el.classList.add("in"));
    } else {
      io = new IntersectionObserver(
        (entries) => {
          entries.forEach((en) => {
            if (en.isIntersecting) {
              en.target.classList.add("in");
              io?.unobserve(en.target);
            }
          });
        },
        { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
      );
      reveals.forEach((el) => io?.observe(el));
    }

    return () => {
      cleanups.forEach((fn) => fn());
      io?.disconnect();
    };
  }, []);

  return (
    <div
      className="scene-3d hidden lg:flex"
      style={{
        minHeight: 420,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div className="star-tilt" ref={tiltRef}>
        <div className="ajrak-sculpture" aria-hidden="true">
          {/* Layer 1 — deepest, faintest indigo */}
          <div
            className="ajrak-layer"
            style={{ transform: "translateZ(-80px)" }}
          >
            <svg viewBox="0 0 300 300">
              <g
                fill="none"
                stroke="oklch(38% 0.13 265)"
                strokeWidth="1.2"
                opacity="0.18"
              >
                <rect x="60" y="60" width="180" height="180" />
                <rect
                  x="60"
                  y="60"
                  width="180"
                  height="180"
                  transform="rotate(45 150 150)"
                />
              </g>
            </svg>
          </div>

          {/* Layer 2 — mid-deep indigo */}
          <div
            className="ajrak-layer"
            style={{ transform: "translateZ(-40px)" }}
          >
            <svg viewBox="0 0 300 300">
              <g
                fill="none"
                stroke="oklch(38% 0.13 265)"
                strokeWidth="1.4"
                opacity="0.32"
              >
                <rect x="60" y="60" width="180" height="180" />
                <rect
                  x="60"
                  y="60"
                  width="180"
                  height="180"
                  transform="rotate(45 150 150)"
                />
              </g>
            </svg>
          </div>

          {/* Layer 3 — center, filled with ajrak pattern */}
          <div className="ajrak-layer" style={{ transform: "translateZ(0px)" }}>
            <svg viewBox="0 0 300 300">
              <rect
                width="300"
                height="300"
                fill="url(#ajrakFill)"
                clipPath="url(#starClip)"
              />
              <g fill="none" stroke="oklch(28% 0.1 265)" strokeWidth="2">
                <rect x="60" y="60" width="180" height="180" />
                <rect
                  x="60"
                  y="60"
                  width="180"
                  height="180"
                  transform="rotate(45 150 150)"
                />
              </g>
              <circle cx="150" cy="150" r="9" fill="oklch(64% 0.14 42)" />
              <circle cx="150" cy="150" r="4" fill="oklch(74% 0.12 85)" />
            </svg>
          </div>

          {/* Layer 4 — front, terracotta outline */}
          <div
            className="ajrak-layer"
            style={{ transform: "translateZ(40px)" }}
          >
            <svg viewBox="0 0 300 300">
              <g
                fill="none"
                stroke="oklch(64% 0.14 42)"
                strokeWidth="1.6"
                opacity="0.55"
              >
                <rect x="60" y="60" width="180" height="180" />
                <rect
                  x="60"
                  y="60"
                  width="180"
                  height="180"
                  transform="rotate(45 150 150)"
                />
              </g>
            </svg>
          </div>

          {/* Layer 5 — foremost, gold shimmer */}
          <div
            className="ajrak-layer"
            style={{ transform: "translateZ(80px)" }}
          >
            <svg viewBox="0 0 300 300">
              <g
                fill="none"
                stroke="oklch(74% 0.12 85)"
                strokeWidth="1.2"
                opacity="0.75"
              >
                <rect x="60" y="60" width="180" height="180" />
                <rect
                  x="60"
                  y="60"
                  width="180"
                  height="180"
                  transform="rotate(45 150 150)"
                />
              </g>
            </svg>
          </div>
        </div>
      </div>

      {/* Floating glassmorphism stat chips */}
      <div className="star-stat s1">
        <p className="n">{supplierCount.toLocaleString()}</p>
        <p className="l">suppliers</p>
      </div>
      <div className="star-stat s2">
        <p className="n">{championCount.toLocaleString()}</p>
        <p className="l">champions</p>
      </div>
      <div className="star-stat s3">
        <p className="n">{requestCount.toLocaleString()}</p>
        <p className="l">requests</p>
      </div>
    </div>
  );
}
