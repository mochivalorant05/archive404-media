import React from "react";
import * as THREE from "three";
import { AbsoluteFill, Easing, interpolate } from "remotion";
import { C } from "../hud";
import { Episode, type EpisodeConfig } from "../Episode";
import { Building, Cam, Glow, Person, Shot, SkyBackground, rnd, useCanvasTexture, useT } from "../three-kit";

/* FOREVER 25 · Episode 5 "Year Five Billion" — the finale. Script & timings from the series doc.
   The decision is never shown: the ending is an open vote. */

type V3 = [number, number, number];
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const YOU = { shirt: "#3a4a6b", pants: "#1d2333", hair: "#1c1512" };
const GREEN = "#39ff88";

const T = {
  space: [0, 7.4],
  ruins: [7.4, 18.6],
  mountain: [18.6, 24.4],
  hand: [24.4, 32.2],
  split: [32.2, 41.2],
  melt: [41.2, 51.0],
  finger: [51.0, 56.3],
} as const;
const END = 56.3;
const DURATION = 64;
const MEMORIES = [44.6, 45.2, 45.8];

/* ----------------------------------------------------------------- space */

const useEarthTexture = () =>
  useCanvasTexture(
    1024,
    512,
    (ctx, w, h) => {
      ctx.fillStyle = "#2a2f3a"; // boiled-off oceans
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 60; i++) {
        ctx.fillStyle = i % 3 ? "#7a4a2a" : "#a0582c";
        ctx.beginPath();
        ctx.ellipse(rnd(i) * w, rnd(i * 3) * h, 30 + rnd(i * 5) * 90, 20 + rnd(i * 7) * 60, rnd(i * 9) * 3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = "rgba(255,90,30,0.25)";
      ctx.fillRect(0, 0, w, h);
    },
    "earth",
  );

const Stars: React.FC<{ n?: number; r?: number }> = ({ n = 500, r = 80 }) => {
  const positions = React.useMemo(() => {
    const a = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const th = rnd(i) * Math.PI * 2;
      const ph = Math.acos(2 * rnd(i * 3) - 1);
      a[i * 3] = r * Math.sin(ph) * Math.cos(th);
      a[i * 3 + 1] = r * Math.cos(ph);
      a[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th);
    }
    return a;
  }, [n, r]);
  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.35} color="#ffffff" sizeAttenuation fog={false} />
    </points>
  );
};

const SpaceShot: React.FC<{ from: number }> = ({ from }) => {
  const { t, local } = useT(from);
  const earth = useEarthTexture();
  const z = interpolate(local, [0, 7.4], [9, 5.6], { easing: Easing.inOut(Easing.sin) });
  const sunScale = 1 + local * 0.025;
  return (
    <Shot bg="#000">
      <ambientLight intensity={0.05} />
      <pointLight position={[0, 0, -30]} intensity={2000} color="#ff5a2a" distance={80} />
      <pointLight position={[5, 2, 6]} intensity={30} color="#ffb08a" distance={20} />
      <Cam pos={[2.6, 0.7, z]} look={[-0.4, 0.2, -10]} fov={42} />
      <Stars />
      {/* the swollen red sun */}
      <mesh position={[0.5, 0.5, -34]} scale={sunScale}>
        <sphereGeometry args={[14, 48, 32]} />
        <meshBasicMaterial color="#ff4a1a" toneMapped={false} />
      </mesh>
      <Glow position={[0.5, 0.5, -30]} color="#ff7a3a" size={60 * sunScale} opacity={0.7} />
      {/* earth, scorched */}
      <mesh rotation={[0.2, t * 0.15, 0]}>
        <sphereGeometry args={[1.6, 48, 32]} />
        <meshStandardMaterial map={earth} roughness={0.9} emissive="#ff3a10" emissiveIntensity={0.08} />
      </mesh>
      {/* the burning terminator glow */}
      <mesh>
        <sphereGeometry args={[1.66, 48, 32]} />
        <meshBasicMaterial color="#ff6a2a" transparent opacity={0.12} side={THREE.BackSide} />
      </mesh>
    </Shot>
  );
};

