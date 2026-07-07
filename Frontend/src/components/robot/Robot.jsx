import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox, Sphere, Cylinder, Torus } from '@react-three/drei';
import * as THREE from 'three';
import { COLORS } from './materials';

// Shared material configs
const whitePlastic = {
  color: COLORS.body,
  roughness: 0.15,
  metalness: 0.05,
  envMapIntensity: 1.2,
};

const cyanEmissive = {
  color: COLORS.eyeGlow,
  emissive: COLORS.eyeGlow,
  emissiveIntensity: 2.5,
  roughness: 0.1,
  metalness: 0,
};

const cyanMatte = {
  color: COLORS.chestPlate,
  roughness: 0.3,
  metalness: 0.1,
  emissive: COLORS.chestPlate,
  emissiveIntensity: 0.3,
};

const visorMat = {
  color: COLORS.visorGlass,
  roughness: 0.05,
  metalness: 0.3,
  envMapIntensity: 2,
};

// Eye arc shape (crescent smile)
function EyeArc({ position }) {
  const points = [];
  const segments = 24;
  for (let i = 0; i <= segments; i++) {
    const angle = Math.PI + (i / segments) * Math.PI; // bottom half circle
    points.push(new THREE.Vector2(Math.cos(angle) * 0.065, Math.sin(angle) * 0.065));
  }
  const shape = new THREE.Shape();
  shape.moveTo(points[0].x, points[0].y + 0.03);
  for (let i = 1; i <= segments; i++) {
    const angle = Math.PI + (i / segments) * Math.PI;
    shape.lineTo(Math.cos(angle) * 0.065, Math.sin(angle) * 0.065 + 0.03);
  }
  // inner arc
  for (let i = segments; i >= 0; i--) {
    const angle = Math.PI + (i / segments) * Math.PI;
    shape.lineTo(Math.cos(angle) * 0.04, Math.sin(angle) * 0.04 + 0.03);
  }
  shape.closePath();

  const extrudeSettings = { depth: 0.012, bevelEnabled: false };

  return (
    <mesh position={position} rotation={[0, 0, 0]}>
      <extrudeGeometry args={[shape, extrudeSettings]} />
      <meshStandardMaterial {...cyanEmissive} />
    </mesh>
  );
}

// Face visor glow rim
function VisorRim({ rx, ry }) {
  return (
    <Torus args={[rx * 0.97, 0.018, 12, 60]} rotation={[Math.PI / 2, 0, 0]}>
      <meshStandardMaterial
        color={COLORS.faceRim}
        emissive={COLORS.faceRim}
        emissiveIntensity={1.8}
        roughness={0.1}
        metalness={0}
      />
    </Torus>
  );
}

