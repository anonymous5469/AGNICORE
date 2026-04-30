import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Float, MeshTransmissionMaterial } from '@react-three/drei';
import * as THREE from 'three';

function generateAuthParticles(count: number): Float32Array {
  const temp = [];
  for (let i = 0; i < count; i++) {
    temp.push((Math.random() - 0.5) * 20);
    temp.push((Math.random() - 0.5) * 20);
    temp.push((Math.random() - 0.5) * 20);
  }
  return new Float32Array(temp);
}

function SecurityNode({ position, color, scale = 1 }: { position: [number, number, number]; color: string; scale?: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.2;
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
      <mesh ref={meshRef} position={position} scale={scale}>
        <icosahedronGeometry args={[1, 1]} />
        <MeshTransmissionMaterial
          backside
          samples={4}
          thickness={0.5}
          chromaticAberration={0.02}
          anisotropy={0.1}
          distortion={0.1}
          distortionScale={0.2}
          temporalDistortion={0.1}
          color={color}
          attenuationDistance={2}
          attenuationColor={color}
        />
      </mesh>
    </Float>
  );
}

function ConnectionLine({ start, end, color }: { start: [number, number, number]; end: [number, number, number]; color: string }) {
  const points = useMemo(() => [new THREE.Vector3(...start), new THREE.Vector3(...end)], [start, end]);
  
  return (
    <line>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={points.length}
          array={new Float32Array(points.flatMap(p => [p.x, p.y, p.z]))}
          itemSize={3}
        />
      </bufferGeometry>
      <lineBasicMaterial color={color} transparent opacity={0.3} />
    </line>
  );
}

function SecurityRing({ radius, color, rotationSpeed = 0.1 }: { radius: number; color: string; rotationSpeed?: number }) {
  const ringRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (ringRef.current) {
      ringRef.current.rotation.z = state.clock.elapsedTime * rotationSpeed;
      ringRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.1) * 0.2;
    }
  });

  return (
    <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[radius, 0.02, 16, 100]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.5}
        transparent
        opacity={0.6}
      />
    </mesh>
  );
}

function CentralHub() {
  const hubRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (hubRef.current) {
      const scale = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.05;
      hubRef.current.scale.set(scale, scale, scale);
    }
  });

  return (
    <group>
      <mesh ref={hubRef}>
        <sphereGeometry args={[1.2, 32, 32]} />
        <meshStandardMaterial
          color="#3b82f6"
          emissive="#3b82f6"
          emissiveIntensity={0.3}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>
      <SecurityRing radius={2} color="#3b82f6" rotationSpeed={0.05} />
      <SecurityRing radius={2.5} color="#8b5cf6" rotationSpeed={-0.03} />
      <SecurityRing radius={3} color="#06b6d4" rotationSpeed={0.02} />
    </group>
  );
}

function ParticleField({ count = 200 }: { count?: number }) {
  const points = useMemo(() => generateAuthParticles(count), [count]);

  const ref = useRef<THREE.Points>(null);
  
  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = state.clock.elapsedTime * 0.02;
      ref.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.01) * 0.1;
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
        size={0.05}
        color="#3b82f6"
        transparent
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  );
}

function Scene() {
  const nodes = useMemo(() => [
    { position: [4, 2, -2] as [number, number, number], color: '#60a5fa', scale: 0.8 },
    { position: [-3, 3, 1] as [number, number, number], color: '#a78bfa', scale: 0.6 },
    { position: [2, -3, 3] as [number, number, number], color: '#22d3ee', scale: 0.7 },
    { position: [-4, -2, -1] as [number, number, number], color: '#818cf8', scale: 0.5 },
    { position: [3, 1, 4] as [number, number, number], color: '#38bdf8', scale: 0.6 },
    { position: [-2, -1, -4] as [number, number, number], color: '#c084fc', scale: 0.7 },
    { position: [0, 4, 2] as [number, number, number], color: '#67e8f9', scale: 0.5 },
    { position: [0, -4, -3] as [number, number, number], color: '#93c5fd', scale: 0.6 },
  ], []);

  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={1} color="#3b82f6" />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#8b5cf6" />
      <pointLight position={[0, 5, 0]} intensity={0.5} color="#06b6d4" />
      
      <CentralHub />
      
      {nodes.map((node, i) => (
        <SecurityNode key={i} {...node} />
      ))}
      
      {nodes.map((node, i) => (
        <ConnectionLine
          key={`line-${i}`}
          start={[0, 0, 0]}
          end={node.position}
          color={node.color}
        />
      ))}
      
      <ParticleField count={500} />
      
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate
        autoRotateSpeed={0.5}
        maxPolarAngle={Math.PI / 1.5}
        minPolarAngle={Math.PI / 3}
      />
    </>
  );
}

export default function AuthScene() {
  return (
    <div className="fixed inset-0 z-0">
      <Canvas
        camera={{ position: [0, 0, 10], fov: 60 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <Scene />
      </Canvas>
    </div>
  );
}