/* ------------------------------------------------------------ ruins */

const RuinsShot: React.FC<{ from: number }> = ({ from }) => {
  const { t, local } = useT(from);
  const walk = local * 0.55;
  return (
    <Shot bg="#3a1408">
      <SkyBackground stops={[[0, "#5a0e0a"], [0.5, "#d0502a"], [1, "#f0a050"]]} k="ruins" />
      <fog attach="fog" args={["#c0602a", 10, 45]} />
      <ambientLight intensity={0.55} color="#ffc08a" />
      <directionalLight position={[0, 4, -10]} intensity={2.4} color="#ff6a3a" />
      <Glow position={[0, 6, -40]} color="#ff5a2a" size={40} opacity={0.7} />
      <Cam pos={[0.9, 1.6, 4.0 - walk]} look={[0, 1.3, -6 - walk]} fov={44} />
      {/* dunes */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[80, 80, 40, 40]} />
        <meshStandardMaterial color="#c98a52" roughness={1} />
      </mesh>
      {Array.from({ length: 12 }).map((_, i) => (
        <mesh key={`d${i}`} position={[(rnd(i) - 0.5) * 30, -0.8, -4 - rnd(i * 2) * 30]} scale={[4 + rnd(i * 3) * 4, 1.6, 3]}>
          <sphereGeometry args={[1, 16, 10]} />
          <meshStandardMaterial color="#d49660" roughness={1} />
        </mesh>
      ))}
      {/* half-buried, tilted towers */}
      {Array.from({ length: 8 }).map((_, i) => (
        <group key={i} position={[(i % 2 ? 1 : -1) * (4 + rnd(i) * 6), -2, -8 - i * 4]} rotation={[0, 0, (rnd(i * 4) - 0.5) * 0.5]}>
          <Building position={[0, 0, 0]} size={[3, 8 + rnd(i * 5) * 10, 3]} seed={i + 60} base="#4a3a32" litColor="#4a3a32" />
        </group>
      ))}
      {/* broken statue: giant head in the sand */}
      <group position={[-2.6, 0.4, -6]} rotation={[0.3, 0.6, 0.4]}>
        <mesh>
          <sphereGeometry args={[1.1, 12, 10]} />
          <meshStandardMaterial color="#b9b2a6" flatShading />
        </mesh>
        <mesh position={[0, 0.2, 0.95]}>
          <boxGeometry args={[0.3, 0.5, 0.3]} />
          <meshStandardMaterial color="#b9b2a6" flatShading />
        </mesh>
      </group>
      {/* the lone chair */}
      <group position={[1.4, 0, -9]} rotation={[0, -0.4, 0]}>
        <mesh position={[0, 0.45, 0]}>
          <boxGeometry args={[0.5, 0.06, 0.5]} />
          <meshStandardMaterial color="#4a3020" />
        </mesh>
        <mesh position={[0, 0.85, -0.22]}>
          <boxGeometry args={[0.5, 0.8, 0.06]} />
          <meshStandardMaterial color="#4a3020" />
        </mesh>
        {[
          [-0.22, -0.22],
          [0.22, -0.22],
          [-0.22, 0.22],
          [0.22, 0.22],
        ].map(([x, z]) => (
          <mesh key={`${x}${z}`} position={[x, 0.22, z]}>
            <boxGeometry args={[0.05, 0.45, 0.05]} />
            <meshStandardMaterial color="#4a3020" />
          </mesh>
        ))}
      </group>
      <Person {...YOU} coat="#2a2f3a" position={[0, 0, 1.2 - walk]} rotation={[0, Math.PI, 0]} />
      {/* blowing sand */}
      {Array.from({ length: 60 }).map((_, i) => (
        <mesh key={`s${i}`} position={[((rnd(i) * 20 + t * 3) % 20) - 10, rnd(i * 3) * 2, 1 - walk - rnd(i * 5) * 8]}>
          <sphereGeometry args={[0.02, 4, 3]} />
          <meshBasicMaterial color="#f0c08a" />
        </mesh>
      ))}
    </Shot>
  );
};