export default function Robot() {
  const groupRef = useRef();
  const bodyRef = useRef();
  const [blink, setBlink] = useState(false);
  const blinkTimer = useRef(0);
  const floatTime = useRef(0);

  useFrame((_, delta) => {
    floatTime.current += delta;
    blinkTimer.current += delta;

    // Floating idle
    if (groupRef.current) {
      groupRef.current.position.y = Math.sin(floatTime.current * 0.8) * 0.08;
      groupRef.current.rotation.y = Math.sin(floatTime.current * 0.3) * 0.06;
      groupRef.current.rotation.z = Math.sin(floatTime.current * 0.5) * 0.015;
    }

    // Blink every ~4s
    if (blinkTimer.current > 4) {
      setBlink(true);
      setTimeout(() => setBlink(false), 120);
      blinkTimer.current = 0;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]}>

      {/* ── HEAD ── */}
      <group position={[0, 0.82, 0]}>

        {/* Main head sphere */}
        <Sphere args={[0.42, 64, 64]} position={[0, 0, 0]}>
          <meshStandardMaterial {...whitePlastic} />
        </Sphere>

        {/* Top bump */}
        <Sphere args={[0.13, 32, 32]} position={[0, 0.38, 0]}>
          <meshStandardMaterial {...whitePlastic} />
        </Sphere>
        <Sphere args={[0.07, 32, 32]} position={[0, 0.48, 0]}>
          <meshStandardMaterial {...whitePlastic} />
        </Sphere>

        {/* Visor dark lens (slightly proud of head) */}
        <mesh position={[0, -0.01, 0.3]} rotation={[0.12, 0, 0]}>
          <sphereGeometry args={[0.34, 48, 48, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
          <meshStandardMaterial {...visorMat} side={THREE.FrontSide} />
        </mesh>

        {/* Visor rim glow */}
        <group position={[0, -0.01, 0.18]} rotation={[0.12, 0, 0]}>
          <VisorRim rx={0.305} ry={0.28} />
        </group>

        {/* Eyes */}
        {!blink && (
          <>
            <EyeArc position={[-0.1, 0.07, 0.405]} />
            <EyeArc position={[0.1, 0.07, 0.405]} />
          </>
        )}
        {/* Blink covers */}
        {blink && (
          <>
            <mesh position={[-0.1, 0.07, 0.41]}>
              <boxGeometry args={[0.14, 0.022, 0.008]} />
              <meshStandardMaterial color={COLORS.visorGlass} />
            </mesh>
            <mesh position={[0.1, 0.07, 0.41]}>
              <boxGeometry args={[0.14, 0.022, 0.008]} />
              <meshStandardMaterial color={COLORS.visorGlass} />
            </mesh>
          </>
        )}

        {/* Eye glow lens covers (glossy over eyes) */}
        <mesh position={[-0.1, 0.075, 0.415]}>
          <sphereGeometry args={[0.075, 24, 24, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
          <meshStandardMaterial
            color={'#ffffff'}
            transparent
            opacity={0.08}
            roughness={0}
            metalness={0}
          />
        </mesh>
        <mesh position={[0.1, 0.075, 0.415]}>
          <sphereGeometry args={[0.075, 24, 24, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
          <meshStandardMaterial
            color={'#ffffff'}
            transparent
            opacity={0.08}
            roughness={0}
            metalness={0}
          />
        </mesh>

        {/* Left ear module */}
        <group position={[-0.44, 0.0, 0.05]} rotation={[0, 0, Math.PI / 2]}>
          <Cylinder args={[0.095, 0.095, 0.18, 32]}>
            <meshStandardMaterial {...whitePlastic} />
          </Cylinder>
          {/* speaker dot */}
          <Cylinder args={[0.028, 0.028, 0.02, 16]} position={[0, 0.1, 0]}>
            <meshStandardMaterial color={'#8890aa'} roughness={0.8} metalness={0.1} />
          </Cylinder>
        </group>

        {/* Right ear module */}
        <group position={[0.44, 0.0, 0.05]} rotation={[0, 0, Math.PI / 2]}>
          <Cylinder args={[0.095, 0.095, 0.18, 32]}>
            <meshStandardMaterial {...whitePlastic} />
          </Cylinder>
          <Cylinder args={[0.028, 0.028, 0.02, 16]} position={[0, -0.1, 0]}>
            <meshStandardMaterial color={'#8890aa'} roughness={0.8} metalness={0.1} />
          </Cylinder>
        </group>

        {/* Antenna fins (back, teal) */}
        <RoundedBox
          args={[0.055, 0.22, 0.035]}
          radius={0.015}
          smoothness={4}
          position={[-0.12, 0.35, -0.28]}
          rotation={[0.25, 0, 0]}
        >
          <meshStandardMaterial {...cyanMatte} />
        </RoundedBox>
        <RoundedBox
          args={[0.055, 0.22, 0.035]}
          radius={0.015}
          smoothness={4}
          position={[0.12, 0.35, -0.28]}
          rotation={[0.25, 0, 0]}
        >
          <meshStandardMaterial {...cyanMatte} />
        </RoundedBox>

        {/* Head-body neck connector */}
        <Cylinder args={[0.14, 0.16, 0.12, 32]} position={[0, -0.44, 0]}>
          <meshStandardMaterial {...whitePlastic} />
        </Cylinder>
      </group>

      {/* ── BODY ── */}
      <group position={[0, 0.04, 0]} ref={bodyRef}>
        {/* Main torso - egg/capsule shape */}
        <Sphere args={[0.38, 48, 48]} position={[0, 0, 0]} scale={[1, 1.15, 0.95]}>
          <meshStandardMaterial {...whitePlastic} />
        </Sphere>

        {/* Lower body taper */}
        <Sphere args={[0.3, 48, 48]} position={[0, -0.3, 0]} scale={[1, 0.7, 0.9]}>
          <meshStandardMaterial {...whitePlastic} />
        </Sphere>

        {/* Chest plate (cyan) */}
        <RoundedBox
          args={[0.28, 0.2, 0.08]}
          radius={0.04}
          smoothness={6}
          position={[0, -0.15, 0.32]}
        >
          <meshStandardMaterial {...cyanMatte} />
        </RoundedBox>

        {/* Chest divider line */}
        <mesh position={[0, 0.06, 0.375]}>
          <boxGeometry args={[0.22, 0.008, 0.006]} />
          <meshStandardMaterial
            color={COLORS.faceRim}
            emissive={COLORS.faceRim}
            emissiveIntensity={1.0}
          />
        </mesh>
      </group>

      {/* ── LEFT ARM (raised) ── */}
      <group position={[-0.48, 0.22, 0]} rotation={[0, 0, 0.55]}>
        {/* Upper arm */}
        <Sphere args={[0.13, 32, 32]} position={[0, 0, 0]} scale={[1, 1.5, 1]}>
          <meshStandardMaterial {...whitePlastic} />
        </Sphere>
        {/* Lower arm */}
        <Sphere args={[0.11, 32, 32]} position={[0, -0.28, 0]} scale={[1, 1.4, 1]}>
          <meshStandardMaterial {...whitePlastic} />
        </Sphere>
        {/* Hand */}
        <Sphere args={[0.1, 32, 32]} position={[0, -0.48, 0]}>
          <meshStandardMaterial {...whitePlastic} />
        </Sphere>
      </group>

      {/* ── RIGHT ARM (slightly raised) ── */}
      <group position={[0.48, 0.18, 0]} rotation={[0, 0, -0.4]}>
        <Sphere args={[0.13, 32, 32]} position={[0, 0, 0]} scale={[1, 1.5, 1]}>
          <meshStandardMaterial {...whitePlastic} />
        </Sphere>
        <Sphere args={[0.11, 32, 32]} position={[0, -0.28, 0]} scale={[1, 1.4, 1]}>
          <meshStandardMaterial {...whitePlastic} />
        </Sphere>
        <Sphere args={[0.1, 32, 32]} position={[0, -0.48, 0]}>
          <meshStandardMaterial {...whitePlastic} />
        </Sphere>
      </group>

      {/* ── SHADOW PLANE (subtle) ── */}
      <mesh position={[0, -0.85, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[0.6, 32]} />
        <meshStandardMaterial
          color={'#00a0a0'}
          transparent
          opacity={0.18}
          roughness={1}
        />
      </mesh>
    </group>
  );
}
