"use client";

import { useEffect, useRef } from "react";

type Node = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
};

/**
 * Subtle protection mesh for the landing hero — connected nodes that drift slowly
 * (spider-web / network feel). Decorative only; disabled when reduced-motion is on.
 */
export function HeroProtectionMesh() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let nodes: Node[] = [];
    let raf = 0;
    let running = false;
    let width = 0;
    let height = 0;
    let dpr = 1;

    const brand = { r: 25, g: 224, b: 111 }; // #19E06F

    function resize() {
      if (!canvas || !ctx) return;
      const parent = canvas.parentElement;
      if (!parent) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = parent.clientWidth;
      height = parent.clientHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
    }

    function seed() {
      const count = Math.max(28, Math.floor((width * height) / 22000));
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.22,
        vy: (Math.random() - 0.5) * 0.22,
        r: 1.1 + Math.random() * 1.6,
      }));
    }

    function drawFrame(animate: boolean) {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);

      const linkDist = Math.min(160, Math.max(110, width * 0.12));

      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        if (animate) {
          a.x += a.vx;
          a.y += a.vy;
          if (a.x < 0 || a.x > width) a.vx *= -1;
          if (a.y < 0 || a.y > height) a.vy *= -1;
          a.x = Math.max(0, Math.min(width, a.x));
          a.y = Math.max(0, Math.min(height, a.y));
        }

        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.hypot(dx, dy);
          if (dist > linkDist) continue;
          const alpha = (1 - dist / linkDist) * 0.22;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = `rgba(${brand.r},${brand.g},${brand.b},${alpha})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }

      for (const n of nodes) {
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${brand.r},${brand.g},${brand.b},0.55)`;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r * 2.4, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${brand.r},${brand.g},${brand.b},0.08)`;
        ctx.fill();
      }
    }

    function loop() {
      drawFrame(true);
      raf = window.requestAnimationFrame(loop);
    }

    function start() {
      if (running) return;
      running = true;
      raf = window.requestAnimationFrame(loop);
    }

    function stop() {
      running = false;
      window.cancelAnimationFrame(raf);
    }

    function applyMotionPreference() {
      stop();
      resize();
      if (reduced.matches) {
        drawFrame(false);
      } else {
        start();
      }
    }

    applyMotionPreference();
    reduced.addEventListener("change", applyMotionPreference);
    window.addEventListener("resize", applyMotionPreference);

    return () => {
      stop();
      reduced.removeEventListener("change", applyMotionPreference);
      window.removeEventListener("resize", applyMotionPreference);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 h-full w-full opacity-70"
      aria-hidden="true"
    />
  );
}
