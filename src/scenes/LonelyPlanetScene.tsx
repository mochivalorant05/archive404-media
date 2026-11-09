import React, { useLayoutEffect, useMemo } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { interpolate, random, useCurrentFrame, useVideoConfig, Easing } from "remotion";

/**
 * Example scene: a lone figure on a tiny planet under a field of stars.
 *
 * Rules for Remotion + Three.js:
 *  - Drive ALL motion from `useCurrentFrame()` (not useFrame / Date / Math.random),
 *    so each frame renders identically in preview and in the final render.
 *  - Use Remotion's seeded `random(seed)` for any randomness.
 */
export const LonelyPlanetScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const t = frame / fps; // seconds

  // Camera: slow push-in + orbit over the whole video.
  const progress = frame / Math.max(1, durationInFrames - 1);
  const camDist = interpolate(progress, [0, 1], [14, 7.5], { easing: Easing.inOut(Easing.cubic) });
  const camAngle = interpolate(progress, [0, 1], [-0.6, 0.6]);
  const camHeight = interpolate(progress, [0, 1], [5, 2.2]);

  return (
    <>
      <color attach="background" args={["#05060a"]} />
      <fog attach="fog" args={["#05060a", 18, 60]} />

      <CameraRig
        position={[Math.sin(camAngle) * camDist, camHeight, Math.cos(camAngle) * camDist]}
        target={[0, 2.2, 0]}
      />

      <ambientLight intensity={0.35} />
      <hemisphereLight args={["#6f86b8", "#120d08", 0.6]} />
      <directionalLight position={[-6, 8, 8]} intensity={2.5} color="#9fc4ff" />
      <pointLight position={[0, 4.5, 0]} intensity={14 + Math.sin(t * 2) * 2} distance={8} color="#ffb070" />

      <Stars count={1500} />
      <Planet rotation={t * 0.08} />
      <Figure bob={Math.sin(t * 1.5) * 0.03} />
      <Moon angle={t * 0.25} />
    </>
  );
};

const CameraRig: React.FC<{
  position: [number, number, number];
  target: [number, number, number];
}> = ({ position, target }) => {
  // Move the canvas' default camera synchronously on every frame render.
  const camera = useThree((state) => state.camera);
  useLayoutEffect(() => {
    camera.position.set(...position);
    camera.lookAt(...target);
    camera.updateProjectionMatrix();
  }, [camera, position, target]);
  return null;
};

const Planet: React.FC<{ rotation: number }> = ({ rotation }) => (
  <group rotation={[0, rotation, 0]}>
    <mesh position={[0, -2, 0]}>
      <icosahedronGeometry args={[3.5, 3]} />
      <meshStandardMaterial color="#2b3242" flatShading roughness={0.95} />
    </mesh>
    {/* A few rocks */}
    {Array.from({ length: 14 }).map((_, i) => {
      const a = random(`rock-a-${i}`) * Math.PI * 2;
      const b = random(`rock-b-${i}`) * 1.1;
      const dir = new THREE.Vector3(Math.sin(b) * Math.cos(a), Math.cos(b), Math.sin(b) * Math.sin(a));
      const pos = dir.clone().multiplyScalar(3.45).add(new THREE.Vector3(0, -2, 0));
      const s = 0.12 + random(`rock-s-${i}`) * 0.25;
      return (
        <mesh key={i} position={pos} scale={s}>
          <dodecahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color="#3d4558" flatShading />
        </mesh>
      );
    })}
  </group>
);

const Figure: React.FC<{ bob: number }> = ({ bob }) => (
  <group position={[0, 1.45 + bob, 0]}>
    {/* body */}
    <mesh position={[0, 0.45, 0]}>
      <capsuleGeometry args={[0.18, 0.55, 6, 12]} />
      <meshStandardMaterial color="#c9c9d1" roughness={0.6} />
    </mesh>
    {/* head */}
    <mesh position={[0, 1.05, 0]}>
      <sphereGeometry args={[0.17, 24, 24]} />
      <meshStandardMaterial color="#e2e2ea" roughness={0.5} />
    </mesh>
    {/* lantern glow */}
    <mesh position={[0.32, 0.35, 0.05]}>
      <sphereGeometry args={[0.07, 16, 16]} />
      <meshBasicMaterial color="#ffcf8a" />
    </mesh>
  </group>
);

const Moon: React.FC<{ angle: number }> = ({ angle }) => (
  <mesh position={[Math.cos(angle) * 9, 7 + Math.sin(angle) * 1.5, Math.sin(angle) * 9 - 6]}>
    <sphereGeometry args={[0.9, 32, 32]} />
    <meshStandardMaterial color="#d8dde8" emissive="#3a4766" emissiveIntensity={0.6} />
  </mesh>
);

const Stars: React.FC<{ count: number }> = ({ count }) => {
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      // Points on a large sphere shell, seeded so they never change between frames.
      const u = random(`star-u-${i}`);
      const v = random(`star-v-${i}`);
      const theta = u * Math.PI * 2;
      const phi = Math.acos(2 * v - 1);
      const r = 40 + random(`star-r-${i}`) * 20;
      arr[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = r * Math.cos(phi);
      arr[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    return arr;
  }, [count]);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.18} color="#ffffff" sizeAttenuation fog={false} />
    </points>
  );
};
