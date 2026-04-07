"use client";

import { motion } from "framer-motion";
import React from "react";

export const AnimatedSection = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => {
  return (
    <motion.div
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-50px" }}
      variants={{
        hidden: { opacity: 0 },
        show: {
          opacity: 1,
          transition: { staggerChildren: 0.1 }
        }
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export const AnimatedItem = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};