/* -------------------------------------------------------- the mountain */

const MountainScene: React.FC<{ t: number; melt?: number; crack?: number }> = ({ t, melt = 0, crack = 0 }) => (
  <>
    <SkyBackground stops={[[0, "#2a0306"], [0.55, "#a01810"], [1, "#ff6a2a"]]} k="mtn" />
    <fog attach="fog" args={["#7a1a10", 14, 60]} />
    <ambientLight intensity={0.4} color="#ff9a6a" />
    <directionalLight position={[0, 3, -12]} intensity={3} color="#ff4a1a" />
    <Glow position={[0, 3, -55]} color="#ff4a1a" size={70} opacity={0.85} />
    {/* glass ground */}
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -6, 0]}>
      <planeGeometry args={[200, 200]} />
      <meshStandardMaterial color="#1a0a0a" metalness={0.9} roughness={0.08} />
    </mesh>
    {/* the last mountain, melting */}
    <group position={[0, -6, 0]} scale={[1 + melt * 0.3, 1 - melt * 0.45, 1 + melt * 0.3]}>
      <mesh position={[0, 3, 0]}>
        <coneGeometry args={[6, 6, 9]} />
        <meshStandardMaterial color="#2a1a18" flatShading emissive="#ff4a10" emissiveIntensity={melt * 0.9} />
      </mesh>
    </group>
    {/* lava rivulets */}
    {melt > 0
      ? Array.from({ length: 9 }).map((_, i) => {
          const a = (i / 9) * Math.PI * 2;
          return (
            <mesh key={i} position={[Math.sin(a) * 2.6, -3.2 - melt, Math.cos(a) * 2.6]} rotation={[Math.cos(a) * 0.7, 0, -Math.sin(a) * 0.7]}>
              <boxGeometry args={[0.18, 5 * melt, 0.05]} />
              <meshBasicMaterial color="#ffa040" toneMapped={false} />
            </mesh>
          );
        })
      : null}
    {/* the sky cracking open */}
    {crack > 0
      ? Array.from({ length: 10 }).map((_, i) => {
          const seg = i / 10;
          if (seg > crack) return null;
          const x = -14 + i * 3;
          const y = 14 + Math.sin(i * 2.3) * 2.5;
          const y2 = 14 + Math.sin((i + 1) * 2.3) * 2.5;
          const len = Math.hypot(3, y2 - y);
          return (
            <mesh key={i} position={[x + 1.5, (y + y2) / 2, -40]} rotation={[0, 0, Math.atan2(y2 - y, 3)]}>
              <planeGeometry args={[len, 0.35]} />
              <meshBasicMaterial color="#e8fbff" toneMapped={false} />
            </mesh>
          );
        })
      : null}
    {crack > 0 ? <Glow position={[0, 14, -39]} color="#bfefff" size={18 * crack} opacity={0.5} /> : null}
    {/* embers */}
    {Array.from({ length: 40 }).map((_, i) => (
      <mesh key={`e${i}`} position={[(rnd(i) - 0.5) * 12, ((rnd(i * 3) * 8 + t * 0.6) % 8) - 2, (rnd(i * 5) - 0.5) * 8]}>
        <sphereGeometry args={[0.03, 4, 3]} />
        <meshBasicMaterial color="#ffb060" toneMapped={false} />
      </mesh>
    ))}
  </>
);

const MountainShot: React.FC<{ from: number }> = ({ from }) => {
  const { t, local } = useT(from);
  const a = interpolate(local, [0, 5.8], [0.9, -0.2]);
  const r = interpolate(local, [0, 5.8], [9, 4.2], { easing: Easing.inOut(Easing.cubic) });
  const h = interpolate(local, [0, 5.8], [3.5, 1.6]);
  return (
    <Shot bg="#2a0306">
      <MountainScene t={t} />
      <Cam pos={[Math.sin(a) * r, h, Math.cos(a) * r]} look={[0, 0.9, 0]} fov={44} />
      <Person {...YOU} coat="#2a2f3a" position={[0, 0, 0]} rotation={[0, Math.PI + 0.2, 0]} />
    </Shot>
  );
};

