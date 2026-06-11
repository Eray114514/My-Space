"use client";

import { useEffect, useRef } from "react";

export function MobileHeroEffects() {
  const rafRef = useRef<number>(0);
  const gyroRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });

  useEffect(() => {
    // 仅在 html.is-touch 存在时执行（ClientLayout 已检测）
    if (!document.documentElement.classList.contains("is-touch")) return;

    const root = document.documentElement;

    const handleOrientation = (e: DeviceOrientationEvent) => {
      const gamma = e.gamma || 0;
      const beta = e.beta || 0;
      const clampedGamma = Math.max(-30, Math.min(30, gamma));
      const clampedBeta = Math.max(-30, Math.min(30, beta - 45));

      gyroRef.current.targetX = (clampedGamma / 30) * 16;
      gyroRef.current.targetY = (clampedBeta / 30) * 12;
    };

    const animate = () => {
      const { targetX, targetY } = gyroRef.current;
      gyroRef.current.x += (targetX - gyroRef.current.x) * 0.06;
      gyroRef.current.y += (targetY - gyroRef.current.y) * 0.06;

      const dx = gyroRef.current.x / 16;
      const dy = gyroRef.current.y / 12;

      root.style.setProperty("--hero-tilt-x", `${(-dy * 6).toFixed(2)}deg`);
      root.style.setProperty("--hero-tilt-y", `${(dx * 8).toFixed(2)}deg`);
      root.style.setProperty("--hero-move-x", `${gyroRef.current.x.toFixed(2)}px`);
      root.style.setProperty("--hero-move-y", `${gyroRef.current.y.toFixed(2)}px`);
      root.style.setProperty("--blog-grid-x", `${(-dx * 16).toFixed(2)}px`);
      root.style.setProperty("--blog-grid-y", `${(-dy * 16).toFixed(2)}px`);
      root.style.setProperty("--blog-grid-tilt-x", `${(dy * 3).toFixed(2)}deg`);
      root.style.setProperty("--blog-grid-tilt-y", `${(-dx * 3).toFixed(2)}deg`);

      rafRef.current = requestAnimationFrame(animate);
    };

    if (typeof (DeviceOrientationEvent as any).requestPermission === "function") {
      const requestOnTouch = () => {
        (DeviceOrientationEvent as any).requestPermission().then((state: string) => {
          if (state === "granted") {
            window.addEventListener("deviceorientation", handleOrientation, { passive: true });
          }
        }).catch(() => {});
        document.removeEventListener("touchstart", requestOnTouch);
      };
      document.addEventListener("touchstart", requestOnTouch, { once: true });
    } else {
      window.addEventListener("deviceorientation", handleOrientation, { passive: true });
    }

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("deviceorientation", handleOrientation);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      root.style.removeProperty("--hero-tilt-x");
      root.style.removeProperty("--hero-tilt-y");
      root.style.removeProperty("--hero-move-x");
      root.style.removeProperty("--hero-move-y");
      root.style.removeProperty("--blog-grid-x");
      root.style.removeProperty("--blog-grid-y");
      root.style.removeProperty("--blog-grid-tilt-x");
      root.style.removeProperty("--blog-grid-tilt-y");
    };
  }, []);

  return null;
}
