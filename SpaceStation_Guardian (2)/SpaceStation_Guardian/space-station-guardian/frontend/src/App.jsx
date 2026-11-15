import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Center, OrbitControls, Stars, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import {
  Activity,
  AlertTriangle,
  Atom,
  Box,
  Camera,
  ChevronDown,
  CircleHelp,
  Crosshair,
  Flame,
  Gauge,
  Layers3,
  Maximize2,
  Minimize2,
  Orbit,
  Pause,
  Play,
  RotateCcw,
  Shield,
  Sparkles,
  Thermometer,
  Video,
  Volume2,
  VolumeX,
  Wind,
  Zap,
} from 'lucide-react';

// Preload 3D models into memory
useGLTF.preload('/models/iss.glb');
useGLTF.preload('/models/scene.gltf');

const MODULES = [
  { id: 'destiny', name: 'Destiny Laboratory', short: 'DESTINY', note: 'US laboratory module' },
  { id: 'harmony', name: 'Harmony Node', short: 'HARMONY', note: 'Connecting node & forward port' },
  { id: 'tranquility', name: 'Tranquility Node', short: 'TRANQUILITY', note: 'Life-support & cupola area' },
  { id: 'columbus', name: 'Columbus Laboratory', short: 'COLUMBUS', note: 'European Space Agency lab' },
  { id: 'kibo', name: 'Kibo Laboratory', short: 'KIBO', note: 'JAXA experiment module' },
  { id: 'zvezda', name: 'Service Module', short: 'ZVEZDA', note: 'Primary Russian living quarters' },
];

const SCENARIOS = [
  { id: 'impact', label: 'High-velocity orbital impact', desc: 'Debris impact detonates hull and triggers catastrophic structural detachment.', icon: 'impact' },
  { id: 'pressure', label: 'Explosive decompression', desc: 'Cabin overpressure blowout fractures module and launches shrapnel.', icon: 'pressure' },
  { id: 'fire', label: 'Internal runaway fire / explosion', desc: 'Violent thermal combustion blast breaches structural bulkhead.', icon: 'fire' },
  { id: 'power', label: 'Main power bus catastrophic arc', desc: 'Solar array power surge triggers electrical blast and severed trusses.', icon: 'power' },
  { id: 'combined', label: 'Cascading station catastrophe', desc: 'Multi-point structural failure and catastrophic fragmentation.', icon: 'combined' },
];

// Epicenter coordinates in the ISS 3D model space
const MODULE_COORDINATES = {
  destiny: [0, -5.38, 6.02],
  harmony: [0, -5.38, 15.18],
  tranquility: [2.23, -5.38, 3.8],
  columbus: [-4.17, -5.38, 20.01],
  kibo: [7.48, -5.38, 20.01],
  zvezda: [0, -4.64, -15.01],
  impact: [-15.25, -0.38, 8.49],
};

const PROCEDURAL_COORDINATES = {
  destiny: [0, 0.12, 0.18],
  harmony: [0.82, 0.12, 0.18],
  tranquility: [-0.78, 0.12, 0.18],
  columbus: [1.42, 0.12, 0.18],
  kibo: [-1.4, 0.12, 0.18],
  zvezda: [0, -0.18, 0.18],
  impact: [-2.6, 0.4, 0],
};

// Procedural Solar Wing for fallback station
function SolarWing({ position, rotation = [0, 0, 0] }) {
  return (
    <group position={position} rotation={rotation}>
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 0.95, 0, 0]}>
          <mesh><boxGeometry args={[1.72, 0.035, 0.78]} /><meshStandardMaterial color="#173e72" metalness={0.65} roughness={0.35} /></mesh>
          {Array.from({ length: 8 }, (_, i) => (
            <mesh key={i} position={[-0.82 + i * 0.235, 0.025, 0]}><boxGeometry args={[0.018, 0.012, 0.76]} /><meshBasicMaterial color="#75b9ed" /></mesh>
          ))}
          <mesh position={[0, 0.026, 0]}><boxGeometry args={[1.7, 0.012, 0.018]} /><meshBasicMaterial color="#8bc8f5" /></mesh>
        </group>
      ))}
    </group>
  );
}

// Procedural Station with dynamic breakdown
function ProceduralStation({ selected, onSelect, alertModule, active, startedAt, severity, scenario }) {
  const groupRef = useRef();
  const moduleRefs = useRef({});
  const wingsRef = useRef({});
  const startClockRef = useRef(null);

  useFrame(({ clock }) => {
    if (!active) {
      startClockRef.current = null;
      if (groupRef.current) groupRef.current.rotation.y += 0.005;
      Object.keys(moduleRefs.current).forEach((k) => {
        const ref = moduleRefs.current[k];
        if (ref) { ref.position.set(0, 0, 0); ref.rotation.set(0, 0, 0); }
      });
      Object.keys(wingsRef.current).forEach((k) => {
        const ref = wingsRef.current[k];
        if (ref) { ref.position.set(0, 0, 0); ref.rotation.set(0, 0, 0); }
      });
      return;
    }

    if (startClockRef.current === null) startClockRef.current = clock.elapsedTime;
    const t = Math.max(0, clock.elapsedTime - startClockRef.current);
    const sev = severity / 10;
    const epicKey = scenario === 'impact' ? 'impact' : selected;
    const epic = PROCEDURAL_COORDINATES[epicKey] || PROCEDURAL_COORDINATES.destiny;
    const epicVec = new THREE.Vector3(...epic);

    MODULES.forEach((m, i) => {
      const ref = moduleRefs.current[m.id];
      if (!ref) return;
      const basePos = new THREE.Vector3(...(PROCEDURAL_COORDINATES[m.id] || [0, 0, 0]));
      const dist = basePos.distanceTo(epicVec);
      const shockSpeed = 12;
      const arrival = dist / shockSpeed;

      if (t > arrival) {
        const dt = t - arrival;
        const dir = new THREE.Vector3().subVectors(basePos, epicVec);
        if (dir.lengthSq() < 0.001) dir.set(0, 1, 0);
        dir.normalize();
        dir.x += Math.sin(i * 2.3) * 0.4;
        dir.y += Math.cos(i * 3.7) * 0.4;
        dir.normalize();
        const speed = (sev * 1.8) / Math.pow(dist + 0.8, 0.45);
        ref.position.set(dir.x * speed * dt, dir.y * speed * dt, dir.z * speed * dt);
        ref.rotation.set(dt * (0.8 + i * 0.3) * sev, dt * (1.1 - i * 0.2) * sev, dt * (0.5 + i * 0.4) * sev);
      }
    });

    ['left', 'right'].forEach((side, idx) => {
      const ref = wingsRef.current[side];
      if (!ref) return;
      const arrival = 0.15;
      if (t > arrival) {
        const dt = t - arrival;
        const dirX = side === 'left' ? -1 : 1;
        ref.position.set(dirX * dt * sev * 2.2, dt * 0.8 * sev, dt * Math.sin(idx) * sev);
        ref.rotation.set(dt * 0.7 * sev, dt * 1.4 * sev, dt * 0.9 * sev);
      }
    });
  });

  const moduleColor = (id) => (alertModule === id ? '#ff4422' : selected === id ? '#36c9f4' : '#b9c7d4');

  return (
    <group ref={groupRef} rotation={[0.16, 0.05, -0.12]} scale={1.8}>
      <mesh><boxGeometry args={[5.6, 0.10, 0.12]} /><meshStandardMaterial color="#aab8c5" metalness={0.78} roughness={0.36} /></mesh>
      <mesh position={[0, 0.09, 0]}><boxGeometry args={[5.45, 0.025, 0.16]} /><meshStandardMaterial color="#d6e0e8" metalness={0.7} /></mesh>
      {MODULES.map((m) => {
        const base = PROCEDURAL_COORDINATES[m.id] || [0, 0, 0];
        return (
          <group key={m.id} position={base}>
            <group ref={(el) => (moduleRefs.current[m.id] = el)} onClick={(e) => { e.stopPropagation(); onSelect(m.id); }}>
              <mesh castShadow>
                <cylinderGeometry args={[0.24, 0.24, 0.76, 24, 1]} />
                <meshStandardMaterial
                  color={moduleColor(m.id)}
                  metalness={0.65}
                  roughness={0.42}
                  emissive={alertModule === m.id ? '#ff2200' : '#071421'}
                  emissiveIntensity={alertModule === m.id ? 2.0 : 0.15}
                />
              </mesh>
              <mesh position={[0, 0.385, 0]}><cylinderGeometry args={[0.22, 0.22, 0.035, 24]} /><meshStandardMaterial color="#e4ebf0" metalness={0.8} /></mesh>
              <mesh position={[0, -0.385, 0]}><cylinderGeometry args={[0.22, 0.22, 0.035, 24]} /><meshStandardMaterial color="#8798a8" metalness={0.8} /></mesh>
            </group>
          </group>
        );
      })}
      <group ref={(el) => (wingsRef.current.left = el)}><SolarWing position={[0, 0.25, 0]} rotation={[0, 0, Math.PI / 2]} /></group>
      <group ref={(el) => (wingsRef.current.right = el)}><SolarWing position={[0, 0.25, 0]} rotation={[0, Math.PI / 2, Math.PI / 2]} /></group>
    </group>
  );
}

// Real ISS 3D Model with dynamic shockwave disintegration and structural breakdown
function ImportedStation({ src, selected, scenario, active, startedAt, severity }) {
  const { scene } = useGLTF(src);
  const cloned = useMemo(() => {
    const c = scene.clone(true);
    const box = new THREE.Box3().setFromObject(c);
    const center = new THREE.Vector3();
    box.getCenter(center);
    c.position.sub(center);
    c.updateMatrixWorld(true);
    return c;
  }, [scene]);
  const partsRef = useRef([]);

  useEffect(() => {
    const list = [];
    cloned.traverse((child) => {
      if (child.isMesh) {
        child.userData.origPos = child.position.clone();
        child.userData.origRot = child.rotation.clone();

        child.geometry.computeBoundingBox();
        const center = new THREE.Vector3();
        if (child.geometry.boundingBox) {
          child.geometry.boundingBox.getCenter(center);
        }
        child.updateWorldMatrix(true, false);
        center.applyMatrix4(child.matrixWorld);

        let h = 0;
        for (let i = 0; i < child.name.length; i++) {
          h = (h << 5) - h + child.name.charCodeAt(i);
          h |= 0;
        }
        const r1 = Math.abs(Math.sin(h * 12.9898)) % 1;
        const r2 = Math.abs(Math.cos(h * 78.233)) % 1;
        const r3 = Math.abs(Math.sin(h * 43.1415)) % 1;

        list.push({
          mesh: child,
          origPos: child.position.clone(),
          origRot: child.rotation.clone(),
          center,
          name: child.name,
          rand: [r1, r2, r3],
        });
      }
    });
    partsRef.current = list;
  }, [cloned]);

  const startClockRef = useRef(null);

  useFrame(({ clock }) => {
    if (!partsRef.current.length) return;

    if (!active) {
      startClockRef.current = null;
      for (let i = 0; i < partsRef.current.length; i++) {
        const p = partsRef.current[i];
        p.mesh.position.copy(p.origPos);
        p.mesh.rotation.copy(p.origRot);
      }
      return;
    }

    if (startClockRef.current === null) startClockRef.current = clock.elapsedTime;
    const t = Math.max(0, clock.elapsedTime - startClockRef.current);

    const key = scenario === 'impact' ? 'impact' : selected;
    const ep = MODULE_COORDINATES[key] || MODULE_COORDINATES.destiny;
    const epicVec = new THREE.Vector3(ep[0], ep[1], ep[2]);
    const sev = severity / 10;

    for (let i = 0; i < partsRef.current.length; i++) {
      const p = partsRef.current[i];
      const dist = p.center.distanceTo(epicVec);
      const shockSpeed = 24.0;
      const arrival = dist / shockSpeed;

      if (t > arrival) {
        const dt = t - arrival;
        const breakDist = 12 + sev * 48;

        if (dist <= breakDist) {
          const dir = new THREE.Vector3().subVectors(p.center, epicVec);
          if (dir.lengthSq() < 0.001) dir.set(0, 1, 0);
          dir.normalize();

          dir.x += (p.rand[0] - 0.5) * 0.95;
          dir.y += (p.rand[1] - 0.5) * 0.95;
          dir.z += (p.rand[2] - 0.5) * 0.95;
          dir.normalize();

          const speed = (sev * 4.6) / Math.pow(dist + 1.2, 0.42);

          p.mesh.position.x = p.origPos.x + dir.x * speed * dt;
          p.mesh.position.y = p.origPos.y + dir.y * speed * dt;
          p.mesh.position.z = p.origPos.z + dir.z * speed * dt;

          const spin = (sev * 1.6) / Math.pow(dist + 1.0, 0.38);
          p.mesh.rotation.x = p.origRot.x + (p.rand[0] - 0.5) * spin * dt;
          p.mesh.rotation.y = p.origRot.y + (p.rand[1] - 0.5) * spin * dt;
          p.mesh.rotation.z = p.origRot.z + (p.rand[2] - 0.5) * spin * dt;
        }
      }
    }
  });

  return (
    <primitive object={cloned} />
  );
}

