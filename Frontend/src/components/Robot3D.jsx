import { useRef, useEffect, Suspense } from 'react'
import { Canvas, useFrame, useThree, useLoader } from '@react-three/fiber'
import * as THREE from 'three'
import logoSrc from '../assets/logo.png'

const DragRotate = ({ groupRef }) => {
  const { gl } = useThree()
  const dragging = useRef(false)
  const lastX = useRef(0)
  const lastY = useRef(0)
  const rotY = useRef(0)
  const rotX = useRef(0)
  const auto = useRef(true)
  const timer = useRef(null)

  useEffect(() => {
    const el = gl.domElement
    const getPoint = (e) => ({
      x: (e.touches ? e.touches[0] : e).clientX,
      y: (e.touches ? e.touches[0] : e).clientY,
    })
    const down = (e) => {
      dragging.current = true
      auto.current = false
      if (timer.current) clearTimeout(timer.current)
      const p = getPoint(e)
      lastX.current = p.x
      lastY.current = p.y
    }
    const up = () => {
      dragging.current = false
      timer.current = setTimeout(() => { auto.current = true }, 2000)
    }
    const move = (e) => {
      if (!dragging.current || !groupRef.current) return
      const p = getPoint(e)
      rotY.current += (p.x - lastX.current) * 0.011
      rotX.current += (p.y - lastY.current) * 0.011
      rotX.current = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, rotX.current))
      groupRef.current.rotation.y = rotY.current
      groupRef.current.rotation.x = rotX.current
      lastX.current = p.x
      lastY.current = p.y
    }
    el.addEventListener('mousedown', down)
    el.addEventListener('touchstart', down, { passive: true })
    window.addEventListener('mouseup', up)
    window.addEventListener('touchend', up)
    window.addEventListener('mousemove', move)
    window.addEventListener('touchmove', move, { passive: true })
    return () => {
      el.removeEventListener('mousedown', down)
      el.removeEventListener('touchstart', down)
      window.removeEventListener('mouseup', up)
      window.removeEventListener('touchend', up)
      window.removeEventListener('mousemove', move)
      window.removeEventListener('touchmove', move)
      if (timer.current) clearTimeout(timer.current)
    }
  }, [gl, groupRef])

  useFrame((_, delta) => {
    if (!groupRef.current) return
    // Always ease X tilt back to upright after releasing
    if (!dragging.current) {
      rotX.current = THREE.MathUtils.lerp(rotX.current, 0, delta * 2.5)
      groupRef.current.rotation.x = rotX.current
    }
    // Resume Y auto-rotation after idle timeout
    if (auto.current) {
      rotY.current += delta * 0.38
      groupRef.current.rotation.y = rotY.current
    }
  })
  return null
}

// Logo badge on stomach
const LogoPatch = () => {
  const texture = useLoader(THREE.TextureLoader, logoSrc)
  return (
    <group position={[0, -0.22, 0.542]}>
      {/* White backing disc so logo pops against dark torso */}
      <mesh position={[0, 0, -0.002]}>
        <circleGeometry args={[0.13, 48]} />
        <meshStandardMaterial color="#ffffff" roughness={0.1} metalness={0} />
      </mesh>
      {/* Logo texture */}
      <mesh>
        <circleGeometry args={[0.115, 48]} />
        <meshStandardMaterial map={texture} transparent opacity={0.92} roughness={0.05} metalness={0} depthWrite={false} />
      </mesh>
    </group>
  )
}

