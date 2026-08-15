'use client';

import React, { useState } from 'react';

/**
 * CrystalIcon component - Displays high-fidelity 3D multi-faceted crystal gem
 * with transparent background and SVG fallback.
 */
export default function CrystalIcon({ className = "w-5 h-5", animate = true }) {
  const [imgError, setImgError] = useState(false);

  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 ${animate ? 'animate-pulse' : ''}`}>
      {!imgError ? (
        <img
          src="/images/crystal_icon.png"
          alt="Pha Lê"
          className={`object-contain drop-shadow-[0_0_10px_rgba(244,114,182,0.6)] ${className}`}
          style={{ mixBlendMode: 'screen' }}
          onError={() => setImgError(true)}
        />
      ) : (
        /* Vector SVG Teardrop Multi-faceted Prismatic Crystal Gem Fallback */
        <svg
          viewBox="0 0 100 120"
          className={`object-contain drop-shadow-[0_0_8px_rgba(234,179,8,0.7)] ${className}`}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="facetTop" x1="50" y1="5" x2="50" y2="45" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="100%" stopColor="#ec4899" />
            </linearGradient>
            <linearGradient id="facetLeft" x1="10" y1="45" x2="50" y2="115" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#818cf8" />
            </linearGradient>
            <linearGradient id="facetRight" x1="90" y1="45" x2="50" y2="115" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#f43f5e" />
              <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>
            <linearGradient id="facetCenter" x1="30" y1="35" x2="70" y2="90" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="50%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#d946ef" />
            </linearGradient>
          </defs>
          {/* Top Tip Facets */}
          <polygon points="50,5 30,35 50,45" fill="url(#facetTop)" opacity="0.9" />
          <polygon points="50,5 50,45 70,35" fill="url(#facetTop)" />
          
          {/* Outer Facets */}
          <polygon points="50,5 15,45 30,35" fill="#38bdf8" opacity="0.8" />
          <polygon points="50,5 70,35 85,45" fill="#f43f5e" opacity="0.8" />
          
          {/* Mid Body Facets */}
          <polygon points="15,45 30,35 50,45" fill="#60a5fa" opacity="0.75" />
          <polygon points="85,45 70,35 50,45" fill="#fb7185" opacity="0.75" />
          
          {/* Center Main Prism Facet */}
          <polygon points="30,35 50,45 70,35 50,115" fill="url(#facetCenter)" />
          
          {/* Lower Side Facets */}
          <polygon points="15,45 50,45 50,115" fill="url(#facetLeft)" />
          <polygon points="85,45 50,45 50,115" fill="url(#facetRight)" />

          {/* Highlights / Shimmer lines */}
          <line x1="50" y1="5" x2="50" y2="115" stroke="#ffffff" strokeWidth="1.5" opacity="0.7" />
          <line x1="30" y1="35" x2="50" y2="115" stroke="#ffffff" strokeWidth="1" opacity="0.5" />
        </svg>
      )}
    </div>
  );
}