// Photorealistic Blast VFX Animation powered by blast.png texture, Additive Blending, and Shockwaves
function RealisticBlast({ active, startedAt, epicenter, severity, isImported }) {
  const blastTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 406;
    const ctx = canvas.getContext('2d');
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = '/textures/blast.png';
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      // 1. Clean "SPACEFLIGHTNOW" watermark in top-left
      const sample = ctx.getImageData(50, 20, 1, 1).data;
      ctx.fillStyle = `rgb(${sample[0]}, ${sample[1]}, ${sample[2]})`;
      ctx.fillRect(45, 20, 230, 48);

      // 2. Clean ground/crowd silhouettes at bottom
      const bottomSample = ctx.getImageData(10, img.height - 40, 1, 1).data;
      ctx.fillStyle = `rgb(${bottomSample[0]}, ${bottomSample[1]}, ${bottomSample[2]})`;
      ctx.fillRect(0, img.height - 30, img.width, 30);

      // 3. Create radial feathered transparent alpha channel from dark background
      const imgData = ctx.getImageData(0, 0, img.width, img.height);
      const d = imgData.data;
      const cx = img.width * 0.52;
      const cy = img.height * 0.46;

      for (let i = 0; i < d.length; i += 4) {
        const r = d[i];
        const g = d[i + 1];
        const b = d[i + 2];
        const lum = Math.max(r, g, b);

        const px = (i / 4) % img.width;
        const py = Math.floor((i / 4) / img.width);
        const dx = (px - cx) / (img.width * 0.5);
        const dy = (py - cy) / (img.height * 0.5);
        const distSq = dx * dx + dy * dy;
        const edgeFeather = Math.max(0, 1 - Math.max(0, distSq - 0.40) * 2.2);

        // Alpha based on luminescence and radial falloff
        d[i + 3] = Math.min(255, Math.floor(lum * 1.65 * edgeFeather));
      }
      ctx.putImageData(imgData, 0, 0);
      texture.needsUpdate = true;
    };

    return texture;
  }, []);

  const lightRef = useRef();
  const sprite1Ref = useRef();
  const sprite2Ref = useRef();
  const plane1Ref = useRef();
  const plane2Ref = useRef();
  const shockwaveRef = useRef();
  const shockwaveRingRef = useRef();
  const sparksRef = useRef();

  // Microgravity shrapnel / particle sparks generated once
  const sparkCount = 90;
  const [sparkGeometry, sparkVelocities] = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(sparkCount * 3);
    const colors = new Float32Array(sparkCount * 3);
    const vels = [];

    for (let i = 0; i < sparkCount; i++) {
      positions[i * 3] = 0;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = 0;

      // Random spherical explosion vector
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const speed = 12 + Math.random() * 32;

      vels.push([
        Math.sin(phi) * Math.cos(theta) * speed,
        Math.sin(phi) * Math.sin(theta) * speed,
        Math.cos(phi) * speed,
      ]);

      // Incandescent flame color spectrum (gold / orange / white)
      const isWhiteHot = Math.random() < 0.25;
      colors[i * 3] = 1.0;
      colors[i * 3 + 1] = isWhiteHot ? 0.95 : 0.4 + Math.random() * 0.4;
      colors[i * 3 + 2] = isWhiteHot ? 0.8 : 0.05;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return [geo, vels];
  }, []);

  const coords = isImported
    ? (MODULE_COORDINATES[epicenter] || MODULE_COORDINATES.destiny)
    : (PROCEDURAL_COORDINATES[epicenter] || PROCEDURAL_COORDINATES.destiny);

  const startClockRef = useRef(null);

  useFrame(({ clock, camera }) => {
    if (!active) {
      startClockRef.current = null;
      if (lightRef.current) lightRef.current.intensity = 0;
      if (sprite1Ref.current) sprite1Ref.current.scale.set(0, 0, 0);
      if (sprite2Ref.current) sprite2Ref.current.scale.set(0, 0, 0);
      if (plane1Ref.current) plane1Ref.current.scale.set(0, 0, 0);
      if (plane2Ref.current) plane2Ref.current.scale.set(0, 0, 0);
      if (shockwaveRef.current) shockwaveRef.current.scale.set(0, 0, 0);
      if (shockwaveRingRef.current) shockwaveRingRef.current.scale.set(0, 0, 0);
      if (sparksRef.current) sparksRef.current.material.opacity = 0;
      return;
    }

    if (startClockRef.current === null) startClockRef.current = clock.elapsedTime;
    const t = Math.max(0, clock.elapsedTime - startClockRef.current);
    const mult = isImported ? 1.0 : 0.35;
    const sevMult = severity / 5;

    // 1. Visceral camera shock tremor on blast impact
    if (t < 1.2) {
      const shakeDecay = Math.pow(Math.max(0, 1 - t / 1.2), 2.2);
      const shakeAmp = shakeDecay * (severity / 10) * 0.55;
      camera.position.x += (Math.sin(clock.elapsedTime * 95) + Math.cos(clock.elapsedTime * 140)) * shakeAmp * 0.5;
      camera.position.y += (Math.cos(clock.elapsedTime * 110) + Math.sin(clock.elapsedTime * 165)) * shakeAmp * 0.5;
      camera.position.z += Math.sin(clock.elapsedTime * 125) * shakeAmp * 0.5;
    }

    // 2. High-intensity detonation flash light (Instantaneous peak ignition at t = 0)
    if (lightRef.current) {
      if (t < 0.08) {
        lightRef.current.intensity = 260 * sevMult;
        lightRef.current.color.set('#ffffff');
      } else if (t < 3.2) {
        const q = (t - 0.08) / 3.12;
        lightRef.current.intensity = Math.max(0, (1 - q) * 140 * sevMult * (0.8 + 0.2 * Math.sin(t * 30)));
        lightRef.current.color.set('#ff8822');
      } else {
        lightRef.current.intensity = 0;
      }
    }

    // 3. Primary Camera-Facing Billboard Fireball (Instant expansion from t = 0)
    if (sprite1Ref.current) {
      if (t < 4.2) {
        let size;
        let opacity;
        if (t < 0.18) {
          const q = t / 0.18;
          size = (20 + q * 12) * sevMult * mult;
          opacity = 1.0;
        } else {
          const q = (t - 0.18) / 4.02;
          size = (32 + q * 16) * sevMult * mult;
          opacity = Math.max(0, Math.pow(1 - q, 1.2));
        }
        sprite1Ref.current.scale.set(size * 1.6, size, 1);
        sprite1Ref.current.material.opacity = opacity;
        sprite1Ref.current.material.rotation = t * 0.08;
      } else {
        sprite1Ref.current.scale.set(0, 0, 0);
      }
    }

    // 4. Secondary Counter-Rotating Churning Fireball Layer
    if (sprite2Ref.current) {
      if (t < 3.6) {
        let size;
        let opacity;
        if (t < 0.15) {
          const q = t / 0.15;
          size = (16 + q * 10) * sevMult * mult;
          opacity = 0.92;
        } else {
          const q = (t - 0.15) / 3.45;
          size = (26 + q * 12) * sevMult * mult;
          opacity = Math.max(0, Math.pow(1 - q, 1.5) * 0.88);
        }
        sprite2Ref.current.scale.set(size * 1.5, size, 1);
        sprite2Ref.current.material.opacity = opacity;
        sprite2Ref.current.material.rotation = -t * 0.15;
      } else {
        sprite2Ref.current.scale.set(0, 0, 0);
      }
    }

    // 5. 3D Cross-Plane Volumetric Lobes (true 3D depth from every orbit angle)
    const update3DPlane = (planeRef, rotOffset, scaleFactor) => {
      if (planeRef.current) {
        if (t < 3.8) {
          const q = Math.min(1, t / 3.8);
          const size = (20 + q * 18) * scaleFactor * sevMult * mult;
          planeRef.current.scale.set(size * 1.6, size, 1);
          planeRef.current.material.opacity = Math.max(0, Math.pow(1 - q, 1.4) * 0.75);
          planeRef.current.rotation.z = t * rotOffset;
        } else {
          planeRef.current.scale.set(0, 0, 0);
        }
      }
    };
    update3DPlane(plane1Ref, 0.18, 1.0);
    update3DPlane(plane2Ref, -0.22, 0.92);

    // 6. Expanding Hypersonic Vacuum Shockwave Rings
    if (shockwaveRef.current) {
      if (t < 1.8) {
        const q = t / 1.8;
        const ringScale = (2 + q * 54) * sevMult * mult;
        shockwaveRef.current.scale.set(ringScale, ringScale, ringScale);
        shockwaveRef.current.material.opacity = Math.max(0, Math.pow(1 - q, 2.0) * 0.9);
      } else {
        shockwaveRef.current.scale.set(0, 0, 0);
      }
    }
    if (shockwaveRingRef.current) {
      if (t < 2.2) {
        const q = t / 2.2;
        const ringScale = (3 + q * 68) * sevMult * mult;
        shockwaveRingRef.current.scale.set(ringScale, ringScale, ringScale);
        shockwaveRingRef.current.material.opacity = Math.max(0, Math.pow(1 - q, 1.8) * 0.6);
      } else {
        shockwaveRingRef.current.scale.set(0, 0, 0);
      }
    }

    // 7. Microgravity High-Velocity Sparks Burst
    if (sparksRef.current) {
      if (t < 3.5) {
        const q = t / 3.5;
        const posAttr = sparkGeometry.getAttribute('position');
        const posArray = posAttr.array;
        for (let i = 0; i < sparkCount; i++) {
          const vel = sparkVelocities[i];
          const drag = Math.exp(-t * 0.4);
          posArray[i * 3] = vel[0] * t * drag * mult * (sevMult * 0.8);
          posArray[i * 3 + 1] = vel[1] * t * drag * mult * (sevMult * 0.8);
          posArray[i * 3 + 2] = vel[2] * t * drag * mult * (sevMult * 0.8);
        }
        posAttr.needsUpdate = true;
        sparksRef.current.material.opacity = Math.max(0, Math.pow(1 - q, 1.3) * 0.95);
      } else {
        sparksRef.current.material.opacity = 0;
      }
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* Blinding detonation ignition light */}
      <pointLight ref={lightRef} position={coords} distance={180} decay={1.2} />

      {/* Layer 1: Primary Camera-Facing Blast Sprite */}
      <sprite ref={sprite1Ref} position={coords}>
        <spriteMaterial
          map={blastTexture}
          blending={THREE.AdditiveBlending}
          transparent={true}
          opacity={0}
          depthWrite={false}
        />
      </sprite>

      {/* Layer 2: Counter-Rotating Secondary Fireball Sprite */}
      <sprite ref={sprite2Ref} position={coords}>
        <spriteMaterial
          map={blastTexture}
          blending={THREE.AdditiveBlending}
          transparent={true}
          opacity={0}
          depthWrite={false}
        />
      </sprite>

      {/* Layer 3 & 4: 3D Volumetric Cross Planes (Double-Sided) */}
      <mesh ref={plane1Ref} position={coords} rotation={[0, Math.PI / 4, 0]}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial
          map={blastTexture}
          blending={THREE.AdditiveBlending}
          transparent={true}
          opacity={0}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh ref={plane2Ref} position={coords} rotation={[Math.PI / 4, 0, Math.PI / 3]}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial
          map={blastTexture}
          blending={THREE.AdditiveBlending}
          transparent={true}
          opacity={0}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Shockwave Rings */}
      <mesh ref={shockwaveRef} position={coords} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.85, 1.0, 64]} />
        <meshBasicMaterial
          color="#ffaa44"
          blending={THREE.AdditiveBlending}
          transparent={true}
          opacity={0}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh ref={shockwaveRingRef} position={coords} rotation={[0, Math.PI / 4, Math.PI / 4]}>
        <ringGeometry args={[0.9, 1.0, 64]} />
        <meshBasicMaterial
          color="#88ddff"
          blending={THREE.AdditiveBlending}
          transparent={true}
          opacity={0}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Flying Burning Debris Particles */}
      <points ref={sparksRef} geometry={sparkGeometry} position={coords}>
        <pointsMaterial
          size={0.65}
          vertexColors={true}
          blending={THREE.AdditiveBlending}
          transparent={true}
          opacity={0}
          depthWrite={false}
        />
      </points>
    </group>
  );
}

