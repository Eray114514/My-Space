"use client";

import { useEffect, useRef, useState } from "react";

export function MobileHeroEffects() {
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const gyroRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });

  useEffect(() => {
    const isTouch =
      window.matchMedia("(hover: none)").matches ||
      (window.matchMedia("(any-pointer: coarse)").matches &&
        !window.matchMedia("(any-pointer: fine)").matches);
    setIsTouchDevice(isTouch);

    if (!isTouch) return;

    const root = document.documentElement;

    // 陀螺仪视差
    const handleOrientation = (e: DeviceOrientationEvent) => {
      const gamma = e.gamma || 0; // 左右倾斜 -90 ~ 90
      const beta = e.beta || 0;   // 前后倾斜 -180 ~ 180

      // 限制角度范围，避免过度偏移
      const clampedGamma = Math.max(-45, Math.min(45, gamma));
      const clampedBeta = Math.max(-45, Math.min(45, beta));

      gyroRef.current.targetX = (clampedGamma / 45) * 18; // -18px ~ 18px
      gyroRef.current.targetY = (clampedBeta / 45) * 14;  // -14px ~ 14px
    };

    const animate = () => {
      const { targetX, targetY } = gyroRef.current;
      gyroRef.current.x += (targetX - gyroRef.current.x) * 0.08;
      gyroRef.current.y += (targetY - gyroRef.current.y) * 0.08;

      const dx = gyroRef.current.x / 18;
      const dy = gyroRef.current.y / 14;

      root.style.setProperty("--hero-move-x", `${gyroRef.current.x.toFixed(2)}px`);
      root.style.setProperty("--hero-move-y", `${gyroRef.current.y.toFixed(2)}px`);
      root.style.setProperty("--blog-grid-x", `${(-dx * 14).toFixed(2)}px`);
      root.style.setProperty("--blog-grid-y", `${(-dy * 14).toFixed(2)}px`);
      root.style.setProperty("--blog-grid-tilt-x", `${(dy * 2).toFixed(2)}deg`);
      root.style.setProperty("--blog-grid-tilt-y", `${(-dx * 2.5).toFixed(2)}deg`);

      rafRef.current = requestAnimationFrame(animate);
    };

    // 请求陀螺仪权限（iOS 13+ 需要）
    if (typeof (DeviceOrientationEvent as any).requestPermission === "function") {
      (DeviceOrientationEvent as any).requestPermission().then((state: string) => {
        if (state === "granted") {
          window.addEventListener("deviceorientation", handleOrientation, { passive: true });
        }
      }).catch(() => {
        // 用户拒绝或不在安全上下文，静默失败
      });
    } else {
      window.addEventListener("deviceorientation", handleOrientation, { passive: true });
    }

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("deviceorientation", handleOrientation);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      root.style.removeProperty("--hero-move-x");
      root.style.removeProperty("--hero-move-y");
      root.style.removeProperty("--blog-grid-x");
      root.style.removeProperty("--blog-grid-y");
      root.style.removeProperty("--blog-grid-tilt-x");
      root.style.removeProperty("--blog-grid-tilt-y");
    };
  }, []);

  // 触摸涟漪效果
  useEffect(() => {
    if (!isTouchDevice) return;

    const hero = heroRef.current;
    if (!hero) return;

    const handleTouch = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (!touch) return;

      const ripple = document.createElement("span");
      ripple.className = "touch-ripple";
      ripple.style.left = `${touch.clientX}px`;
      ripple.style.top = `${touch.clientY}px`;
      document.body.appendChild(ripple);

      // 轻微震动反馈
      if (navigator.vibrate) {
        navigator.vibrate(8);
      }

      const remove = () => {
        ripple.removeEventListener("animationend", remove);
        ripple.remove();
      };
      ripple.addEventListener("animationend", remove);
    };

    hero.addEventListener("touchstart", handleTouch, { passive: true });

    return () => {
      hero.removeEventListener("touchstart", handleTouch);
    };
  }, [isTouchDevice]);

  if (!isTouchDevice) return null;

  return <div ref={heroRef} className="mobile-hero-effects" aria-hidden="true" />;
}
