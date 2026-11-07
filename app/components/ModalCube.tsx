'use client'

import React from 'react'

interface ModalCubeProps {
  size?: 'sm' | 'md' | 'lg' | 'hero'
  className?: string
  interactive?: boolean
}

export default function ModalCube({ size = 'hero', className = '', interactive = true }: ModalCubeProps) {
  const dimensions = {
    sm: { container: 'w-8 h-8', cube: 'w-6 h-6', orb: 'w-3 h-3', glow: 'w-10 h-10' },
    md: { container: 'w-16 h-16', cube: 'w-12 h-12', orb: 'w-6 h-6', glow: 'w-24 h-24' },
    lg: { container: 'w-48 h-48', cube: 'w-36 h-36', orb: 'w-20 h-20', glow: 'w-64 h-64' },
    hero: { container: 'w-56 h-56 sm:w-80 sm:h-80 md:w-96 md:h-96', cube: 'w-44 h-44 sm:w-56 sm:h-56 md:w-64 md:h-64', orb: 'w-24 h-24 sm:w-32 sm:h-32 md:w-36 md:h-36', glow: 'w-[260px] h-[260px] sm:w-[400px] sm:h-[400px]' },
  }[size]

  return (
    <div className={`relative flex items-center justify-center select-none ${dimensions.container} ${className}`}>
      {/* Background radial caustic light bleed */}
      <div 
        className={`absolute rounded-full pointer-events-none filter blur-3xl opacity-80 animate-modal-pulse ${dimensions.glow}`}
        style={{
          background: 'radial-gradient(circle, rgba(249, 251, 4, 0.45) 0%, rgba(212, 252, 100, 0.3) 35%, rgba(106, 195, 85, 0.12) 65%, transparent 85%)',
        }}
      />

      {/* Outer ambient green aura */}
      <div 
        className="absolute rounded-full pointer-events-none filter blur-2xl opacity-60"
        style={{
          width: '85%',
          height: '85%',
          background: 'radial-gradient(circle, rgba(212, 252, 100, 0.6) 10%, rgba(117, 217, 92, 0.25) 50%, transparent 75%)',
        }}
      />

      {/* 3D Isometric Translucent Glass Cube Structure */}
      <div 
        className={`relative z-10 flex items-center justify-center animate-modal-float ${interactive ? 'transition-transform duration-500 hover:scale-105' : ''}`}
        style={{ perspective: 1000 }}
      >
        <svg
          viewBox="0 0 200 200"
          className="w-full h-full drop-shadow-[0_0_35px_rgba(212,252,100,0.5)]"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Top Face Gradient */}
            <linearGradient id="topFace" x1="100" y1="30" x2="100" y2="95" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#d4fc64" stopOpacity="0.55" />
              <stop offset="50%" stopColor="#75d95c" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#273823" stopOpacity="0.45" />
            </linearGradient>

            {/* Left Face Gradient */}
            <linearGradient id="leftFace" x1="30" y1="95" x2="100" y2="165" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#75d95c" stopOpacity="0.4" />
              <stop offset="60%" stopColor="#1e3a1e" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#0d1f0d" stopOpacity="0.7" />
            </linearGradient>

            {/* Right Face Gradient */}
            <linearGradient id="rightFace" x1="100" y1="95" x2="170" y2="165" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#d4fc64" stopOpacity="0.45" />
              <stop offset="60%" stopColor="#569846" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#122512" stopOpacity="0.65" />
            </linearGradient>

            {/* Internal Core Glow */}
            <radialGradient id="coreOrb" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
              <stop offset="25%" stopColor="#f9fb04" stopOpacity="0.95" />
              <stop offset="65%" stopColor="#d4fc64" stopOpacity="0.8" />
              <stop offset="88%" stopColor="#6ac355" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#07b976" stopOpacity="0" />
            </radialGradient>

            <filter id="orbBlur" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="8" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Core Yellow/Lime Glowing Orb inside cube */}
          <circle
            cx="100"
            cy="105"
            r="44"
            fill="url(#coreOrb)"
            filter="url(#orbBlur)"
            className="animate-pulse"
          />

          {/* Internal reflection ring */}
          <circle
            cx="98"
            cy="102"
            r="32"
            fill="#ffea71"
            opacity="0.6"
            filter="blur(4px)"
          />

          {/* Top Face of Cube */}
          <polygon
            points="100,28 168,64 100,100 32,64"
            fill="url(#topFace)"
            stroke="#d4fc64"
            strokeWidth="1.75"
            strokeLinejoin="round"
            className="opacity-95"
          />

          {/* Top Surface Specular Highlights */}
          <path
            d="M 100,32 L 164,65 L 100,97 L 36,65 Z"
            stroke="rgba(255, 255, 255, 0.45)"
            strokeWidth="0.75"
            fill="none"
          />

          {/* Left Face of Cube */}
          <polygon
            points="32,64 100,100 100,172 32,136"
            fill="url(#leftFace)"
            stroke="#75d95c"
            strokeWidth="1.75"
            strokeLinejoin="round"
            className="opacity-90"
          />

          {/* Right Face of Cube */}
          <polygon
            points="100,100 168,64 168,136 100,172"
            fill="url(#rightFace)"
            stroke="#d4fc64"
            strokeWidth="1.75"
            strokeLinejoin="round"
            className="opacity-95"
          />

          {/* Center Vertical Edge Highlight */}
          <line
            x1="100"
            y1="100"
            x2="100"
            y2="172"
            stroke="#ffffff"
            strokeWidth="1.5"
            opacity="0.85"
          />

          {/* Sharp Caustic Accent Points */}
          <circle cx="100" cy="28" r="2.5" fill="#ffffff" />
          <circle cx="168" cy="64" r="2.5" fill="#d4fc64" />
          <circle cx="32" cy="64" r="2.5" fill="#75d95c" />
          <circle cx="100" cy="100" r="3" fill="#ffffff" />
          <circle cx="100" cy="172" r="2.5" fill="#d4fc64" />
        </svg>
      </div>
    </div>
  )
}