// 3D Microgravity Space Debris System: Authentically fracturing station pieces floating in vacuum
function FloatingSpaceDebris({ active, startedAt, epicenter, severity, isImported, count = 52 }) {
  const coords = isImported
    ? (MODULE_COORDINATES[epicenter] || MODULE_COORDINATES.destiny)
    : (PROCEDURAL_COORDINATES[epicenter] || PROCEDURAL_COORDINATES.destiny);

  const groupRef = useRef();
  const debrisRefs = useRef([]);

  // Generate diverse realistic space station debris components
  const pieces = useMemo(() => {
    const list = [];
    for (let i = 0; i < count; i++) {
      const typeIdx = i % 6;
      let type = 'hull';
      let color = '#b8c7d6';
      let metalness = 0.85;
      let roughness = 0.3;
      let emissive = '#ff4400';
      let scale = [1, 1, 1];

      if (typeIdx === 0) {
        // Outer Station Hull Armor Plate
        type = 'hull';
        color = '#c2d2e2';
        metalness = 0.88;
        roughness = 0.35;
        scale = [0.85 + (i % 3) * 0.25, 0.55 + (i % 2) * 0.2, 0.05];
      } else if (typeIdx === 1) {
        // Solar Array Photovoltaic Silicon Shard
        type = 'solar';
        color = '#0e3868';
        metalness = 0.92;
        roughness = 0.18;
        scale = [1.1 + (i % 2) * 0.3, 0.65 + (i % 3) * 0.2, 0.03];
      } else if (typeIdx === 2) {
        // Golden Kapton Multi-Layer Thermal Insulation (MLI) Foil Sheet
        type = 'foil';
        color = '#f59e0b';
        metalness = 0.98;
        roughness = 0.12;
        scale = [0.55 + (i % 3) * 0.15, 0.55 + (i % 2) * 0.15, 1];
      } else if (typeIdx === 3) {
        // Severed Titanium Truss Strut / Lattice Tube
        type = 'strut';
        color = '#e2e8f0';
        metalness = 0.75;
        roughness = 0.4;
        scale = [0.045, 0.045, 1.2 + (i % 3) * 0.4];
      } else if (typeIdx === 4) {
        // Avionics Cargo Box / Instrument Pod
        type = 'box';
        color = '#334155';
        metalness = 0.65;
        roughness = 0.45;
        scale = [0.36, 0.3, 0.24];
      } else {
        // High-velocity Jagged Shrapnel Shard
        type = 'shard';
        color = '#ff8833';
        metalness = 0.8;
        roughness = 0.3;
        scale = [0.22, 0.22, 0.22];
      }

      // Spherical explosive burst direction with slight bias away from station core
      const u = (i * 0.618033988749895) % 1;
      const v = ((i + 1) * 0.38196601125) % 1;
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const dir = [
        Math.sin(phi) * Math.cos(theta),
        Math.sin(phi) * Math.sin(theta),
        Math.cos(phi),
      ];

      // Random speed with severe kick for shrapnel, slower drift for heavy panels
      const baseSpeed = type === 'shard' ? 5.5 : type === 'foil' ? 3.4 : 2.5;
      const speed = (baseSpeed + (i % 7) * 0.7) * (isImported ? 1.0 : 0.4);

      // Random 3D angular velocity vector for authentic tumbling in zero-g
      const rotSpeed = [
        (Math.sin(i * 1.7) * 2.5),
        (Math.cos(i * 2.3) * 2.8),
        (Math.sin(i * 3.1) * 2.2),
      ];

      // Initial random offset right at the blast module perimeter
      const offset = [
        (Math.sin(i * 4.3) * 0.75),
        (Math.cos(i * 5.1) * 0.65),
        (Math.sin(i * 6.7) * 0.75),
      ];

      list.push({
        id: i,
        type,
        color,
        metalness,
        roughness,
        emissive,
        scale,
        dir,
        speed,
        rotSpeed,
        offset,
      });
    }
    return list;
  }, [count, isImported]);

  const startClockRef = useRef(null);

  useFrame(({ clock }) => {
    if (!active) {
      startClockRef.current = null;
      debrisRefs.current.forEach((mesh) => {
        if (mesh) mesh.scale.set(0, 0, 0);
      });
      return;
    }

    if (startClockRef.current === null) startClockRef.current = clock.elapsedTime;
    const t = Math.max(0, clock.elapsedTime - startClockRef.current);

    const sevMult = severity / 8;

    for (let i = 0; i < pieces.length; i++) {
      const mesh = debrisRefs.current[i];
      if (!mesh) continue;
      const p = pieces[i];

      // Microgravity drift: position = epicenter + initial offset + direction * speed * time
      const dist = p.speed * sevMult * t;
      mesh.position.set(
        coords[0] + p.offset[0] + p.dir[0] * dist,
        coords[1] + p.offset[1] + p.dir[1] * dist,
        coords[2] + p.offset[2] + p.dir[2] * dist
      );

      // Tumbling rotation in 3 axes (conservation of angular momentum in zero-g)
      mesh.rotation.x = p.rotSpeed[0] * t;
      mesh.rotation.y = p.rotSpeed[1] * t;
      mesh.rotation.z = p.rotSpeed[2] * t;

      // Scale in during explosive ignition: instantly visible on frame 0, fully expanding
      const scaleIntro = Math.min(1, 0.4 + (t / 0.06) * 0.6);
      mesh.scale.set(
        p.scale[0] * scaleIntro,
        p.scale[1] * scaleIntro,
        p.scale[2] * scaleIntro
      );

      // Thermal cooling: hot orange incandescent glow cools down to cold metal in vacuum
      if (mesh.material && mesh.material.emissive) {
        if (t < 2.8) {
          const heat = Math.max(0, 1 - t / 2.8);
          mesh.material.emissiveIntensity = (p.type === 'shard' ? 2.8 : 1.2) * heat;
        } else {
          mesh.material.emissiveIntensity = 0;
        }
      }
    }
  });

  return (
    <group ref={groupRef}>
      {pieces.map((p, i) => (
        <mesh
          key={p.id}
          ref={(el) => (debrisRefs.current[i] = el)}
          scale={[0, 0, 0]}
        >
          {p.type === 'hull' && <boxGeometry args={[1, 1, 1]} />}
          {p.type === 'solar' && <boxGeometry args={[1, 1, 1]} />}
          {p.type === 'foil' && <planeGeometry args={[1, 1]} />}
          {p.type === 'strut' && <cylinderGeometry args={[1, 1, 1, 8]} />}
          {p.type === 'box' && <boxGeometry args={[1, 1, 1]} />}
          {p.type === 'shard' && <tetrahedronGeometry args={[1, 0]} />}

          <meshStandardMaterial
            color={p.color}
            metalness={p.metalness}
            roughness={p.roughness}
            emissive={p.emissive}
            emissiveIntensity={0}
            side={p.type === 'foil' ? THREE.DoubleSide : THREE.FrontSide}
          />
        </mesh>
      ))}
    </group>
  );
}

