const fs = require('fs');
const filePath = 'src/App.jsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Update material traversal
const oldMat = `    // Make all materials double-sided and ensure sRGB color mapping
    c.traverse((child) => {
      if (child.isMesh && child.material) {
        child.material = child.material.clone();
        child.material.side = THREE.DoubleSide;
        child.material.roughness = 0.82;
        child.material.metalness = 0.15;
        child.material.emissive = new THREE.Color(0x333333);
        if (child.material.map) {
          child.material.map.colorSpace = THREE.SRGBColorSpace;
          child.material.map.minFilter = THREE.LinearMipmapLinearFilter;
          child.material.needsUpdate = true;
        }
      }
    });`;

const newMat = `    // Make all materials double-sided, bind emissiveMap and ensure sRGB color mapping
    c.traverse((child) => {
      if (child.isMesh && child.material) {
        child.material = child.material.clone();
        child.material.side = THREE.DoubleSide;
        child.material.roughness = 0.76;
        child.material.metalness = 0.12;
        child.material.emissive = new THREE.Color(0x282828);
        if (child.material.map) {
          child.material.map.colorSpace = THREE.SRGBColorSpace;
          child.material.map.minFilter = THREE.LinearMipmapLinearFilter;
          child.material.emissiveMap = child.material.map;
          child.material.needsUpdate = true;
        }
      }
    });`;

if (!content.includes(oldMat)) {
  console.error('Could not find oldMat');
  process.exit(1);
}
content = content.replace(oldMat, newMat);

// 2. Replace enclosure, lights, spots, controller, and viewer
const oldBlockStart = '      {/* Station Outer Pressure Hull Enclosure: Backs up photogrammetry meshes so user NEVER sees black void outside */}';
const oldBlockEnd = '        <InteriorCameraController teleportTrigger={teleportTrigger} onSpotChange={onSpotChange} />\n      </Canvas>\n    </div>\n  );\n}';

const startIndex = content.indexOf(oldBlockStart);
const endIndex = content.indexOf(oldBlockEnd);

if (startIndex === -1 || endIndex === -1) {
  console.error('Could not find block boundaries:', { startIndex, endIndex });
  process.exit(1);
}

