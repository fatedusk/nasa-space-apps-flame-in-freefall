import React, { useRef, useEffect, useState } from 'react';
import { PredictionInput, PredictionResult } from '../types';
import { Sparkles, Eye, Info, AlertTriangle, CheckCircle2, Flame } from 'lucide-react';

interface FlameSimulatorCanvasProps {
  input: PredictionInput;
  prediction: PredictionResult;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  r: number;
  g: number;
  b: number;
  alpha: number;
  isSoot?: boolean;
  isSpark?: boolean;
}

// Procedural Planetary Background Renderer
function drawPlanetaryBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  activeGravity: string,
  frame: number
) {
  if (activeGravity === '1g') {
    // ==========================================
    // 🌍 1-g EARTH TERRESTRIAL BACKGROUND
    // ==========================================
    // Daytime blue sky gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, height - 50);
    skyGrad.addColorStop(0, '#0369a1');
    skyGrad.addColorStop(0.5, '#38bdf8');
    skyGrad.addColorStop(1, '#bae6fd');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, width, height);

    // Drifting atmospheric clouds
    ctx.fillStyle = 'rgba(255, 255, 255, 0.28)';
    const cloudOffset = (frame * 0.2) % (width + 120);
    for (let c = -1; c < 3; c++) {
      const cx = c * 200 + cloudOffset - 60;
      ctx.beginPath();
      ctx.arc(cx, 35, 25, 0, Math.PI * 2);
      ctx.arc(cx + 25, 30, 30, 0, Math.PI * 2);
      ctx.arc(cx + 50, 35, 20, 0, Math.PI * 2);
      ctx.fill();
    }

    // Terrestrial green/blue rolling Earth horizon
    ctx.fillStyle = 'rgba(21, 128, 61, 0.4)';
    ctx.beginPath();
    ctx.moveTo(0, height - 45);
    ctx.bezierCurveTo(width * 0.3, height - 60, width * 0.7, height - 35, width, height - 50);
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    ctx.fill();

    // Terrestrial test cell floor
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, height - 35, width, 35);
  } else if (activeGravity === 'lunar') {
    // ==========================================
    // 🌕 1/6-g LUNAR SURFACE (MOON) BACKGROUND
    // ==========================================
    // Deep space black void
    ctx.fillStyle = '#020408';
    ctx.fillRect(0, 0, width, height);

    // Lunar starry sky
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    for (let s = 0; s < 45; s++) {
      const sx = (s * 37 + 13) % width;
      const sy = (s * 53 + 7) % (height - 60);
      const twinkle = Math.sin(frame * 0.05 + s) * 0.3 + 0.7;
      ctx.globalAlpha = twinkle;
      ctx.fillRect(sx, sy, s % 4 === 0 ? 1.5 : 1, s % 4 === 0 ? 1.5 : 1);
    }
    ctx.globalAlpha = 1.0;

    // Distant Blue Marble Earth hanging in the black lunar sky
    const earthX = width - 85;
    const earthY = 48;
    const earthR = 24;

    // Earth atmospheric glow
    const earthGlow = ctx.createRadialGradient(earthX, earthY, earthR * 0.8, earthX, earthY, earthR * 1.6);
    earthGlow.addColorStop(0, 'rgba(56, 189, 248, 0.5)');
    earthGlow.addColorStop(1, 'rgba(56, 189, 248, 0)');
    ctx.fillStyle = earthGlow;
    ctx.beginPath();
    ctx.arc(earthX, earthY, earthR * 1.6, 0, Math.PI * 2);
    ctx.fill();

    // Earth body
    const earthBody = ctx.createRadialGradient(earthX - 6, earthY - 6, 2, earthX, earthY, earthR);
    earthBody.addColorStop(0, '#38bdf8');
    earthBody.addColorStop(0.6, '#0284c7');
    earthBody.addColorStop(1, '#071b38');
    ctx.fillStyle = earthBody;
    ctx.beginPath();
    ctx.arc(earthX, earthY, earthR, 0, Math.PI * 2);
    ctx.fill();

    // Cratered gray lunar regolith horizon
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.moveTo(0, height - 60);
    ctx.bezierCurveTo(width * 0.25, height - 75, width * 0.55, height - 50, width, height - 68);
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    ctx.fill();

    // Forefront lunar crater ridges
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.moveTo(0, height - 42);
    ctx.bezierCurveTo(width * 0.4, height - 30, width * 0.7, height - 55, width, height - 40);
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    ctx.fill();

    // Distant Artemis habitat dome silhouette
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.arc(85, height - 55, 14, Math.PI, 0);
    ctx.fill();
    ctx.fillRect(80, height - 55, 10, 4);
  } else if (activeGravity === 'mars') {
    // ==========================================
    // 🔴 3/8-g MARTIAN SURFACE (MARS) BACKGROUND
    // ==========================================
    // Dusky butterscotch to salmon-tinted twilight sky
    const marsSky = ctx.createLinearGradient(0, 0, 0, height - 40);
    marsSky.addColorStop(0, '#2e1065');
    marsSky.addColorStop(0.3, '#7c2d12');
    marsSky.addColorStop(0.7, '#c2410c');
    marsSky.addColorStop(1, '#ea580c');
    ctx.fillStyle = marsSky;
    ctx.fillRect(0, 0, width, height);

    // Tiny Martian moon Phobos in the sky
    ctx.fillStyle = '#fde68a';
    ctx.beginPath();
    ctx.arc(width - 70, 36, 4, 0, Math.PI * 2);
    ctx.fill();

    // Distant Gale Crater rim / mountain silhouette
    ctx.fillStyle = '#7f1d1d';
    ctx.beginPath();
    ctx.moveTo(0, height - 55);
    ctx.lineTo(80, height - 72);
    ctx.lineTo(160, height - 62);
    ctx.lineTo(260, height - 80);
    ctx.lineTo(380, height - 60);
    ctx.lineTo(width, height - 68);
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    ctx.fill();

    // Forefront rust-red sand dunes
    ctx.fillStyle = '#450a0a';
    ctx.beginPath();
    ctx.moveTo(0, height - 40);
    ctx.bezierCurveTo(width * 0.35, height - 52, width * 0.65, height - 30, width, height - 44);
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    ctx.fill();
  } else {
    // ==========================================
    // 🛰️ 0-g ISS LOW EARTH ORBIT BACKGROUND
    // ==========================================
    // Pitch black cosmos void
    ctx.fillStyle = '#010308';
    ctx.fillRect(0, 0, width, height);

    // Starfield in deep space
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    for (let s = 0; s < 50; s++) {
      const sx = (s * 41 + 19) % width;
      const sy = (s * 31 + 5) % (height - 55);
      const twinkle = Math.sin(frame * 0.06 + s) * 0.35 + 0.65;
      ctx.globalAlpha = twinkle;
      ctx.fillRect(sx, sy, s % 3 === 0 ? 1.5 : 1, s % 3 === 0 ? 1.5 : 1);
    }
    ctx.globalAlpha = 1.0;

    // Curved planet Earth limb viewed from ISS orbit (400 km altitude)
    const earthCenterX = width / 2;
    const earthCenterY = height + 360;
    const earthRadius = 420;

    // Outer atmospheric Rayleigh scattering halo
    const atmosHalo = ctx.createRadialGradient(
      earthCenterX,
      earthCenterY,
      earthRadius - 15,
      earthCenterX,
      earthCenterY,
      earthRadius + 22
    );
    atmosHalo.addColorStop(0, 'rgba(56, 189, 248, 0.85)');
    atmosHalo.addColorStop(0.4, 'rgba(14, 165, 233, 0.45)');
    atmosHalo.addColorStop(1, 'rgba(2, 132, 199, 0)');
    ctx.fillStyle = atmosHalo;
    ctx.beginPath();
    ctx.arc(earthCenterX, earthCenterY, earthRadius + 22, 0, Math.PI * 2);
    ctx.fill();

    // Planet Earth body
    const earthGrad = ctx.createRadialGradient(
      earthCenterX,
      earthCenterY - 30,
      earthRadius * 0.7,
      earthCenterX,
      earthCenterY,
      earthRadius
    );
    earthGrad.addColorStop(0, '#0c4a6e');
    earthGrad.addColorStop(0.5, '#0369a1');
    earthGrad.addColorStop(0.95, '#0284c7');
    earthGrad.addColorStop(1, '#bae6fd');
    ctx.fillStyle = earthGrad;
    ctx.beginPath();
    ctx.arc(earthCenterX, earthCenterY, earthRadius, 0, Math.PI * 2);
    ctx.fill();

    // ISS Solar Array Truss dark silhouette in corner
    ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
    ctx.fillRect(15, 15, 3, 40);
    ctx.fillRect(8, 22, 18, 6);
    ctx.fillRect(8, 36, 18, 6);
  }

  // Cinematic Chamber Viewport Overlay (vignette to ensure flame contrast)
  const vignette = ctx.createRadialGradient(width / 2, height / 2, 80, width / 2, height / 2, width * 0.7);
  vignette.addColorStop(0, 'rgba(2, 6, 23, 0.35)');
  vignette.addColorStop(1, 'rgba(2, 6, 23, 0.75)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);
}

