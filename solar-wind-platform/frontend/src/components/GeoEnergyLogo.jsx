import React from 'react';

export default function GeoEnergyLogo({ type = 'full', size = 'normal', className = '' }) {
  
  // Premium vector circular app icon combining Globe, Solar, Wind, and AI circuit themes
  const AppIcon = () => (
    <svg 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full select-none"
    >
      <defs>
        {/* Border and fill gradients */}
        <linearGradient id="borderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#16A34A" />
          <stop offset="50%" stopColor="#0EA5E9" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>
        
        <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0F172A" />
          <stop offset="100%" stopColor="#020617" />
        </linearGradient>

        <linearGradient id="sunGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>
      </defs>

      {/* Circular Background Card */}
      <circle cx="50" cy="50" r="46" fill="url(#bgGrad)" stroke="url(#borderGrad)" strokeWidth="2.5" />

      {/* 1. Globe Latitude & Longitude lines (GIS Mapping) */}
      <ellipse cx="50" cy="50" rx="30" ry="46" stroke="#ffffff" strokeOpacity="0.08" strokeWidth="1" fill="none" />
      <ellipse cx="50" cy="50" rx="46" ry="18" stroke="#ffffff" strokeOpacity="0.08" strokeWidth="1" fill="none" />
      <line x1="4" y1="50" x2="96" y2="50" stroke="#ffffff" strokeOpacity="0.08" strokeWidth="1" />
      <line x1="50" y1="4" x2="50" y2="96" stroke="#ffffff" strokeOpacity="0.08" strokeWidth="1" />

      {/* 2. AI Circuit Network Lines & Nodes */}
      <path d="M 28 35 L 42 35 L 50 50 L 50 68" stroke="#0EA5E9" strokeOpacity="0.4" strokeWidth="1.2" strokeLinecap="round" fill="none" />
      <path d="M 72 35 L 58 35 L 50 50" stroke="#16A34A" strokeOpacity="0.4" strokeWidth="1.2" strokeLinecap="round" fill="none" />
      <path d="M 32 68 L 42 68 L 50 50" stroke="#F59E0B" strokeOpacity="0.4" strokeWidth="1.2" strokeLinecap="round" fill="none" />
      
      {/* Node Dots */}
      <circle cx="28" cy="35" r="2.5" fill="#0EA5E9" />
      <circle cx="72" cy="35" r="2.5" fill="#16A34A" />
      <circle cx="32" cy="68" r="2.5" fill="#F59E0B" />

      {/* 3. Solar panels / Sun rays (Upper-Right section) */}
      <circle cx="70" cy="30" r="8" fill="url(#sunGrad)" />
      {/* Solar Panel grid lines */}
      <line x1="64" y1="28" x2="76" y2="34" stroke="#ffffff" strokeOpacity="0.3" strokeWidth="1" />
      <line x1="67" y1="25" x2="73" y2="37" stroke="#ffffff" strokeOpacity="0.3" strokeWidth="1" />

      {/* 4. Wind Turbine structure (Center-left section) */}
      <path d="M 46 76 L 49 50 L 51 50 L 54 76 Z" fill="#94A3B8" fillOpacity="0.4" />
      {/* Spinning Blades */}
      <g className="animate-spin-slow origin-[50px_50px]">
        {/* Center hub */}
        <circle cx="50" cy="50" r="3" fill="#ffffff" />
        {/* Blade 1 */}
        <path d="M 50 50 Q 52 35 50 20 Q 48 35 50 50 Z" fill="#ffffff" fillOpacity="0.9" />
        {/* Blade 2 */}
        <path d="M 50 50 Q 63 58 76 65 Q 61 63 50 50 Z" fill="#ffffff" fillOpacity="0.9" />
        {/* Blade 3 */}
        <path d="M 50 50 Q 37 58 24 65 Q 39 63 50 50 Z" fill="#ffffff" fillOpacity="0.9" />
      </g>

      {/* 5. Central Energy Lightning Bolt (Overlay) */}
      <path 
        d="M 52 42 L 44 52 L 49 52 L 46 62 L 56 50 L 50 50 Z" 
        fill="#F59E0B" 
        stroke="#020617" 
        strokeWidth="1" 
        strokeLinejoin="round" 
      />
    </svg>
  );

  // Return requested format
  if (type === 'icon') {
    return (
      <div className={`relative flex items-center justify-center shrink-0 ${className}`}>
        <AppIcon />
      </div>
    );
  }

  // Horizontal logo layout with brand name and tagline
  const isLarge = size === 'large';
  
  return (
    <div className={`flex items-center space-x-3 text-left ${className}`}>
      <div className={isLarge ? "w-14 h-14" : "w-10 h-10"}>
        <AppIcon />
      </div>
      <div className="flex flex-col justify-center">
        <span className={`font-black bg-gradient-to-r from-[#16A34A] via-[#0EA5E9] to-[#F59E0B] bg-clip-text text-transparent tracking-wider leading-none ${
          isLarge ? "text-2xl" : "text-lg"
        }`}>
          GeoEnergy AI
        </span>
        <span className={`text-[#94a3b8] font-extrabold uppercase tracking-widest mt-1.5 leading-none ${
          isLarge ? "text-[10px]" : "text-[8px]"
        }`}>
          Smart Renewable Energy Intelligence
        </span>
      </div>
    </div>
  );
}
