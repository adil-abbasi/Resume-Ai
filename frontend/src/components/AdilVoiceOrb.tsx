import React, { useRef, useEffect } from 'react';
import { VoiceState } from '../services/voiceService';

interface AdilVoiceOrbProps {
  state: VoiceState;
  audioLevel?: number; // 0.0 to 1.0 (audio-reactive amplitude)
  onClick?: () => void;
  size?: number; // diameter in pixels (default 260)
}

export const AdilVoiceOrb: React.FC<AdilVoiceOrbProps> = ({
  state,
  audioLevel = 0,
  onClick,
  size = 280
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const stateRef = useRef<VoiceState>(state);
  const audioLevelRef = useRef<number>(audioLevel);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    audioLevelRef.current = audioLevel;
  }, [audioLevel]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle High DPI displays for crisp rendering
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    let time = 0;
    const center = size / 2;
    const baseRadius = size * 0.32;

    // Floating particle field
    const particles = Array.from({ length: 24 }, (_, i) => ({
      angle: (i / 24) * Math.PI * 2,
      distance: baseRadius * (0.8 + Math.random() * 0.6),
      speed: 0.008 + Math.random() * 0.012,
      size: 1.5 + Math.random() * 2.5,
      opacity: 0.2 + Math.random() * 0.6,
      phase: Math.random() * Math.PI * 2
    }));

    const render = () => {
      time += 0.024;
      ctx.clearRect(0, 0, size, size);

      const currentState = stateRef.current;
      const currentAudio = audioLevelRef.current;

      // Determine state dynamic parameters
      let speedMult = 1.0;
      let deformAmp = 6.0;
      let energyBoost = 0;
      let coreColor1 = '#6366f1'; // Indigo
      let coreColor2 = '#8b5cf6'; // Purple
      let glowColor = 'rgba(99, 102, 241, 0.4)';

      switch (currentState) {
        case 'Connecting':
          speedMult = 0.8;
          deformAmp = 4.0;
          coreColor1 = '#f59e0b';
          coreColor2 = '#6366f1';
          glowColor = 'rgba(245, 158, 11, 0.35)';
          break;
        case 'Listening':
          // Subtle organic breathing motion
          speedMult = 1.1;
          deformAmp = 5.0 + Math.sin(time * 1.5) * 2.0;
          coreColor1 = '#06b6d4'; // Cyan
          coreColor2 = '#10b981'; // Emerald
          glowColor = 'rgba(16, 185, 129, 0.38)';
          break;
        case 'Thinking':
          // Fast swirling concentric vortex
          speedMult = 2.4;
          deformAmp = 9.0;
          coreColor1 = '#a855f7'; // Purple
          coreColor2 = '#ec4899'; // Pink
          glowColor = 'rgba(168, 85, 247, 0.45)';
          break;
        case 'Speaking':
          // Dynamic audio-reactive wave oscillations with radiant energy
          speedMult = 1.8 + currentAudio * 1.5;
          deformAmp = 10.0 + currentAudio * 22.0;
          energyBoost = currentAudio * 18.0;
          coreColor1 = '#38bdf8'; // Sky blue
          coreColor2 = '#6366f1'; // Indigo
          glowColor = `rgba(56, 189, 248, ${0.4 + currentAudio * 0.45})`;
          break;
        case 'Processing':
          speedMult = 1.4;
          deformAmp = 7.0;
          coreColor1 = '#3b82f6';
          coreColor2 = '#14b8a6';
          glowColor = 'rgba(20, 184, 166, 0.4)';
          break;
      }

      const activeRadius = baseRadius + energyBoost;

      // 1. Outer Radiant Glow Halos (Additive blending)
      ctx.save();
      ctx.globalCompositeOperation = 'screen';

      const outerGlow = ctx.createRadialGradient(
        center, center, activeRadius * 0.5,
        center, center, activeRadius * 1.8
      );
      outerGlow.addColorStop(0, glowColor);
      outerGlow.addColorStop(0.6, glowColor.replace(/[\d\.]+\)$/, '0.15)'));
      outerGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = outerGlow;
      ctx.beginPath();
      ctx.arc(center, center, activeRadius * 1.8, 0, Math.PI * 2);
      ctx.fill();

      // Concentric soundwave ripples while speaking
      if (currentState === 'Speaking' && currentAudio > 0.15) {
        const rippleCount = 3;
        for (let r = 1; r <= rippleCount; r++) {
          const rRadius = activeRadius * (1.0 + r * 0.22 * currentAudio) + (time * 15 * r) % (size * 0.2);
          ctx.beginPath();
          ctx.arc(center, center, rRadius, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(56, 189, 248, ${Math.max(0, 0.3 - r * 0.08)})`;
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      }

      // 2. Animated Deformed Organic Orb Body
      const points = 48;
      const t = time * speedMult;

      ctx.beginPath();
      for (let i = 0; i <= points; i++) {
        const angle = (i / points) * Math.PI * 2;
        // Multiscale harmonic noise deformation
        const wave1 = Math.sin(angle * 3 + t * 1.6);
        const wave2 = Math.cos(angle * 5 - t * 2.2);
        const wave3 = Math.sin(angle * 7 + t * 3.1);
        const wave4 = Math.sin(angle * 2 - t * 0.9);

        const r = activeRadius + (wave1 * 0.4 + wave2 * 0.3 + wave3 * 0.2 + wave4 * 0.1) * deformAmp;
        const x = center + Math.cos(angle) * r;
        const y = center + Math.sin(angle) * r;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();

      // Fluid linear/radial gradient fill
      const orbGrad = ctx.createLinearGradient(
        center - activeRadius,
        center - activeRadius,
        center + activeRadius,
        center + activeRadius
      );
      orbGrad.addColorStop(0, coreColor1);
      orbGrad.addColorStop(0.5, coreColor2);
      orbGrad.addColorStop(1, '#1e1b4b'); // Deep indigo dark base

      ctx.fillStyle = orbGrad;
      ctx.fill();

      // Soft rim highlight
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.stroke();

      // 3. Inner Swirling Radiant Core
      const coreGrad = ctx.createRadialGradient(
        center - activeRadius * 0.25,
        center - activeRadius * 0.25,
        2,
        center,
        center,
        activeRadius * 0.85
      );
      coreGrad.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
      coreGrad.addColorStop(0.3, 'rgba(255, 255, 255, 0.4)');
      coreGrad.addColorStop(0.7, glowColor.replace(/[\d\.]+\)$/, '0.2)'));
      coreGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(center, center, activeRadius * 0.85, 0, Math.PI * 2);
      ctx.fill();

      // 4. Orbiting Stardust Particles
      particles.forEach((p) => {
        p.angle += p.speed * speedMult;
        const pDist = p.distance + Math.sin(time * 2 + p.phase) * (6 + energyBoost * 0.5);
        const px = center + Math.cos(p.angle) * pDist;
        const py = center + Math.sin(p.angle) * pDist;

        ctx.beginPath();
        ctx.arc(px, py, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity * (0.6 + Math.sin(time * 3 + p.phase) * 0.4)})`;
        ctx.fill();
      });

      ctx.restore();

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [size]);

  // State badge styling
  const getStateBadge = () => {
    switch (state) {
      case 'Connecting':
        return {
          label: 'Connecting to Adil\'s AI...',
          badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
          dotClass: 'bg-amber-400 animate-pulse'
        };
      case 'Listening':
        return {
          label: 'Listening naturally (English, Urdu, Hindi)...',
          badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 shadow-sm shadow-emerald-500/20',
          dotClass: 'bg-emerald-400 animate-ping'
        };
      case 'Thinking':
        return {
          label: 'Adil\'s AI is thinking...',
          badgeClass: 'bg-purple-500/20 text-purple-300 border-purple-500/30 shadow-sm shadow-purple-500/20',
          dotClass: 'bg-purple-400 animate-spin'
        };
      case 'Speaking':
        return {
          label: 'Adil\'s AI is speaking (tap to interrupt)...',
          badgeClass: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-md shadow-cyan-500/25',
          dotClass: 'bg-cyan-300 animate-pulse'
        };
      case 'Processing':
        return {
          label: 'Synthesizing Resume Profile...',
          badgeClass: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
          dotClass: 'bg-indigo-400 animate-pulse'
        };
      default:
        return {
          label: 'Ready',
          badgeClass: 'bg-gray-800 text-gray-300 border-gray-700',
          dotClass: 'bg-gray-400'
        };
    }
  };

  const badge = getStateBadge();

  return (
    <div className="flex flex-col items-center justify-center select-none">
      {/* Interactive Orb Canvas Container */}
      <div
        onClick={onClick}
        className="relative group cursor-pointer transition-transform duration-300 hover:scale-[1.03] active:scale-[0.98]"
        title={state === 'Speaking' ? 'Tap orb to interrupt Adil\'s AI' : 'Tap orb to interact'}
      >
        <canvas
          ref={canvasRef}
          style={{ width: `${size}px`, height: `${size}px` }}
          className="rounded-full filter drop-shadow-[0_0_35px_rgba(99,102,241,0.35)]"
        />

        {/* Dynamic Inner Interaction Ring */}
        <div className="absolute inset-0 rounded-full border border-white/10 group-hover:border-white/25 pointer-events-none transition-all duration-300" />

        {/* Hover Hint Overlay */}
        <div className="absolute inset-x-0 bottom-3 text-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
          <span className="px-2.5 py-1 rounded-full bg-gray-950/80 backdrop-blur-md text-[10px] font-medium text-gray-200 border border-white/15 shadow-lg">
            {state === 'Speaking' ? 'Tap to interrupt ✋' : 'Tap to speak 🎙️'}
          </span>
        </div>
      </div>

      {/* Voice Status Pill */}
      <div className="mt-4 flex items-center justify-center">
        <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold border backdrop-blur-md transition-all duration-300 ${badge.badgeClass}`}>
          <span className={`w-2 h-2 rounded-full ${badge.dotClass}`} />
          <span>{badge.label}</span>
        </div>
      </div>
    </div>
  );
};
