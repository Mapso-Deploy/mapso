import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// --- SHADER INJECTION ---
// Inject into MeshStandardMaterial to preserve lighting/textures.

const CLOTH_SHADER = {
    uniforms: {
        uTime: { value: 0 },
        uTwist: { value: 0 },       // Rotational lag angle (radians)
        uSwayX: { value: 0 },       // Pendulum sway in X direction
        uSwayZ: { value: 0 },       // Pendulum sway in Z direction
        uHeightRange: { value: new THREE.Vector2(-1, 1) } // [minY, maxY]
    },

    head: `
    uniform float uTime;
    uniform float uTwist;
    uniform float uSwayX;
    uniform float uSwayZ;
    uniform vec2 uHeightRange;
    
    // Rotation Matrix for rigid Y-axis rotation
    mat2 rotate2d(float _angle){
        return mat2(cos(_angle), -sin(_angle),
                    sin(_angle), cos(_angle));
    }
    
    // Smooth noise for organic movement
    float hash(vec3 p) {
      p = fract(p * 0.3183099 + 0.1);
      p *= 17.0;
      return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
    }
    
    float noise(vec3 x) {
      vec3 i = floor(x);
      vec3 f = fract(x);
      f = f * f * (3.0 - 2.0 * f);
      return mix(mix(mix(hash(i + vec3(0,0,0)), hash(i + vec3(1,0,0)), f.x),
                     mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
                 mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
                     mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
    }
  `,

    main: `
    #include <begin_vertex>
    
    // === 1. HEIGHT NORMALIZATION ===
    // For a hanging shirt: TOP (shoulders/hanger) = maxY, BOTTOM (hem) = minY
    // looseFactor = 0 at top (pinned), looseFactor = 1 at bottom (free)
    
    float heightRange = uHeightRange.y - uHeightRange.x;
    float normalizedHeight = clamp((transformed.y - uHeightRange.x) / heightRange, 0.0, 1.0);
    
    // looseFactor: 0 at top (normalizedHeight=1), 1 at bottom (normalizedHeight=0)
    float looseFactor = 1.0 - normalizedHeight;
    
    // GENTLE power curve: 1.5 means shoulders (top 15%) are mostly pinned
    // but the chest/middle/bottom all have meaningful movement
    looseFactor = pow(looseFactor, 1.5);
    
    // === 2. IDLE BREEZE (visible gentle sway) ===
    // Multiple frequencies for organic feel
    float slowWave = sin(uTime * 0.4 + transformed.y * 2.0) * 0.5 + 0.5;
    float medWave = sin(uTime * 0.7 + transformed.x * 3.0) * 0.5 + 0.5;
    float n = noise(vec3(
      transformed.x * 0.5 + uTime * 0.08,
      transformed.y * 0.3 + uTime * 0.05,
      transformed.z * 0.5 + uTime * 0.06
    )) * 2.0 - 1.0;
    
    // Combine for organic idle movement
    float idleX = (slowWave * 0.6 + n * 0.4) * 0.08 * looseFactor;
    float idleZ = (medWave * 0.5 + n * 0.5) * 0.06 * looseFactor;
    
    transformed.x += idleX;
    transformed.z += idleZ;
    
    // === 3. TWIST (Rotational Inertia around Y axis) ===
    // This is THE KEY effect: when you spin the hanger, the bottom LAGS behind
    // creating a "wring" or twist in the fabric
    
    // Twist amount scales with looseFactor - bottom twists more than middle
    float twistAngle = uTwist * looseFactor;
    
    // Apply rigid rotation around Y axis (center of garment)
    // This rotates X and Z coordinates while preserving distance from axis
    vec2 rotatedXZ = rotate2d(twistAngle) * transformed.xz;
    transformed.x = rotatedXZ.x;
    transformed.z = rotatedXZ.y;
    
    // === 4. PENDULUM SWAY ===
    // The bottom swings in the direction of rotation momentum
    // This adds to the "being swung around" feel
    
    transformed.x += uSwayX * looseFactor;
    transformed.z += uSwayZ * looseFactor;
    
    // === 5. WRING TENSION (vertical lift during twist) ===
    // Twisted fabric tightens and pulls up slightly
    float wringLift = abs(uTwist) * 0.05 * looseFactor;
    transformed.y += wringLift;
  `
};

