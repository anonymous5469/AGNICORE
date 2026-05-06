import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Float } from '@react-three/drei';
import * as THREE from 'three';

function generateParticles(count: number): Float32Array {
  const temp = [];
  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = 5 + Math.random() * 3;
    temp.push(
      r * Math.sin(phi) * Math.cos(theta),
      r * Math.sin(phi) * Math.sin(theta),
      r * Math.cos(phi)
    );
  }
  return new Float32Array(temp);
}

function SecurityPlatform() {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.05;
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.2;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Main platform */}
      <mesh position={[0, -1, 0]}>
        <cylinderGeometry args={[3, 3.2, 0.5, 6]} />
        <meshStandardMaterial
          color="#1e3a5f"
          metalness={0.9}
          roughness={0.1}
          transparent
          opacity={0.8}
        />
      </mesh>

      {/* Security shield */}
      <Float speed={2} rotationIntensity={0.3} floatIntensity={0.3}>
        <mesh position={[0, 1, 0]} scale={[1.5, 1.5, 1.5]}>
          <boxGeometry args={[1, 1.2, 0.2]} />
          <meshStandardMaterial
            color="#3b82f6"
            emissive="#3b82f6"
            emissiveIntensity={0.4}
            metalness={0.8}
            roughness={0.2}
            transparent
            opacity={0.9}
          />
        </mesh>
      </Float>

      {/* Orbiting rings */}
      <SecurityRing radius={2.5} color="#3b82f6" speed={0.3} />
      <SecurityRing radius={3.2} color="#8b5cf6" speed={-0.2} />
      <SecurityRing radius={3.8} color="#06b6d4" speed={0.15} />

      {/* Floating nodes */}
      {[...Array(6)].map((_, i) => {
        const angle = (i / 6) * Math.PI * 2;
        const radius = 4.5;
        return (
          <Float key={i} speed={1.5 + i * 0.2} rotationIntensity={0.2} floatIntensity={0.4}>
            <mesh
              position={[
                Math.cos(angle) * radius,
                Math.sin(i * 0.8) * 0.5,
                Math.sin(angle) * radius
              ]}
              scale={0.3 + i * 0.05}
            >
              <icosahedronGeometry args={[1, 0]} />
              <meshStandardMaterial
                color={i % 2 === 0 ? '#60a5fa' : '#a78bfa'}
                emissive={i % 2 === 0 ? '#60a5fa' : '#a78bfa'}
                emissiveIntensity={0.5}
                metalness={0.7}
                roughness={0.3}
              />
            </mesh>
          </Float>
        );
      })}
    </group>
  );
}

function SecurityRing({ radius, color, speed }: { radius: number; color: string; speed: number }) {
  const ringRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (ringRef.current) {
      ringRef.current.rotation.x = Math.PI / 2 + Math.sin(state.clock.elapsedTime * speed) * 0.3;
      ringRef.current.rotation.z = state.clock.elapsedTime * speed * 0.5;
    }
  });

  return (
    <mesh ref={ringRef}>
      <torusGeometry args={[radius, 0.03, 16, 100]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.6}
        transparent
        opacity={0.5}
      />
    </mesh>
  );
}

function DataParticles({ count = 300 }: { count?: number }) {
  const points = useMemo(() => generateParticles(count), [count]);

  const ref = useRef<THREE.Points>(null);
  
  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = state.clock.elapsedTime * 0.02;
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={points}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.06}
        color="#3b82f6"
        transparent
        opacity={0.5}
        sizeAttenuation
      />
    </points>
  );
}

function Scene() {
  return (
    <>
      <ambientLight intensity={0.2} />
      <pointLight position={[10, 10, 10]} intensity={1.5} color="#3b82f6" />
      <pointLight position={[-10, -10, -10]} intensity={1} color="#8b5cf6" />
      <pointLight position={[0, 5, 0]} intensity={0.8} color="#06b6d4" />
      
      <SecurityPlatform />
      <DataParticles count={400} />
      
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate
        autoRotateSpeed={0.3}
        maxPolarAngle={Math.PI / 1.8}
        minPolarAngle={Math.PI / 3}
      />
    </>
  );
}

export default function DashboardScene() {
  return (
    <div className="absolute inset-0 z-0">
      <Canvas
        camera={{ position: [0, 2, 8], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <Scene />
      </Canvas>
    </div>
  );
}