/* -------------------------------------------------------- the Brake, green */

const BrakeInHand: React.FC<{ green: number; blinkOn: boolean; open?: number }> = ({ green, blinkOn, open = 0.15 }) => {
  const lit = green > 0 && blinkOn;
  const col = green > 0 ? GREEN : "#22d3ee";
  return (
    <group>
      <mesh position={[0, 0.07, 0]}>
        <boxGeometry args={[0.36, 0.14, 0.24]} />
        <meshStandardMaterial color="#9aa0aa" metalness={0.5} roughness={0.35} />
      </mesh>
      <group position={[0, 0.145, -0.12]} rotation={[-open * 1.6, 0, 0]}>
        <mesh position={[0, 0.015, 0.12]}>
          <boxGeometry args={[0.37, 0.03, 0.25]} />
          <meshStandardMaterial color="#a8aeb8" metalness={0.5} roughness={0.3} />
        </mesh>
      </group>
      {/* the button */}
      <mesh position={[0, 0.16, 0.02]}>
        <cylinderGeometry args={[0.035, 0.035, 0.02, 20]} />
        <meshBasicMaterial color={lit ? col : "#1e2a24"} toneMapped={false} />
      </mesh>
      {lit ? <Glow position={[0, 0.2, 0.02]} color={col} size={0.5} /> : null}
      <mesh position={[0, 0.14, 0.121]}>
        <boxGeometry args={[0.37, 0.008, 0.005]} />
        <meshBasicMaterial color={lit ? col : "#2a3a3a"} toneMapped={false} />
      </mesh>
    </group>
  );
};

const HandShot: React.FC<{ from: number }> = ({ from }) => {
  const { t, local } = useT(from);
  const green = t >= 27.32 ? 1 : 0;
  const blinkOn = Math.floor((t - 27.32) * 2.5) % 2 === 0;
  const d = interpolate(local, [0, 7.8], [1.5, 0.8], { easing: Easing.out(Easing.quad) });
  return (
    <Shot bg="#2a0306">
      <MountainScene t={t} />
      <pointLight position={[0, 1.5, 0.4]} intensity={green && blinkOn ? 6 : 1} color={GREEN} distance={2} />
      <Cam pos={[0.25 * d, 1.2 + d * 0.35, 0.3 + d]} look={[0, 1.15, 0]} fov={36} />
      <group position={[0, 1.05, 0]} rotation={[0.2, 0.2, 0]}>
        {/* palm under the box */}
        <mesh position={[0, -0.04, 0]} scale={[0.16, 0.05, 0.2]}>
          <sphereGeometry args={[1, 14, 10]} />
          <meshStandardMaterial color="#d9a98a" />
        </mesh>
        <mesh position={[0, -0.06, 0.3]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.07, 0.08, 0.4, 12]} />
          <meshStandardMaterial color="#2a2f3a" />
        </mesh>
        <BrakeInHand green={green} blinkOn={blinkOn} />
      </group>
    </Shot>
  );
};

/* ------------------------------------------------------------ split */