const PremiumClothPhysics = ({ meshRef, rotationData, debug = false }) => {
    // Physics state
    const state = useRef({
        // Twist (rotational lag)
        twist: 0,
        twistVelocity: 0,

        // Pendulum sway (horizontal displacement)
        swayX: 0,
        swayZ: 0,
        swayVelocityX: 0,
        swayVelocityZ: 0,

        // Track last rotation direction
        lastDirection: 0
    });

    useEffect(() => {
        if (!meshRef?.current) return;

        meshRef.current.traverse((child) => {
            if (child.isMesh && child.material) {
                child.material = child.material.clone();
                child.material.onBeforeCompile = (shader) => {
                    child.userData.shader = shader;

                    shader.uniforms.uTime = { value: 0 };
                    shader.uniforms.uTwist = { value: 0 };
                    shader.uniforms.uSwayX = { value: 0 };
                    shader.uniforms.uSwayZ = { value: 0 };

                    child.geometry.computeBoundingBox();
                    const { min, max } = child.geometry.boundingBox;
                    shader.uniforms.uHeightRange = { value: new THREE.Vector2(min.y, max.y) };

                    shader.vertexShader = CLOTH_SHADER.head + shader.vertexShader;
                    shader.vertexShader = shader.vertexShader.replace(
                        '#include <begin_vertex>',
                        CLOTH_SHADER.main
                    );

                    if (debug) console.log("CLOTH PHYSICS: Shader injected for", child.name);
                };
                child.material.needsUpdate = true;

                // Depth material for shadows
                child.customDepthMaterial = new THREE.MeshDepthMaterial({
                    depthPacking: THREE.RGBADepthPacking
                });
                child.customDepthMaterial.onBeforeCompile = (shader) => {
                    shader.uniforms.uTime = { value: 0 };
                    shader.uniforms.uTwist = { value: 0 };
                    shader.uniforms.uSwayX = { value: 0 };
                    shader.uniforms.uSwayZ = { value: 0 };
                    shader.uniforms.uHeightRange = {
                        value: new THREE.Vector2(
                            child.geometry.boundingBox.min.y,
                            child.geometry.boundingBox.max.y
                        )
                    };

                    shader.vertexShader = CLOTH_SHADER.head + shader.vertexShader;
                    shader.vertexShader = shader.vertexShader.replace(
                        '#include <begin_vertex>',
                        CLOTH_SHADER.main
                    );
                    child.userData.depthShader = shader;
                };
            }
        });
    }, [meshRef, debug]);

    useFrame((clock, delta) => {
        if (!meshRef?.current) return;

        const dt = Math.min(delta, 1 / 30);
        const { speed = 0, direction = 0, isMoving = false } = rotationData;
        const s = state.current;

        // === TWIST PHYSICS ===
        // When user rotates, the cloth bottom lags behind (resists change)

        // Target twist: proportional to rotation speed, opposite direction
        const maxTwist = 0.8; // ~45 degrees max twist
        let targetTwist = 0;

        if (isMoving && Math.abs(speed) > 0.01) {
            // Negative direction = twist lags opposite to spin
            // Increased multiplier for more visible twist
            targetTwist = -direction * Math.min(speed * 0.25, maxTwist);
            s.lastDirection = direction;
        }

        // SLOWER spring physics for heavy, fluid feel
        // Reduced stiffness = slower oscillation
        // Moderate damping = some bounce but settles
        const twistStiffness = 12.0;  // Reduced from 25 for slower movement
        const twistDamping = 2.0;     // Reduced for more swing

        const twistDisplacement = s.twist - targetTwist;
        const twistForce = -twistStiffness * twistDisplacement - twistDamping * s.twistVelocity;

        s.twistVelocity += twistForce * dt;
        s.twist += s.twistVelocity * dt;

        // === SWAY PHYSICS ===
        // Pendulum effect: bottom swings in direction of rotation

        let targetSwayX = 0;
        let targetSwayZ = 0;

        if (isMoving && Math.abs(speed) > 0.05) {
            // Sway in direction of rotation, scaled by speed
            const swayMagnitude = Math.min(speed * 0.12, 0.4);
            targetSwayX = direction * swayMagnitude;
            targetSwayZ = direction * swayMagnitude * 0.3;
        }

        // Even softer pendulum spring for heavy swing
        const swayStiffness = 8.0;   // Very soft
        const swayDamping = 1.5;     // Low damping = more swing

        const swayForceX = -swayStiffness * (s.swayX - targetSwayX) - swayDamping * s.swayVelocityX;
        const swayForceZ = -swayStiffness * (s.swayZ - targetSwayZ) - swayDamping * s.swayVelocityZ;

        s.swayVelocityX += swayForceX * dt;
        s.swayVelocityZ += swayForceZ * dt;
        s.swayX += s.swayVelocityX * dt;
        s.swayZ += s.swayVelocityZ * dt;

        // === UPDATE UNIFORMS ===
        meshRef.current.traverse((child) => {
            const shader = child.userData.shader;
            const depthShader = child.userData.depthShader;

            if (shader) {
                shader.uniforms.uTime.value = clock.clock.elapsedTime;
                shader.uniforms.uTwist.value = s.twist;
                shader.uniforms.uSwayX.value = s.swayX;
                shader.uniforms.uSwayZ.value = s.swayZ;
            }
            if (depthShader) {
                depthShader.uniforms.uTime.value = clock.clock.elapsedTime;
                depthShader.uniforms.uTwist.value = s.twist;
                depthShader.uniforms.uSwayX.value = s.swayX;
                depthShader.uniforms.uSwayZ.value = s.swayZ;
            }
        });
    });

    return null;
};

export default PremiumClothPhysics;