// Photorealistic Starburst Sun with Anamorphic Lens Flare
function SunWithFlare({ position = [0, 195, -340] }) {
  const flareTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    const cx = 512;
    const cy = 512;

    const radGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 480);
    radGrad.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
    radGrad.addColorStop(0.06, 'rgba(255, 252, 235, 0.98)');
    radGrad.addColorStop(0.18, 'rgba(225, 235, 255, 0.55)');
    radGrad.addColorStop(0.45, 'rgba(145, 135, 255, 0.16)');
    radGrad.addColorStop(0.75, 'rgba(65, 50, 200, 0.03)');
    radGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = radGrad;
    ctx.fillRect(0, 0, 1024, 1024);

    const angles = [0, 22.5, 45, 67.5, 90, 112.5, 135, 157.5, 180, 202.5, 225, 247.5, 270, 292.5, 315, 337.5];
    for (let i = 0; i < angles.length; i++) {
      ctx.save();
      ctx.translate(cx, cy);
      const rad = (angles[i] * Math.PI) / 180;
      ctx.rotate(rad);
      const isCard = angles[i] % 90 === 0;
      const isDiag = angles[i] % 45 === 0;
      const spikeLen = isCard ? 512 : isDiag ? 430 : 280;
      const spikeWidth = isCard ? 4.5 : isDiag ? 3.0 : 1.4;

      const grad = ctx.createLinearGradient(0, 0, spikeLen, 0);
      grad.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
      grad.addColorStop(0.2, isCard ? 'rgba(250, 252, 255, 0.85)' : 'rgba(230, 240, 255, 0.65)');
      grad.addColorStop(0.65, 'rgba(160, 190, 255, 0.25)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(0, -spikeWidth);
      ctx.lineTo(spikeLen, 0);
      ctx.lineTo(0, spikeWidth);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);

  const streakTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createLinearGradient(0, 32, 1024, 32);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    grad.addColorStop(0.3, 'rgba(120, 150, 255, 0.25)');
    grad.addColorStop(0.47, 'rgba(220, 240, 255, 0.85)');
    grad.addColorStop(0.5, 'rgba(255, 255, 255, 1.0)');
    grad.addColorStop(0.53, 'rgba(220, 240, 255, 0.85)');
    grad.addColorStop(0.7, 'rgba(120, 150, 255, 0.25)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 26, 1024, 12);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);

  const ghostTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 60);
    grad.addColorStop(0, 'rgba(180, 120, 255, 0.55)');
    grad.addColorStop(0.7, 'rgba(90, 130, 255, 0.22)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      const x = 64 + Math.cos(a) * 56;
      const y = 64 + Math.sin(a) * 56;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);

  return (
    <group position={position}>
      <mesh>
        <sphereGeometry args={[13, 32, 32]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      <sprite scale={[210, 210, 1]}>
        <spriteMaterial map={flareTexture} blending={THREE.AdditiveBlending} transparent opacity={0.98} depthWrite={false} />
      </sprite>
      <sprite scale={[360, 14, 1]}>
        <spriteMaterial map={streakTexture} blending={THREE.AdditiveBlending} transparent opacity={0.85} depthWrite={false} />
      </sprite>
      <sprite position={[0, -90, 100]} scale={[240, 160, 1]}>
        <spriteMaterial map={flareTexture} blending={THREE.AdditiveBlending} transparent opacity={0.18} depthWrite={false} />
      </sprite>
      <sprite position={[0, -50, 60]} scale={[26, 26, 1]}>
        <spriteMaterial map={ghostTexture} blending={THREE.AdditiveBlending} transparent opacity={0.35} depthWrite={false} />
      </sprite>
      <sprite position={[0, -90, 110]} scale={[42, 42, 1]}>
        <spriteMaterial map={ghostTexture} blending={THREE.AdditiveBlending} transparent opacity={0.28} depthWrite={false} />
      </sprite>
      <sprite position={[0, -140, 165]} scale={[22, 22, 1]}>
        <spriteMaterial map={ghostTexture} blending={THREE.AdditiveBlending} transparent opacity={0.32} depthWrite={false} />
      </sprite>
      <sprite position={[0, -185, 215]} scale={[56, 56, 1]}>
        <spriteMaterial map={ghostTexture} blending={THREE.AdditiveBlending} transparent opacity={0.16} depthWrite={false} />
      </sprite>
      <directionalLight position={[0, 0, 0]} intensity={4.8} color="#fffcf2" />
    </group>
  );
}

// 3D Space Scene
function SpaceScene({ selected, onSelect, active, scenario, severity, startedAt, alertModule, modelUrl }) {
  const epicKey = scenario === 'impact' ? 'impact' : selected;

  return (
    <>
      <color attach="background" args={['#01040a']} />
      <SunWithFlare position={[0, 195, -340]} />
      <Stars radius={450} depth={140} count={9000} factor={4} saturation={0.25} fade speed={0.2} />
      <ambientLight intensity={1.1} />
      <directionalLight position={[0, 195, -340]} intensity={4.2} color="#fffcf2" />
      <directionalLight position={[-40, -30, -20]} intensity={1.2} color="#8ab8ff" />
      <pointLight position={[-20, 20, 30]} intensity={1.4} color="#8ec5ff" />

      {modelUrl ? (
        <Suspense fallback={<ProceduralStation selected={selected} onSelect={onSelect} alertModule={alertModule} active={active} startedAt={startedAt} severity={severity} scenario={scenario} />}>
          <ImportedStation src={modelUrl} selected={selected} scenario={scenario} active={active} startedAt={startedAt} severity={severity} />
        </Suspense>
      ) : (
        <ProceduralStation selected={selected} onSelect={onSelect} alertModule={alertModule} active={active} startedAt={startedAt} severity={severity} scenario={scenario} />
      )}

      <RealisticBlast active={active} startedAt={startedAt} epicenter={epicKey} severity={severity} isImported={!!modelUrl} />
      <FloatingSpaceDebris active={active} startedAt={startedAt} epicenter={epicKey} severity={severity} isImported={!!modelUrl} count={52} />

      <OrbitControls makeDefault enableDamping minDistance={2} maxDistance={250} target={[0, 0, 0]} />
    </>
  );
}

// 3D ISS Interior Module Cutaway using the authentic NASA ISS interior photo & real-time disaster cause sequence
function InteriorCutawayScene({ active, startedAt, scenario, severity, moduleName }) {
  const cabinRef = useRef();
  const klaxonRef = useRef();
  const breachLightRef = useRef();
  const debrisGroupRef = useRef();
  const causeRef = useRef();
  const fireGroupRef = useRef();
  const backdropRef = useRef();

  // Load the authentic user-uploaded ISS interior photo
  const interiorTexture = useMemo(() => {
    const loader = new THREE.TextureLoader();
    const tex = loader.load('/textures/interior.jpg');
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    return tex;
  }, []);

  // Floating zero-g items inside the module
  const items = useMemo(() => [
    { id: 1, pos: [-0.65, 0.15, 0.6], rot: [0.2, 0.4, 0], type: 'tablet', color: '#1a1f26' },
    { id: 2, pos: [0.7, -0.4, -0.6], rot: [0.8, 0.1, 0.5], type: 'toolbox', color: '#2a6594' },
    { id: 3, pos: [-0.4, -0.6, 0.1], rot: [0.1, 0.9, 0.3], type: 'container', color: '#8899a6' },
    { id: 4, pos: [0.45, 0.55, 0.8], rot: [0.5, 0.3, 0.8], type: 'flask', color: '#45cda0' },
  ], []);

  const startClockRef = useRef(null);

  useFrame(({ clock, camera }) => {
    const time = clock.elapsedTime;
    camera.position.x = Math.sin(time * 0.8) * 0.06;
    camera.position.y = Math.cos(time * 0.6) * 0.05;

    if (!active) {
      startClockRef.current = null;
      if (klaxonRef.current) {
        klaxonRef.current.color.set('#f4f9ff');
        klaxonRef.current.intensity = 3.5;
      }
      if (breachLightRef.current) breachLightRef.current.intensity = 0;
      if (causeRef.current) causeRef.current.scale.set(0, 0, 0);
      if (fireGroupRef.current) fireGroupRef.current.scale.set(0, 0, 0);
      if (backdropRef.current) backdropRef.current.material.color.set('#ffffff');

      if (debrisGroupRef.current) {
        debrisGroupRef.current.children.forEach((child, i) => {
          child.rotation.x += 0.005 * (i % 2 === 0 ? 1 : -1);
          child.rotation.y += 0.007 * (i % 3 === 0 ? 1 : -1);
          child.position.y += Math.sin(time * 1.5 + i) * 0.0015;
        });
      }
      return;
    }

    if (startClockRef.current === null) startClockRef.current = time;
    const t = Math.max(0, time - startClockRef.current);

    // 1. Violent camera tremor inside the module on blast impact
    if (t < 1.6) {
      const shakeDecay = Math.max(0, 1 - t / 1.6);
      camera.position.x += (Math.sin(time * 95) + Math.cos(time * 140)) * shakeDecay * 0.14;
      camera.position.y += (Math.cos(time * 110) + Math.sin(time * 165)) * shakeDecay * 0.14;
      camera.position.z = 3.0 + Math.sin(time * 80) * shakeDecay * 0.08;
    }

    // 2. Emergency Klaxon: Rapid pulsing alarm red bathing the ISS interior
    if (klaxonRef.current) {
      klaxonRef.current.color.set('#ff2200');
      const isStrobeOn = Math.sin(time * 18) > 0;
      klaxonRef.current.intensity = isStrobeOn ? 7.5 : 1.5;
      if (backdropRef.current) {
        backdropRef.current.material.color.set(isStrobeOn ? '#ff8877' : '#aa4433');
      }
    }

    // 3. Breach Light & Internal Fireball Flare
    if (breachLightRef.current) {
      if (t < 0.18) {
        breachLightRef.current.color.set('#ffffff');
        breachLightRef.current.intensity = (t / 0.18) * 140;
      } else if (t < 2.8) {
        breachLightRef.current.color.set('#ff7711');
        const q = (t - 0.18) / 2.62;
        breachLightRef.current.intensity = Math.max(0, (1 - q) * 80 * (0.8 + 0.2 * Math.sin(time * 30)));
      } else {
        breachLightRef.current.intensity = 0;
      }
    }

    // 4. Scenario-Specific Cause Progression
    if (causeRef.current) {
      if (t < 2.5) {
        causeRef.current.scale.set(1, 1, 1);
        if (scenario === 'impact') {
          const projT = Math.min(1, t / 0.22);
          causeRef.current.position.set(1.9 - projT * 3.0, 0.3 - projT * 0.15, -0.4);
        } else if (scenario === 'power') {
          causeRef.current.position.set(0, 1.1, -0.5);
          causeRef.current.rotation.z = time * 28;
        } else if (scenario === 'fire') {
          causeRef.current.position.set(-1.1, -0.1, -0.6);
        } else {
          causeRef.current.position.set(1.2, 0, -0.5);
        }
      } else {
        causeRef.current.scale.set(0, 0, 0);
      }
    }

    // 5. Internal Fire & Smoke Cloud
    if (fireGroupRef.current) {
      if (t < 3.4) {
        const fireScale = Math.min(1, t / 0.25) * (1 - t / 3.4) * 2.2;
        fireGroupRef.current.scale.set(fireScale, fireScale, fireScale);
        fireGroupRef.current.rotation.z = time * 0.8;
      } else {
        fireGroupRef.current.scale.set(0, 0, 0);
      }
    }

    // 6. Zero-G Debris violently sucked towards breach
    if (debrisGroupRef.current) {
      const breachPos = new THREE.Vector3(1.4, 0.2, -0.5);
      debrisGroupRef.current.children.forEach((child, i) => {
        const dir = new THREE.Vector3().subVectors(breachPos, child.position).normalize();
        const suckSpeed = Math.min(3.8, t * 2.4);
        child.position.addScaledVector(dir, 0.045 * suckSpeed);
        child.rotation.x += 0.09 * (i + 1);
        child.rotation.y += 0.14 * (i + 1);
      });
    }
  });

  return (
    <group ref={cabinRef}>
      {/* Authentic NASA ISS Laboratory Interior Backdrop (Exact 3:2 Photo Ratio 1024x682) */}
      <mesh ref={backdropRef} position={[0, 0, -2.0]} scale={[6.375, 4.246, 1]}>
        <planeGeometry args={[1, 1]} />
        <meshStandardMaterial
          map={interiorTexture}
          metalness={0.15}
          roughness={0.6}
        />
      </mesh>

      {/* Floating Zero-Gravity Items drifting across the ISS cabin */}
      <group ref={debrisGroupRef}>
        {items.map((item) => (
          <mesh key={item.id} position={item.pos} rotation={item.rot}>
            {item.type === 'tablet' && <boxGeometry args={[0.22, 0.3, 0.02]} />}
            {item.type === 'toolbox' && <boxGeometry args={[0.36, 0.24, 0.22]} />}
            {item.type === 'container' && <cylinderGeometry args={[0.13, 0.13, 0.32, 12]} />}
            {item.type === 'flask' && <sphereGeometry args={[0.13, 12, 12]} />}
            <meshStandardMaterial color={item.color} metalness={0.5} roughness={0.3} />
          </mesh>
        ))}
      </group>

      {/* Cause Element: Projectile / Arc / Thermal Core */}
      <group ref={causeRef} scale={[0, 0, 0]}>
        {scenario === 'impact' && (
          <mesh>
            <sphereGeometry args={[0.12, 14, 14]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
        )}
        {scenario === 'power' && (
          <mesh>
            <torusGeometry args={[0.42, 0.05, 8, 16]} />
            <meshBasicMaterial color="#88e0ff" />
          </mesh>
        )}
        {scenario === 'fire' && (
          <mesh>
            <sphereGeometry args={[0.38, 16, 16]} />
            <meshBasicMaterial color="#ff6611" />
          </mesh>
        )}
        {scenario === 'pressure' && (
          <mesh>
            <coneGeometry args={[0.38, 0.95, 14]} rotation={[0, 0, Math.PI / 2]} />
            <meshBasicMaterial color="#d8eeff" transparent opacity={0.85} />
          </mesh>
        )}
      </group>

      {/* Internal Fireball Combustion Puff */}
      <group ref={fireGroupRef} position={[1.2, 0, -0.5]} scale={[0, 0, 0]}>
        <mesh>
          <sphereGeometry args={[1.3, 20, 20]} />
          <meshBasicMaterial color="#ff7722" transparent opacity={0.85} />
        </mesh>
        <mesh scale={0.75}>
          <sphereGeometry args={[1.3, 16, 16]} />
          <meshBasicMaterial color="#ffdd44" transparent opacity={0.9} />
        </mesh>
      </group>

      {/* Dynamic Multi-Point Illumination (Klaxon Alarm Strobe & Breach Flash) */}
      <ambientLight intensity={1.6} color="#f4f9ff" />
      <pointLight ref={klaxonRef} position={[0, 1.3, 0]} distance={16} intensity={4.5} color="#eef6ff" decay={1.1} />
      <directionalLight position={[0, 0.6, 4.0]} intensity={2.0} color="#ffffff" />
      <pointLight ref={breachLightRef} position={[1.4, 0, -0.5]} distance={16} decay={1.1} />
    </group>
  );
}

// =========================================================================
// NASA ISS VIRTUAL TOUR & DEEP SPACE HULL BREACH SYSTEM
// Inspired by NASA ISS Virtual Tour (https://www.nasa.gov/feature/iss-virtual-tour/)
// Authentic modules, 360° astronaut exploration, interactive equipment hotspots,
// and realistic hull deconstruction: when blast occurs, the module wall fractures,
// revealing deep space and Earth outside, with interior equipment and debris
// violently sucked through the breach into the vacuum of space!
// =========================================================================

const NASA_HOTSPOTS = [
  {
    id: 'express_rack',
    module: 'destiny',
    title: 'EXPRESS Science Rack 3',
    code: 'ISPR-USL-ER3',
    pos: [-0.95, 0.35, -0.8],
    desc: 'Expedite the Processing of Experiments to Space Station. Houses 8 modular science payloads including Fluid Physics and Materials Science chambers.',
    telemetry: { status: 'ONLINE', power: '1.4 kW', flowRate: '42 kg/h', loopTemp: '18.2°C' },
  },
  {
    id: 'glovebox',
    module: 'destiny',
    title: 'Microgravity Science Glovebox (MSG)',
    code: 'MSG-USL-01',
    pos: [-0.95, -0.25, 0.7],
    desc: 'Sealed physical science glovebox allowing astronauts to conduct hazardous combustion, fluid, and materials experiments without contaminating cabin air.',
    telemetry: { status: 'SEALED', pressure: '101.2 kPa', nitrogen: 'PURGED', filterLife: '98%' },
  },
  {
    id: 'cupola_portal',
    module: 'destiny',
    title: 'Cupola Observation Portal',
    code: 'NODE3-CUP-01',
    pos: [0.95, 0.25, 1.3],
    desc: 'Access junction to the 7-window Cupola observatory. Provides astronauts with breathtaking 360° views of Earth and teleoperation control for Canadarm2.',
    telemetry: { status: 'CLEAR', shutter: 'OPEN', earthAngle: '42.1°', radiation: '0.18 mSv/d' },
  },
  {
    id: 'cws_terminal',
    module: 'destiny',
    title: 'Caution & Warning System (C&WS)',
    code: 'CWS-USL-MASTER',
    pos: [0.95, 0.45, -0.5],
    desc: 'Central ISS life-support monitoring terminal. Detects hull pressure drop, fire events, toxic atmospheres, and rapid depressurization alerts.',
    telemetry: { status: 'ARMED', klaxon: 'STANDBY', sensorBuses: 'DUAL REDUNDANT' },
  },
  {
    id: 'fwd_hatch',
    module: 'destiny',
    title: 'Forward Hatch 102 (Harmony Node 2)',
    code: 'HTCH-N2-102',
    pos: [0, 0, -3.2],
    desc: 'Bulkhead hatch with pressure equalization valve connecting Destiny Laboratory to Node 2 (Harmony) and the Columbus & Kibo laboratory modules.',
    telemetry: { status: 'LATCHED', deltaP: '0.00 kPa', sealIntegrity: '100%' },
  },
];

// Deep Space & Planet Earth curvature visible right outside the breached hull
function BreachedSpaceBackdrop({ breachPos = [2.0, 0.3, -1.4] }) {
  return (
    <group position={breachPos}>
      {/* Dense Deep Space Starfield */}
      <Stars radius={70} depth={50} count={3200} factor={4.2} saturation={0.25} speed={0.2} />

      {/* Planet Earth visible floating outside the ruptured module wall */}
      <mesh position={[14, -10, -16]} rotation={[0.2, -0.45, 0.15]}>
        <sphereGeometry args={[18, 48, 48]} />
        <meshStandardMaterial
          color="#1b4d79"
          roughness={0.65}
          metalness={0.15}
          emissive="#0a223a"
          emissiveIntensity={0.65}
        />
      </mesh>
      {/* Earth atmospheric limb haze */}
      <mesh position={[14, -10, -16]}>
        <sphereGeometry args={[18.4, 48, 48]} />
        <meshBasicMaterial
          color="#52afff"
          transparent
          opacity={0.28}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Direct orbital sunlight piercing through the hull rupture */}
      <directionalLight position={[16, 12, -8]} intensity={3.5} color="#fffcf2" />
    </group>
  );
}

// Supersonic Atmospheric Venting Plume (high-pressure 14.7 psi cabin venting to vacuum)
function DecompressionVaporPlume({ active, time, breachPos }) {
  const plumeRef = useRef();

  useFrame(() => {
    if (!plumeRef.current) return;
    if (!active) {
      plumeRef.current.scale.set(0, 0, 0);
      return;
    }
    const pulse = 1.0 + Math.sin(time * 26) * 0.15;
    plumeRef.current.scale.set(pulse, pulse, pulse);
    plumeRef.current.rotation.z = time * 2.8;
  });

  return (
    <group ref={plumeRef} position={breachPos} scale={[0, 0, 0]}>
      {[0.3, 0.7, 1.2, 1.8, 2.5, 3.4].map((dist, idx) => (
        <mesh key={idx} position={[dist * 1.3, dist * 0.15, -dist * 0.9]} rotation={[0, -0.65, 0]}>
          <ringGeometry args={[0.2 + idx * 0.2, 0.38 + idx * 0.35, 24]} />
          <meshBasicMaterial
            color="#bfe8ff"
            transparent
            opacity={Math.max(0, 0.75 - idx * 0.11)}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
      <pointLight position={[0.5, 0, 0]} intensity={4.0} color="#7dd3fc" distance={9} />
    </group>
  );
}

// Jagged Cracked Hull Aperture (peeled outward like explosive petals)
function JaggedBreachAperture({ active, time, breachPos }) {
  const petals = useMemo(() => {
    const list = [];
    const count = 12;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      list.push({
        angle,
        pos: [Math.cos(angle) * 0.9, Math.sin(angle) * 0.9, 0],
        rot: [Math.sin(angle) * 0.75, -Math.cos(angle) * 0.75, angle],
        scale: [0.38 + (i % 3) * 0.12, 0.7 + (i % 2) * 0.18, 0.05],
      });
    }
    return list;
  }, []);

  return (
    <group position={breachPos} rotation={[0, -0.65, 0]}>
      {petals.map((p, i) => (
        <mesh key={i} position={p.pos} rotation={p.rot} scale={p.scale}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial
            color="#94a3b8"
            metalness={0.92}
            roughness={0.22}
            emissive={active ? '#ff3b10' : '#000000'}
            emissiveIntensity={active ? 1.8 + Math.sin(time * 18 + i) * 0.6 : 0}
          />
        </mesh>
      ))}
    </group>
  );
}

// High-Voltage Electrical Arc Sparks from severed cables around breach
function ElectricalArcSparks({ active, time, breachPos }) {
  const sparksRef = useRef();

  useFrame(() => {
    if (!sparksRef.current) return;
    if (!active) {
      sparksRef.current.scale.set(0, 0, 0);
      return;
    }
    const isSparking = Math.sin(time * 35) > 0.35;
    sparksRef.current.scale.setScalar(isSparking ? 1.0 : 0.0);
    sparksRef.current.rotation.z = time * 45;
  });

  return (
    <group ref={sparksRef} position={breachPos} scale={[0, 0, 0]}>
      {[0, 1, 2, 3, 4].map((i) => {
        const a = (i / 5) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * 0.7, Math.sin(a) * 0.7, 0]} rotation={[0, 0, a]}>
            <cylinderGeometry args={[0.015, 0.015, 0.45, 6]} />
            <meshBasicMaterial color="#a5f3fc" />
          </mesh>
        );
      })}
      <pointLight distance={6} intensity={5.0} color="#67e8f9" />
    </group>
  );
}

