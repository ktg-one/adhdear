/**
 * Kinetic Canvas Particle & Floating Reward Overlay
 * Renders high-performance particle blasts, disintegration debris,
 * and floating dopamine text awards.
 */

import React, { useEffect, useRef } from 'react';

export interface KineticBlastOptions {
  x?: number;
  y?: number;
  message?: string;
  color?: string;
}

// Global blast dispatch event
export const triggerKineticBlast = (options?: KineticBlastOptions) => {
  const event = new CustomEvent('synapse:kinetic-blast', { detail: options });
  window.dispatchEvent(event);
};

export const KineticCanvasOverlay: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      color: string;
      alpha: number;
      decay: number;
    }

    interface FloatingText {
      x: number;
      y: number;
      vy: number;
      text: string;
      color: string;
      alpha: number;
      decay: number;
    }

    const particles: Particle[] = [];
    const floatingTexts: FloatingText[] = [];

    const handleBlast = (e: Event) => {
      const detail = (e as CustomEvent<KineticBlastOptions>).detail || {};
      const x = detail.x ?? window.innerWidth / 2;
      const y = detail.y ?? window.innerHeight / 2;
      const message = detail.message ?? 'GREAT FOCUS! +150 XP';
      const baseColor = detail.color;

      const colors = baseColor
        ? [baseColor, '#ffffff', '#00f2fe']
        : ['#00f2fe', '#00ff9d', '#ff007f', '#ffaa00', '#ffffff', '#9d4edd'];

      for (let i = 0; i < 75; i++) {
        const color = colors[Math.floor(Math.random() * colors.length)];
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 8 + 2;
        particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 1.8,
          size: Math.random() * 3.5 + 2,
          color,
          alpha: 1,
          decay: Math.random() * 0.02 + 0.015,
        });
      }

      floatingTexts.push({
        x,
        y: y - 24,
        vy: -2.2,
        text: message,
        color: baseColor || '#00ff9d',
        alpha: 1,
        decay: 0.016,
      });
    };

    window.addEventListener('synapse:kinetic-blast', handleBlast);

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.14; // soft gravity
        p.alpha -= p.decay;

        if (p.alpha <= 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 8;
        ctx.shadowColor = p.color;
        ctx.fillRect(p.x, p.y, p.size, p.size);
        ctx.restore();
      }

      for (let j = floatingTexts.length - 1; j >= 0; j--) {
        const ft = floatingTexts[j];
        ft.y += ft.vy;
        ft.alpha -= ft.decay;

        if (ft.alpha <= 0) {
          floatingTexts.splice(j, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = Math.max(0, ft.alpha);
        ctx.font = '700 16px "JetBrains Mono", monospace';
        ctx.fillStyle = ft.color;
        ctx.shadowBlur = 12;
        ctx.shadowColor = ft.color;
        ctx.textAlign = 'center';
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.restore();
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('synapse:kinetic-blast', handleBlast);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[9999]"
      aria-hidden="true"
    />
  );
};
