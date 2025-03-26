import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import useStore from '../../store';

// AI Visualization component using Three.js
const AIVisualization = ({ activeTab, stage }) => {
  // Use provided stage or get from store
  const { processingStage: storeStage } = useStore();
  const processingStage = stage || storeStage;
  
  // Create refs for the objects we'll animate
  const groupRef = useRef();
  const sphereRef = useRef();
  const particlesRef = useRef();
  
  // Create particles
  useEffect(() => {
    if (particlesRef.current) {
      const particleCount = 500;
      const positions = new Float32Array(particleCount * 3);
      const colors = new Float32Array(particleCount * 3);
      const sizes = new Float32Array(particleCount);
      
      const color = new THREE.Color();
      
      for (let i = 0; i < particleCount; i++) {
        // Position
        const x = (Math.random() - 0.5) * 10;
        const y = (Math.random() - 0.5) * 10;
        const z = (Math.random() - 0.5) * 10;
        
        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;
        
        // Color based on active tab
        const hue = activeTab === 'profile' ? 0.85 : 
                    activeTab === 'company' ? 0.6 : 
                    activeTab === 'message' ? 0.35 : 
                    Math.random();
        
        color.setHSL(hue, 0.7, 0.5);
        colors[i * 3] = color.r;
        colors[i * 3 + 1] = color.g;
        colors[i * 3 + 2] = color.b;
        
        // Size
        sizes[i] = Math.random() * 0.1 + 0.05;
      }
      
      particlesRef.current.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      particlesRef.current.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      particlesRef.current.geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    }
  }, [activeTab]);
  
  // Animation based on processing stage
  useFrame((state, delta) => {
    if (groupRef.current) {
      // Base rotation
      groupRef.current.rotation.y += delta * 0.2;
      
      // Stage-specific animations
      switch (processingStage) {
        case 'idle':
          if (sphereRef.current) {
            sphereRef.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime) * 0.1);
          }
          if (particlesRef.current) {
            particlesRef.current.material.opacity = 0.3;
          }
          break;
          
        case 'loading':
          if (sphereRef.current) {
            sphereRef.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 5) * 0.2);
          }
          if (particlesRef.current) {
            particlesRef.current.material.opacity = 0.5;
            // Make particles move toward center
            const positions = particlesRef.current.geometry.attributes.position.array;
            for (let i = 0; i < positions.length; i += 3) {
              positions[i] += (0 - positions[i]) * 0.01;
              positions[i + 1] += (0 - positions[i + 1]) * 0.01;
              positions[i + 2] += (0 - positions[i + 2]) * 0.01;
            }
            particlesRef.current.geometry.attributes.position.needsUpdate = true;
          }
          break;
          
        case 'analyzing':
          if (sphereRef.current) {
            sphereRef.current.scale.setScalar(1.5 + Math.sin(state.clock.elapsedTime * 3) * 0.2);
          }
          if (particlesRef.current) {
            particlesRef.current.material.opacity = 0.8;
            // Make particles orbit
            const positions = particlesRef.current.geometry.attributes.position.array;
            for (let i = 0; i < positions.length; i += 3) {
              const x = positions[i];
              const z = positions[i + 2];
              const angle = delta * 0.5;
              positions[i] = x * Math.cos(angle) - z * Math.sin(angle);
              positions[i + 2] = x * Math.sin(angle) + z * Math.cos(angle);
            }
            particlesRef.current.geometry.attributes.position.needsUpdate = true;
          }
          break;
          
        case 'generating':
          if (sphereRef.current) {
            sphereRef.current.scale.setScalar(2 + Math.sin(state.clock.elapsedTime * 2) * 0.3);
          }
          if (particlesRef.current) {
            particlesRef.current.material.opacity = 1;
            // Make particles expand outward
            const positions = particlesRef.current.geometry.attributes.position.array;
            for (let i = 0; i < positions.length; i += 3) {
              const x = positions[i];
              const y = positions[i + 1];
              const z = positions[i + 2];
              const length = Math.sqrt(x * x + y * y + z * z);
              if (length < 5) {
                positions[i] += x / length * 0.05;
                positions[i + 1] += y / length * 0.05;
                positions[i + 2] += z / length * 0.05;
              }
            }
            particlesRef.current.geometry.attributes.position.needsUpdate = true;
          }
          break;
          
        case 'complete':
          if (sphereRef.current) {
            sphereRef.current.scale.setScalar(1.5 + Math.sin(state.clock.elapsedTime) * 0.1);
          }
          if (particlesRef.current) {
            particlesRef.current.material.opacity = 0.7;
            // Make particles form a stable pattern
            const positions = particlesRef.current.geometry.attributes.position.array;
            for (let i = 0; i < positions.length; i += 3) {
              const x = positions[i];
              const y = positions[i + 1];
              const z = positions[i + 2];
              const length = Math.sqrt(x * x + y * y + z * z);
              if (length > 3 && length < 4) {
                positions[i] += (3.5 * x / length - x) * 0.05;
                positions[i + 1] += (3.5 * y / length - y) * 0.05;
                positions[i + 2] += (3.5 * z / length - z) * 0.05;
              } else if (length < 3) {
                positions[i] += (3 * x / length - x) * 0.05;
                positions[i + 1] += (3 * y / length - y) * 0.05;
                positions[i + 2] += (3 * z / length - z) * 0.05;
              } else if (length > 4) {
                positions[i] += (4 * x / length - x) * 0.05;
                positions[i + 1] += (4 * y / length - y) * 0.05;
                positions[i + 2] += (4 * z / length - z) * 0.05;
              }
            }
            particlesRef.current.geometry.attributes.position.needsUpdate = true;
          }
          break;
          
        default:
          break;
      }
    }
  });
  
  // Get color based on active tab - now using the brand colors from Chakra theme
  const getColor = () => {
    switch (activeTab) {
      case 'profile':
        return '#7B68EE'; // Brand primary color
      case 'company':
        return '#3366ff'; // Blue
      case 'message':
        return '#4DB76A'; // Green
      default:
        return '#7B68EE'; // Default brand color
    }
  };
  
  return (
    <group ref={groupRef}>
      {/* Central sphere representing the AI core */}
      <mesh ref={sphereRef}>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial 
          color={getColor()} 
          emissive={getColor()} 
          emissiveIntensity={0.5} 
          metalness={0.8} 
          roughness={0.2} 
        />
      </mesh>
      
      {/* Particles representing data and processing */}
      <points ref={particlesRef}>
        <bufferGeometry />
        <pointsMaterial 
          size={0.1} 
          vertexColors 
          transparent 
          opacity={0.5} 
          blending={THREE.AdditiveBlending} 
        />
      </points>
    </group>
  );
};

export default AIVisualization;