const RobotBody = ({ bodyRef }) => {
  const leftArmRef = useRef()
  const eyeLRef = useRef()
  const eyeRRef = useRef()
  const antennaRef = useRef()
  const chestGlowRef = useRef()

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    // Hover above stand
    if (bodyRef.current) bodyRef.current.position.y = 0.28 + Math.sin(t * 0.95) * 0.09
    if (leftArmRef.current) leftArmRef.current.rotation.z = Math.sin(t * 2.4) * 0.42 + 0.95
    const pulse = (Math.sin(t * 2.2) + 1) / 2
    if (eyeLRef.current) eyeLRef.current.material.emissiveIntensity = 2.5 + pulse * 3.5
    if (eyeRRef.current) eyeRRef.current.material.emissiveIntensity = 2.5 + pulse * 3.5
    if (antennaRef.current) antennaRef.current.material.emissiveIntensity = 1.8 + pulse * 3
    if (chestGlowRef.current) chestGlowRef.current.material.emissiveIntensity = 0.8 + pulse * 1.5
  })

  const B = () => <meshPhysicalMaterial color="#eef2ff" roughness={0.05} metalness={0.08} clearcoat={1} clearcoatRoughness={0.05} reflectivity={0.9} />
  const J = () => <meshPhysicalMaterial color="#c7d2f0" roughness={0.1} metalness={0.15} clearcoat={0.8} clearcoatRoughness={0.1} />
  const V = () => <meshPhysicalMaterial color="#040e1c" roughness={0.0} metalness={0.3} transparent opacity={0.94} />
  const F = () => <meshPhysicalMaterial color="#1a3a6e" roughness={0.12} metalness={0.5} clearcoat={0.6} />
  const A = () => <meshPhysicalMaterial color="#7ab4ff" roughness={0.08} metalness={0.2} clearcoat={0.9} clearcoatRoughness={0.06} />
  const CG = ({ i = 3 }) => <meshStandardMaterial color="#00e5ff" emissive="#00e5ff" emissiveIntensity={i} roughness={0} metalness={0} />
  const BG = ({ i = 2 }) => <meshStandardMaterial color="#3b82f6" emissive="#3b82f6" emissiveIntensity={i} roughness={0} metalness={0} />

  return (
    <group ref={bodyRef} position={[0, 0.28, 0]}>
      <pointLight position={[0, 1.5, 0.9]} color="#00e5ff" intensity={1.5} distance={1.8} decay={2} />
      <pointLight position={[0, 0.3, 0.85]} color="#3b82f6" intensity={1.0} distance={1.4} decay={2} />

      {/* ANTENNA */}
      <mesh position={[0, 2.2, 0]}><cylinderGeometry args={[0.013, 0.013, 0.36, 10]} /><A /></mesh>
      <mesh ref={antennaRef} position={[0, 2.4, 0]}><sphereGeometry args={[0.06, 24, 24]} /><CG i={2} /></mesh>

      {/* HEAD */}
      <mesh position={[0, 1.46, 0]}><sphereGeometry args={[0.62, 64, 64]} /><B /></mesh>
      <mesh position={[0, 1.98, 0]} scale={[0.88, 0.42, 0.88]}><sphereGeometry args={[0.28, 32, 32]} /><B /></mesh>

      {/* Visor */}
      <mesh position={[0, 1.5, 0.5]} rotation={[0.1, 0, 0]}><boxGeometry args={[0.9, 0.4, 0.035]} /><F /></mesh>
      <mesh position={[0, 1.5, 0.52]} rotation={[0.1, 0, 0]}><boxGeometry args={[0.82, 0.32, 0.04]} /><V /></mesh>

      {/* Eyes */}
      {[-0.24, 0.24].map((x, i) => (
        <mesh key={i} position={[x, 1.5, 0.555]}><circleGeometry args={[0.105, 48]} /><meshPhysicalMaterial color="#081c38" roughness={0} metalness={0.4} /></mesh>
      ))}
      <mesh ref={eyeLRef} position={[-0.24, 1.5, 0.575]}><circleGeometry args={[0.072, 48]} /><CG i={3} /></mesh>
      <mesh ref={eyeRRef} position={[0.24, 1.5, 0.575]}><circleGeometry args={[0.072, 48]} /><CG i={3} /></mesh>
      {[-0.24, 0.24].map((x, i) => (
        <mesh key={i} position={[x + 0.025, 1.525, 0.595]}><circleGeometry args={[0.022, 16]} /><meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={5} /></mesh>
      ))}

      {/* Smile */}
      <mesh position={[0, 1.24, 0.56]} rotation={[Math.PI - 0.05, 0, 0]}>
        <torusGeometry args={[0.14, 0.016, 10, 28, Math.PI * 0.75]} /><CG i={2} />
      </mesh>

      {/* Ears */}
      {[-0.64, 0.64].map((x, i) => (
        <group key={i} position={[x, 1.46, 0]} rotation={[0, Math.PI / 2, 0]}>
          <mesh><cylinderGeometry args={[0.115, 0.095, 0.12, 24]} /><J /></mesh>
          <mesh position={[0, 0, x > 0 ? 0.09 : -0.09]}><circleGeometry args={[0.05, 20]} /><BG i={1.5} /></mesh>
        </group>
      ))}

      {/* Neck */}
      <mesh position={[0, 0.78, 0]}><cylinderGeometry args={[0.135, 0.175, 0.19, 24]} /><J /></mesh>
      <mesh position={[0, 0.82, 0]}><torusGeometry args={[0.155, 0.016, 8, 24]} /><A /></mesh>

      {/* Torso */}
      <mesh position={[0, 0.1, 0]} scale={[1.06, 1.2, 0.88]}><sphereGeometry args={[0.6, 64, 64]} /><B /></mesh>

      {/* Chest panel */}
      <mesh position={[0, 0.3, 0.5]}><boxGeometry args={[0.62, 0.34, 0.028]} /><F /></mesh>
      <mesh position={[0, 0.3, 0.515]}><boxGeometry args={[0.54, 0.26, 0.03]} /><V /></mesh>
      {[['#00e5ff', -0.16], ['#34d399', 0], ['#f87171', 0.16]].map(([c, x], i) => (
        <mesh key={i} position={[x, 0.3, 0.535]}><circleGeometry args={[0.036, 20]} /><meshStandardMaterial color={c} emissive={c} emissiveIntensity={2.2} roughness={0} /></mesh>
      ))}
      <mesh ref={chestGlowRef} position={[0, 0.08, 0.535]}><torusGeometry args={[0.065, 0.014, 8, 24]} /><CG i={1} /></mesh>

      {/* Logo on stomach */}
      <Suspense fallback={null}>
        <LogoPatch />
      </Suspense>

      {/* Waist bands */}
      {[-0.52, 0.52].map((x, i) => (
        <mesh key={i} position={[x * 0.85, -0.1, 0.38]} rotation={[0, x > 0 ? -0.6 : 0.6, 0]}>
          <boxGeometry args={[0.07, 0.28, 0.055]} /><J />
        </mesh>
      ))}

      {/* Left arm — waving */}
      <group ref={leftArmRef} position={[-0.7, 0.36, 0]}>
        <mesh><sphereGeometry args={[0.13, 20, 20]} /><J /></mesh>
        <mesh position={[-0.09, 0.17, 0]} rotation={[0, 0, 0.35]}><capsuleGeometry args={[0.095, 0.26, 10, 20]} /><B /></mesh>
        <mesh position={[-0.2, 0.32, 0]}><sphereGeometry args={[0.115, 18, 18]} /><J /></mesh>
        <mesh position={[-0.27, 0.48, 0]} rotation={[0, 0, -0.18]}><capsuleGeometry args={[0.088, 0.22, 10, 20]} /><B /></mesh>
        <mesh position={[-0.31, 0.64, 0]}><sphereGeometry args={[0.115, 20, 20]} /><A /></mesh>
      </group>

      {/* Right arm — relaxed */}
      <group position={[0.7, 0.22, 0]} rotation={[0.1, 0, -0.32]}>
        <mesh><sphereGeometry args={[0.13, 20, 20]} /><J /></mesh>
        <mesh position={[0, -0.18, 0]}><capsuleGeometry args={[0.095, 0.28, 10, 20]} /><B /></mesh>
        <mesh position={[0, -0.38, 0]}><sphereGeometry args={[0.115, 18, 18]} /><J /></mesh>
        <mesh position={[0, -0.54, 0]}><capsuleGeometry args={[0.088, 0.2, 10, 20]} /><B /></mesh>
        <mesh position={[0, -0.7, 0]}><sphereGeometry args={[0.115, 20, 20]} /><A /></mesh>
      </group>

      {/* Legs */}
      {[-0.27, 0.27].map((x, i) => (
        <group key={i} position={[x, -0.58, 0]}>
          <mesh><sphereGeometry args={[0.12, 18, 18]} /><J /></mesh>
          <mesh position={[0, -0.14, 0]}><capsuleGeometry args={[0.105, 0.22, 10, 18]} /><B /></mesh>
          <mesh position={[0, -0.3, 0]}><sphereGeometry args={[0.12, 18, 18]} /><J /></mesh>
          <mesh position={[0, -0.46, 0]}><capsuleGeometry args={[0.095, 0.2, 10, 18]} /><B /></mesh>
          <mesh position={[0, -0.64, 0.09]} scale={[1.3, 0.52, 1.65]}><sphereGeometry args={[0.13, 22, 22]} /><A /></mesh>
        </group>
      ))}
    </group>
  )
}

