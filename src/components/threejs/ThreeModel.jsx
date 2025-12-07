import React, { useRef, useEffect, useState, useCallback, Suspense } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { useGLTF, OrbitControls, Environment, ContactShadows } from '@react-three/drei';

import * as THREE from 'three';
import PremiumClothPhysics from './PremiumClothPhysics';
import './threejs.css';

// Model component with enhanced rotation tracking and cloth physics
const Model = ({ url, rotationData, onPointerDown, onPointerUp, onPointerMove }) => {
  const groupRef = useRef();
  const sceneRef = useRef();
  const [modelLoaded, setModelLoaded] = useState(false);

  // Always call hooks at the top level - no conditionals
  const gltf = useGLTF(url);

  useEffect(() => {
    if (gltf && gltf.scene && groupRef.current && !modelLoaded) {
      try {
        // Clone the scene to avoid conflicts when multiple components use the same GLB
        const scene = gltf.scene.clone();

        // Calculate bounding box to center and scale the model properly
        const box = new THREE.Box3().setFromObject(scene);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        // COMPREHENSIVE MODEL ORIENTATION FIX
        console.log('Model dimensions:', { width: size.x, height: size.y, depth: size.z });
        console.log('Model center:', center);

        // Reset all rotations first
        scene.rotation.set(0, 0, 0);
        scene.position.set(0, 0, 0);

        // Force model to face forward - CORRECTED front-facing orientation
        scene.rotation.set(0, Math.PI / 2, 0); // Rotate 90° around Y-axis to face front
        console.log('MODEL: Set to face forward (front toward camera)');

        // Additional check: if the model center is way off, it might need different handling
        if (Math.abs(center.y) > size.y * 0.5) {
          scene.position.y = -center.y; // Adjust Y position
          console.log('MODEL: Adjusted Y position for proper centering');
        }

        // Center the model properly
        scene.position.copy(center).multiplyScalar(-1);

        // If the model is still not oriented correctly after centering, adjust Y position
        if (center.y < 0) {
          scene.position.y = -center.y; // Move up if center is below origin
        }

        // Scale the model to fit properly in viewport
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 5.0 / maxDim; // Reduced from 8.0 to 5.0 to fit viewport properly
        groupRef.current.scale.setScalar(scale);

        // Clear any existing children and add the cloned scene
        while (groupRef.current.children.length > 0) {
          groupRef.current.remove(groupRef.current.children[0]);
        }
        groupRef.current.add(scene);

        // Store scene reference for cloth physics
        sceneRef.current = scene;

        setModelLoaded(true);
        console.log('MODEL SETUP: Properly sized model with forward orientation', {
          rotation: scene.rotation,
          position: scene.position,
          scale: scale,
          dimensions: size
        });
      } catch (error) {
        console.error('Error setting up 3D model:', error);
      }
    }
  }, [gltf, modelLoaded]);

  // Handle error state after all hooks are called
  if (!gltf || !gltf.scene) {
    return <mesh><boxGeometry args={[1, 1, 1]} /><meshStandardMaterial color="red" /></mesh>;
  }

  return (
    <group
      ref={groupRef}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerMove={onPointerMove}
    >
      {/* Physics-Based Cloth Simulation using Rapier */}
      {modelLoaded && sceneRef.current && (
        <PremiumClothPhysics
          meshRef={sceneRef}
          rotationData={rotationData}
          debug={false}
        />
      )}
    </group>
  );
};

