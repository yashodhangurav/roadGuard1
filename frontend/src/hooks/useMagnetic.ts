import { useState, useEffect, useRef } from 'react';

interface UseMagneticOptions {
  strength?: number;
  maxDistance?: number;
  reachRadius?: number;
}

export function useMagnetic<T extends HTMLElement>({
  strength = 0.08,
  maxDistance = 9,
  reachRadius = 220,
}: UseMagneticOptions = {}) {
  const ref = useRef<T | null>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let x = 0;
    let y = 0;
    let targetX = 0;
    let targetY = 0;
    let raf = 0;

    const clamp = (n: number, min: number, max: number) =>
      Math.min(max, Math.max(min, n));

    const step = () => {
      x += (targetX - x) * 0.16;
      y += (targetY - y) * 0.16;
      setOffset({ x: Number(x.toFixed(2)), y: Number(y.toFixed(2)) });

      if (Math.abs(targetX - x) + Math.abs(targetY - y) > 0.05) {
        raf = requestAnimationFrame(step);
      } else {
        raf = 0;
      }
    };

    const handlePointerMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const dx = e.clientX - centerX;
      const dy = e.clientY - centerY;
      const distance = Math.hypot(dx, dy);
      const reach = Math.max(rect.width, rect.height) / 2 + reachRadius;

      if (distance < reach) {
        targetX = clamp(dx * strength, -maxDistance, maxDistance);
        targetY = clamp(dy * strength, -maxDistance, maxDistance);
      } else {
        targetX = 0;
        targetY = 0;
      }

      if (!raf) raf = requestAnimationFrame(step);
    };

    const handlePointerLeave = () => {
      targetX = 0;
      targetY = 0;
      if (!raf) raf = requestAnimationFrame(step);
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', handlePointerLeave);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      document.documentElement.removeEventListener('pointerleave', handlePointerLeave);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [strength, maxDistance, reachRadius]);

  return { ref, offset };
}

