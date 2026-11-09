import React, { useLayoutEffect, useMemo } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { ThreeCanvas } from "@remotion/three";
import { useCurrentFrame, useVideoConfig } from "remotion";

type V3 = [number, number, number];

/** A full-frame ThreeCanvas for one shot. Each shot mounts its own canvas inside a <Sequence>. */
export const Shot: React.FC<{ children: React.ReactNode; bg?: string; w?: number; h?: number }> = ({
  children,
  bg = "#070b1a",
  w,
  h,
}) => {
  const cfg = useVideoConfig();
  const width = w ?? cfg.width;
  const height = h ?? cfg.height;
  return (
    <ThreeCanvas width={width} height={height} camera={{ fov: 40, position: [0, 2, 8], near: 0.05, far: 400 }}>
      <color attach="background" args={[bg]} />
      {children}
    </ThreeCanvas>
  );
};

/** Places the default camera every frame (all motion comes from useCurrentFrame upstream). */
export const Cam: React.FC<{ pos: V3; look: V3; fov?: number; roll?: number }> = ({ pos, look, fov = 40, roll = 0 }) => {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  useLayoutEffect(() => {
    camera.position.set(...pos);
    camera.up.set(Math.sin(roll), Math.cos(roll), 0);
    camera.lookAt(...look);
    camera.fov = fov;
    camera.updateProjectionMatrix();
  });
  return null;
};

/** Seeded pseudo-random camera shake, amplitude in world units. */
export const shake = (frame: number, amp: number, seed = 1): V3 => {
  const n = (k: number) => Math.sin(frame * 12.9898 * k + seed * 78.233) * 43758.5453 % 1;
  return [n(1) * amp, n(2) * amp, n(3) * amp * 0.5];
};

/** Makes a CanvasTexture and redraws it whenever `key` changes (pass frame-derived state as key). */
export const useCanvasTexture = (
  w: number,
  h: number,
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
  key: unknown,
) => {
  const { canvas, tex } = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    return { canvas, tex };
  }, [w, h]);
  useLayoutEffect(() => {
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, w, h);
    draw(ctx, w, h);
    tex.needsUpdate = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, canvas, tex]);
  return tex;
};

/** Vertical gradient used as a sky / backdrop. */
export const useGradient = (stops: [number, string][], key: unknown = 0) =>
  useCanvasTexture(
    4,
    256,
    (ctx, w, h) => {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      stops.forEach(([o, c]) => g.addColorStop(o, c));
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    },
    key,
  );

export const SkyBackground: React.FC<{ stops: [number, string][]; k?: unknown }> = ({ stops, k }) => {
  const tex = useGradient(stops, k ?? JSON.stringify(stops));
  const scene = useThree((s) => s.scene);
  useLayoutEffect(() => {
    scene.background = tex;
  }, [scene, tex]);
  return null;
};

export type Pose = "stand" | "lie" | "sit" | "armsUp" | "crouch";

export type PersonLook = {
  skin?: string;
  hair?: string | null;
  shirt?: string;
  pants?: string;
  shoes?: string;
  /** Dark suit with a coloured tie (Ilya). */
  tie?: string;
  /** Older: hunched + glasses. */
  old?: boolean;
  coat?: string;
  /** Long hair falling to the shoulders (Mara, your daughter). */
  longHair?: string;
  /** A dress/skirt covering the legs. */
  dress?: string;
  /** Simple eyes — only for characters that are not "you" (the bible keeps you faceless). */
  eyes?: boolean;
};

/**
 * Low-poly stylised person (faceless, like a mannequin). The series bible keeps "you" in
 * over-the-shoulder / back views, so no face consistency is needed between shots.
 * Origin is at the feet.
 */
export const Person: React.FC<
  PersonLook & {
    position?: V3;
    rotation?: V3;
    pose?: Pose;
    /** 0..1 blend for arm raise etc. */
    amount?: number;
    headTurn?: number;
    headTilt?: number;
    scale?: number;
    torn?: boolean;
  }
