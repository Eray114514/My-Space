"use client";

import { motion, useScroll, useSpring } from "framer-motion";

export function ReadingProgress() {
  const { scrollYProgress } = useScroll();
  const scaleY = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 28,
    restDelta: 0.001,
  });

  return (
    <div className="article-progress-rail" aria-hidden="true">
      <motion.div className="article-progress-fill" style={{ scaleY }} />
    </div>
  );
}
