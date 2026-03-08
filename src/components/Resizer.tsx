"use client";

import { useCallback, useEffect, useState } from "react";

type ResizerProps = {
  leftPercent: number;
  onResize: (leftPercent: number) => void;
  className?: string;
};

export default function Resizer({
  leftPercent,
  onResize,
  className = "",
}: ResizerProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragging(true);
    },
    []
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      const percent = (e.clientX / window.innerWidth) * 100;
      const clamped = Math.max(15, Math.min(85, percent));
      onResize(clamped);
    },
    [onResize]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (!isDragging) return;
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <div
      className={`w-1 flex-shrink-0 bg-gray-300 hover:bg-accent cursor-col-resize select-none flex items-center justify-center group ${className}`}
      style={{ minWidth: 4 }}
      onMouseDown={handleMouseDown}
      role="separator"
      aria-valuenow={leftPercent}
    >
      <div className="w-1 h-12 bg-gray-400 group-hover:bg-accent rounded-full transition" />
    </div>
  );
}