const newBlock = `      {/* Outer Station Space Enclosure: Backs up photogrammetry so user NEVER sees black void outside */}
      <mesh>
        <sphereGeometry args={[50, 24, 24]} />
        <meshBasicMaterial color="#0c121c" side={THREE.BackSide} />
      </mesh>

      {/* Balanced lighting mapped to authentic module clusters */}
      <ambientLight intensity={2.5} color="#f0f6fc" />
      <directionalLight position={[0, 4, 0]} intensity={1.1} color="#ffffff" />
      <directionalLight position={[0, -2, 0]} intensity={0.5} color="#8ab4f8" />

      {/* Point lights inside real module positions */}
      <pointLight position={[-10.0, 1.1, -7.5]} intensity={3.5} distance={14} color="#ffffff" decay={1.0} />
      <pointLight position={[-9.0, 1.1, -11.0]} intensity={3.5} distance={14} color="#ffffff" decay={1.0} />
      <pointLight position={[-6.5, 1.1, -1.0]} intensity={3.5} distance={14} color="#ffffff" decay={1.0} />
      <pointLight position={[-5.0, 1.1, 0.5]} intensity={3.5} distance={14} color="#ffffff" decay={1.0} />
      <pointLight position={[-14.0, 1.1, 1.5]} intensity={3.5} distance={14} color="#ffffff" decay={1.0} />
      <pointLight position={[6.5, 1.1, 10.5]} intensity={3.5} distance={14} color="#ffffff" decay={1.0} />
      <pointLight position={[7.0, 1.1, 8.0]} intensity={3.5} distance={14} color="#ffffff" decay={1.0} />
      <pointLight position={[0.0, 1.1, 1.5]} intensity={3.5} distance={14} color="#ffffff" decay={1.0} />
      <pointLight ref={strobeLightRef} position={[-6.5, 1.1, -1.0]} distance={16} intensity={2.8} color="#eef6ff" decay={1.0} />
      <pointLight ref={breachLightRef} position={[-7.5, 0.5, -4.0]} distance={16} decay={1.1} />
    </group>
  );
}

// Authentic ISS interior module positions (mapped to verified 3D photogrammetry mesh clusters)
const ISS_TELEPORT_SPOTS = [
  {
    id: 'destiny',
    label: 'DESTINY U.S. LAB',
    desc: 'U.S. Primary Science Racks & Workstation Corridor',
    pos: [-10.0, 0.5, -7.5],
    target: [-10.0, 0.5, -10.5],
    bounds: { minX: -11.8, maxX: -8.2, minY: -0.2, maxY: 1.3, minZ: -12.0, maxZ: -5.0 }
  },
  {
    id: 'kibo',
    label: 'KIBO (JEM) MODULE',
    desc: 'Japanese Experiment Module Facility Racks',
    pos: [-9.0, 0.5, -10.5],
    target: [-8.0, 0.5, -12.5],
    bounds: { minX: -10.8, maxX: -7.2, minY: -0.2, maxY: 1.3, minZ: -13.0, maxZ: -8.5 }
  },
  {
    id: 'harmony',
    label: 'NODE 2 (HARMONY)',
    desc: 'Utility Crossing & Multi-Hatch Vestibule',
    pos: [-6.5, 0.5, -1.0],
    target: [-6.5, 0.5, -3.5],
    bounds: { minX: -8.0, maxX: -5.0, minY: -0.2, maxY: 1.3, minZ: -3.0, maxZ: 1.0 }
  },
  {
    id: 'airlock',
    label: 'QUEST AIRLOCK',
    desc: 'EVA Spacesuit & High-Pressure Equipment Lock',
    pos: [-5.0, 0.5, 0.5],
    target: [-5.0, 0.5, 2.5],
    bounds: { minX: -6.5, maxX: -3.5, minY: -0.2, maxY: 1.3, minZ: -1.0, maxZ: 2.5 }
  },
  {
    id: 'columbus',
    label: 'COLUMBUS SCIENCE LAB',
    desc: 'ESA European Orbital Research Module',
    pos: [-14.0, 0.5, 1.5],
    target: [-14.0, 0.5, -1.5],
    bounds: { minX: -15.5, maxX: -12.5, minY: -0.2, maxY: 1.3, minZ: -2.5, maxZ: 3.0 }
  },
  {
    id: 'zvezda',
    label: 'ZVEZDA HABITATION',
    desc: 'Russian Service Module Living Quarters & Galley',
    pos: [6.5, 0.5, 10.5],
    target: [6.5, 0.5, 7.5],
    bounds: { minX: 5.0, maxX: 8.0, minY: -0.1, maxY: 1.3, minZ: 7.0, maxZ: 12.5 }
  },
  {
    id: 'zarya',
    label: 'ZARYA FGB MODULE',
    desc: 'Functional Cargo Block & Orbital Storage',
    pos: [7.0, 0.5, 8.0],
    target: [7.0, 0.5, 11.0],
    bounds: { minX: 5.5, maxX: 8.5, minY: -0.1, maxY: 1.3, minZ: 6.0, maxZ: 10.0 }
  },
  {
    id: 'unity',
    label: 'UNITY NODE 1',
    desc: 'Forward Connecting Hub & Node Corridor',
    pos: [0.0, 0.5, 1.5],
    target: [2.5, 0.5, 1.5],
    bounds: { minX: -1.5, maxX: 2.5, minY: -0.2, maxY: 1.3, minZ: 0.0, maxZ: 3.0 }
  },
];

// Camera controller: Random teleport on open/trigger & strict wall collision clamping
function InteriorCameraController({ teleportTrigger, onSpotChange }) {
  const { camera } = useThree();
  const controlsRef = useRef();
  const currentSpotRef = useRef(ISS_TELEPORT_SPOTS[0]);
  const lastSpotIdRef = useRef(null);

  // Random teleport to an authentic ISS module on trigger
  useEffect(() => {
    const available = ISS_TELEPORT_SPOTS.filter((s) => s.id !== lastSpotIdRef.current);
    const pool = available.length > 0 ? available : ISS_TELEPORT_SPOTS;
    const spot = pool[Math.floor(Math.random() * pool.length)];
    lastSpotIdRef.current = spot.id;
    currentSpotRef.current = spot;

    camera.position.set(...spot.pos);
    if (controlsRef.current) {
      controlsRef.current.target.set(...spot.target);
      controlsRef.current.update();
    }
    if (onSpotChange) onSpotChange(spot);
  }, [teleportTrigger]);

  // Every frame: Strict collision clamping within authentic module bounds so camera NEVER exits into black void
  useFrame(() => {
    const b = currentSpotRef.current?.bounds;
    if (!b) return;

    // 1. Clamp camera position within module interior
    const x = Math.max(b.minX, Math.min(b.maxX, camera.position.x));
    const y = Math.max(b.minY, Math.min(b.maxY, camera.position.y));
    const z = Math.max(b.minZ, Math.min(b.maxZ, camera.position.z));
    camera.position.set(x, y, z);

    // 2. Also clamp OrbitControls target so orbit pivot stays inside module
    if (controlsRef.current) {
      const t = controlsRef.current.target;
      t.x = Math.max(b.minX - 0.5, Math.min(b.maxX + 0.5, t.x));
      t.y = Math.max(b.minY, Math.min(b.maxY, t.y));
      t.z = Math.max(b.minZ - 0.5, Math.min(b.maxZ + 0.5, t.z));

      // Limit max distance from orbit target so camera never zooms out through walls
      const dist = camera.position.distanceTo(t);
      if (dist > 1.8) {
        const dir = new THREE.Vector3().subVectors(camera.position, t).normalize();
        camera.position.copy(t).addScaledVector(dir, 1.8);
      }
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enableDamping={true}
      dampingFactor={0.08}
      enablePan={true}
      panSpeed={1.8}
      screenSpacePanning={true}
      enableZoom={true}
      zoomSpeed={1.2}
      enableRotate={true}
      rotateSpeed={0.75}
      minDistance={0.05}
      maxDistance={1.8}
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
  );
}

// 3D Interior Viewer with Right-Click Move/Pan, Scroll Zoom, Left-Click Rotate,
// random teleport on open, and wall-clamped navigation that never exits into black void
function Interior3DViewer({ active, startedAt, scenario, severity, teleportTrigger, onSpotChange }) {
  return (
    <div
      style={{ width: '100%', height: '100%', position: 'relative' }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <Canvas
        camera={{ position: [-10.0, 0.5, -7.5], fov: 72, near: 0.05, far: 80 }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.5 }}
        onContextMenu={(e) => e.preventDefault()}
      >
        <Suspense fallback={<InteriorCutawayScene active={active} startedAt={startedAt} scenario={scenario} severity={severity} />}>
          <Interior3DModel active={active} startedAt={startedAt} scenario={scenario} severity={severity} />
        </Suspense>
        <InteriorCameraController teleportTrigger={teleportTrigger} onSpotChange={onSpotChange} />
      </Canvas>
    </div>
  );
}`;

content = content.substring(0, startIndex) + newBlock + content.substring(endIndex + oldBlockEnd.length);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully updated App.jsx with authentic ISS coordinates, lighting, and camera controller!');