// Enhanced Controls with real-time rotation tracking
const EnhancedControls = ({ controlsRef, onRotationData }) => {
  const { camera, gl } = useThree();

  // IMPROVED Real-time rotation tracking
  const lastRotation = useRef(0);
  const lastTime = useRef(performance.now());

  useFrame(() => {
    if (!controlsRef.current) return;

    const currentTime = performance.now();
    const currentRotation = controlsRef.current.getAzimuthalAngle();
    const deltaTime = currentTime - lastTime.current;

    if (deltaTime > 10) { // Only check every 10ms for stability
      // Calculate rotation difference (handling wrap-around)
      let rotationDiff = currentRotation - lastRotation.current;

      // Handle wrap-around at ±π
      if (rotationDiff > Math.PI) rotationDiff -= 2 * Math.PI;
      if (rotationDiff < -Math.PI) rotationDiff += 2 * Math.PI;

      // Calculate angular velocity (radians per second)
      const angularVelocity = rotationDiff / (deltaTime / 1000);

      // Enhanced detection - lower threshold for better responsiveness
      const isMoving = Math.abs(angularVelocity) > 0.005;

      if (isMoving) {
        console.log('ROTATION DETECTED:', {
          velocity: angularVelocity.toFixed(3),
          direction: angularVelocity > 0 ? 'CW' : 'CCW',
          angle: currentRotation.toFixed(3)
        });
      }

      // Create CONTROLLED rotation data with better speed limiting
      const rotationData = {
        speed: Math.abs(angularVelocity),
        velocity: angularVelocity,
        acceleration: 0, // Simplified
        direction: angularVelocity > 0 ? 1 : -1,
        angle: currentRotation,
        isMoving: isMoving,
        intensity: Math.min(Math.abs(angularVelocity) * 2.5, 6) // REDUCED: From 3→10 to 2.5→6 for stability
      };

      // Send data to physics
      if (onRotationData) {
        onRotationData(rotationData);
      }

      lastRotation.current = currentRotation;
      lastTime.current = currentTime;
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      args={[camera, gl.domElement]}
      enableZoom={true}
      enablePan={false}
      minPolarAngle={Math.PI / 2}
      maxPolarAngle={Math.PI / 2}
      rotateSpeed={0.8}
      minDistance={5}
      maxDistance={12}
      dampingFactor={0.08}
      enableDamping={true}
    />
  );
};

const ThreeModel = ({
  src,
  alt = "3D Model",
  onModelClick,
  onMouseDown,
  onMouseUp,
  onClick,
  enableClothPhysics = true,
  clothIntensity = 1.2,
  ...props
}) => {
  const controlsRef = useRef();
  const [rotationData, setRotationData] = useState({
    speed: 0,
    velocity: 0,
    acceleration: 0,
    direction: 0,
    angle: 0,
    isMoving: false,
    intensity: 0
  });
  const [isDragging, setIsDragging] = useState(false);
  const [clickStartTime, setClickStartTime] = useState(0);

  // Handle rotation data from controls
  const handleRotationData = useCallback((data) => {
    setRotationData(data);
    // Debug log rotation data
    if (data.isMoving) {
      console.log('THREEMODEL: Rotation data received:', data);
    }
  }, []);

  const handlePointerDown = useCallback((event) => {
    setIsDragging(true);
    setClickStartTime(Date.now());
    event.stopPropagation();
    if (onMouseDown) onMouseDown(event);
  }, [onMouseDown]);

  const handlePointerUp = useCallback((event) => {
    const clickDuration = Date.now() - clickStartTime;

    if (!isDragging || clickDuration < 200) {
      // Short click - trigger modal
      if (onModelClick) {
        onModelClick();
      } else if (onClick) {
        onClick();
      }
    }

    setIsDragging(false);
    event.stopPropagation();
    if (onMouseUp) onMouseUp(event);
  }, [isDragging, clickStartTime, onModelClick, onClick, onMouseUp]);

  const handlePointerMove = useCallback((event) => {
    if (isDragging) {
      event.stopPropagation();
    }
  }, [isDragging]);

  return (
    <div
      className={`three-model-container ${rotationData.isMoving ? 'cloth-physics-active' : 'cloth-physics-idle'}`}
      style={{ width: '100%', height: '400px', ...props.style }}
    >
      <Canvas
        className="three-model-canvas"
        camera={{
          position: [0, 0, 8.5],
          fov: 45,
          near: 0.5,
          far: 1000
        }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
          preserveDrawingBuffer: true,
          failIfMajorPerformanceCaveat: false
        }}
        dpr={Math.min(window.devicePixelRatio, 2)}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.0;
          gl.outputColorSpace = THREE.SRGBColorSpace;
        }}
      >
        {/* Softer, more natural lighting */}
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 5, 5]} intensity={0.8} castShadow />
        <directionalLight position={[-5, -5, 5]} intensity={0.3} />
        <pointLight position={[0, 0, 10]} intensity={0.2} />
        <Environment preset="warehouse" intensity={0.6} />
        <ContactShadows
          position={[0, -3, 0]}
          opacity={0.3}
          scale={15}
          blur={2}
          far={10}
        />

        {/* No physics wrapper needed - cloth physics applied directly to vertices */}
        <Model
          url={src}
          rotationData={rotationData}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerMove={handlePointerMove}
        />

        <EnhancedControls
          controlsRef={controlsRef}
          onRotationData={handleRotationData}
        />
      </Canvas>
    </div>
  );
};

export default ThreeModel; 