// 42+ Diverse Interior Equipment & Zero-G Items violent suction and drift into deep space
function InteriorBreachDebrisField({ active, time, breachPos, severity }) {
  const debrisRefs = useRef([]);

  const pieces = useMemo(() => {
    const list = [];
    const types = ['rack_door', 'laptop', 'ctb', 'flask', 'toolbox', 'conduit', 'foil', 'strut'];

    for (let i = 0; i < 42; i++) {
      const type = types[i % types.length];
      // Starting positions floating inside the pressurized module corridor
      const initPos = [
        (Math.sin(i * 2.3) * 0.85),
        (Math.cos(i * 1.7) * 0.65),
        -4.2 + (i / 42) * 8.4,
      ];
      // Random tumbling rotational velocities in 3 axes
      const rotSpeed = [
        Math.sin(i * 3.1) * 3.2,
        Math.cos(i * 2.7) * 3.5,
        Math.sin(i * 4.3) * 2.8,
      ];
      // Trajectory vector heading OUT into open space after crossing the breach
      const exitDir = [
        2.2 + (Math.sin(i * 1.9) * 0.7),
        -0.5 + (Math.cos(i * 2.1) * 0.6),
        -1.3 + (Math.sin(i * 2.9) * 0.9),
      ];
      const speed = 1.9 + (i % 6) * 0.48;

      let color = '#ffffff';
      let scale = [0.25, 0.25, 0.25];
      let metalness = 0.5;
      let roughness = 0.4;

      if (type === 'rack_door') {
        color = '#e2e8f0';
        scale = [0.46, 0.88, 0.04];
        metalness = 0.88;
        roughness = 0.22;
      } else if (type === 'laptop') {
        color = '#0f172a';
        scale = [0.34, 0.24, 0.03];
        metalness = 0.4;
        roughness = 0.3;
      } else if (type === 'ctb') {
        // White NASA Cargo Transfer Bag (stowage)
        color = '#f8fafc';
        scale = [0.38, 0.32, 0.28];
        metalness = 0.1;
        roughness = 0.85;
      } else if (type === 'flask') {
        color = (i % 2 === 0) ? '#45cda0' : '#38bdf8';
        scale = [0.12, 0.28, 0.12];
        metalness = 0.7;
        roughness = 0.2;
      } else if (type === 'toolbox') {
        color = '#2563eb';
        scale = [0.38, 0.24, 0.2];
        metalness = 0.65;
        roughness = 0.35;
      } else if (type === 'conduit') {
        color = '#94a3b8';
        scale = [0.045, 0.045, 1.1];
        metalness = 0.9;
        roughness = 0.3;
      } else if (type === 'foil') {
        // Golden Kapton Thermal MLI Blanket
        color = '#f59e0b';
        scale = [0.5, 0.5, 0.01];
        metalness = 0.98;
        roughness = 0.12;
      } else {
        color = '#cbd5e1';
        scale = [0.065, 0.065, 0.8];
        metalness = 0.78;
        roughness = 0.38;
      }

      list.push({ id: i, type, initPos, rotSpeed, exitDir, speed, color, scale, metalness, roughness });
    }
    return list;
  }, []);

  useFrame(() => {
    if (!active) {
      pieces.forEach((p, i) => {
        const mesh = debrisRefs.current[i];
        if (!mesh) return;
        mesh.position.set(
          p.initPos[0] + Math.sin(time * 0.9 + i) * 0.03,
          p.initPos[1] + Math.cos(time * 0.7 + i) * 0.03,
          p.initPos[2] + Math.sin(time * 0.5 + i) * 0.02
        );
        mesh.rotation.set(
          p.rotSpeed[0] * time * 0.04,
          p.rotSpeed[1] * time * 0.04,
          p.rotSpeed[2] * time * 0.04
        );
      });
      return;
    }

    const sevMult = severity / 7;
    pieces.forEach((p, i) => {
      const mesh = debrisRefs.current[i];
      if (!mesh) return;

      const targetPos = new THREE.Vector3(...breachPos);
      const startPos = new THREE.Vector3(...p.initPos);
      const reachTime = 0.9 + (i % 6) * 0.22;

      if (time < reachTime) {
        // Phase 1: Violently sucked towards breach inside cabin
        const q = Math.min(1, time / reachTime);
        mesh.position.lerpVectors(startPos, targetPos, Math.pow(q, 2.0));
      } else {
        // Phase 2: Blown OUT through the breach into DEEP SPACE!
        const outsideTime = time - reachTime;
        const flightDist = outsideTime * p.speed * sevMult * 1.8;
        mesh.position.set(
          targetPos.x + p.exitDir[0] * flightDist,
          targetPos.y + p.exitDir[1] * flightDist,
          targetPos.z + p.exitDir[2] * flightDist
        );
      }

      // 3D Tumbling in vacuum
      mesh.rotation.x = p.rotSpeed[0] * time * 2.4;
      mesh.rotation.y = p.rotSpeed[1] * time * 2.4;
      mesh.rotation.z = p.rotSpeed[2] * time * 2.4;
    });
  });

  return (
    <group>
      {pieces.map((p, i) => (
        <mesh
          key={p.id}
          ref={(el) => (debrisRefs.current[i] = el)}
          position={p.initPos}
          scale={p.scale}
        >
          {p.type === 'conduit' || p.type === 'strut' ? (
            <cylinderGeometry args={[1, 1, 1, 10]} />
          ) : p.type === 'foil' ? (
            <planeGeometry args={[1, 1]} />
          ) : (
            <boxGeometry args={[1, 1, 1]} />
          )}
          <meshStandardMaterial
            color={p.color}
            metalness={p.metalness}
            roughness={p.roughness}
            side={p.type === 'foil' ? THREE.DoubleSide : THREE.FrontSide}
          />
        </mesh>
      ))}
    </group>
  );
}

// Cupola 360° Observation Dome (7 panoramic windows overlooking Earth)
function CupolaModule({ active, time, severity }) {
  const windowAngles = [0, 60, 120, 180, 240, 300];

  return (
    <group position={[0, -0.4, 0]}>
      {/* Deep Space & Planet Earth beneath Cupola */}
      <Stars radius={60} depth={40} count={3000} factor={4} speed={0.2} />

      {/* Earth directly below observation windows */}
      <mesh position={[0, -22, -8]} rotation={[0.4, 0.2, -0.1]}>
        <sphereGeometry args={[20, 48, 48]} />
        <meshStandardMaterial
          color="#1b4d79"
          roughness={0.65}
          metalness={0.15}
          emissive="#0a223a"
          emissiveIntensity={0.6}
        />
      </mesh>
      <mesh position={[0, -22, -8]}>
        <sphereGeometry args={[20.4, 48, 48]} />
        <meshBasicMaterial color="#55adff" transparent opacity={0.26} side={THREE.BackSide} />
      </mesh>

      {/* Cupola Dome Structure */}
      <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[2.0, 2.4, 1.2, 8, 1, true]} />
        <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.3} side={THREE.DoubleSide} />
      </mesh>

      {/* Central Circular Nadir Window (80cm diameter) */}
      <mesh position={[0, -0.6, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.75, 32]} />
        <meshPhysicalMaterial
          color={active ? '#ff6644' : '#bae6fd'}
          transmission={0.92}
          roughness={0.08}
          transparent
          opacity={0.6}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Central Window Frame Ring */}
      <mesh position={[0, -0.59, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.74, 0.84, 32]} />
        <meshStandardMaterial color="#64748b" metalness={0.9} roughness={0.2} side={THREE.DoubleSide} />
      </mesh>

      {/* 6 Angled Trapezoidal Windows around Cupola Perimeter */}
      {windowAngles.map((deg, i) => {
        const rad = (deg * Math.PI) / 180;
        const x = Math.sin(rad) * 1.5;
        const z = Math.cos(rad) * 1.5;
        return (
          <group key={i} position={[x, 0, z]} rotation={[0, rad, 0.35]}>
            <mesh>
              <planeGeometry args={[1.05, 0.85]} />
              <meshPhysicalMaterial
                color={active ? '#ff6644' : '#bae6fd'}
                transmission={0.92}
                roughness={0.08}
                transparent
                opacity={0.6}
                side={THREE.DoubleSide}
              />
            </mesh>
            {/* Window Frame border */}
            <mesh scale={[1.1, 0.9, 1]}>
              <ringGeometry args={[0.48, 0.56, 4]} />
              <meshStandardMaterial color="#64748b" metalness={0.9} roughness={0.2} side={THREE.DoubleSide} />
            </mesh>
          </group>
        );
      })}

      {/* Canadarm2 Robotic Workstation Console */}
      <group position={[0, -0.5, 0.7]} rotation={[-0.4, 0, 0]}>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.8, 0.3, 0.08]} />
          <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.3} />
        </mesh>
        {/* Dual Hand Controllers (Joysticks) */}
        <mesh position={[-0.25, 0.1, 0.08]}>
          <cylinderGeometry args={[0.02, 0.02, 0.16, 8]} />
          <meshStandardMaterial color="#0284c7" />
        </mesh>
        <mesh position={[0.25, 0.1, 0.08]}>
          <cylinderGeometry args={[0.02, 0.02, 0.16, 8]} />
          <meshStandardMaterial color="#0284c7" />
        </mesh>
      </group>
    </group>
  );
}

// 3D Hotspot Pin in the NASA Virtual Tour style
function HotspotMarker3D({ hotspot, isSelected, onClick, active }) {
  const markerRef = useRef();

  useFrame(({ clock }) => {
    if (!markerRef.current) return;
    const time = clock.elapsedTime;
    markerRef.current.rotation.z = time * 1.8;
    const pulse = 1.0 + Math.sin(time * 4) * 0.18;
    markerRef.current.scale.set(pulse, pulse, pulse);
  });

  return (
    <group position={hotspot.pos} onClick={(e) => { e.stopPropagation(); onClick(hotspot); }}>
      <mesh ref={markerRef}>
        <ringGeometry args={[0.08, 0.12, 16]} />
        <meshBasicMaterial color={active ? '#ff3b30' : isSelected ? '#38bdf8' : '#45cda0'} side={THREE.DoubleSide} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.045, 12, 12]} />
        <meshBasicMaterial color={active ? '#ff3b30' : isSelected ? '#38bdf8' : '#61d7f5'} />
      </mesh>
      <pointLight distance={1.8} intensity={2.0} color={active ? '#ff3b30' : '#61d7f5'} />
    </group>
  );
}

// Authentic 3D Photogrammetry Interior Model with Dynamic Mesh Fracture & Deep Space Breach
function Interior3DModel({
  active,
  scenario,
  severity,
  interiorModule = 'destiny',
  showHotspots = true,
  selectedHotspot,
  onSelectHotspot,
}) {
  const { scene } = useGLTF('/models/scene.gltf');
  const interiorRef = useRef();
  const strobeLightRef = useRef();
  const breachLightRef = useRef();
  const blastFireRef = useRef();
  const startClockRef = useRef(null);
  const meshDataRef = useRef([]);

  const breachPos = useMemo(() => [1.95, 0.28, -1.35], []);

  // Clone photogrammetry model and prepare meshes for dynamic shockwave fracturing
  const cloned = useMemo(() => {
    const c = scene.clone(true);
    c.rotation.x = -Math.PI / 2;

    const box = new THREE.Box3().setFromObject(c);
    const center = new THREE.Vector3();
    box.getCenter(center);
    c.position.sub(center);
    c.updateMatrixWorld(true);

    const meshList = [];
    c.traverse((child) => {
      if (child.isMesh && child.material) {
        child.material = child.material.clone();
        child.material.side = THREE.DoubleSide;
        child.material.roughness = Math.min(0.9, child.material.roughness || 0.85);
        if (child.material.map) {
          child.material.map.colorSpace = THREE.SRGBColorSpace;
          child.material.map.minFilter = THREE.LinearMipmapLinearFilter;
        }

        meshList.push({
          mesh: child,
          origPos: child.position.clone(),
          origRot: child.rotation.clone(),
          dir: new THREE.Vector3(
            1.2 + (Math.random() - 0.2) * 1.5,
            (Math.random() - 0.5) * 1.2,
            -0.8 + (Math.random() - 0.5) * 1.5
          ).normalize(),
          rotSpeed: [
            (Math.random() - 0.5) * 1.5,
            (Math.random() - 0.5) * 1.5,
            (Math.random() - 0.5) * 1.5,
          ],
          speed: 1.2 + Math.random() * 2.8,
        });
      }
    });

    meshDataRef.current = meshList;
    return c;
  }, [scene]);

  const [simTime, setSimTime] = useState(0);

  useFrame(({ clock, camera }) => {
    const time = clock.elapsedTime;
    setSimTime(time);

    if (!active) {
      startClockRef.current = null;
      if (strobeLightRef.current) {
        strobeLightRef.current.color.set('#f0f6fc');
        strobeLightRef.current.intensity = 2.6;
      }
      if (breachLightRef.current) breachLightRef.current.intensity = 0;
      if (blastFireRef.current) blastFireRef.current.scale.set(0, 0, 0);

      // Restore all photogrammetry mesh positions to nominal intact state
      meshDataRef.current.forEach((item) => {
        if (item.mesh) {
          item.mesh.position.copy(item.origPos);
          item.mesh.rotation.copy(item.origRot);
        }
      });
      return;
    }

    if (startClockRef.current === null) startClockRef.current = time;
    const t = Math.max(0, time - startClockRef.current);
    const sevMult = severity / 7;

    // 1. Visceral camera shock tremor inside the module on blast impact
    if (t < 1.6) {
      const shakeDecay = Math.max(0, 1 - t / 1.6);
      camera.position.x += (Math.sin(time * 95) + Math.cos(time * 140)) * shakeDecay * 0.08;
      camera.position.y += (Math.cos(time * 110) + Math.sin(time * 165)) * shakeDecay * 0.08;
      camera.position.z += Math.sin(time * 80) * shakeDecay * 0.05;
    }

    // 2. Emergency Klaxon: pulsing red alarm light
    if (strobeLightRef.current) {
      strobeLightRef.current.color.set('#ff1a00');
      const isStrobeOn = Math.sin(time * 22) > 0;
      strobeLightRef.current.intensity = isStrobeOn ? 8.5 : 1.4;
    }

    // 3. Breach Flash Light
    if (breachLightRef.current) {
      if (t < 0.2) {
        breachLightRef.current.intensity = (t / 0.2) * 95;
        breachLightRef.current.color.set('#ffffff');
      } else if (t < 2.8) {
        const q = (t - 0.2) / 2.6;
        breachLightRef.current.intensity = Math.max(0, (1 - q) * 60 * (0.8 + 0.2 * Math.sin(time * 30)));
        breachLightRef.current.color.set('#ff6611');
      } else {
        breachLightRef.current.intensity = 0;
      }
    }

    // 4. Combustion Fireball Puff inside module
    if (blastFireRef.current) {
      if (t < 3.0) {
        const fireScale = Math.min(1, t / 0.18) * (1 - t / 3.0) * 2.0;
        blastFireRef.current.scale.set(fireScale, fireScale, fireScale);
        blastFireRef.current.rotation.z = time * 1.2;
      } else {
        blastFireRef.current.scale.set(0, 0, 0);
      }
    }

    // 5. Dynamic mesh fracture: Photogrammetry module meshes buckle & separate into space!
    meshDataRef.current.forEach((item) => {
      if (item.mesh) {
        const dist = item.speed * sevMult * Math.min(3.2, t) * 0.45;
        item.mesh.position.set(
          item.origPos.x + item.dir.x * dist,
          item.origPos.y + item.dir.y * dist * 0.6,
          item.origPos.z + item.dir.z * dist
        );
        item.mesh.rotation.x = item.origRot.x + item.rotSpeed[0] * t * 0.22;
        item.mesh.rotation.y = item.origRot.y + item.rotSpeed[1] * t * 0.22;
        item.mesh.rotation.z = item.origRot.z + item.rotSpeed[2] * t * 0.22;
      }
    });
  });

  return (
    <group ref={interiorRef}>
      {interiorModule === 'cupola' ? (
        <CupolaModule active={active} time={simTime} severity={severity} />
      ) : (
        /* Destiny Laboratory Photogrammetry Model */
        <primitive object={cloned} />
      )}

      {/* Deep Space & Planet Earth curvature visible right outside the breached hull */}
      <BreachedSpaceBackdrop breachPos={breachPos} />

      {/* Supersonic Atmospheric Venting Plume (high-pressure cabin venting into vacuum) */}
      <DecompressionVaporPlume active={active} time={simTime} breachPos={breachPos} />

      {/* Jagged Cracked Hull Aperture with glowing incandescent edges */}
      <JaggedBreachAperture active={active} time={simTime} breachPos={breachPos} />

      {/* High-Voltage Electrical Arc Sparks from severed cables around breach */}
      <ElectricalArcSparks active={active} time={simTime} breachPos={breachPos} />

      {/* 42+ Diverse Interior Equipment & Zero-G Items violent suction and drift into deep space */}
      <InteriorBreachDebrisField active={active} time={simTime} breachPos={breachPos} severity={severity} />

      {/* NASA ISS Virtual Tour Interactive 3D Hotspot Markers */}
      {showHotspots && !active && interiorModule === 'destiny' && (
        <group>
          {NASA_HOTSPOTS.map((h) => (
            <HotspotMarker3D
              key={h.id}
              hotspot={h}
              isSelected={selectedHotspot?.id === h.id}
              onClick={onSelectHotspot}
              active={active}
            />
          ))}
        </group>
      )}

      {/* Internal Combustion Fireball Puff */}
      <group ref={blastFireRef} position={breachPos} scale={[0, 0, 0]}>
        <mesh>
          <sphereGeometry args={[1.2, 16, 16]} />
          <meshBasicMaterial color="#ff6611" transparent opacity={0.82} />
        </mesh>
        <mesh scale={0.7}>
          <sphereGeometry args={[1.2, 14, 14]} />
          <meshBasicMaterial color="#ffdd44" transparent opacity={0.88} />
        </mesh>
      </group>

      {/* Cabin Multi-Point Illumination (Switches to Emergency Crimson Klaxon on blast) */}
      <ambientLight intensity={1.7} color="#f0f6fc" />
      <pointLight position={[0, 1.1, -7.0]} distance={16} intensity={2.2} color="#f0f6fc" decay={1.0} />
      <pointLight position={[0, 1.1, -3.5]} distance={16} intensity={2.4} color="#f0f6fc" decay={1.0} />
      <pointLight ref={strobeLightRef} position={[0, 1.1, 0]} distance={20} intensity={2.8} color="#eef6ff" decay={1.0} />
      <pointLight position={[0, 1.1, 3.5]} distance={16} intensity={2.4} color="#f0f6fc" decay={1.0} />
      <pointLight position={[0, 1.1, 7.0]} distance={16} intensity={2.2} color="#f0f6fc" decay={1.0} />
      <directionalLight position={[0, 0.8, 4.0]} intensity={1.6} color="#ffffff" />
      <directionalLight position={[0, -0.8, -4.0]} intensity={1.2} color="#b8d8ff" />
      <pointLight ref={breachLightRef} position={breachPos} distance={18} decay={1.1} />
    </group>
  );
}

