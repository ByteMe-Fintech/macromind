import React from 'react';
import { motion } from 'motion/react';

export function AestheticOverlays() {
  return (
    <>
      {/* Paper Grain Texture - Using internal SVG noise instead of external URL */}
      <div 
        className="fixed inset-0 pointer-events-none z-[100] opacity-[0.03]" 
        style={{ 
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` 
        }}
      />
      
      {/* Subtle Ink Bleed / Vignette */}
      <div className="fixed inset-0 pointer-events-none z-[101] shadow-[inset_0_0_200px_rgba(0,0,0,0.05)]" />

      {/* Halftone Pattern (Very Subtle) */}
      <div className="fixed inset-0 pointer-events-none z-[99] opacity-[0.02] bg-[radial-gradient(#000_1px,transparent_0)] bg-[length:10px_10px]" />
    </>
  );
}
