import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// ============================================================================
// TUNING GUIDE - Adjust these values to experiment:
// ============================================================================
const TUNING = {
    // === IDLE SWAY (when not rotating) ===
    IDLE_AMPLITUDE: 0.25,        // How far the fabric sways at rest (try 0.1 - 0.5)
    IDLE_SPEED: 0.4,             // How fast the idle sway cycles (try 0.2 - 0.8)

    // === TWIST (rotational wring around Y axis) ===
    TWIST_MULTIPLIER: 0.35,       // How much twist per unit of rotation speed (try 0.2 - 0.8)
    TWIST_MAX: 0.8,              // Maximum twist in radians (~45 degrees) (try 0.4 - 1.2)
    TWIST_STIFFNESS: 10.0,       // How quickly twist responds (lower = slower, try 5 - 15)
    TWIST_DAMPING: 2.5,          // How quickly twist settles (try 1 - 4)

    // === WRING EFFECT (inward compression + vertical tension during twist) ===
    WRING_INWARD: 0.25,          // How much fabric pulls INWARD toward center when twisted (try 0.1 - 0.3)
    WRING_VERTICAL: 0.12,        // How much fabric drops DOWN when twisted (gravity on twisted mass) (try 0.05 - 0.2)

    // === SWAY (sideways pendulum swing) ===
    SWAY_MULTIPLIER: 0.12,       // How much sway per unit of rotation speed (try 0.08 - 0.2)
    SWAY_MAX: 0.4,               // Maximum sway distance (try 0.2 - 0.6)
    SWAY_STIFFNESS: 8.0,         // How quickly sway responds (try 4 - 12)
    SWAY_DAMPING: 1.8,           // How quickly sway settles (try 1 - 3)

    // === HEIGHT CURVE ===
    LOOSE_FACTOR_POWER: 1.5,     // How quickly effect increases from top to bottom (try 1.2 - 2.0)
};
// ============================================================================

const CLOTH_SHADER = {
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

    main: (config) => `
    #include <begin_vertex>
    
    // === 1. HEIGHT NORMALIZATION ===
    float heightRange = uHeightRange.y - uHeightRange.x;
    float normalizedHeight = clamp((transformed.y - uHeightRange.x) / heightRange, 0.0, 1.0);
    
    // looseFactor: 0 at top (pinned shoulders), 1 at bottom (free hem)
    float looseFactor = 1.0 - normalizedHeight;
    looseFactor = pow(looseFactor, ${config.LOOSE_FACTOR_POWER.toFixed(1)});
    
    // === 2. IDLE SWAY (gentle movement at rest) ===
    float slowWave = sin(uTime * ${config.IDLE_SPEED.toFixed(2)} + transformed.y * 1.5);
    float medWave = sin(uTime * ${(config.IDLE_SPEED * 1.3).toFixed(2)} + transformed.x * 2.0 + 1.0);
    float n = noise(vec3(
      transformed.x * 0.4 + uTime * 0.05,
      transformed.y * 0.3 + uTime * 0.04,
      transformed.z * 0.4 + uTime * 0.03
    )) * 2.0 - 1.0;
    
    float idleX = (slowWave * 0.7 + n * 0.3) * ${config.IDLE_AMPLITUDE.toFixed(2)} * looseFactor;
    float idleZ = (medWave * 0.6 + n * 0.4) * ${(config.IDLE_AMPLITUDE * 0.7).toFixed(2)} * looseFactor;
    
    transformed.x += idleX;
    transformed.z += idleZ;
    
    // === 3. TWIST WITH WRING PHYSICS ===
    // The twist is a rotation around the Y axis, but with proper wring physics:
    // - Fabric pulls INWARD toward center axis (compression)
    // - Fabric pulls DOWNWARD/scrunches (vertical tension)
    
    float twistAngle = uTwist * looseFactor;
    float absTwist = abs(uTwist);
    
    // Calculate current distance from center axis (Y axis)
    float radiusFromCenter = length(transformed.xz);
    
    // --- 3a. INWARD COMPRESSION (the key to avoiding "wine opener" look) ---
    // When fabric twists, it wraps tighter around the center axis
    // This pulls vertices TOWARD the Y axis proportional to twist amount
    float inwardPull = absTwist * ${config.WRING_INWARD.toFixed(2)} * looseFactor;
    
    // Apply inward compression (reduce radius)
    if (radiusFromCenter > 0.01) {
      vec2 dirToCenter = -normalize(transformed.xz);
      transformed.xz += dirToCenter * inwardPull * radiusFromCenter;
    }
    
    // --- 3b. ROTATIONAL TWIST ---
    // Now apply the rotation around Y axis
    // The rotation happens AFTER inward compression, on the compressed radius
    vec2 rotatedXZ = rotate2d(twistAngle) * transformed.xz;
    transformed.x = rotatedXZ.x;
    transformed.z = rotatedXZ.y;
    
    // --- 3c. VERTICAL DROP (gravity on twisted mass) ---
    // For a HANGING garment, twisting causes the bottom to drop slightly
    // The twisted mass is pulled down by gravity, not up
    float verticalDrop = absTwist * ${config.WRING_VERTICAL.toFixed(2)} * looseFactor;
    transformed.y -= verticalDrop;  // NEGATIVE = downward
    
    // === 4. PENDULUM SWAY (independent from twist) ===
    // This is the sideways swing from rotation momentum
    // It's SEPARATE from twist - just a horizontal displacement
    
    transformed.x += uSwayX * looseFactor;
    transformed.z += uSwayZ * looseFactor;
  `
};