const RestHalf: React.FC<{ from: number }> = ({ from }) => {
  const { t } = useT(from);
  const dissolve = interpolate(t, [32.4, 36.0], [0, 1], clamp);
  return (
    <Shot bg="#0a0a10" w={540} h={1920}>
      <ambientLight intensity={0.6} />
      <pointLight position={[0, 4, 2]} intensity={10 + dissolve * 30} color="#ffffff" distance={10} />
      <Glow position={[0, 1.4, -1]} color="#ffffff" size={2 + dissolve * 6} opacity={0.4 + dissolve * 0.5} />
      <Cam pos={[0, 1.2, 4.5]} look={[0, 1.0, 0]} fov={40} />
      <group scale={[1, 1, 1]}>
        <Person {...YOU} position={[0, 0, 0]} rotation={[0, Math.PI, 0]} shirt={dissolve > 0.6 ? "#e8eef8" : YOU.shirt} />
      </group>
      {Array.from({ length: 50 }).map((_, i) => {
        const p = (t * 0.4 + rnd(i)) % 1;
        return (
          <mesh key={i} position={[(rnd(i * 3) - 0.5) * 0.8, 0.2 + p * 3.5 * dissolve + rnd(i * 5) * 1.6, (rnd(i * 7) - 0.5) * 0.4]}>
            <sphereGeometry args={[0.025, 5, 4]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={dissolve * (1 - p)} toneMapped={false} />
          </mesh>
        );
      })}
    </Shot>
  );
};

const DriftHalf: React.FC<{ from: number }> = ({ from }) => {
  const { t, local } = useT(from);
  return (
    <Shot bg="#000006" w={540} h={1920}>
      <ambientLight intensity={0.35} color="#9fb6ff" />
      <pointLight position={[2, 2, 3]} intensity={6} color="#9fb6ff" distance={10} />
      <Cam pos={[0, 1.0, 5.2]} look={[0, 0.9, 0]} fov={40} />
      <Stars n={400} r={40} />
      <group position={[0, 1.0 + Math.sin(t * 0.7) * 0.15, 0]} rotation={[local * 0.05, local * 0.12, 0.5 + local * 0.04]}>
        <group position={[0, -0.95, 0]}>
          <Person {...YOU} eyes position={[0, 0, 0]} />
        </group>
      </group>
    </Shot>
  );
};

const SplitShot: React.FC<{ from: number }> = ({ from }) => {
  const { t } = useT(from);
  const leftOn = interpolate(t, [32.3, 32.8], [0, 1], clamp);
  const rightOn = interpolate(t, [35.6, 36.1], [0, 1], clamp);
  const label = (text: string, color: string, o: number) => (
    <div
      style={{
        position: "absolute",
        top: 470,
        width: "100%",
        textAlign: "center",
        fontFamily: "Inter, Arial",
        fontWeight: 900,
        fontSize: 64,
        color,
        opacity: o,
        textShadow: "0 0 20px rgba(0,0,0,0.8)",
      }}
    >
      {text}
    </div>
  );
  return (
    <AbsoluteFill style={{ flexDirection: "row", backgroundColor: "#000" }}>
      <div style={{ width: 540, height: 1920, position: "relative", opacity: 0.25 + leftOn * 0.75 }}>
        <RestHalf from={from} />
        {label("REST?", "#ffffff", leftOn)}
      </div>
      <div style={{ width: 6, height: 1920, background: "#ffffff", opacity: 0.8 }} />
      <div style={{ width: 534, height: 1920, position: "relative", overflow: "hidden", opacity: 0.25 + rightOn * 0.75 }}>
        <DriftHalf from={from} />
        {label("DRIFT?", C.cyan, rightOn)}
      </div>
    </AbsoluteFill>
  );
};

/* ----------------------------------------------------- melt + memories */

const MemoryInsert: React.FC<{ kind: number; t: number }> = ({ kind, t }) => {
  if (kind === 0) {
    // your daughter, old, in the hospital bed
    return (
      <>
        <ambientLight intensity={0.5} color="#bcd0ff" />
        <pointLight position={[0.5, 2, 1]} intensity={8} color="#ffd2a0" distance={5} />
        <Cam pos={[1.0, 1.6, 0.9]} look={[0, 0.8, -0.5]} fov={36} />
        <mesh position={[0, 0.55, 0]}>
          <boxGeometry args={[1.1, 0.25, 2.3]} />
          <meshStandardMaterial color="#e9f1f2" />
        </mesh>
        <Person hair="#c9ccd3" longHair="#c9ccd3" skin="#e2b89d" shirt="#d9e3ea" eyes old pose="lie" position={[0, 0.62, 0.05]} />
      </>
    );
  }
  if (kind === 1) {
    // Mara by the fire
    return (
      <>
        <ambientLight intensity={0.15} />
        <pointLight position={[-0.6, 0.8, 0.6]} intensity={14} color="#ff9a3c" distance={5} />
        <Cam pos={[0.35, 1.45, 2.8]} look={[0, 1.25, 0]} fov={36} />
        <mesh position={[0, 1.6, -1.5]}>
          <planeGeometry args={[6, 4]} />
          <meshStandardMaterial color="#3a2618" />
        </mesh>
        <Person skin="#d9a98a" hair="#1c1512" longHair="#1c1512" dress="#2f4a3a" shirt="#2f4a3a" eyes position={[0, 0, 0]} rotation={[0, 0.2, 0]} />
      </>
    );
  }
  // the silver box, glowing cyan
  return (
    <>
      <ambientLight intensity={0.2} />
      <pointLight position={[0, 0.6, 0.4]} intensity={8} color="#22d3ee" distance={3} />
      <Cam pos={[0.3, 0.55, 0.8]} look={[0, 0.1, 0]} fov={36} />
      <group rotation={[0, t, 0]}>
        <mesh position={[0, 0.07, 0]}>
          <boxGeometry args={[0.36, 0.14, 0.24]} />
          <meshStandardMaterial color="#c9ced6" metalness={0.5} roughness={0.25} />
        </mesh>
        <Glow position={[0, 0.16, 0]} color="#22d3ee" size={0.6} />
      </group>
    </>
  );
};

const MeltShot: React.FC<{ from: number }> = ({ from }) => {
  const { t, local } = useT(from);
  const melt = interpolate(t, [41.4, 50.5], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) });
  const crack = interpolate(t, [42.9, 44.0], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const memory = MEMORIES.findIndex((m) => t >= m && t < m + 0.5);
  if (memory >= 0) {
    return (
      <Shot bg="#05070d">
        <MemoryInsert kind={memory} t={t} />
      </Shot>
    );
  }
  const shakeAmt = t > 42.9 && t < 44.2 ? 0.06 : 0.015;
  const sx = Math.sin(t * 47) * shakeAmt;
  const sy = Math.cos(t * 39) * shakeAmt;
  return (
    <Shot bg="#2a0306">
      <MountainScene t={t} melt={melt} crack={crack} />
      <Cam pos={[2.2 + sx, 1.0 + sy - melt * 0.6, 4.6 - local * 0.15]} look={[0, 1.4 + crack * 2, -2]} fov={46} />
      <Person {...YOU} coat="#2a2f3a" position={[0, -melt * 0.9, 0]} rotation={[0, Math.PI + 0.3, 0]} headTilt={-0.3 * crack} />
    </Shot>
  );
};

