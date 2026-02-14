'use client';

import { Canvas } from '@react-three/fiber';
import LiquidBackground from './3d/LiquidBackground';
import Monolith from './3d/Monolith';

export default function ModernBackground() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none">
      <Canvas camera={{ position: [0, 0, 60], fov: 35 }}>
        <ambientLight intensity={0.4} />
        <spotLight position={[50, 50, 50]} intensity={3} />
        <LiquidBackground />
        <Monolith />
      </Canvas>
    </div>
  );
}
