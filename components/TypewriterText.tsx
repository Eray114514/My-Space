"use client";

import { useEffect, useState } from "react";

interface TypewriterTextProps {
  text: string;
  className?: string;
  speed?: number;
  delay?: number;
  onComplete?: () => void;
}

export function TypewriterText({
  text,
  className = "",
  speed = 60,
  delay = 300,
  onComplete,
}: TypewriterTextProps) {
  const [displayed, setDisplayed] = useState("");
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const isTouch =
      window.matchMedia("(hover: none)").matches ||
      (window.matchMedia("(any-pointer: coarse)").matches &&
        !window.matchMedia("(any-pointer: fine)").matches);

    // PC 端不启用打字机，直接显示
    if (!isTouch) {
      setDisplayed(text);
      onComplete?.();
      return;
    }

    const startTimer = setTimeout(() => {
      setStarted(true);
    }, delay);

    return () => clearTimeout(startTimer);
  }, [delay, onComplete, text]);

  useEffect(() => {
    if (!started) return;

    let i = 0;
    const timer = setInterval(() => {
      i += 1;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(timer);
        onComplete?.();
      }
    }, speed);

    return () => clearInterval(timer);
  }, [started, text, speed, onComplete]);

  return (
    <span className={`typewriter-text ${className}`}>
      {displayed}
      {started && displayed.length < text.length && (
        <span className="typewriter-cursor" />
      )}
    </span>
  );
}