const Stand = () => (
  <group>
    {/* Thin plate */}
    <mesh position={[0, -1.32, 0]}>
      <cylinderGeometry args={[0.88, 0.88, 0.07, 64]} />
      <meshPhysicalMaterial color="#0d1f45" roughness={0.06} metalness={0.7} clearcoat={1} clearcoatRoughness={0.04} />
    </mesh>
    {/* Top edge cyan glow ring */}
    <mesh position={[0, -1.285, 0]} rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[0.88, 0.018, 10, 64]} />
      <meshStandardMaterial color="#00e5ff" emissive="#00e5ff" emissiveIntensity={3} roughness={0} metalness={0} />
    </mesh>
    {/* Bottom edge blue ring */}
    <mesh position={[0, -1.355, 0]} rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[0.88, 0.012, 8, 64]} />
      <meshStandardMaterial color="#3b82f6" emissive="#3b82f6" emissiveIntensity={2} roughness={0} metalness={0} />
    </mesh>
    {/* Glow pool beneath */}
    <mesh position={[0, -1.4, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[1.2, 48]} />
      <meshStandardMaterial color="#00e5ff" transparent opacity={0.06} />
    </mesh>
    <mesh position={[0, -1.39, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[0.7, 48]} />
      <meshStandardMaterial color="#00e5ff" transparent opacity={0.1} />
    </mesh>
  </group>
)

const Scene = () => {
  const groupRef = useRef()
  const bodyRef = useRef()
  return (
    <>
      <ambientLight intensity={1.2} color="#ffffff" />
      <directionalLight position={[5, 9, 5]} intensity={2.2} color="#ffffff" />
      <directionalLight position={[-4, 3, 3]} intensity={0.8} color="#e0f7fa" />
      <directionalLight position={[0, 5, -6]} intensity={0.8} color="#b2ebf2" />
      <directionalLight position={[0, -4, 2]} intensity={0.3} color="#ffffff" />

      <group ref={groupRef}>
        <RobotBody bodyRef={bodyRef} />
      </group>
      <Stand />
      <DragRotate groupRef={groupRef} />
    </>
  )
}

export const Robot3D = ({ height = 300 }) => (
  <div
    style={{ width: '100%', height, background: '#00d4d4' }}
    className="cursor-grab active:cursor-grabbing touch-none select-none"
  >
    <Canvas
      camera={{ position: [0, 0.55, 7.2], fov: 40 }}
      gl={{ antialias: true, alpha: false, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.15 }}
    >
      <color attach="background" args={['#00d4d4']} />
      <Scene />
    </Canvas>
  </div>
)
