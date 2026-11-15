import React, { useEffect, useRef } from 'react';

interface Star {
  x: number;
  y: number;
  z: number; // Depth layer: 1 (far), 2 (mid), 3 (near)
  size: number;
  baseAlpha: number;
  alpha: number;
  twinkleSpeed: number;
  twinklePhase: number;
  color: string;
  hasFlare: boolean;
}

export const StarfieldBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Mouse parallax tracking
    let targetMouseX = 0;
    let targetMouseY = 0;
    let currentMouseX = 0;
    let currentMouseY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      // Normalize to [-1, 1]
      targetMouseX = (e.clientX / width - 0.5) * 2;
      targetMouseY = (e.clientY / height - 0.5) * 2;
    };

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      initStars();
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('resize', handleResize);

    const starColors = [
      '#ffffff',
      '#f0f9ff', // crisp ice white
      '#bae6fd', // light cyan
      '#fef08a', // warm stellar yellow
      '#fed7aa', // amber star
      '#fbcfe8', // faint nebula rose
    ];

    let stars: Star[] = [];

    const initStars = () => {
      // Create a rich panoramic field of stars
      const count = Math.max(280, Math.floor((width * height) / 4500));
      stars = [];
      for (let i = 0; i < count; i++) {
        const z = Math.random() < 0.65 ? 1 : Math.random() < 0.9 ? 2 : 3;
        const size =
          z === 1
            ? 0.6 + Math.random() * 0.7
            : z === 2
            ? 1.2 + Math.random() * 0.9
            : 2.0 + Math.random() * 1.2;

        const baseAlpha = z === 1 ? 0.2 + Math.random() * 0.4 : 0.4 + Math.random() * 0.5;

        stars.push({
          x: Math.random() * (width + 200) - 100,
          y: Math.random() * (height + 200) - 100,
          z,
          size,
          baseAlpha,
          alpha: baseAlpha,
          twinkleSpeed: 0.01 + Math.random() * 0.03,
          twinklePhase: Math.random() * Math.PI * 2,
          color: starColors[Math.floor(Math.random() * starColors.length)],
          hasFlare: z === 3 && Math.random() < 0.25,
        });
      }
    };

    initStars();

    let time = 0;

    const render = () => {
      time += 0.016;

      // Smooth parallax interpolation
      currentMouseX += (targetMouseX - currentMouseX) * 0.04;
      currentMouseY += (targetMouseY - currentMouseY) * 0.04;

      ctx.clearRect(0, 0, width, height);

      // Deep space pure OLED black fill with faint plum undertone
      ctx.fillStyle = '#09040a';
      ctx.fillRect(0, 0, width, height);

      // =====================================================================
      // 1. PANORAMIC NEBULA GLOWS
      // =====================================================================
      const panOffsetX = currentMouseX * 35;
      const panOffsetY = currentMouseY * 25;

      // Celestial Reddish-Pink / Magenta Nebula (Top Right)
      const gradPink = ctx.createRadialGradient(
        width * 0.88 + panOffsetX * 0.4,
        height * 0.22 + panOffsetY * 0.4,
        60,
        width * 0.88 + panOffsetX * 0.4,
        height * 0.22 + panOffsetY * 0.4,
        width * 0.55
      );
      gradPink.addColorStop(0, 'rgba(255, 46, 126, 0.22)');
      gradPink.addColorStop(0.4, 'rgba(180, 20, 80, 0.12)');
      gradPink.addColorStop(0.8, 'rgba(60, 5, 30, 0.05)');
      gradPink.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = gradPink;
      ctx.fillRect(0, 0, width, height);

      // Cosmic Plum / Rose Nebula (Bottom Left)
      const gradPlum = ctx.createRadialGradient(
        width * 0.15 + panOffsetX * 0.3,
        height * 0.75 + panOffsetY * 0.3,
        50,
        width * 0.15 + panOffsetX * 0.3,
        height * 0.75 + panOffsetY * 0.3,
        width * 0.45
      );
      gradPlum.addColorStop(0, 'rgba(219, 39, 119, 0.12)');
      gradPlum.addColorStop(0.6, 'rgba(76, 5, 45, 0.05)');
      gradPlum.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = gradPlum;
      ctx.fillRect(0, 0, width, height);

      // =====================================================================
      // 2. MAJESTIC ORBITAL CELESTIAL SPHERE (REDDISH-PINK ECLIPSE)
      // =====================================================================
      const planetRadius = Math.max(180, Math.min(width, height) * 0.32);
      const planetCenterX = width * 0.92 + panOffsetX * 0.6;
      const planetCenterY = height * 0.18 + panOffsetY * 0.6;

      ctx.save();

      // Atmospheric Pink Neon Glow Outer Halo
      const atmoGlow = ctx.createRadialGradient(
        planetCenterX,
        planetCenterY,
        planetRadius * 0.88,
        planetCenterX,
        planetCenterY,
        planetRadius * 1.35
      );
      atmoGlow.addColorStop(0, 'rgba(255, 46, 126, 0.35)');
      atmoGlow.addColorStop(0.35, 'rgba(225, 29, 72, 0.20)');
      atmoGlow.addColorStop(0.7, 'rgba(159, 18, 57, 0.08)');
      atmoGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = atmoGlow;
      ctx.beginPath();
      ctx.arc(planetCenterX, planetCenterY, planetRadius * 1.35, 0, Math.PI * 2);
      ctx.fill();

      // Planet Sphere Body Base
      ctx.beginPath();
      ctx.arc(planetCenterX, planetCenterY, planetRadius, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip(); // Clip to planet sphere

      // Crimson / Magenta Surface Gradient
      const planetSurface = ctx.createLinearGradient(
        planetCenterX - planetRadius * 0.8,
        planetCenterY - planetRadius * 0.8,
        planetCenterX + planetRadius * 0.8,
        planetCenterY + planetRadius * 0.8
      );
      planetSurface.addColorStop(0, '#be185d'); // sunlit magenta
      planetSurface.addColorStop(0.35, '#831843'); // deep rose
      planetSurface.addColorStop(0.55, '#500724'); // shadow crimson
      planetSurface.addColorStop(0.85, '#2e0214'); // dark limb
      planetSurface.addColorStop(1, '#0f0107'); // night side
      ctx.fillStyle = planetSurface;
      ctx.fillRect(
        planetCenterX - planetRadius,
        planetCenterY - planetRadius,
        planetRadius * 2,
        planetRadius * 2
      );

      // Swirling Cloud Bands & Continental Formations
      ctx.save();
      ctx.translate(planetCenterX, planetCenterY);
      ctx.rotate((time * 0.008) % (Math.PI * 2));
      const cloudGrad = ctx.createRadialGradient(
        -planetRadius * 0.3,
        -planetRadius * 0.2,
        20,
        0,
        0,
        planetRadius
      );
      cloudGrad.addColorStop(0, 'rgba(255, 255, 255, 0.38)');
      cloudGrad.addColorStop(0.25, 'rgba(224, 242, 254, 0.25)');
      cloudGrad.addColorStop(0.6, 'rgba(255, 255, 255, 0.15)');
      cloudGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = cloudGrad;
      ctx.beginPath();
      ctx.arc(0, 0, planetRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Atmospheric Limb Reflection
      const innerLimb = ctx.createRadialGradient(
        planetCenterX - planetRadius * 0.4,
        planetCenterY - planetRadius * 0.4,
        planetRadius * 0.6,
        planetCenterX,
        planetCenterY,
        planetRadius
      );
      innerLimb.addColorStop(0, 'rgba(255, 255, 255, 0)');
      innerLimb.addColorStop(0.8, 'rgba(56, 189, 248, 0.15)');
      innerLimb.addColorStop(0.98, 'rgba(186, 230, 253, 0.45)');
      innerLimb.addColorStop(1, 'rgba(56, 189, 248, 0.6)');
      ctx.fillStyle = innerLimb;
      ctx.fillRect(
        planetCenterX - planetRadius,
        planetCenterY - planetRadius,
        planetRadius * 2,
        planetRadius * 2
      );

      // Day / Night Terminator Shadow (Crescent Curve)
      const shadowGrad = ctx.createLinearGradient(
        planetCenterX - planetRadius * 0.5,
        planetCenterY - planetRadius * 0.5,
        planetCenterX + planetRadius * 0.7,
        planetCenterY + planetRadius * 0.7
      );
      shadowGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
      shadowGrad.addColorStop(0.45, 'rgba(2, 6, 23, 0.2)');
      shadowGrad.addColorStop(0.65, 'rgba(2, 6, 23, 0.85)');
      shadowGrad.addColorStop(0.85, 'rgba(1, 3, 10, 0.98)');
      shadowGrad.addColorStop(1, 'rgba(0, 0, 0, 1)');
      ctx.fillStyle = shadowGrad;
      ctx.fillRect(
        planetCenterX - planetRadius,
        planetCenterY - planetRadius,
        planetRadius * 2,
        planetRadius * 2
      );

      // Night Side City Lights (Subtle golden clusters)
      ctx.fillStyle = 'rgba(253, 224, 71, 0.5)';
      const nightCluster = [
        [0.45, 0.4],
        [0.55, 0.35],
        [0.5, 0.52],
        [0.62, 0.48],
        [0.58, 0.65],
      ];
      for (const [px, py] of nightCluster) {
        ctx.beginPath();
        ctx.arc(
          planetCenterX - planetRadius + planetRadius * 2 * px,
          planetCenterY - planetRadius + planetRadius * 2 * py,
          1.2,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }

      ctx.restore();

      // =====================================================================
      // 3. PANORAMIC 3D STARFIELD WITH TWINKLE & PARALLAX
      // =====================================================================
      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];

        // Parallax speed based on depth layer (1: distant, 2: mid, 3: near)
        const depthFactor = s.z === 1 ? 0.25 : s.z === 2 ? 0.6 : 1.1;
        const posX = s.x + panOffsetX * depthFactor;
        const posY = s.y + panOffsetY * depthFactor;

        // Multi-frequency twinkle oscillation
        const twinkle =
          Math.sin(time * 3 + s.twinklePhase) * 0.2 +
          Math.cos(time * 1.5 + s.twinklePhase * 1.3) * 0.15;
        s.alpha = Math.max(0.12, Math.min(1, s.baseAlpha + twinkle));

        // Draw star core
        ctx.beginPath();
        ctx.arc(posX, posY, s.size, 0, Math.PI * 2);
        ctx.fillStyle = s.color;
        ctx.globalAlpha = s.alpha;

        if (s.size > 1.8) {
          ctx.shadowColor = s.color;
          ctx.shadowBlur = 6;
        }

        ctx.fill();

        // 4-Point Subtle Diffraction Flare on Prominent Foreground Stars
        if (s.hasFlare && s.alpha > 0.5) {
          ctx.strokeStyle = s.color;
          ctx.lineWidth = 0.6;
          ctx.globalAlpha = s.alpha * 0.45;
          const flareLen = s.size * 3.8;

          ctx.beginPath();
          ctx.moveTo(posX - flareLen, posY);
          ctx.lineTo(posX + flareLen, posY);
          ctx.moveTo(posX, posY - flareLen);
          ctx.lineTo(posX, posY + flareLen);
          ctx.stroke();
        }
      }

      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <>
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-0"
        style={{ background: '#09040a' }}
      />
      {/* Reddish-pink celestial glow matching screenshot */}
      <div
        className="fixed z-0 right-[-140px] top-[40px] w-[550px] h-[550px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 35% 35%, rgba(255,46,126,0.38), rgba(160,20,80,0.18) 55%, transparent 72%)',
          filter: 'blur(20px)',
        }}
      />
      <div
        className="fixed z-0 -left-[100px] top-[30%] w-[450px] h-[450px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(140,20,70,0.15), transparent 70%)',
          filter: 'blur(30px)',
        }}
      />
    </>
  );
};