// 3D Interior Viewer with NASA ISS Virtual Tour controls, right-click move, scroll zoom, and breach HUD
function Interior3DViewer({ active, startedAt, scenario, severity }) {
  const controlsRef = useRef(null);
  const containerRef = useRef(null);

  const [interiorModule, setInteriorModule] = useState('destiny');
  const [showHotspots, setShowHotspots] = useState(true);
  const [selectedHotspot, setSelectedHotspot] = useState(null);

  // Quick preset navigation helpers
  const navCenter = () => {
    if (!controlsRef.current) return;
    const c = controlsRef.current;
    c.target.set(0, 0, 0);
    c.object.position.set(0, 0, 0.5);
    c.update();
  };

  const navFwd = () => {
    if (!controlsRef.current) return;
    const c = controlsRef.current;
    c.target.set(0, 0, -4.2);
    c.object.position.set(0, 0, -3.5);
    c.update();
  };

  const navAft = () => {
    if (!controlsRef.current) return;
    const c = controlsRef.current;
    c.target.set(0, 0, 4.2);
    c.object.position.set(0, 0, 3.5);
    c.update();
  };

  const navReset = () => {
    if (!controlsRef.current) return;
    controlsRef.current.reset();
  };

  const navZoomIn = () => {
    if (!controlsRef.current) return;
    const c = controlsRef.current;
    const dir = new THREE.Vector3().subVectors(c.target, c.object.position).normalize();
    c.object.position.addScaledVector(dir, 0.85);
    c.update();
  };

  const navZoomOut = () => {
    if (!controlsRef.current) return;
    const c = controlsRef.current;
    const dir = new THREE.Vector3().subVectors(c.target, c.object.position).normalize();
    c.object.position.addScaledVector(dir, -0.85);
    c.update();
  };

  const switchModule = (mod) => {
    setInteriorModule(mod);
    setSelectedHotspot(null);
    if (!controlsRef.current) return;
    const c = controlsRef.current;
    if (mod === 'cupola') {
      c.target.set(0, -0.6, 0);
      c.object.position.set(0, -0.1, 0.3);
    } else if (mod === 'harmony') {
      c.target.set(0, 0, -4.5);
      c.object.position.set(0, 0, -3.0);
    } else {
      c.target.set(0, 0, 0);
      c.object.position.set(0, 0, 0.5);
    }
    c.update();
  };

  return (
    <div
      ref={containerRef}
      className={`interior-3d-wrapper ${active ? 'breached' : ''}`}
      style={{ width: '100%', height: '100%', position: 'relative' }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <Canvas
        camera={{ position: [0, 0, 0.5], fov: 70, near: 0.05, far: 120 }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.45 }}
        onContextMenu={(e) => e.preventDefault()}
      >
        <Suspense fallback={<InteriorCutawayScene active={active} startedAt={startedAt} scenario={scenario} severity={severity} />}>
          <Interior3DModel
            active={active}
            startedAt={startedAt}
            scenario={scenario}
            severity={severity}
            interiorModule={interiorModule}
            showHotspots={showHotspots}
            selectedHotspot={selectedHotspot}
            onSelectHotspot={setSelectedHotspot}
          />
        </Suspense>

        <OrbitControls
          ref={controlsRef}
          makeDefault
          enableDamping={true}
          dampingFactor={0.08}
          enablePan={true}
          panSpeed={2.0}
          screenSpacePanning={true}
          enableZoom={true}
          zoomSpeed={1.3}
          enableRotate={true}
          rotateSpeed={0.75}
          minDistance={0.05}
          maxDistance={35}
          target={[0, 0, 0]}
          mouseButtons={{
            LEFT: THREE.MOUSE.ROTATE,
            MIDDLE: THREE.MOUSE.DOLLY,
            RIGHT: THREE.MOUSE.PAN,
          }}
          touches={{
            ONE: THREE.TOUCH.ROTATE,
            TWO: THREE.TOUCH.DOLLY_PAN,
          }}
        />
      </Canvas>

      {/* NASA ISS Virtual Tour Module Switcher & Hotspot Toggle */}
      <div className="nasa-tour-topbar">
        <div className="nasa-tour-modules">
          <button
            className={`nasa-module-btn ${interiorModule === 'destiny' ? 'active' : ''}`}
            onClick={() => switchModule('destiny')}
            title="Explore U.S. Destiny Science Laboratory"
          >
            🔬 DESTINY LAB
          </button>
          <button
            className={`nasa-module-btn ${interiorModule === 'cupola' ? 'active' : ''}`}
            onClick={() => switchModule('cupola')}
            title="Explore 7-Window Cupola Earth Observation Bay"
          >
            🌍 CUPOLA EARTH
          </button>
          <button
            className={`nasa-module-btn ${interiorModule === 'harmony' ? 'active' : ''}`}
            onClick={() => switchModule('harmony')}
            title="Explore Node 2 Harmony Docking Hatchways"
          >
            🚪 HARMONY NODE
          </button>
        </div>
        <button
          className={`nasa-hotspot-toggle ${showHotspots ? 'active' : ''}`}
          onClick={() => setShowHotspots((v) => !v)}
          title="Toggle NASA Equipment Inspection Pins"
        >
          📍 {showHotspots ? 'PINS ON' : 'PINS OFF'}
        </button>
      </div>

      {/* Floating NASA Telemetry Hotspot Info Card */}
      {selectedHotspot && !active && (
        <div className="nasa-telemetry-card">
          <div className="nasa-card-head">
            <span className="nasa-card-code">{selectedHotspot.code}</span>
            <button className="nasa-card-close" onClick={() => setSelectedHotspot(null)}>✕</button>
          </div>
          <h4>{selectedHotspot.title}</h4>
          <p>{selectedHotspot.desc}</p>
          <div className="nasa-card-telemetry">
            {Object.entries(selectedHotspot.telemetry).map(([k, v]) => (
              <div key={k} className="nasa-telem-row">
                <span className="telem-key">{k.toUpperCase()}</span>
                <span className="telem-val">{v}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Corridor Navigation Bar */}
      <div className="interior-preset-bar">
        <button onClick={navFwd} className="interior-mini-nav" title="Glide to Forward Hatch">⬆️ FWD</button>
        <button onClick={navCenter} className="interior-mini-nav active" title="Center Module Corridor">🎯 CENTER</button>
        <button onClick={navAft} className="interior-mini-nav" title="Glide to Aft Airlock">⬇️ AFT</button>
        <button onClick={navReset} className="interior-mini-nav" title="Reset View">🔄 RESET</button>
        <div className="interior-zoom-group">
          <button onClick={navZoomIn} className="interior-zoom-btn" title="Zoom In">➕</button>
          <button onClick={navZoomOut} className="interior-zoom-btn" title="Zoom Out">➖</button>
        </div>
      </div>

      {/* Mouse Guidance Badge */}
      <div className="interior-nav-badge">
        🖱️ <b>RIGHT CLICK</b>: MOVE &nbsp;•&nbsp; <b>LEFT CLICK</b>: 360° LOOK &nbsp;•&nbsp; <b>SCROLL</b>: ZOOM
      </div>

      {/* Active Breach Warning Banner */}
      {active && (
        <div className="interior-alarm-overlay">
          <span className="interior-alarm-text">
            ⚠️ CATASTROPHIC HULL BREACH // RAPID CABIN DEPRESSURIZATION // INTERIOR VENTING TO SPACE
          </span>
        </div>
      )}
    </div>
  );
}

function InternalModuleViewer({ active, startedAt, scenario, severity, moduleName }) {
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Canvas
        camera={{ position: [0, 0, 3.0], fov: 46, near: 0.1, far: 50 }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.5 }}
      >
        <InteriorCutawayScene
          active={active}
          startedAt={startedAt}
          scenario={scenario}
          severity={severity}
          moduleName={moduleName}
        />
      </Canvas>
    </div>
  );
}

// Dynamic Camera Rig tracking the blast epicenter module in the Hub Cam
function HubCamRig({ epicenter, active, startedAt, severity, camAngle, zoom, isImported }) {
  const coords = isImported
    ? (MODULE_COORDINATES[epicenter] || MODULE_COORDINATES.destiny)
    : (PROCEDURAL_COORDINATES[epicenter] || PROCEDURAL_COORDINATES.destiny);
  const epicVec = useMemo(() => new THREE.Vector3(...coords), [coords]);
  const startClockRef = useRef(null);

  useFrame(({ clock, camera }) => {
    const time = clock.elapsedTime;
    const zFactor = Math.max(0.35, 1.0 / zoom);

    // Compute base target camera offset relative to the blast module
    const baseOffset = new THREE.Vector3();
    if (camAngle === 'orbit') {
      const radius = 20 * zFactor;
      baseOffset.set(
        Math.sin(time * 0.35) * radius,
        3 * zFactor + Math.cos(time * 0.2) * 5 * zFactor,
        Math.cos(time * 0.35) * radius
      );
    } else if (camAngle === 'chase') {
      baseOffset.set(0, 2.5 * zFactor, 15 * zFactor);
    } else {
      // 'tactical' - Default 45° angle optimal for watching debris disperse into space
      baseOffset.set(13 * zFactor, 7 * zFactor, 15 * zFactor);
    }

    camera.position.set(
      epicVec.x + baseOffset.x,
      epicVec.y + baseOffset.y,
      epicVec.z + baseOffset.z
    );

    // Violent blast shock tremor on the Hub Cam optical sensor
    if (!active) {
      startClockRef.current = null;
    } else {
      if (startClockRef.current === null) startClockRef.current = time;
      const t = Math.max(0, time - startClockRef.current);
      if (t < 1.4) {
        const shakeDecay = Math.max(0, 1 - t / 1.4);
        const amp = shakeDecay * (severity / 8) * 0.85;
        camera.position.x += (Math.sin(time * 85) + Math.cos(time * 125)) * amp;
        camera.position.y += (Math.cos(time * 100) + Math.sin(time * 145)) * amp;
        camera.position.z += Math.sin(time * 115) * amp * 0.5;
      }
    }

    camera.lookAt(epicVec);
  });

  return null;
}

// 3D Hub Cam Scene: Close-up tactical optical view of the International Space Station blast & floating debris
function HubCam3DScene({
  selected,
  active,
  scenario,
  severity,
  startedAt,
  modelUrl,
  camAngle = 'tactical',
  zoom = 1.0,
}) {
  const epicKey = scenario === 'impact' ? 'impact' : selected;

  return (
    <>
      <color attach="background" args={['#01050e']} />

      {/* Earth curvature in the distance of Hub Cam */}
      <mesh position={[0, -260, -50]}>
        <sphereGeometry args={[230, 48, 48]} />
        <meshStandardMaterial
          color="#16385a"
          roughness={0.7}
          metalness={0.15}
          emissive="#091d33"
          emissiveIntensity={0.6}
        />
      </mesh>
      {/* Earth atmospheric limb haze */}
      <mesh position={[0, -260, -50]}>
        <sphereGeometry args={[234, 48, 48]} />
        <meshBasicMaterial
          color="#4fa3e3"
          transparent
          opacity={0.15}
          side={THREE.BackSide}
        />
      </mesh>

      <Stars radius={250} depth={80} count={4500} factor={3} saturation={0.25} fade speed={0.15} />

      {/* Realistic lighting */}
      <ambientLight intensity={1.2} />
      <directionalLight position={[30, 80, 50]} intensity={3.8} color="#fffcf2" />
      <directionalLight position={[-40, -30, -20]} intensity={1.1} color="#8ab8ff" />
      <pointLight position={[-15, 20, 20]} intensity={1.2} color="#8ec5ff" />

      {/* Authentic ISS 3D Model with dynamic shockwave disintegration */}
      {modelUrl ? (
        <Suspense fallback={<ProceduralStation selected={selected} alertModule={active ? selected : null} active={active} startedAt={startedAt} severity={severity} scenario={scenario} />}>
          <ImportedStation src={modelUrl} selected={selected} scenario={scenario} active={active} startedAt={startedAt} severity={severity} />
        </Suspense>
      ) : (
        <ProceduralStation selected={selected} alertModule={active ? selected : null} active={active} startedAt={startedAt} severity={severity} scenario={scenario} />
      )}

      {/* Detonation Fireball & Shockwaves */}
      <RealisticBlast active={active} startedAt={startedAt} epicenter={epicKey} severity={severity} isImported={!!modelUrl} />

      {/* 3D Broken Objects & Floating Space Debris System */}
      <FloatingSpaceDebris active={active} startedAt={startedAt} epicenter={epicKey} severity={severity} isImported={!!modelUrl} count={52} />

      {/* Dynamic Tactical Tracking Camera */}
      <HubCamRig
        epicenter={epicKey}
        active={active}
        startedAt={startedAt}
        severity={severity}
        camAngle={camAngle}
        zoom={zoom}
        isImported={!!modelUrl}
      />
    </>
  );
}

// Global audio instance for smooth high-fidelity blast playback
let audioInstance = null;

// Synthetic space explosion fallback using Web Audio API
function playSyntheticBlastSound() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    if (ctx.state === 'suspended') ctx.resume();
    const now = ctx.currentTime;

    const bufferSize = Math.floor(ctx.sampleRate * 2.5);
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.setValueAtTime(1400, now);
    noiseFilter.frequency.exponentialRampToValueAtTime(45, now + 2.0);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.8, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 2.2);

    whiteNoise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    whiteNoise.start(now);

    const subOsc = ctx.createOscillator();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(140, now);
    subOsc.frequency.exponentialRampToValueAtTime(25, now + 1.4);

    const subGain = ctx.createGain();
    subGain.gain.setValueAtTime(0.9, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 1.6);

    subOsc.connect(subGain);
    subGain.connect(ctx.destination);
    subOsc.start(now);
    subOsc.stop(now + 2.5);
  } catch (e) {
    // Audio optional fallback
  }
}

