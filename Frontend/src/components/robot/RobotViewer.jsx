import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Suspense, useRef } from 'react';
import Scene from './Scene';

export default function RobotViewer({ style = {} }) {
  const controlsRef = useRef();

  function handleDoubleClick() {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  }

  return (
    <div
      onDoubleClick={handleDoubleClick}
      style={{
        width: '100%',
        height: '100%',
        background: '#00d4d4',
        borderRadius: 'inherit',
        ...style,
      }}
    >
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [0, 0.3, 3.2], fov: 38, near: 0.1, far: 50 }}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        style={{ background: '#00d4d4' }}
      >
        <Suspense fallback={null}>
          <Scene />
        </Suspense>

        <OrbitControls
          ref={controlsRef}
          enablePan={false}
          enableZoom={true}
          enableDamping
          dampingFactor={0.06}
          minDistance={1.8}
          maxDistance={6}
          minPolarAngle={Math.PI * 0.1}
          maxPolarAngle={Math.PI * 0.85}
          autoRotate={false}
          makeDefault
        />
      </Canvas>
    </div>
  );
}
