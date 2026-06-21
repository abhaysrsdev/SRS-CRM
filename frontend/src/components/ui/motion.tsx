import React from 'react';
import { motion } from 'framer-motion';
import type { HTMLMotionProps } from 'framer-motion';

export const FadeIn = ({ children, delay = 0, className, ...props }: HTMLMotionProps<"div"> & { delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay, ease: "easeOut" }}
    className={className}
    {...props}
  >
    {children}
  </motion.div>
);

export const SlideInRight = ({ children, delay = 0, className, ...props }: HTMLMotionProps<"div"> & { delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, x: 50 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
    className={className}
    {...props}
  >
    {children}
  </motion.div>
);

export const StaggerContainer = ({ children, className, ...props }: HTMLMotionProps<"div">) => (
  <motion.div
    variants={{
      hidden: { opacity: 0 },
      show: {
        opacity: 1,
        transition: { staggerChildren: 0.1 }
      }
    }}
    initial="hidden"
    animate="show"
    className={className}
    {...props}
  >
    {children}
  </motion.div>
);

export const StaggerItem = ({ children, className, ...props }: HTMLMotionProps<"div">) => (
  <motion.div
    variants={{
      hidden: { opacity: 0, scale: 0.95 },
      show: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 300, damping: 24 } }
    }}
    className={className}
    {...props}
  >
    {children}
  </motion.div>
);