export const FlameSimulatorCanvas: React.FC<FlameSimulatorCanvasProps> = ({
  input,
  prediction,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [comparisonMode, setComparisonMode] = useState<boolean>(false);

  // Compute physical diagnostics
  const gVal =
    input.gravity === '0g'
      ? 0.0
      : input.gravity === 'lunar'
      ? 0.165
      : input.gravity === 'mars'
      ? 0.38
      : 1.0;

  const isCo2 = input.gasMix === 'co2';
  const isQuenching = prediction.regime === 'No spread';
  const isMarginal = prediction.regime === 'Marginal spread';
  const isSustained = prediction.regime === 'Sustained spread';

  // Adiabatic / Microgravity Flame Temperature calculation
  const flameTempK = Math.round(
    Math.max(
      650,
      (gVal === 0 ? 1180 : 1650) +
        (input.oxygenPct - 21.0) * 35 -
        (isCo2 ? 320 : 0) -
        (isQuenching ? 450 : isMarginal ? 150 : 0)
    )
  );

  const grashofNum = gVal === 0 ? '0.00 (Gr → 0)' : (gVal * 1.8e5).toExponential(2);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let particles: Particle[] = [];
    let frame = 0;

    const width = (canvas.width = 560);
    const height = (canvas.height = 260);

    const render = () => {
      frame++;
      ctx.clearRect(0, 0, width, height);

      // Draw Authentic Procedural Planetary Background
      const activePlanetGravity = comparisonMode ? '1g' : input.gravity;
      drawPlanetaryBackground(ctx, width, height, activePlanetGravity, frame);

      // Airflow velocity vector indicator
      const flowDirSign = input.flowDirection === 'opposed' ? -1 : 1;
      const flowMagnitude = (input.airflowCms / 45.0) * 4.0 * flowDirSign;

      // Fuel Sample Burner Base
      const burnerX = width / 2;
      const burnerY = height / 2 + (gVal > 0 ? 35 : 0);

      // Draw Burner Mount
      ctx.fillStyle = '#1e293b';
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(burnerX - 28, burnerY + 12, 56, 12, 4);
      ctx.fill();
      ctx.stroke();

      // Fuel sample strip
      ctx.fillStyle =
        input.material === 'pmma'
          ? '#38bdf8'
          : input.material === 'nomex'
          ? '#fbbf24'
          : input.material === 'ultem'
          ? '#c084fc'
          : '#e2e8f0';
      ctx.fillRect(burnerX - 22, burnerY + 8, 44, 4);

      // Active Pyrolysis Melt/Reaction Front (glowing ember line)
      if (!isQuenching) {
        const pulse = 0.55 + Math.sin(frame * 0.15) * 0.35;
        ctx.fillStyle = `rgba(249, 115, 22, ${pulse})`;
        ctx.shadowColor = '#f97316';
        ctx.shadowBlur = 8;
        ctx.fillRect(burnerX - 18, burnerY + 6, 36, 2.5);
        ctx.shadowBlur = 0;
      }

      // Airflow drift arrows in background
      if (input.airflowCms > 1.0) {
        ctx.fillStyle = 'rgba(34, 211, 238, 0.2)';
        const arrowSpacing = 90;
        for (let ax = 60; ax < width; ax += arrowSpacing) {
          const ay = 40 + ((frame * 1.5) % 30);
          ctx.beginPath();
          ctx.moveTo(ax, ay);
          ctx.lineTo(ax + flowMagnitude * 8, ay);
          ctx.lineTo(ax + flowMagnitude * 6, ay - 3);
          ctx.moveTo(ax + flowMagnitude * 8, ay);
          ctx.lineTo(ax + flowMagnitude * 6, ay + 3);
          ctx.strokeStyle = 'rgba(34, 211, 238, 0.3)';
          ctx.stroke();
        }
      }

      // Physics: Emission Rate & Base Flame Radius
      const baseRadius = isQuenching
        ? 10
        : Math.max(14, 22 + (input.oxygenPct - 21) * 1.2 - (isCo2 ? 8 : 0));

      const effectiveG = comparisonMode ? 1.0 : gVal;

      // Spawn flame particles & convective sparks
      const spawnCount = isQuenching ? 1 : Math.floor(4 + input.oxygenPct / 8);
      for (let i = 0; i < spawnCount; i++) {
        if (particles.length > 280) break;

        const isSpark = Math.random() < 0.18;
        const angle = Math.random() * Math.PI * 2;
        const radialSpeed = 0.3 + Math.random() * 0.9;

        let vx = Math.cos(angle) * radialSpeed + flowMagnitude * 0.45;
        let vy = Math.sin(angle) * radialSpeed;

        if (effectiveG > 0) {
          vy -= effectiveG * (1.8 + Math.random() * 2.5);
          vx *= 0.65;
        }

        const isSootParticle = !isSpark && effectiveG > 0.2 && Math.random() < 0.45;

        // Color temperature
        let r = 56;
        let g = 189;
        let b = 248; // default pure pale blue chemiluminescence

        if (isSpark) {
          r = 254;
          g = 240;
          b = 138; // hot golden spark
        } else if (isSootParticle) {
          r = 251;
          g = 191;
          b = 36; // incandescent soot
        } else if (input.oxygenPct > 28) {
          r = 96;
          g = 165;
          b = 250; // Artemis hyperoxic violet-blue
        } else if (isCo2 || isQuenching) {
          r = 148;
          g = 163;
          b = 184; // dying dim blue-gray
        }

        particles.push({
          x: burnerX + (Math.random() - 0.5) * 16,
          y: burnerY + (Math.random() - 0.5) * 6,
          vx: isSpark ? vx * 1.3 + flowMagnitude * 0.3 : vx,
          vy: isSpark ? vy * 1.2 : vy,
          life: 0,
          maxLife: isSpark ? 22 + Math.random() * 15 : isQuenching ? 20 : 35 + Math.random() * 30,
          size: isSpark ? 1.5 + Math.random() * 1.5 : 4 + Math.random() * 6,
          r,
          g,
          b,
          alpha: isQuenching ? 0.3 : isSpark ? 0.95 : 0.75,
          isSoot: isSootParticle,
          isSpark,
        });
      }

      // Switch to Additive Blending for Radiant Flame Luminescence
      ctx.globalCompositeOperation = 'lighter';

      // Render & Update Particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life++;

        if (p.life >= p.maxLife) {
          particles.splice(i, 1);
          continue;
        }

        const progress = p.life / p.maxLife;

        if (effectiveG > 0) {
          p.vy -= effectiveG * 0.08;
        }

        p.vx += flowMagnitude * 0.04;
        p.x += p.vx;
        p.y += p.vy;

        const curSize = p.size * (1 + progress * 0.8);
        const curAlpha = p.alpha * (1 - progress);

        ctx.beginPath();
        ctx.arc(p.x, p.y, curSize, 0, Math.PI * 2);

        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, curSize);
        grad.addColorStop(0, `rgba(${p.r}, ${p.g}, ${p.b}, ${curAlpha})`);
        grad.addColorStop(1, `rgba(${p.r}, ${p.g}, ${p.b}, 0)`);
        ctx.fillStyle = grad;
        ctx.fill();
      }

      // Draw Steady Core Flame Envelope (Spherical in 0-g vs Teardrop in 1-g)
      if (!isQuenching) {
        ctx.save();
        ctx.translate(burnerX, burnerY);

        if (effectiveG === 0) {
          // === 0-g MICROGRAVITY SPHERICAL BLUE DIFFUSION FLAME ===
          const sphereRadius = baseRadius * (1 + Math.sin(frame * 0.08) * 0.04);
          const flowShiftX = flowMagnitude * 4;

          // Outer pale blue radiative diffusion halo
          const haloGrad = ctx.createRadialGradient(
            flowShiftX,
            0,
            sphereRadius * 0.3,
            flowShiftX,
            0,
            sphereRadius * 1.6
          );
          haloGrad.addColorStop(0, 'rgba(56, 189, 248, 0.55)');
          haloGrad.addColorStop(0.5, 'rgba(14, 165, 233, 0.3)');
          haloGrad.addColorStop(1, 'rgba(2, 132, 199, 0)');

          ctx.fillStyle = haloGrad;
          ctx.beginPath();
          ctx.arc(flowShiftX, 0, sphereRadius * 1.6, 0, Math.PI * 2);
          ctx.fill();

          // Inner reaction core (dim pale electric blue ghost flame)
          const coreGrad = ctx.createRadialGradient(
            flowShiftX,
            0,
            0,
            flowShiftX,
            0,
            sphereRadius * 0.85
          );
          coreGrad.addColorStop(0, 'rgba(240, 249, 255, 0.9)');
          coreGrad.addColorStop(0.5, 'rgba(56, 189, 248, 0.7)');
          coreGrad.addColorStop(1, 'rgba(2, 132, 199, 0)');

          ctx.fillStyle = coreGrad;
          ctx.beginPath();
          ctx.arc(flowShiftX, 0, sphereRadius * 0.85, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // === BUOYANT TEARDROP FLAME (1-g Earth or Partial-g Moon/Mars) ===
          const tearHeight = baseRadius * (1.8 + effectiveG * 2.2);
          const tearWidth = baseRadius * 1.1;
          const flicker = Math.sin(frame * 0.22) * 4 + Math.cos(frame * 0.45) * 2;
          const tilt = flowMagnitude * 4 + flicker;

          // Outer buoyant flame plume
          ctx.beginPath();
          ctx.moveTo(-tearWidth * 0.7, 0);
          ctx.bezierCurveTo(
            -tearWidth * (1 + Math.sin(frame * 0.18) * 0.1),
            -tearHeight * 0.4,
            tilt - tearWidth * 0.3,
            -tearHeight * 0.9,
            tilt,
            -tearHeight
          );
          ctx.bezierCurveTo(
            tilt + tearWidth * 0.3,
            -tearHeight * 0.9,
            tearWidth * (1 + Math.cos(frame * 0.18) * 0.1),
            -tearHeight * 0.4,
            tearWidth * 0.7,
            0
          );
          ctx.closePath();

          const tearGrad = ctx.createLinearGradient(0, 0, tilt, -tearHeight);
          tearGrad.addColorStop(0, 'rgba(56, 189, 248, 0.85)'); // electric blue base
          tearGrad.addColorStop(0.35, 'rgba(251, 191, 36, 0.9)'); // luminous yellow body
          tearGrad.addColorStop(0.85, 'rgba(239, 68, 68, 0.75)'); // orange-red tip
          tearGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');

          ctx.fillStyle = tearGrad;
          ctx.fill();

          // Inner blue reaction zone
          ctx.beginPath();
          ctx.arc(0, 0, tearWidth * 0.55, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(56, 189, 248, 0.75)';
          ctx.fill();
        }

        ctx.restore();
      } else {
        // Quenching / Extinguished: Small smoke wisp
        ctx.fillStyle = 'rgba(148, 163, 184, 0.7)';
        ctx.font = '11px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('Radiative Extinction Zone (Flame Quenched)', width / 2, height / 2 - 15);
      }

      // Revert composite operation for clean HUD overlays
      ctx.globalCompositeOperation = 'source-over';

      animId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animId);
  }, [input, prediction, comparisonMode]);

  return (
    <div className="bg-[#030712]/95 border border-cyan-500/30 rounded-2xl p-4 shadow-2xl relative overflow-hidden flex flex-col justify-between">
      {/* Top Header & Telemetry Badges */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center justify-center">
            <Flame className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <h4 className="text-xs font-mono font-bold text-white uppercase flex items-center gap-1.5">
              <span>Real-Time Flame Physics Simulator</span>
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-cyan-400/20 text-cyan-300 border border-cyan-400/30 font-bold">
                60 FPS
              </span>
            </h4>
            <p className="text-[10px] font-mono text-slate-400">
              {input.gravity === '0g'
                ? 'ISS Microgravity Spherical Diffusion Flame (Gr → 0)'
                : input.gravity === 'lunar'
                ? 'Lunar 1/6-g Hybrid Buoyant Flame'
                : input.gravity === 'mars'
                ? 'Martian 3/8-g Semi-Buoyant Flame'
                : 'Earth 1-g Upward Buoyant Teardrop'}
            </p>
          </div>
        </div>

        {/* Quick 0-g vs 1-g Comparison Toggle */}
        <button
          onClick={() => setComparisonMode(!comparisonMode)}
          className={`text-[10px] font-mono px-2.5 py-1 rounded-lg border transition flex items-center gap-1 cursor-pointer ${
            comparisonMode
              ? 'bg-amber-500/20 text-amber-300 border-amber-400 font-bold'
              : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
          }`}
          title="Toggle 1-g Earth comparison view"
        >
          <Eye className="w-3 h-3" />
          <span>{comparisonMode ? 'Viewing Earth 1-g' : 'Compare 1-g Earth'}</span>
        </button>
      </div>

      {/* Flame Canvas */}
      <div className="relative w-full flex justify-center bg-black rounded-xl p-1 border border-slate-900 overflow-hidden shadow-inner">
        <canvas
          ref={canvasRef}
          width={560}
          height={260}
          className="max-w-full h-auto rounded-lg"
        />

        {/* Real-Time Live Flame HUD Overlay */}
        <div className="absolute top-3 left-3 flex flex-col gap-1 pointer-events-none">
          <div className="bg-slate-950/85 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-800/80 text-[10px] font-mono text-cyan-300">
            <span>Core Temp: </span>
            <strong className="text-white">{flameTempK} K</strong>
          </div>
          <div className="bg-slate-950/85 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-800/80 text-[10px] font-mono text-slate-400">
            <span>Grashof: </span>
            <strong className="text-cyan-300">{grashofNum}</strong>
          </div>
        </div>

        {/* Planetary Location Badge */}
        <div className="absolute bottom-2.5 right-3 pointer-events-none">
          <div className="bg-slate-950/85 backdrop-blur-md px-2.5 py-1 rounded-lg border border-cyan-500/40 text-[10px] font-mono font-bold text-slate-200 flex items-center gap-1.5 shadow">
            {comparisonMode || input.gravity === '1g' ? (
              <>
                <span>🌍</span>
                <span className="text-cyan-300">Earth Terrestrial (1.0-g)</span>
              </>
            ) : input.gravity === 'lunar' ? (
              <>
                <span>🌕</span>
                <span className="text-amber-300">Lunar Surface (0.165-g)</span>
              </>
            ) : input.gravity === 'mars' ? (
              <>
                <span>🔴</span>
                <span className="text-rose-300">Martian Surface (0.38-g)</span>
              </>
            ) : (
              <>
                <span>🛰️</span>
                <span className="text-sky-300">ISS Low Earth Orbit (0-g)</span>
              </>
            )}
          </div>
        </div>

        <div className="absolute top-3 right-3 pointer-events-none">
          <div
            className={`px-2.5 py-1 rounded-lg border text-[10px] font-mono font-bold flex items-center gap-1 backdrop-blur-md ${
              isSustained
                ? 'bg-rose-950/80 border-rose-500/60 text-rose-300'
                : isMarginal
                ? 'bg-amber-950/80 border-amber-500/60 text-amber-300'
                : 'bg-cyan-950/80 border-cyan-500/60 text-cyan-300'
            }`}
          >
            {isSustained && <AlertTriangle className="w-3 h-3 text-rose-400" />}
            {isMarginal && <Sparkles className="w-3 h-3 text-amber-400" />}
            {isQuenching && <CheckCircle2 className="w-3 h-3 text-cyan-400" />}
            <span>{prediction.regime.toUpperCase()}</span>
          </div>
        </div>

        {/* Airflow Direction indicator at bottom */}
        <div className="absolute bottom-2.5 left-3 text-[10px] font-mono text-slate-400 pointer-events-none flex items-center gap-1.5 bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800">
          <span>Ventilation Draft: {input.airflowCms} cm/s</span>
          <span className="text-cyan-400 font-bold uppercase">({input.flowDirection})</span>
        </div>
      </div>
    </div>
  );
};
