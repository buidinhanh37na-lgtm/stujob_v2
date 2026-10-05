"use client";

import { motion, HTMLMotionProps } from "framer-motion";
import { fadeInUp } from "./variants";

interface FadeInProps extends HTMLMotionProps<"div"> {
  delay?: number;
  children: React.ReactNode;
}

export function FadeIn({ delay = 0, children, ...rest }: FadeInProps) {
  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={fadeInUp}
      transition={{ delay }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}