/* ------------------------------------------------------------ the finger */

const FingerShot: React.FC<{ from: number }> = ({ from }) => {
  const { t, local } = useT(from);
  const hover = Math.sin(t * 3) * 0.01;
  const light = interpolate(t, [52.7, 53.6], [0, 1], clamp);
  if (t > 53.7) {
    return (
      <Shot bg="#000">
        <Cam pos={[0, 1, 2]} look={[0, 0, 0]} />
      </Shot>
    );
  }
  return (
    <Shot bg="#2a0306">
      <MountainScene t={t} melt={1} crack={1} />
      <ambientLight intensity={light * 3} color="#ffffff" />
      <pointLight position={[0, 1.4, 0.2]} intensity={5 + light * 60} color={light > 0.2 ? "#ffffff" : GREEN} distance={3} />
      <Cam pos={[0.75, 1.32 - local * 0.02, 0.55 - local * 0.04]} look={[0, 1.24, 0.05]} fov={36} />
      <group position={[0, 1.05, 0]} rotation={[0.2, 0.2, 0]}>
        <mesh position={[0, -0.04, 0]} scale={[0.16, 0.05, 0.2]}>
          <sphereGeometry args={[1, 14, 10]} />
          <meshStandardMaterial color="#d9a98a" />
        </mesh>
        <BrakeInHand green={1} blinkOn={Math.floor(t * 2.5) % 2 === 0} />
        {/* the other hand: index finger hovering over the button */}
        <group position={[0.02, 0.3 + hover, 0.12]} rotation={[0.9, 0, 0]}>
          <mesh rotation={[0, 0, 0]}>
            <capsuleGeometry args={[0.022, 0.12, 4, 8]} />
            <meshStandardMaterial color="#d9a98a" />
          </mesh>
          <mesh position={[0, 0.12, 0.03]} scale={[0.07, 0.05, 0.09]}>
            <sphereGeometry args={[1, 12, 8]} />
            <meshStandardMaterial color="#d9a98a" />
          </mesh>
        </group>
      </group>
      {light > 0 ? <Glow position={[0, 1.25, 0.05]} color="#ffffff" size={0.5 + light * 8} opacity={light} /> : null}
    </Shot>
  );
};