// Master blast audio player — plays instantly from pre-decoded AudioBuffer (zero latency)
function playBlastAudio(soundEnabled = true) {
  if (!soundEnabled) return;

  // Immediately play synthetic sub-bass kick for perceptual instant impact
  playSyntheticBlastSound();

  try {
    // If we have a pre-decoded AudioBuffer from the preload effect, use it (zero latency)
    if (audioInstance && audioInstance._decodedBuffer && audioInstance._audioCtx) {
      const ctx = audioInstance._audioCtx;
      if (ctx.state === 'suspended') ctx.resume();
      const src = ctx.createBufferSource();
      src.buffer = audioInstance._decodedBuffer;
      const gainNode = ctx.createGain();
      gainNode.gain.value = 0.85;
      src.connect(gainNode);
      gainNode.connect(ctx.destination);
      src.start(ctx.currentTime);
      return;
    }
    // Fallback: regular HTMLAudio (may have minor buffer latency)
    if (!audioInstance) {
      audioInstance = new Audio('/textures/blast.mp3');
      audioInstance.preload = 'auto';
    }
    audioInstance.currentTime = 0;
    audioInstance.volume = 1.0;
    audioInstance.play().catch(() => {});
  } catch (e) {
    // already played synthetic above
  }
}

function stopBlastAudio() {
  if (audioInstance) {
    audioInstance.pause();
    audioInstance.currentTime = 0;
  }
}

function simulate(t, scenario, severity) {
  const s = severity / 10;
  const pressureLoss = scenario === 'pressure' || scenario === 'impact' || scenario === 'combined';
  const fire = scenario === 'fire' || scenario === 'combined';
  const electrical = scenario === 'power' || scenario === 'combined';
  const pressure = pressureLoss ? 101.3 * Math.exp(-(0.0012 + 0.0035 * s) * t) : 101.3;
  const temperature = 22 + (fire ? Math.min(65, (3.5 + 4.2 * s) * Math.log1p(t / 14)) : 0) + (electrical ? Math.min(18, 2.8 * Math.log1p(t / 20)) : 0);
  const oxygen = Math.max(0, pressure * 0.2095);
  const power = electrical || scenario === 'impact' ? Math.max(8, 100 - (5.5 + 6.5 * s) * Math.log1p(t / 6)) : 100;
  return { pressure, temperature, oxygen, power };
}

function Metric({ icon: Icon, label, value, unit, tone = '' }) {
  return (
    <div className="metric">
      <div className="metric-icon"><Icon size={15} /></div>
      <div className="metric-copy">
        <span>{label}</span>
        <strong className={tone}>{value}<small> {unit}</small></strong>
      </div>
    </div>
  );
}

