"use client";

import { cn } from "@/lib/utils";
import { motion, useScroll, MotionProps } from "framer-motion";
import React, { useRef, useEffect } from "react";

interface SidebarScrollProgressProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, keyof MotionProps> {
  containerId: string;
}

export const SidebarScrollProgress = React.forwardRef<
  HTMLDivElement,
  SidebarScrollProgressProps
>(({ className, containerId, ...props }, ref) => {
  const containerRef = useRef<HTMLElement | null>(null);
  
  useEffect(() => {
    containerRef.current = document.getElementById(containerId);
  }, [containerId]);

  const { scrollYProgress } = useScroll({
    container: containerRef
  });

  return (
    <motion.div
      ref={ref}
      className={cn(
        // "sticky top-0 h-0.5 origin-left bg-gradient-to-r from-[#A97CF8] via-[#F38CB8] to-[#FDCC92] z-[100]",
        "sticky top-0 h-0.5 origin-left bg-gradient-to-r from-primary via-primary/80 to-accent z-[100]",
        className,
      )}
      style={{
        scaleX: scrollYProgress,
      }}
      {...props}
    />
  );
});

SidebarScrollProgress.displayName = "SidebarScrollProgress";
