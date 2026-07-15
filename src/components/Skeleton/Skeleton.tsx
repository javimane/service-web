import React from "react";
import "./Skeleton.css";

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  variant?: "rectangular" | "circular" | "text" | "card";
}

export default function Skeleton({
  className = "",
  width,
  height,
  variant = "rectangular",
}: SkeletonProps) {
  return (
    <div
      className={`skeleton skeleton--${variant} ${className}`}
      style={{ width, height }}
    />
  );
}
