'use client';

import { motion } from 'framer-motion';
import React from 'react';
import { usePathname } from 'next/navigation';

export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.4, 
        ease: [0.25, 0.1, 0.25, 1], // Apple-like ease-out curve
      }}
    >
      {children}
    </motion.div>
  );
}