const PremiumClothPhysics = ({ meshRef, rotationData, debug = true }) => {
    const state = useRef({
        twist: 0,
        twistVelocity: 0,
        swayX: 0,
        swayZ: 0,
        swayVelocityX: 0,
        swayVelocityZ: 0,
        lastDirection: 0
    });

    useEffect(() => {
        if (!meshRef?.current) return;

        const shaderMain = CLOTH_SHADER.main(TUNING);

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
                        shaderMain
                    );

                    console.log("CLOTH PHYSICS: Shader injected with WRING physics");
                };
                child.material.needsUpdate = true;

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
                        shaderMain
                    );
                    child.userData.depthShader = shader;
                };
            }
        });
    }, [meshRef]);

    useFrame((clock, delta) => {
        if (!meshRef?.current) return;

        const dt = Math.min(delta, 1 / 30);
        const { speed = 0, direction = 0, isMoving = false } = rotationData;
        const s = state.current;

        // === TWIST PHYSICS ===
        let targetTwist = 0;

        if (isMoving && Math.abs(speed) > 0.01) {
            targetTwist = -direction * Math.min(speed * TUNING.TWIST_MULTIPLIER, TUNING.TWIST_MAX);
            s.lastDirection = direction;
        }

        const twistDisplacement = s.twist - targetTwist;
        const twistForce = -TUNING.TWIST_STIFFNESS * twistDisplacement - TUNING.TWIST_DAMPING * s.twistVelocity;

        s.twistVelocity += twistForce * dt;
        s.twist += s.twistVelocity * dt;

        // === SWAY PHYSICS (independent pendulum) ===
        let targetSwayX = 0;
        let targetSwayZ = 0;

        if (isMoving && Math.abs(speed) > 0.05) {
            const swayMagnitude = Math.min(speed * TUNING.SWAY_MULTIPLIER, TUNING.SWAY_MAX);
            targetSwayX = direction * swayMagnitude;
            targetSwayZ = direction * swayMagnitude * 0.2;
        }

        const swayForceX = -TUNING.SWAY_STIFFNESS * (s.swayX - targetSwayX) - TUNING.SWAY_DAMPING * s.swayVelocityX;
        const swayForceZ = -TUNING.SWAY_STIFFNESS * (s.swayZ - targetSwayZ) - TUNING.SWAY_DAMPING * s.swayVelocityZ;

        s.swayVelocityX += swayForceX * dt;
        s.swayVelocityZ += swayForceZ * dt;
        s.swayX += s.swayVelocityX * dt;
        s.swayZ += s.swayVelocityZ * dt;

        if (debug && (Math.abs(s.twist) > 0.02 || Math.abs(s.swayX) > 0.01)) {
            console.log(`CLOTH: twist=${s.twist.toFixed(3)} sway=(${s.swayX.toFixed(3)}, ${s.swayZ.toFixed(3)})`);
        }

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
