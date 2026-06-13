"use client";

import { useEffect } from "react";

export function PointerLens() {
  useEffect(() => {
    const root = document.documentElement;
    const finePointer = window.matchMedia("(any-pointer: fine)");
    const hoverPointer = window.matchMedia("(hover: hover)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    if (reducedMotion.matches) {
      root.classList.remove("pointer-lens-enabled", "pointer-lens-active");
      return;
    }

    let hasMouseInput = finePointer.matches || hoverPointer.matches;
    let pointerX = window.innerWidth / 2;
    let pointerY = window.innerHeight / 2;
    let visualX = pointerX;
    let visualY = pointerY;
    let frame = 0;
    let isVisible = false;
    let isHeaderHover = false;
    let headerOverlap = 0;
    let headerRect = { left: 0, right: 0, top: 0, bottom: 0, width: 0, height: 0 };

    const enableLens = () => {
      if (!hasMouseInput) hasMouseInput = true;
      root.classList.add("pointer-lens-enabled");
    };

    const setLensState = () => {
      const shouldShow = hasMouseInput && isVisible;
      root.classList.toggle("pointer-lens-active", shouldShow);
      root.classList.toggle("pointer-lens-header", shouldShow && isHeaderHover);
      root.classList.remove("pointer-lens-native");
      root.style.setProperty("--lens-opacity", shouldShow ? "1" : "0");
      root.style.setProperty("--lens-scale", shouldShow ? "1" : "0.12");
      root.style.setProperty("--lens-stretch-x", "1");
      root.style.setProperty("--lens-stretch-y", "1");
      root.style.setProperty("--lens-header-scale", shouldShow && isHeaderHover ? "1" : "0");
      root.style.setProperty("--lens-over-header", (shouldShow ? headerOverlap : 0).toFixed(3));
      root.style.setProperty("--glass-overlap", (shouldShow ? headerOverlap : 0).toFixed(3));
      root.style.setProperty("--glass-bubble-opacity", shouldShow && headerOverlap > 0 ? "1" : "0");
      root.style.setProperty("--glass-bubble-scale", (1 + headerOverlap * 0.004).toFixed(3));
      root.style.setProperty("--glass-bubble-scale-x", (1 + headerOverlap * 0.012).toFixed(3));
      root.style.setProperty("--glass-bubble-scale-y", (1 - headerOverlap * 0.018).toFixed(3));
      root.style.setProperty("--glass-grid-opacity", (0.24 + headerOverlap * 0.09).toFixed(3));
      root.style.setProperty("--glass-grid-scale", (1.01 + headerOverlap * 0.01).toFixed(3));
      root.style.setProperty("--glass-grid-shift-x", `${(headerOverlap * 7).toFixed(2)}px`);
      root.style.setProperty("--glass-grid-shift-y", `${(headerOverlap * -2.4).toFixed(2)}px`);
      root.style.setProperty("--glass-chroma-opacity", (headerOverlap * 0.08).toFixed(3));
    };

    const updateScrollState = () => {
      updateHeaderRect();
      setLensState();
    };

    const updateHeaderRect = () => {
      const header = document.querySelector("[data-blog-header]");
      if (header) {
        const rect = header.getBoundingClientRect();
        headerRect = { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom, width: rect.width, height: rect.height };
      }
    };

    const updateHeaderState = (x: number, y: number) => {
      if (!headerRect.width) {
        isHeaderHover = false;
        headerOverlap = 0;
        return;
      }

      const lensRadius = 66;
      const closestX = Math.max(headerRect.left, Math.min(x, headerRect.right));
      const closestY = Math.max(headerRect.top, Math.min(y, headerRect.bottom));
      const distance = Math.hypot(x - closestX, y - closestY);
      headerOverlap = Math.max(0, Math.min(1, 1 - distance / lensRadius));
      isHeaderHover = headerOverlap > 0.02;

      root.style.setProperty("--glass-pointer-x", `${Math.max(0, Math.min(100, ((x - headerRect.left) / headerRect.width) * 100)).toFixed(2)}%`);
      root.style.setProperty("--glass-pointer-y", `${Math.max(0, Math.min(100, ((y - headerRect.top) / headerRect.height) * 100)).toFixed(2)}%`);
    };

    const writePointerVars = () => {
      frame = 0;
      visualX += (pointerX - visualX) * 0.85;
      visualY += (pointerY - visualY) * 0.85;

      const dx = (visualX / window.innerWidth - 0.5) * 2;
      const dy = (visualY / window.innerHeight - 0.5) * 2;

      root.style.setProperty("--lens-x", `${visualX.toFixed(2)}px`);
      root.style.setProperty("--lens-y", `${visualY.toFixed(2)}px`);
      root.style.setProperty("--lens-inner-x", `${(-visualX).toFixed(2)}px`);
      root.style.setProperty("--lens-inner-y", `${(-visualY - window.scrollY).toFixed(2)}px`);
      root.style.setProperty("--hero-tilt-x", `${Math.max(-8, Math.min(8, -dy * 8)).toFixed(2)}deg`);
      root.style.setProperty("--hero-tilt-y", `${Math.max(-10, Math.min(10, dx * 10)).toFixed(2)}deg`);
      root.style.setProperty("--hero-move-x", `${Math.max(-16, Math.min(16, dx * 16)).toFixed(2)}px`);
      root.style.setProperty("--hero-move-y", `${Math.max(-16, Math.min(16, dy * 14)).toFixed(2)}px`);
      root.style.setProperty("--blog-grid-x", `${(-dx * 22).toFixed(2)}px`);
      root.style.setProperty("--blog-grid-y", `${(-dy * 22).toFixed(2)}px`);
      root.style.setProperty("--blog-grid-tilt-x", `${Math.max(-4, Math.min(4, dy * 4)).toFixed(2)}deg`);
      root.style.setProperty("--blog-grid-tilt-y", `${Math.max(-5, Math.min(5, -dx * 5)).toFixed(2)}deg`);
      updateHeaderState(visualX, visualY);
      setLensState();

      if (isVisible && (Math.abs(pointerX - visualX) > 0.5 || Math.abs(pointerY - visualY) > 0.5)) {
        frame = window.requestAnimationFrame(writePointerVars);
      } else {
        frame = 0;
        if (isVisible) {
          visualX = pointerX;
          visualY = pointerY;
        }
      }
    };

    const queueFrame = () => {
      if (!frame) frame = window.requestAnimationFrame(writePointerVars);
    };

    const handleMove = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;

      enableLens();
      pointerX = event.clientX;
      pointerY = event.clientY;
      isVisible = true;
      queueFrame();
    };

    const handlePointerLeave = () => {
      isVisible = false;
      isHeaderHover = false;
      headerOverlap = 0;
      setLensState();
    };

    if (hasMouseInput) root.classList.add("pointer-lens-enabled");
    updateScrollState();
    if (hasMouseInput) queueFrame();

    window.addEventListener("pointermove", handleMove, { passive: true });
    root.addEventListener("pointerleave", handlePointerLeave);
    root.addEventListener("mouseleave", handlePointerLeave);
    window.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      root.classList.remove("pointer-lens-enabled", "pointer-lens-active", "pointer-lens-header", "pointer-lens-native");
      root.style.removeProperty("--lens-opacity");
      root.style.removeProperty("--lens-scale");
      root.style.removeProperty("--lens-stretch-x");
      root.style.removeProperty("--lens-stretch-y");
      root.style.removeProperty("--lens-header-scale");
      root.style.removeProperty("--lens-over-header");
      root.style.removeProperty("--glass-overlap");
      root.style.removeProperty("--glass-bubble-opacity");
      root.style.removeProperty("--glass-bubble-scale");
      root.style.removeProperty("--glass-bubble-scale-x");
      root.style.removeProperty("--glass-bubble-scale-y");
      root.style.removeProperty("--glass-grid-opacity");
      root.style.removeProperty("--glass-grid-scale");
      root.style.removeProperty("--glass-grid-shift-x");
      root.style.removeProperty("--glass-grid-shift-y");
      root.style.removeProperty("--glass-chroma-opacity");
      root.style.removeProperty("--lens-x");
      root.style.removeProperty("--lens-y");
      root.style.removeProperty("--lens-inner-x");
      root.style.removeProperty("--lens-inner-y");
      root.style.removeProperty("--hero-tilt-x");
      root.style.removeProperty("--hero-tilt-y");
      root.style.removeProperty("--hero-move-x");
      root.style.removeProperty("--hero-move-y");
      root.style.removeProperty("--blog-grid-x");
      root.style.removeProperty("--blog-grid-y");
      root.style.removeProperty("--blog-grid-tilt-x");
      root.style.removeProperty("--blog-grid-tilt-y");
      root.style.removeProperty("--glass-pointer-x");
      root.style.removeProperty("--glass-pointer-y");
      window.removeEventListener("pointermove", handleMove);
      root.removeEventListener("pointerleave", handlePointerLeave);
      root.removeEventListener("mouseleave", handlePointerLeave);
      window.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, []);

  return (
    <div className="pointer-lens" aria-hidden="true" />
  );
}