export default function App() {
  const [scenario, setScenario] = useState('impact');
  const [severity, setSeverity] = useState(8);
  const [selected, setSelected] = useState('destiny');
  const [running, setRunning] = useState(false);
  const [active, setActive] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [eventStart, setEventStart] = useState(0);
  const [modelUrl, setModelUrl] = useState('/models/iss.glb');
  const [history, setHistory] = useState([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showTacticalCam, setShowTacticalCam] = useState(true);
  const [hubCamMode, setHubCamMode] = useState('interior');
  const [hubCamAngle, setHubCamAngle] = useState('tactical');
  const [hubCamZoom, setHubCamZoom] = useState(1.0);
  const [hubCamExpanded, setHubCamExpanded] = useState(false);
  const [backendStatus, setBackendStatus] = useState('CONNECTING');

  // Ping backend API on port 4000
  useEffect(() => {
    let activePoll = true;
    const pingBackend = async () => {
      try {
        const res = await fetch('/api/health');
        if (res.ok) {
          if (activePoll) setBackendStatus('ONLINE');
          return;
        }
      } catch {}

      try {
        const directRes = await fetch('http://localhost:4000/api/health');
        if (directRes.ok) {
          if (activePoll) setBackendStatus('ONLINE');
        } else {
          if (activePoll) setBackendStatus('OFFLINE');
        }
      } catch {
        if (activePoll) setBackendStatus('OFFLINE');
      }
    };

    pingBackend();
    const interval = setInterval(pingBackend, 4000);
    return () => {
      activePoll = false;
      clearInterval(interval);
    };
  }, []);

  // Preload & decode blast.mp3 into an in-memory AudioBuffer for zero-latency playback
  useEffect(() => {
    let ctx = null;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      ctx = new AudioContext();
      fetch('/textures/blast.mp3')
        .then((r) => r.arrayBuffer())
        .then((buf) => ctx.decodeAudioData(buf))
        .then((decoded) => {
          // Store decoded buffer on the audioInstance as a flag
          if (!audioInstance) {
            audioInstance = new Audio('/textures/blast.mp3');
            audioInstance.preload = 'auto';
          }
          audioInstance._decodedBuffer = decoded;
          audioInstance._audioCtx = ctx;
        })
        .catch(() => {});
    } catch (e) {}
    return () => {};
  }, []);

  const scenarioInfo = SCENARIOS.find((s) => s.id === scenario) || SCENARIOS[0];
  const readings = simulate(elapsed, scenario, severity);
  const selectedModule = MODULES.find((m) => m.id === selected) || MODULES[0];
  const status = readings.pressure < 60 || active ? 'CRITICAL' : readings.pressure < 90 || readings.temperature > 42 || readings.power < 65 ? 'WARNING' : 'NOMINAL';

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setElapsed((t) => {
        const next = t + speed;
        setHistory((h) => [...h.slice(-39), { t: next, p: simulate(next, scenario, severity).pressure, temp: simulate(next, scenario, severity).temperature }]);
        return next;
      });
    }, 100);
    return () => clearInterval(id);
  }, [running, speed, scenario, severity]);

  // Synchronize master video playback and backend disaster event
  function start() {
    const vid = document.getElementById('blast-video');
    if (!active) {
      setElapsed(0);
      setHistory([]);
      setEventStart(performance.now() / 1000);
      setActive(true);
      if (vid) {
        vid.currentTime = 0;
        vid.play().catch(() => {});
      }
      playBlastAudio(soundEnabled);

      // Log detonation event to backend
      const payload = { scenario, severity, module: selected };
      fetch('/api/detonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).catch(() => {
        fetch('http://localhost:4000/api/detonate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }).catch(() => {});
      });
    } else {
      if (vid) vid.play().catch(() => {});
    }
    setRunning(true);
  }

  function pause() {
    setRunning(false);
    const vid = document.getElementById('blast-video');
    if (vid) vid.pause();
    if (audioInstance) audioInstance.pause();
  }

  function reset() {
    setRunning(false);
    setActive(false);
    setElapsed(0);
    setHistory([]);
    setEventStart(0);
    const vid = document.getElementById('blast-video');
    if (vid) {
      vid.pause();
      vid.currentTime = 0;
    }
    stopBlastAudio();

    // Reset backend simulation state
    fetch('/api/reset', { method: 'POST' }).catch(() => {
      fetch('http://localhost:4000/api/reset', { method: 'POST' }).catch(() => {});
    });
  }

  function changeSpeed(v) {
    setSpeed(v);
    fetch('/api/speed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ speed: v }),
    }).catch(() => {
      fetch('http://localhost:4000/api/speed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ speed: v }),
      }).catch(() => {});
    });
  }

  function replay() {
    reset();
    setTimeout(() => {
      setEventStart(performance.now() / 1000);
      setActive(true);
      setRunning(true);
      const vid = document.getElementById('blast-video');
      if (vid) {
        vid.currentTime = 0;
        vid.play().catch(() => {});
      }
      playBlastAudio(soundEnabled);
    }, 60);
  }

  function toggleSound() {
    setSoundEnabled((prev) => {
      const next = !prev;
      const vid = document.getElementById('blast-video');
      if (vid) vid.muted = !next;
      if (!next && audioInstance) {
        audioInstance.pause();
      }
      return next;
    });
  }

  function changeScenario(v) {
    setScenario(v);
    reset();
  }

  function uploadModel(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.name.toLowerCase().endsWith('.glb') && !f.name.toLowerCase().endsWith('.gltf')) {
      alert('Please upload a .glb model.');
      return;
    }
    const url = URL.createObjectURL(f);
    setModelUrl(url);
  }

  return (
    <div className="shell">
      {/* Master Video element backing Three.js VideoTexture */}
      <video
        id="blast-video"
        src="/textures/blast.mp4"
        crossOrigin="anonymous"
        playsInline
        preload="auto"
        muted={true}
        style={{ display: 'none' }}
      />

      <header className="topbar">
        <div className="brand">
          <div className="brand-mark"><Orbit size={20} /></div>
          <div><b>SPACESTATION <em>GUARDIAN</em></b><small>ORBITAL CATASTROPHE DIGITAL TWIN</small></div>
        </div>
        <div className="top-center">
          <span className={`green-dot ${active ? 'pulse-alert' : ''}`} style={active ? { background: '#ff3b30' } : {}} />
          {active ? 'CATASTROPHIC BLAST SEQUENCE' : 'NOMINAL SIMULATION'} <span className="top-sep">/</span> DEEP SPACE
        </div>
        <div className="top-actions">
          <span className={`backend-badge ${backendStatus.toLowerCase()}`} title="SpaceStation Guardian Backend Core on Port 4000">
            <span className="backend-dot" />
            BACKEND: {backendStatus}
          </span>
          <button className={`icon-btn sound-toggle-btn ${soundEnabled ? 'active' : ''}`} title="Toggle Blast Sound Effect" onClick={toggleSound}>
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            {soundEnabled ? 'AUDIO ON' : 'MUTED'}
          </button>
          <button className={`icon-btn tactical-btn ${showTacticalCam ? 'active' : ''}`} title="Toggle Hub Camera View" onClick={() => setShowTacticalCam((v) => !v)}>
            <Camera size={15} />
            {showTacticalCam ? 'HUB CAM' : 'HIDE CAM'}
          </button>
          <button className="icon-btn" title="Reset view and structure" onClick={reset}><RotateCcw size={16} /></button>
          <label className="upload-btn"><Layers3 size={15} /> Load GLB model<input type="file" accept=".glb,.gltf" onChange={uploadModel} /></label>
          <span className="build-tag">BUILD 03</span>
        </div>
      </header>

      <main className="layout">
        <aside className="left-panel panel">
          <div className="panel-title"><span>01 / STATION ELEMENTS</span><Box size={16} /></div>
          <div className="panel-sub">SELECT TARGET FOR BLAST FOCUS</div>
          {MODULES.map((m) => (
            <button key={m.id} className={`module-row ${selected === m.id ? 'selected' : ''}`} onClick={() => setSelected(m.id)}>
              <span className={`module-status ${active && selected === m.id ? 'alert' : ''}`} />
              <span className="module-name">{m.name}</span>
              <span className="module-state">{active && selected === m.id ? 'BREACH' : 'INTACT'}</span>
            </button>
          ))}
          <div className="module-card">
            <div className="eyebrow">SELECTED TARGET COMPONENT</div>
            <h3>{selectedModule.name}</h3>
            <p>{selectedModule.note}</p>
            <div className="component-line">
              <span>INTEGRITY</span>
              <b className={status === 'NOMINAL' ? 'ok' : status === 'WARNING' ? 'warn' : 'danger'}>
                {active ? 'DETACHED / DESTROYED' : status}
              </b>
            </div>
            <div className="component-line">
              <span>BLAST EPICENTER</span>
              <b>{scenario === 'impact' ? 'EXTERNAL TRUSS' : selectedModule.short}</b>
            </div>
          </div>
          <div className="left-foot"><Shield size={15} /> DYNAMIC FRAGMENTATION SOLVER ACTIVE</div>
        </aside>

        <section className="viewport">
          <div className="view-head">
            <div><span className="eyebrow">TACTICAL ORBITAL VIEW</span><h2>International Space Station</h2></div>
            <div className="view-chip">
              <span className={`green-dot ${active ? 'pulse-alert' : ''}`} style={active ? { background: '#ff3b30' } : {}} />
              {active ? 'STRUCTURAL COLLAPSE ACTIVE' : '3D SCENE NOMINAL'}
            </div>
          </div>

          <Canvas
            camera={{ position: [45, 24, 52], fov: 45, near: 0.5, far: 2500 }}
            dpr={[1, 1.8]}
            gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
          >
            <SpaceScene
              selected={selected}
              onSelect={setSelected}
              active={active}
              scenario={scenario}
              severity={severity}
              startedAt={eventStart}
              alertModule={active ? selected : null}
              modelUrl={modelUrl}
            />
          </Canvas>

          {/* 3D Hub Cam: Tactical ISS Blast & Floating Space Debris Optical Feed */}
          {showTacticalCam && (
            <div className={`tactical-cam-box ${hubCamExpanded ? 'expanded' : ''}`}>
              <div className="tactical-cam-header">
                <div className="cam-header-left">
                  <span className="live-indicator">
                    <span className="pulse-dot" style={{ background: active ? '#ff3b30' : '#45cda0' }} />
                    {active ? 'BREACH IN PROGRESS' : 'HUB CAM // OPTICAL LOCK'}
                  </span>
                  <span className="cam-coords">{selectedModule.short} // T+{elapsed.toFixed(2)}s</span>
                </div>
                <div className="cam-header-actions">
                  <div className="cam-mode-pills">
                    <button
                      className={`cam-mode-btn ${hubCamMode === 'interior' ? 'active' : ''}`}
                      onClick={() => setHubCamMode('interior')}
                      title="ISS Photogrammetry Interior 3D Model — Right-Click Move, Scroll Zoom"
                    >
                      🛸 ISS INTERIOR
                    </button>
                    <button
                      className={`cam-mode-btn ${hubCamMode === '3d' ? 'active' : ''}`}
                      onClick={() => setHubCamMode('3d')}
                      title="3D International Space Station Blast & Floating Debris"
                    >
                      <Orbit size={11} /> EXTERIOR
                    </button>
                    <button
                      className={`cam-mode-btn ${hubCamMode === 'cabin' ? 'active' : ''}`}
                      onClick={() => setHubCamMode('cabin')}
                      title="Procedural Cabin Cutaway View"
                    >
                      <Box size={11} /> CABIN
                    </button>
                  </div>
                  <button
                    className="cam-size-btn"
                    onClick={() => setHubCamExpanded((v) => !v)}
                    title={hubCamExpanded ? 'Standard Size' : 'Enlarge Hub Cam'}
                  >
                    {hubCamExpanded ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
                  </button>
                </div>
              </div>

              <div className="tactical-cam-body">
                {hubCamMode === 'interior' ? (
                  /* ISS Photogrammetry 3D Interior — right-click moves, scroll zooms, left-click rotates */
                  <div style={{ width: '100%', height: '100%', position: 'relative' }} onContextMenu={(e) => e.preventDefault()}>
                    <Interior3DViewer
                      active={active}
                      startedAt={eventStart}
                      scenario={scenario}
                      severity={severity}
                    />
                    {/* Navigation hint badge */}
                    <div className="interior-nav-badge">
                      🖱️ <b>RIGHT CLICK</b>: MOVE &nbsp;•&nbsp; <b>LEFT CLICK</b>: LOOK &nbsp;•&nbsp; <b>SCROLL</b>: ZOOM
                    </div>
                    {/* Alarm overlay on blast */}
                    {active && (
                      <div className="interior-alarm-overlay">
                        <span className="interior-alarm-text">⚠ DEPRESSURISATION BREACH DETECTED</span>
                      </div>
                    )}
                  </div>
                ) : hubCamMode === '3d' ? (
                  <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                    <Canvas
                      camera={{ position: [14, 8, 16], fov: 48, near: 0.1, far: 1000 }}
                      gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.3 }}
                    >
                      <HubCam3DScene
                        selected={selected}
                        active={active}
                        scenario={scenario}
                        severity={severity}
                        startedAt={eventStart}
                        modelUrl={modelUrl}
                        camAngle={hubCamAngle}
                        zoom={hubCamZoom}
                      />
                    </Canvas>

                    {/* HUD Controls Overlay on 3D Cam */}
                    <div className="hud-overlay-controls">
                      <div className="hud-angle-group">
                        <span className="hud-label">CAM:</span>
                        {['tactical', 'orbit', 'chase'].map((angle) => (
                          <button
                            key={angle}
                            className={`hud-sub-btn ${hubCamAngle === angle ? 'active' : ''}`}
                            onClick={() => setHubCamAngle(angle)}
                          >
                            {angle.toUpperCase()}
                          </button>
                        ))}
                      </div>
                      <div className="hud-zoom-group">
                        <span className="hud-label">ZOOM:</span>
                        {[1.0, 1.5, 2.5].map((z) => (
                          <button
                            key={z}
                            className={`hud-sub-btn ${hubCamZoom === z ? 'active' : ''}`}
                            onClick={() => setHubCamZoom(z)}
                          >
                            {z}×
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Reticle Target Overlay */}
                    <div className={`hub-target-reticle ${active ? 'detonated' : ''}`}>
                      <div className="reticle-corner top-left" />
                      <div className="reticle-corner top-right" />
                      <div className="reticle-corner bottom-left" />
                      <div className="reticle-corner bottom-right" />
                      <div className="reticle-tag">
                        {active ? '⚠️ BLAST DETONATION // DEBRIS DISPERSION' : `TARGET: [${selectedModule.short}]`}
                      </div>
                    </div>
                  </div>
                ) : (
                  <InternalModuleViewer
                    active={active}
                    startedAt={eventStart}
                    scenario={scenario}
                    severity={severity}
                    moduleName={selectedModule.name}
                  />
                )}

                <div className="tactical-crosshair" />
                <div className="tactical-grid-overlay" />
                {active && <div className="tactical-glitch-overlay" />}
              </div>

              <div className="tactical-cam-footer">
                <span className="hud-cause-tag">
                  {active ? (
                    `FRAGMENTS: 52 OBJECTS DRIFTING IN VACUUM // ${(14.2 * severity / 8).toFixed(1)} m/s`
                  ) : (
                    `TARGET: ${selectedModule.name.toUpperCase()} // SENSOR LOCKED`
                  )}
                </span>
                <span className="fps-badge">
                  {hubCamMode === 'interior' ? '🛸 ISS INTERIOR 3D' : hubCamMode === '3d' ? '3D EXTERIOR CAM' : 'CABIN CUTAWAY'}</span>
              </div>
            </div>
          )}

          <div className="view-bottom">
            <span><Crosshair size={13} /> DRAG TO ORBIT</span>
            <span>SCROLL TO ZOOM</span>
            <span>CLICK TO INSPECT MODULES</span>
          </div>

          {active && (
            <div className="event-overlay">
              <span className="pulse-dot" style={{ background: '#ff3b30' }} />
              CATASTROPHIC DETONATION & STRUCTURAL DECONSTRUCTION
              <small>PHOTOREALISTIC BLAST VFX & SYNCHRONIZED AUDIO ACTIVE</small>
            </div>
          )}

          <div className="scene-controls">
            <button onClick={toggleSound} title={soundEnabled ? 'Mute Audio' : 'Unmute Audio'} style={soundEnabled ? { borderColor: '#55c6ed', color: '#55c6ed' } : {}}>
              {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
            </button>
            <button onClick={() => setShowTacticalCam((v) => !v)} title="Toggle Camera Monitor" style={showTacticalCam ? { borderColor: '#ffaa44', color: '#ffaa44' } : {}}>
              <Camera size={15} />
            </button>
            <button onClick={pause} title="Pause"><Pause size={15} /></button>
            <button onClick={start} title="Trigger Blast" style={active ? { borderColor: '#ff4422' } : {}}><Play size={15} /></button>
            <button onClick={replay} title="Replay Blast"><RotateCcw size={15} /></button>
          </div>
        </section>

        <aside className="right-panel panel">
          <div className="panel-title"><span>02 / BLAST CONFIGURATION</span><Activity size={16} /></div>
          <div className="panel-sub">SELECT DISASTER & INTENSITY</div>

          <label className="field-label">EMERGENCY SCENARIO</label>
          <div className="select-wrap">
            <select value={scenario} onChange={(e) => changeScenario(e.target.value)}>
              {SCENARIOS.map((s) => (<option value={s.id} key={s.id}>{s.label}</option>))}
            </select>
            <ChevronDown size={14} />
          </div>
          <p className="scenario-desc">{scenarioInfo.desc}</p>

          <div className="range-head">
            <label className="field-label">EXPLOSION FORCE / SEVERITY</label>
            <b style={{ color: severity > 7 ? '#ff4422' : '#55c6ed' }}>{severity}<small>/10</small></b>
          </div>
          <input className="range" type="range" min="1" max="10" value={severity} onChange={(e) => setSeverity(+e.target.value)} />
          <div className="range-labels"><span>MINOR RUPTURE</span><span>TOTAL DISINTEGRATION</span></div>

          <div className="control-grid">
            <button className="start-btn" onClick={start} style={{ background: active ? '#ff3b30' : '#e03c1b' }}>
              <Flame size={14} fill="currentColor" /> {active ? 'RUNNING' : 'DETONATE'}
            </button>
            <button onClick={pause}><Pause size={14} /> PAUSE</button>
            <button onClick={replay}><RotateCcw size={14} /> REPLAY</button>
            <button onClick={reset}><RotateCcw size={14} /> REASSEMBLE</button>
          </div>

          <div className="speed-row">
            <label className="field-label">TIME SCALE</label>
            <div className="speed-options">
              {[0.5, 1, 2, 5].map((v) => (
                <button key={v} className={speed === v ? 'active' : ''} onClick={() => changeSpeed(v)}>{v}×</button>
              ))}
            </div>
          </div>

          <div className="section-rule" />
          <div className="panel-title small-title"><span>03 / LIVE TELEMETRY</span><Gauge size={15} /></div>
          <div className={`alarm-state ${status.toLowerCase()}`}>
            <span className="alarm-light" />
            {status === 'NOMINAL' ? 'STATION SYSTEMS NOMINAL' : status === 'WARNING' ? 'ENVIRONMENTAL WARNING' : 'HULL BREACH / STRUCTURAL FAILURE'}
          </div>

          <div className="metrics">
            <Metric icon={Wind} label="CABIN PRESSURE" value={readings.pressure.toFixed(1)} unit="kPa" tone={readings.pressure < 70 ? 'danger' : readings.pressure < 90 ? 'warn' : ''} />
            <Metric icon={Thermometer} label="THERMAL READING" value={readings.temperature.toFixed(1)} unit="°C" tone={readings.temperature > 40 ? 'warn' : ''} />
            <Metric icon={Atom} label="O₂ PARTIAL PRESSURE" value={readings.oxygen.toFixed(1)} unit="kPa" />
            <Metric icon={Zap} label="POWER AVAILABILITY" value={readings.power.toFixed(0)} unit="%" tone={readings.power < 50 ? 'danger' : ''} />
          </div>

          <div className="time-row">
            <span>ELAPSED DISASTER TIME</span>
            <b>{elapsed.toFixed(1)} s</b>
          </div>
          <div className="timeline">
            <div className="timeline-fill" style={{ width: `${Math.min(100, (elapsed / 120) * 100)}%`, background: active ? '#ff3b30' : '#36c9f4' }} />
          </div>

          <div className="chart-title"><span>PRESSURE TREND</span><small>kPa / illustrative</small></div>
          <div className="sparkline">
            {history.length > 1 ? (
              <svg viewBox="0 0 280 52" preserveAspectRatio="none">
                <polyline
                  points={history.map((h, i) => `${(i / (history.length - 1)) * 280},${48 - ((h.p - 20) / 85) * 42}`).join(' ')}
                  fill="none"
                  stroke={active ? '#ff4422' : '#55c6ed'}
                  strokeWidth="2"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
            ) : (
              <span>Detonate scenario to view decay curves</span>
            )}
          </div>

          <div className="disclaimer">
            <AlertTriangle size={13} /> PHYSICAL STRUCTURAL MODEL: 131 detached spacecraft segments simulated with microgravity tumbling kinetics.
          </div>
        </aside>
      </main>

      <footer>
        <span>SPACE STATION GUARDIAN</span><i /> ORBITAL CATASTROPHE & BLAST DIGITAL TWIN <i /> VACUUM DISPERSION ENGINE <span className="footer-right">V2.0.0</span>
      </footer>
    </div>
  );
}
