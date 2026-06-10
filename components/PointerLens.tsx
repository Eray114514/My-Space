"use client";

import { useEffect } from "react";

interface PointerLensProps {
  adminName: string;
}

export function PointerLens({ adminName }: PointerLensProps) {
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
    let isPastHero = false;

    const enableLens = () => {
      if (!hasMouseInput) hasMouseInput = true;
      root.classList.add("pointer-lens-enabled");
    };

    const setLensState = () => {
      const shouldShow = hasMouseInput && isVisible && !isPastHero;
      root.classList.toggle("pointer-lens-active", shouldShow);
      root.classList.toggle("pointer-lens-header", shouldShow && isHeaderHover);
      root.classList.toggle("pointer-lens-native", isPastHero);
      root.style.setProperty("--lens-opacity", shouldShow ? (isHeaderHover ? "0.16" : "1") : "0");
      root.style.setProperty("--lens-scale", shouldShow ? (isHeaderHover ? "0.16" : "1") : "0.12");
    };

    const updateScrollState = () => {
      isPastHero = window.scrollY > window.innerHeight * 0.65;
      setLensState();
    };

    const updateHeaderState = (x: number, y: number) => {
      const header = document.querySelector("[data-blog-header]");
      if (!header) {
        isHeaderHover = false;
        return;
      }

      const rect = header.getBoundingClientRect();
      const padding = 16;
      isHeaderHover =
        x >= rect.left - padding &&
        x <= rect.right + padding &&
        y >= rect.top - padding &&
        y <= rect.bottom + padding;
    };

    const writePointerVars = () => {
      frame = 0;
      visualX += (pointerX - visualX) * 0.24;
      visualY += (pointerY - visualY) * 0.24;

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

      if (isVisible && !isPastHero) {
        frame = window.requestAnimationFrame(writePointerVars);
      }
    };

    const queueFrame = () => {
      if (!frame) frame = window.requestAnimationFrame(writePointerVars);
    };

    const handleMove = (event: PointerEvent | MouseEvent) => {
      const isPointerEvent = "pointerType" in event;
      const isMouseLike = !isPointerEvent || event.pointerType === "mouse";
      if (!isMouseLike) return;

      enableLens();
      pointerX = event.clientX;
      pointerY = event.clientY;
      isVisible = true;
      updateHeaderState(pointerX, pointerY);
      setLensState();
      queueFrame();
    };

    const handlePointerLeave = () => {
      isVisible = false;
      isHeaderHover = false;
      setLensState();
    };

    if (hasMouseInput) root.classList.add("pointer-lens-enabled");
    updateScrollState();
    setLensState();
    if (hasMouseInput) queueFrame();

    window.addEventListener("pointermove", handleMove, { passive: true });
    window.addEventListener("mousemove", handleMove, { passive: true });
    root.addEventListener("pointerleave", handlePointerLeave);
    root.addEventListener("mouseleave", handlePointerLeave);
    window.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      root.classList.remove("pointer-lens-enabled", "pointer-lens-active", "pointer-lens-header", "pointer-lens-native");
      root.style.removeProperty("--lens-opacity");
      root.style.removeProperty("--lens-scale");
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
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("mousemove", handleMove);
      root.removeEventListener("pointerleave", handlePointerLeave);
      root.removeEventListener("mouseleave", handlePointerLeave);
      window.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, []);

  return (
    <div className="pointer-lens" aria-hidden="true">
      <div className="pointer-lens-stage">
        <p className="pointer-lens-eyebrow">文章 · 想法 · 技术实践</p>
        <p className="pointer-lens-title">HELLO, THIS IS {adminName.toUpperCase()}</p>
        <p className="pointer-lens-subtitle">写给现在，也写给以后。</p>
      </div>
    </div>
  );
}
