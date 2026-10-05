"use client";

import { motion } from "framer-motion";
import { staggerContainer, fadeInUp } from "./variants";

interface StaggerListProps {
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
}

export function StaggerList({
  children,
  className = "",
  staggerDelay,
}: StaggerListProps) {
  const container = staggerDelay
    ? {
        hidden: { opacity: 0 },
        show: {
          opacity: 1,
          transition: { staggerChildren: staggerDelay },
        },
      }
    : staggerContainer;

  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="show"
      variants={container}
    >
      {children}
    </motion.div>
  );
}

interface StaggerItemProps {
  children: React.ReactNode;
  className?: string;
}

export function StaggerItem({ children, className = "" }: StaggerItemProps) {
  return (
    <motion.div className={className} variants={fadeInUp}>
      {children}
    </motion.div>
  );
}