> = ({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  pose = "stand",
  amount = 1,
  headTurn = 0,
  headTilt = 0,
  scale = 1,
  skin = "#d9a98a",
  hair = "#1c1512",
  shirt = "#2d3b55",
  pants = "#1b2131",
  shoes = "#0d0f14",
  tie,
  old,
  coat,
  torn,
  longHair,
  dress,
  eyes,
}) => {
  const sit = pose === "sit";
  const crouch = pose === "crouch" ? amount : 0;
  const armsUp = pose === "armsUp" ? amount : 0;
  const hunch = old ? 0.22 : 0;
  const legBend = sit ? Math.PI / 2 : crouch * 1.2;
  const hipY = sit ? 0.5 : 0.95 - crouch * 0.35;
  const armA = -armsUp * 2.6; // shoulder rotation around z
  const mat = (c: string, r = 0.75) => <meshStandardMaterial color={c} roughness={r} flatShading />;
  const body = (
    <group position={[0, hipY, 0]}>
      {/* legs */}
      {[-0.11, 0.11].map((x) => (
        <group key={x} position={[x, 0, 0]} rotation={[sit ? -legBend : legBend * 0.5, 0, 0]}>
          <mesh position={[0, -0.24, 0]}>
            <capsuleGeometry args={[0.085, 0.36, 4, 8]} />
            {mat(pants)}
          </mesh>
          <group position={[0, -0.47, 0]} rotation={[sit ? legBend : -legBend, 0, 0]}>
            <mesh position={[0, -0.22, 0]}>
              <capsuleGeometry args={[0.075, 0.34, 4, 8]} />
              {mat(pants)}
            </mesh>
            <mesh position={[0, -0.44, 0.06]}>
              <boxGeometry args={[0.13, 0.08, 0.26]} />
              {mat(shoes, 0.5)}
            </mesh>
          </group>
        </group>
      ))}
      {dress ? (
        <mesh position={[0, -0.32, 0]}>
          <cylinderGeometry args={[0.2, sit ? 0.3 : 0.36, 0.72, 14]} />
          {mat(dress)}
        </mesh>
      ) : null}
      {/* torso */}
      <group rotation={[hunch + crouch * 0.4, 0, 0]}>
        <mesh position={[0, 0.33, 0]}>
          <capsuleGeometry args={[0.2, 0.36, 4, 10]} />
          {mat(coat ?? shirt)}
        </mesh>
        {tie ? (
          <>
            <mesh position={[0, 0.5, 0.17]}>
              <boxGeometry args={[0.14, 0.12, 0.05]} />
              {mat("#e9e9ee")}
            </mesh>
            <mesh position={[0, 0.36, 0.2]} rotation={[0.08, 0, 0]}>
              <boxGeometry args={[0.06, 0.3, 0.02]} />
              <meshStandardMaterial color={tie} emissive={tie} emissiveIntensity={0.25} />
            </mesh>
          </>
        ) : null}
        {torn
          ? [
              [0.08, 0.38, 0.19],
              [-0.1, 0.24, 0.18],
              [0.02, 0.5, 0.17],
            ].map((p, i) => (
              <mesh key={i} position={p as V3} rotation={[0, 0, i]}>
                <boxGeometry args={[0.09, 0.05, 0.02]} />
                {mat(skin)}
              </mesh>
            ))
          : null}
        {/* arms */}
        {[-1, 1].map((side) => (
          <group
            key={side}
            position={[side * 0.27, 0.55, 0]}
            rotation={[sit ? -0.9 : 0, 0, side * (0.08 - armA * 0.5) * (armsUp ? 1 : 1)]}
          >
            <group rotation={[0, 0, side * -armA * 0.5]}>
              <mesh position={[0, -0.27, 0]}>
                <capsuleGeometry args={[0.07, 0.42, 4, 8]} />
                {mat(coat ?? shirt)}
              </mesh>
              <mesh position={[0, -0.56, 0]}>
                <sphereGeometry args={[0.07, 8, 8]} />
                {mat(skin, 0.6)}
              </mesh>
            </group>
          </group>
        ))}
        {/* neck + head */}
        <group position={[0, 0.68, 0]} rotation={[headTilt, headTurn, 0]}>
          <mesh position={[0, 0.02, 0]}>
            <cylinderGeometry args={[0.06, 0.07, 0.1, 8]} />
            {mat(skin, 0.6)}
          </mesh>
          <mesh position={[0, 0.2, 0]}>
            <sphereGeometry args={[0.15, 16, 14]} />
            {mat(skin, 0.6)}
          </mesh>
          {hair ? (
            <mesh position={[0, 0.25, -0.015]} rotation={[-0.25, 0, 0]}>
              <sphereGeometry args={[0.158, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
              {mat(hair, 0.9)}
            </mesh>
          ) : null}
          {longHair ? (
            <mesh position={[0, 0.1, -0.06]}>
              <boxGeometry args={[0.3, 0.42, 0.14]} />
              {mat(longHair, 0.9)}
            </mesh>
          ) : null}
          {eyes
            ? [-0.055, 0.055].map((x) => (
                <mesh key={`e${x}`} position={[x, 0.22, 0.135]}>
                  <sphereGeometry args={[0.022, 8, 8]} />
                  <meshStandardMaterial color="#141018" roughness={0.3} />
                </mesh>
              ))
            : null}
          {old
            ? [-0.06, 0.06].map((x) => (
                <mesh key={x} position={[x, 0.21, 0.14]}>
                  <torusGeometry args={[0.04, 0.008, 6, 14]} />
                  <meshStandardMaterial color="#c8c8c8" metalness={0.6} roughness={0.3} />
                </mesh>
              ))
            : null}
        </group>
      </group>
    </group>
  );
  if (pose === "lie") {
    // Lying on the back, feet toward +z.
    return (
      <group position={position} rotation={rotation} scale={scale}>
        <group position={[0, 0.12, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <group position={[0, -0.9, 0]}>{body}</group>
        </group>
      </group>
    );
  }
  return (
    <group position={position} rotation={rotation} scale={scale}>
      {body}
    </group>
  );
};

/** Simple city block with lit windows (canvas texture). */
export const Building: React.FC<{ position: V3; size: V3; seed: number; litColor?: string; base?: string }> = ({
  position,
  size,
  seed,
  litColor = "#ffcf7a",
  base = "#141a2c",
}) => {
  const tex = useCanvasTexture(
    64,
    128,
    (ctx, w, h) => {
      ctx.fillStyle = base;
      ctx.fillRect(0, 0, w, h);
      const cols = 6;
      const rows = 14;
      for (let r = 0; r < rows; r++)
        for (let c = 0; c < cols; c++) {
          const v = Math.abs(Math.sin((r * 31 + c * 17 + seed * 101) * 12.9898) * 43758.5453) % 1;
          ctx.fillStyle = v > 0.62 ? litColor : "#0b0f1c";
          ctx.fillRect(4 + c * 10, 4 + r * 9, 6, 5);
        }
    },
    seed,
  );
  return (
    <mesh position={[position[0], position[1] + size[1] / 2, position[2]]}>
      <boxGeometry args={size} />
      <meshStandardMaterial
        color="#ffffff"
        map={tex}
        emissiveMap={tex}
        emissive="#ffffff"
        emissiveIntensity={0.55}
        roughness={0.9}
      />
    </mesh>
  );
};

/** Additive soft glow sprite (headlights, lamps). */
export const Glow: React.FC<{ position: V3; color: string; size: number; opacity?: number }> = ({
  position,
  color,
  size,
  opacity = 1,
}) => {
  const tex = useCanvasTexture(
    128,
    128,
    (ctx, w) => {
      const g = ctx.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
      g.addColorStop(0, "rgba(255,255,255,1)");
      g.addColorStop(0.2, "rgba(255,255,255,0.6)");
      g.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, w);
    },
    0,
  );
  return (
    <sprite position={position} scale={[size, size, size]}>
      <spriteMaterial
        map={tex}
        color={color}
        transparent
        opacity={opacity}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        toneMapped={false}
      />
    </sprite>
  );
};

/* ---------------------------------------------------------------- props */

/** Falling rain streaks in a box around the camera target. */
export const Rain: React.FC<{ t: number; count?: number; area?: number; color?: string }> = ({
  t,
  count = 260,
  area = 14,
  color = "#9fb3d1",
}) => (
  <group>
    {Array.from({ length: count }).map((_, i) => {
      const x = (rnd(i * 3.1) - 0.5) * area;
      const z = (rnd(i * 7.7) - 0.5) * area;
      const y = 8 - ((t * 14 + rnd(i * 1.3) * 8) % 8);
      return (
        <mesh key={i} position={[x, y, z]}>
          <boxGeometry args={[0.012, 0.45, 0.012]} />
          <meshBasicMaterial color={color} transparent opacity={0.45} />
        </mesh>
      );
    })}
  </group>
);

/** Slow drifting snow flakes. */
export const Snow: React.FC<{ t: number; count?: number; area?: number; wind?: number }> = ({
  t,
  count = 300,
  area = 16,
  wind = 0.6,
}) => (
  <group>
    {Array.from({ length: count }).map((_, i) => {
      const y = 7 - ((t * (0.8 + rnd(i) * 0.6) + rnd(i * 2.2) * 7) % 7);
      const x = ((rnd(i * 5.3) - 0.5) * area + t * wind + Math.sin(t + i) * 0.2) % (area / 2);
      const z = (rnd(i * 9.1) - 0.5) * area;
      return (
        <mesh key={i} position={[x, y, z]}>
          <sphereGeometry args={[0.025 + rnd(i * 4.4) * 0.02, 5, 4]} />
          <meshBasicMaterial color="#f2f6ff" />
        </mesh>
      );
    })}
  </group>
);

/** A candle; `lit` 0..1 fades the flame. */
export const Candle: React.FC<{ position: [number, number, number]; lit: number; h?: number; flick?: number }> = ({
  position,
  lit,
  h = 0.3,
  flick = 0,
}) => (
  <group position={position}>
    <mesh position={[0, h / 2, 0]}>
      <cylinderGeometry args={[0.045, 0.05, h, 12]} />
      <meshStandardMaterial color="#efe6d2" roughness={0.6} />
    </mesh>
    {lit > 0.01 ? (
      <>
        <mesh position={[0, h + 0.05, 0]} scale={[1, 1 + Math.sin(flick * 13) * 0.15, 1]}>
          <coneGeometry args={[0.025, 0.09, 8]} />
          <meshBasicMaterial color="#ffd27a" transparent opacity={lit} toneMapped={false} />
        </mesh>
        <Glow position={[0, h + 0.06, 0]} color="#ffb35a" size={0.35 * lit} opacity={lit} />
      </>
    ) : (
      <mesh position={[0, h + 0.04, 0]}>
        <cylinderGeometry args={[0.004, 0.004, 0.05, 4]} />
        <meshBasicMaterial color="#222" />
      </mesh>
    )}
  </group>
);

/** Open umbrella held overhead. */
export const Umbrella: React.FC<{ position: [number, number, number]; color: string; tilt?: number }> = ({
  position,
  color,
  tilt = 0,
}) => (
  <group position={position} rotation={[tilt, 0, tilt * 0.5]}>
    <mesh position={[0, 0.45, 0]}>
      <coneGeometry args={[0.62, 0.32, 10, 1, true]} />
      <meshStandardMaterial color={color} side={THREE.DoubleSide} roughness={0.5} />
    </mesh>
    <mesh position={[0, 0, 0]}>
      <cylinderGeometry args={[0.012, 0.012, 0.9, 6]} />
      <meshStandardMaterial color="#222" />
    </mesh>
  </group>
);

/** Silver sedan (Ilya's car). */
export const SilverCar: React.FC<{ position: [number, number, number]; rotation?: number; lights?: number }> = ({
  position,
  rotation = 0,
  lights = 0,
}) => (
  <group position={position} rotation={[0, rotation, 0]}>
    <mesh position={[0, 0.45, 0]}>
      <boxGeometry args={[1.8, 0.5, 4.2]} />
      <meshStandardMaterial color="#d3d8e0" metalness={0.35} roughness={0.3} />
    </mesh>
    <mesh position={[0, 0.88, -0.2]}>
      <boxGeometry args={[1.6, 0.42, 2.2]} />
      <meshStandardMaterial color="#0d1118" metalness={0.6} roughness={0.15} />
    </mesh>
    {[-1.4, 1.4].map((z) =>
      [-0.85, 0.85].map((x) => (
        <mesh key={`${x}${z}`} position={[x, 0.3, z]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.32, 0.32, 0.22, 14]} />
          <meshStandardMaterial color="#0a0a0a" />
        </mesh>
      )),
    )}
    {lights > 0
      ? [-0.6, 0.6].map((x) => <Glow key={x} position={[x, 0.5, 2.15]} color="#fff2cc" size={0.9 * lights} />)
      : null}
    {[-0.6, 0.6].map((x) => (
      <mesh key={`r${x}`} position={[x, 0.55, -2.11]}>
        <planeGeometry args={[0.35, 0.1]} />
        <meshBasicMaterial color="#ff2a3a" toneMapped={false} side={THREE.DoubleSide} />
      </mesh>
    ))}
  </group>
);

/** Deterministic hash-based random in [0,1). */
export const rnd = (n: number) => Math.abs(Math.sin(n * 12.9898 + 78.233) * 43758.5453) % 1;

/** Absolute episode time (s) inside a shot mounted at `from` seconds. */
export const useT = (from: number) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return { t: from + frame / fps, local: frame / fps, frame };
};