/* ---------------------------------------------------------------- config */

const cfg: EpisodeConfig = {
  dir: "ep5",
  duration: DURATION,
  shots: (
    [
      ["space", SpaceShot],
      ["ruins", RuinsShot],
      ["mountain", MountainShot],
      ["hand", HandShot],
      ["split", SplitShot],
      ["melt", MeltShot],
      ["finger", FingerShot],
    ] as [keyof typeof T, React.FC<{ from: number }>][]
  ).map(([name, Comp]) => ({ name, from: T[name][0], to: T[name][1], Comp })),
  hud: (t) => {
    if (t >= 53.7) return null;
    const earth = Math.max(0, 3 - t * 0.058);
    const base = { year: "YEAR 5,000,000,000", counter: `EARTH: ${earth.toFixed(1)}%`, counterColor: C.red };
    if (t < T.ruins[0]) return { ...base, clock: "--:--", location: "LOW ORBIT" };
    if (t < T.mountain[0]) return { ...base, clock: "--:--", location: "WHAT WAS NEW YORK" };
    if (t < T.split[0]) return { ...base, clock: "--:--", location: "THE LAST MOUNTAIN" };
    if (t < T.melt[0]) return { ...base, clock: "--:--", location: "YOUR CHOICE" };
    return { ...base, clock: "--:--", location: "THE LAST MOUNTAIN" };
  },
  hook: { line1: "YEAR 5,000,000,000.", line2: "YOU'RE STILL HERE.", line2At: 4.9, until: 6.9 },
  stamps: [
    { at: 27.7, dur: 1.8, text: "IT BLINKS GREEN.", color: "#14a85a" },
    { at: 39.78, dur: 1.3, text: "AWAKE. FOREVER.", color: "#3b5bdb" },
    { at: 49.04, dur: 1.8, text: "A SENTENCE.", color: C.red },
  ],
  flashes: [
    { at: T.ruins[0], color: "#000", frames: 10 },
    { at: T.mountain[0], color: "#000", frames: 8 },
    { at: T.split[0], color: "#fff", frames: 8 },
    { at: T.melt[0], color: "#000", frames: 8 },
    ...MEMORIES.map((m) => ({ at: m, color: "#fff", frames: 6 })),
    { at: MEMORIES[2] + 0.5, color: "#fff", frames: 6 },
    { at: 52.9, color: "#fff", frames: 26 },
  ],
  mascotAlert: [41.2, 53.7],
  end: {
    from: END,
    question: "Would you press it… or drift forever?",
    a: "PRESS",
    b: "DRIFT",
    prompt: "YOUR VOTES DECIDE HOW THIS ENDS",
  },
  sfx: [
    { file: "sfx_rumble.mp3", at: 0, dur: 7.4 },
    { file: "sfx_beep.mp3", at: 27.25, dur: 3 },
    { file: "sfx_rumble.mp3", at: 41.2, dur: 9.8 },
    { file: "sfx_crack.mp3", at: 42.85, dur: 2.1 },
    { file: "sfx_light.mp3", at: 52.6, dur: 2.1 },
    ...[27.7, 39.78, 49.04].map((s) => ({ file: "sfx_hit.mp3", at: s - 0.3, dur: 2 })),
  ],
};

export const Forever25Ep5: React.FC = () => <Episode cfg={cfg} />;
export const EP5_DURATION = DURATION;
