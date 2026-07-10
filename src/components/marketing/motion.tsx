"use client";

import * as React from "react";
import { motion, useInView, useMotionValue, useSpring, animate, type Variants } from "framer-motion";
import { cn } from "@/lib/utils/cn";

const easeOut = [0.16, 1, 0.3, 1] as const;

/** Fade + rise into view once. */
export function Reveal({
  children,
  className,
  delay = 0,
  y = 24,
  as = "div",
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  as?: "div" | "span" | "li" | "section";
}) {
  const MotionTag = motion[as] as typeof motion.div;
  return (
    <MotionTag
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, ease: easeOut, delay }}
    >
      {children}
    </MotionTag>
  );
}

const containerVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
};
const itemVariants: Variants = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.65, ease: easeOut } },
};

export function StaggerGroup({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div className={className} variants={containerVariants} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }}>
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div className={className} variants={itemVariants}>
      {children}
    </motion.div>
  );
}

/** Animated number that counts up when scrolled into view. */
export function CountUp({
  to,
  suffix = "",
  prefix = "",
  duration = 1.6,
  decimals = 0,
  className,
}: {
  to: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
  decimals?: number;
  className?: string;
}) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const [value, setValue] = React.useState(0);

  React.useEffect(() => {
    if (!inView) return;
    const controls = animate(0, to, {
      duration,
      ease: easeOut,
      onUpdate: (v) => setValue(v),
    });
    return () => controls.stop();
  }, [inView, to, duration]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {value.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
      {suffix}
    </span>
  );
}

/** Cursor spotlight that follows the mouse inside its bounds. */
export function Spotlight({ className }: { className?: string }) {
  const x = useMotionValue(-400);
  const y = useMotionValue(-400);
  const sx = useSpring(x, { stiffness: 120, damping: 22, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 120, damping: 22, mass: 0.4 });

  return (
    <motion.div
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        x.set(e.clientX - rect.left);
        y.set(e.clientY - rect.top);
      }}
      onMouseLeave={() => {
        x.set(-400);
        y.set(-400);
      }}
      className={cn("pointer-events-auto absolute inset-0", className)}
    >
      <motion.div
        aria-hidden
        className="pointer-events-none absolute size-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-40 blur-[80px]"
        style={{
          left: sx,
          top: sy,
          background: "radial-gradient(circle, hsl(var(--primary) / 0.5), transparent 60%)",
        }}
      />
    </motion.div>
  );
}

export { motion };
