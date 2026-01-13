'use client';

import { useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Sparkles, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';

// 3D Camera Model - stylized geometric camera
function Camera3D({ position = [0, 0, 0] as [number, number, number], scale = 1 }) {
  const groupRef = useRef<THREE.Group>(null);
  const lensRef = useRef<THREE.Mesh>(null);
  const flashRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (groupRef.current) {
      // Gentle floating rotation
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.3;
      groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
      groupRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.8) * 0.2;
    }
    if (lensRef.current) {
      // Lens subtle pulsing
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.05;
      lensRef.current.scale.set(pulse, pulse, 1);
    }
    if (flashRef.current) {
      // Flash blinking effect
      const flash = Math.sin(state.clock.elapsedTime * 4) > 0.95 ? 2 : 0.5;
      (flashRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = flash;
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
      <group ref={groupRef} position={position} scale={scale}>
        {/* Camera body */}
        <RoundedBox args={[2.4, 1.6, 1.2]} radius={0.15} smoothness={4}>
          <meshStandardMaterial
            color="#1a1a2e"
            roughness={0.3}
            metalness={0.8}
          />
        </RoundedBox>
        
        {/* Top grip/viewfinder */}
        <RoundedBox args={[0.8, 0.4, 0.6]} radius={0.08} position={[0.5, 1, 0]}>
          <meshStandardMaterial
            color="#16162a"
            roughness={0.4}
            metalness={0.7}
          />
        </RoundedBox>
        
        {/* Lens outer ring */}
        <mesh position={[0, 0, 0.7]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.7, 0.75, 0.3, 32]} />
          <meshStandardMaterial
            color="#2d2d44"
            roughness={0.2}
            metalness={0.9}
          />
        </mesh>
        
        {/* Lens middle */}
        <mesh position={[0, 0, 0.9]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.55, 0.6, 0.4, 32]} />
          <meshStandardMaterial
            color="#1a1a2e"
            roughness={0.3}
            metalness={0.8}
          />
        </mesh>
        
        {/* Lens glass - glowing purple */}
        <mesh ref={lensRef} position={[0, 0, 1.15]}>
          <circleGeometry args={[0.45, 32]} />
          <meshStandardMaterial
            color="#8b5cf6"
            emissive="#a855f7"
            emissiveIntensity={0.8}
            roughness={0.1}
            metalness={0.9}
            transparent
            opacity={0.9}
          />
        </mesh>
        
        {/* Inner lens reflection */}
        <mesh position={[0, 0, 1.12]}>
          <ringGeometry args={[0.2, 0.35, 32]} />
          <meshStandardMaterial
            color="#c084fc"
            emissive="#c084fc"
            emissiveIntensity={0.3}
            transparent
            opacity={0.5}
          />
        </mesh>
        
        {/* Flash */}
        <mesh ref={flashRef} position={[-0.7, 0.6, 0.61]}>
          <boxGeometry args={[0.4, 0.25, 0.05]} />
          <meshStandardMaterial
            color="#fef3c7"
            emissive="#fbbf24"
            emissiveIntensity={0.5}
            roughness={0.1}
          />
        </mesh>
        
        {/* Shutter button */}
        <mesh position={[0.8, 1, 0.3]}>
          <cylinderGeometry args={[0.12, 0.12, 0.15, 16]} />
          <meshStandardMaterial
            color="#a855f7"
            roughness={0.3}
            metalness={0.6}
          />
        </mesh>
        
        {/* Mode dial */}
        <mesh position={[-0.6, 1, 0]}>
          <cylinderGeometry args={[0.2, 0.2, 0.2, 16]} />
          <meshStandardMaterial
            color="#2d2d44"
            roughness={0.4}
            metalness={0.7}
          />
        </mesh>
        
        {/* Strap holders */}
        <mesh position={[-1.3, 0.5, 0]} rotation={[0, Math.PI / 2, 0]}>
          <torusGeometry args={[0.1, 0.03, 8, 16]} />
          <meshStandardMaterial color="#4a4a5a" metalness={0.9} roughness={0.2} />
        </mesh>
        <mesh position={[1.3, 0.5, 0]} rotation={[0, Math.PI / 2, 0]}>
          <torusGeometry args={[0.1, 0.03, 8, 16]} />
          <meshStandardMaterial color="#4a4a5a" metalness={0.9} roughness={0.2} />
        </mesh>
      </group>
    </Float>
  );
}

