import { Suspense } from 'react';
import { Environment, ContactShadows } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import Robot from './Robot';

export default function Scene() {
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.6} color="#e0f7fa" />

      {/* Key light */}
      <directionalLight
        position={[3, 5, 4]}
        intensity={1.8}
        color="#ffffff"
        castShadow
        shadow-mapSize={[1024, 1024]}
      />

      {/* Fill light */}
      <directionalLight position={[-3, 2, -2]} intensity={0.5} color="#b2ebf2" />

      {/* Rim light */}
      <pointLight position={[0, 4, -3]} intensity={1.2} color="#00e5ff" />

      {/* Cyan ambient bounce */}
      <pointLight position={[0, -1, 2]} intensity={0.4} color="#00bcd4" />

      {/* Environment for reflections */}
      <Environment preset="city" />

      {/* Robot */}
      <Suspense fallback={null}>
        <Robot />
      </Suspense>

      {/* Contact shadow on floor */}
      <ContactShadows
        position={[0, -0.85, 0]}
        opacity={0.25}
        scale={2}
        blur={1.5}
        far={1}
        color="#007a8a"
      />

      {/* Post-processing: bloom on emissive */}
      <EffectComposer>
        <Bloom
          luminanceThreshold={0.6}
          luminanceSmoothing={0.4}
          intensity={0.8}
          mipmapBlur
        />
      </EffectComposer>
    </>
  );
}