// Floating photo frames around the camera
function PhotoFrame({ position, rotation, scale = 1 }: { 
  position: [number, number, number]; 
  rotation?: [number, number, number];
  scale?: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
      meshRef.current.rotation.y += 0.002;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
      <mesh ref={meshRef} position={position} rotation={rotation} scale={scale}>
        <boxGeometry args={[1.6, 1.2, 0.05]} />
        <meshStandardMaterial 
          color="#8b5cf6" 
          transparent 
          opacity={0.15}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>
    </Float>
  );
}

// Particle system for ambient effect
function ParticleField() {
  const count = 200;
  const particlesRef = useRef<THREE.Points>(null);
  
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 20;
    }
    return pos;
  }, []);

  useFrame((state) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y = state.clock.elapsedTime * 0.02;
      particlesRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.1) * 0.1;
    }
  });

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }, [positions]);

  return (
    <points ref={particlesRef} geometry={geometry}>
      <pointsMaterial
        size={0.03}
        color="#a855f7"
        transparent
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  );
}


// Floating rings
function FloatingRing({ position, scale = 1 }: { 
  position: [number, number, number]; 
  scale?: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.5;
      meshRef.current.rotation.z = state.clock.elapsedTime * 0.3;
    }
  });

  return (
    <Float speed={1.8} rotationIntensity={0.4} floatIntensity={0.6}>
      <mesh ref={meshRef} position={position} scale={scale}>
        <torusGeometry args={[1, 0.02, 16, 100]} />
        <meshStandardMaterial
          color="#c084fc"
          transparent
          opacity={0.5}
          roughness={0.1}
          metalness={0.9}
        />
      </mesh>
    </Float>
  );
}

// Main 3D scene
function Scene() {
  return (
    <>
      <ambientLight intensity={0.4} />
      <pointLight position={[10, 10, 10]} intensity={1} color="#a855f7" />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#8b5cf6" />
      <pointLight position={[0, 5, 5]} intensity={0.8} color="#c084fc" />
      <spotLight
        position={[0, 10, 5]}
        angle={0.4}
        penumbra={1}
        intensity={0.8}
        color="#ffffff"
      />

      {/* Central 3D Camera - the hero element */}
      <Camera3D position={[2, 0, 0]} scale={0.9} />

      {/* Floating photo frames around */}
      <PhotoFrame position={[-3.5, 1.5, -3]} rotation={[0.1, 0.4, 0]} scale={0.6} />
      <PhotoFrame position={[-4, -1.5, -4]} rotation={[-0.1, -0.2, 0.1]} scale={0.5} />
      <PhotoFrame position={[4.5, 2, -5]} rotation={[-0.15, 0.3, 0]} scale={0.55} />

      {/* Floating rings */}
      <FloatingRing position={[-2, 2, -2]} scale={0.4} />
      <FloatingRing position={[4, -1, -3]} scale={0.3} />

      {/* Particle effects */}
      <ParticleField />
      
      {/* Sparkles for magical effect */}
      <Sparkles
        count={80}
        scale={12}
        size={1.5}
        speed={0.4}
        opacity={0.6}
        color="#a855f7"
      />

      {/* Use simple lighting instead of HDR environment to avoid network issues */}
      <fog attach="fog" args={['#0f0f1a', 8, 25]} />
    </>
  );
}

// Exported component
export function HeroScene() {
  return (
    <div className="absolute inset-0 z-0 w-full h-full">
      <Canvas
        camera={{ position: [0, 0, 8], fov: 45 }}
        dpr={[1, 2]}
        gl={{ 
          antialias: true, 
          alpha: true,
          powerPreference: 'high-performance'
        }}
        style={{ 
          background: 'transparent',
          width: '100%',
          height: '100%'
        }}
      >
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>
    </div>
  );
}

export default HeroScene;
