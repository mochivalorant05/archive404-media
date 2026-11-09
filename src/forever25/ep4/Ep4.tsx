import React from "react";
import * as THREE from "three";
import { Easing, interpolate } from "remotion";
import { C } from "../hud";
import { Episode, type EpisodeConfig } from "../Episode";
import { Cam, Candle, Glow, Person, Shot, SkyBackground, rnd, useCanvasTexture, useT } from "../three-kit";

/* FOREVER 25 · Episode 4 "The Twelve" — script & timings from the series doc. */

type V3 = [number, number, number];
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const YOU = { shirt: "#3a4a6b", pants: "#1d2333", hair: "#1c1512" };
const ILYA = { coat: "#15161c", pants: "#121318", shoes: "#060607", hair: "#0d0d10", skin: "#d8b49a", tie: "#d8202f", eyes: true };
const SHADOW = { coat: "#0c0d12", pants: "#0c0d12", shoes: "#050506", hair: "#08080a", skin: "#1a1a20" };

const T = {
  hall: [0, 5.0],
  spheres: [5.0, 11.0],
  candles: [11.0, 16.4],
  museum: [16.4, 22.0],
  brake: [22.0, 27.4],
  wine: [27.4, 33.0],
  threat: [33.0, 36.4],
  refuse: [36.4, 46.2],
  fire: [46.2, 55.2],
} as const;
const END = 55.2;
const DURATION = 64;
const FIRE = 46.45;

/* ------------------------------------------------------------------ hall */

const Throne: React.FC<{ position: V3; rotation: number; empty?: boolean; red?: number }> = ({ position, rotation, empty, red = 0 }) => (
  <group position={position} rotation={[0, rotation, 0]}>
    <mesh position={[0, 0.45, 0]}>
      <boxGeometry args={[0.6, 0.1, 0.55]} />
      <meshStandardMaterial color="#2a2230" />
    </mesh>
    <mesh position={[0, 1.15, -0.25]}>
      <boxGeometry args={[0.62, 1.5, 0.08]} />
      <meshStandardMaterial color="#1e1824" emissive="#ff3b4e" emissiveIntensity={red * 0.3} />
    </mesh>
    {!empty ? <Person {...SHADOW} pose="sit" position={[0, 0, 0.05]} /> : null}
  </group>
);

const Hall: React.FC<{ red?: number; ring?: boolean }> = ({ red = 0, ring = true }) => (
  <>
    <mesh rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[9, 64]} />
      <meshStandardMaterial color="#d8d3ca" roughness={0.25} metalness={0.1} />
    </mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
      <ringGeometry args={[1.0, 1.08, 64]} />
      <meshBasicMaterial color="#22d3ee" toneMapped={false} />
    </mesh>
    {/* columns */}
    {Array.from({ length: 16 }).map((_, i) => {
      const a = (i / 16) * Math.PI * 2;
      return (
        <mesh key={i} position={[Math.sin(a) * 7, 3, Math.cos(a) * 7]}>
          <cylinderGeometry args={[0.3, 0.35, 6, 12]} />
          <meshStandardMaterial color="#bdb6aa" />
        </mesh>
      );
    })}
    {ring
      ? Array.from({ length: 11 }).map((_, i) => {
          const a = (i / 11) * Math.PI * 2;
          return <Throne key={i} position={[Math.sin(a) * 3.6, 0, Math.cos(a) * 3.6]} rotation={a + Math.PI} red={red} />;
        })
      : null}
  </>
);

const SilverBox: React.FC<{ open?: number; glow?: number; position?: V3; rotation?: V3 }> = ({
  open = 0,
  glow = 0.3,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
}) => (
  <group position={position} rotation={rotation}>
    <mesh position={[0, 0.07, 0]}>
      <boxGeometry args={[0.36, 0.14, 0.24]} />
      <meshStandardMaterial color="#c9ced6" metalness={0.5} roughness={0.25} />
    </mesh>
    <group position={[0, 0.145, -0.12]} rotation={[-open * 1.6, 0, 0]}>
      <mesh position={[0, 0.015, 0.12]}>
        <boxGeometry args={[0.37, 0.03, 0.25]} />
        <meshStandardMaterial color="#d7dbe2" metalness={0.5} roughness={0.2} />
      </mesh>
    </group>
    <mesh position={[0, 0.14, 0.121]}>
      <boxGeometry args={[0.37, 0.008, 0.005]} />
      <meshBasicMaterial color="#22d3ee" toneMapped={false} />
    </mesh>
    <Glow position={[0, 0.17, 0.05]} color="#22d3ee" size={0.25 + glow * 0.6} opacity={Math.min(1, 0.4 + glow)} />
  </group>
);

const HallShot: React.FC<{ from: number }> = ({ from }) => {
  const { local } = useT(from);
  const a = local * 0.22;
  const h = interpolate(local, [0, 5], [11, 6.5], { easing: Easing.out(Easing.cubic) });
  return (
    <Shot bg="#08070c">
      <fog attach="fog" args={["#08070c", 10, 26]} />
      <ambientLight intensity={0.35} color="#c9c2d8" />
      <spotLight position={[0, 9, 0]} angle={0.5} penumbra={0.6} intensity={55} color="#f0eadf" />
      <pointLight position={[0, 1.6, 0]} intensity={6} color="#22d3ee" distance={5} />
      <Cam pos={[Math.sin(a) * 4.5, h, Math.cos(a) * 4.5]} look={[0, 0.6, 0]} fov={46} />
      <Hall />
      {/* the twelfth, in the centre, holding the silver box */}
      <Person {...ILYA} position={[0, 0, 0]} rotation={[0, a, 0]} />
      <SilverBox position={[0.28, 0.95, 0.15]} glow={0.6} />
    </Shot>
  );
};

/* ------------------------------------------------------- world spheres */

const useIconTexture = (kind: "banks" | "elections" | "wars") =>
  useCanvasTexture(
    256,
    256,
    (ctx, w, h) => {
      ctx.fillStyle = kind === "wars" ? "#3a0a0e" : kind === "banks" ? "#0a2a1a" : "#0a1a3a";
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = ctx.fillStyle = kind === "wars" ? "#ff4b3a" : kind === "banks" ? "#39ff88" : "#6fa8ff";
      ctx.lineWidth = 10;
      if (kind === "banks") {
        ctx.beginPath();
        [40, 150, 90, 180, 130, 60, 200, 110].forEach((v, i) => (i ? ctx.lineTo(30 + i * 28, h - v) : ctx.moveTo(30, h - v)));
        ctx.stroke();
        ctx.font = "900 80px 'DejaVu Sans'";
        ctx.fillText("$", 170, 90);
      } else if (kind === "elections") {
        ctx.strokeRect(60, 110, 136, 110);
        ctx.fillRect(100, 60, 56, 70);
        ctx.font = "900 40px 'DejaVu Sans'";
        ctx.fillText("VOTE", 82, 185);
      } else {
        for (let i = 0; i < 5; i++) {
          ctx.beginPath();
          ctx.arc(50 + i * 40, 140 + Math.sin(i) * 40, 26 + (i % 2) * 12, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    },
    kind,
  );

const GlobeIcon: React.FC<{ kind: "banks" | "elections" | "wars"; position: V3; show: number; t: number }> = ({ kind, position, show, t }) => {
  const tex = useIconTexture(kind);
  return (
    <group position={position} scale={show}>
      <mesh rotation={[0, t * 0.6, 0]}>
        <sphereGeometry args={[0.7, 32, 24]} />
        <meshStandardMaterial map={tex} emissiveMap={tex} emissive="#ffffff" emissiveIntensity={0.7} transparent opacity={0.92} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.76, 32, 24]} />
        <meshStandardMaterial color="#cfe6f0" transparent opacity={0.15} roughness={0.05} />
      </mesh>
      {/* the shadow behind the ruler */}
      <Person {...SHADOW} position={[0, -1.6, -1.4]} scale={1.6} />
    </group>
  );
};

const SpheresShot: React.FC<{ from: number }> = ({ from }) => {
  const { t, local } = useT(from);
  const s = (at: number) => interpolate(t, [at - 0.1, at + 0.35], [0, 1], { ...clamp, easing: Easing.out(Easing.back(1.6)) });
  return (
    <Shot bg="#05060c">
      <fog attach="fog" args={["#05060c", 6, 20]} />
      <ambientLight intensity={0.4} />
      <pointLight position={[0, 3, 4]} intensity={12} color="#e6ecf5" distance={12} />
      <pointLight position={[0, 2.5, -4]} intensity={10} color="#6f8ed6" distance={10} />
      <Cam pos={[local * 0.15, 1.6, 6.4 - local * 0.25]} look={[0, 1.4, 0]} fov={44} />
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial color="#0e0f16" roughness={0.2} metalness={0.4} />
      </mesh>
      <GlobeIcon kind="banks" position={[-1.3, 2.6, 0]} show={s(8.32)} t={t} />
      <GlobeIcon kind="elections" position={[1.3, 2.2, -0.4]} show={s(9.06)} t={t} />
      <GlobeIcon kind="wars" position={[0, 1.2, 0.8]} show={s(10.0)} t={t} />
      {/* before the globes: the silhouettes of the eleven, high above */}
      {t < 8.3
        ? Array.from({ length: 5 }).map((_, i) => (
            <Person key={i} {...SHADOW} position={[-2 + i, 0, -2]} scale={1.3} rotation={[0, 0, 0]} />
          ))
        : null}
    </Shot>
  );
};

/* -------------------------------------------------------- the Brief */

const CandlesFieldShot: React.FC<{ from: number }> = ({ from }) => {
  const { t, local, frame } = useT(from);
  const N = 48;
  return (
    <Shot bg="#040305">
      <ambientLight intensity={0.06} />
      <pointLight position={[0, 2, 0]} intensity={interpolate(t, [13.6, 16], [10, 2], clamp)} color="#ffb35a" distance={8} />
      <Cam pos={[0, 1.4 - local * 0.08, 3.4 - local * 0.2]} look={[0, 0.2, -1]} fov={46} />
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#120c08" />
      </mesh>
      {Array.from({ length: N }).map((_, i) => {
        const x = ((i % 8) - 3.5) * 0.45 + (rnd(i) - 0.5) * 0.15;
        const z = -Math.floor(i / 8) * 0.6 + (rnd(i * 3) - 0.5) * 0.2;
        const born = 11.0 + rnd(i * 5) * 1.6; // "born"
        const out = 13.7 + rnd(i * 7) * 2.4; // "flicker out"
        const lit = t < born ? 0 : t > out ? 0 : 1;
        return <Candle key={i} position={[x, 0, z]} lit={lit} h={0.15 + rnd(i * 2) * 0.2} flick={frame * 0.1 + i} />;
      })}
    </Shot>
  );
};

/* ------------------------------------------------------------- museum */

const MuseumShot: React.FC<{ from: number }> = ({ from }) => {
  const { t, local } = useT(from);
  const walkZ = 4 - local * 1.0;
  return (
    <Shot bg="#0b0a0e">
      <fog attach="fog" args={["#0b0a0e", 6, 22]} />
      <ambientLight intensity={0.25} color="#e6dccb" />
      {Array.from({ length: 6 }).map((_, i) => (
        <spotLight key={i} position={[(i % 2 ? 1.8 : -1.8), 4, 2 - i * 2]} angle={0.4} penumbra={0.7} intensity={40} color="#f4e2c4" />
      ))}
      <Cam pos={[1.6, 1.7, walkZ + 3.2]} look={[0, 1.3, walkZ - 1]} fov={40} />
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[8, 40]} />
        <meshStandardMaterial color="#2a2420" roughness={0.3} metalness={0.2} />
      </mesh>
      {[-3, 3].map((x) => (
        <mesh key={x} position={[x, 2.5, -5]} rotation={[0, -Math.sign(x) * Math.PI / 2, 0]}>
          <planeGeometry args={[40, 5]} />
          <meshStandardMaterial color="#3a2a2a" />
        </mesh>
      ))}
      {/* pedestals with three thousand years of things */}
      {Array.from({ length: 6 }).map((_, i) => {
        const x = i % 2 ? 1.8 : -1.8;
        const z = 2 - i * 2;
        return (
          <group key={i} position={[x, 0, z]}>
            <mesh position={[0, 0.5, 0]}>
              <boxGeometry args={[0.6, 1, 0.6]} />
              <meshStandardMaterial color="#e6e0d6" />
            </mesh>
            {i % 3 === 0 ? (
              <mesh position={[0, 1.3, 0]}>
                <sphereGeometry args={[0.25, 12, 10]} />
                <meshStandardMaterial color="#a8642f" />
              </mesh>
            ) : i % 3 === 1 ? (
              <mesh position={[0, 1.15, 0]}>
                <torusGeometry args={[0.18, 0.05, 8, 16]} />
                <meshStandardMaterial color="#e3c27a" metalness={0.6} roughness={0.3} />
              </mesh>
            ) : (
              <mesh position={[0, 1.4, 0]} rotation={[0, 0, 0.3]}>
                <boxGeometry args={[0.06, 0.8, 0.02]} />
                <meshStandardMaterial color="#cfd6e0" metalness={0.7} roughness={0.2} />
              </mesh>
            )}
          </group>
        );
      })}
      <Person {...ILYA} position={[0, 0, walkZ]} rotation={[0, Math.PI, 0]} headTurn={Math.sin(t * 0.8) * 0.3} />
    </Shot>
  );
};

const BrakeShot: React.FC<{ from: number }> = ({ from }) => {
  const { t, local } = useT(from);
  const open = interpolate(t, [22.04, 22.8], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const rise = interpolate(t, [22.6, 23.6], [0, 0.22], { ...clamp, easing: Easing.out(Easing.cubic) });
  const d = interpolate(local, [0, 5.4], [1.4, 0.75]);
  return (
    <Shot bg="#05070d">
      <ambientLight intensity={0.15} />
      <pointLight position={[0, 1.2, 0.6]} intensity={4} color="#e6ecf5" distance={4} />
      <pointLight position={[0, 0.3, 0]} intensity={2 + open * 8} color="#22d3ee" distance={3} />
      <Cam pos={[0.3 * d, 0.45 + d * 0.35, d]} look={[0, 0.25, 0]} fov={36} />
      <SilverBox open={open} glow={0.4 + open} />
      {/* the device inside */}
      <group position={[0, 0.12 + rise, 0]} rotation={[0, t * 1.5, 0]}>
        <mesh>
          <torusGeometry args={[0.08, 0.012, 10, 32]} />
          <meshBasicMaterial color="#22d3ee" toneMapped={false} />
        </mesh>
        <mesh>
          <sphereGeometry args={[0.035, 16, 12]} />
          <meshBasicMaterial color="#e8fbff" toneMapped={false} />
        </mesh>
        <Glow position={[0, 0, 0]} color="#22d3ee" size={0.4 * open} />
      </group>
      {/* Ilya's hands holding it */}
      {[-1, 1].map((s) => (
        <group key={s} position={[s * 0.26, 0.06, 0.02]}>
          <mesh scale={[0.06, 0.03, 0.1]}>
            <sphereGeometry args={[1, 10, 8]} />
            <meshStandardMaterial color="#d8b49a" />
          </mesh>
          <mesh position={[s * 0.12, -0.02, 0.05]} rotation={[0, 0, (s * Math.PI) / 2]}>
            <cylinderGeometry args={[0.05, 0.05, 0.22, 10]} />
            <meshStandardMaterial color="#15161c" />
          </mesh>
        </group>
      ))}
      <mesh position={[0, -0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[4, 4]} />
        <meshStandardMaterial color="#0e0f16" />
      </mesh>
    </Shot>
  );
};

/* -------------------------------------------------------------- the offer */

const WineShot: React.FC<{ from: number }> = ({ from }) => {
  const { t, local } = useT(from);
  const pour = interpolate(t, [27.5, 29.8], [0, 1], clamp);
  const pull = interpolate(t, [29.6, 33.0], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const pos: V3 = [0.25 + pull * 0.6, 1.05 + pull * 0.55, 0.55 + pull * 2.6];
  return (
    <Shot bg="#0b080c">
      <ambientLight intensity={0.25} color="#e6dccb" />
      <pointLight position={[0.4, 1.8, 1]} intensity={10} color="#ffcf9a" distance={5} />
      <pointLight position={[-0.6, 1.2, -0.6]} intensity={3} color="#d8202f" distance={3} />
      <Cam pos={pos} look={[pull * -0.3, 0.95 + pull * 0.1, 0]} fov={36} />
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[8, 48]} />
        <meshStandardMaterial color="#d8d3ca" roughness={0.25} />
      </mesh>
      {/* two thrones side by side: his and the empty one for you */}
      <Throne position={[-0.75, 0, -0.4]} rotation={0} empty />
      <Throne position={[0.75, 0, -0.4]} rotation={0} empty />
      <Person {...ILYA} pose="sit" position={[-0.75, 0, -0.35]} headTurn={0.4} />
      {/* small table with the glass */}
      <mesh position={[0, 0.45, -0.1]}>
        <cylinderGeometry args={[0.25, 0.25, 0.9, 16]} />
        <meshStandardMaterial color="#1e1824" />
      </mesh>
      <group position={[0.05, 0.9, -0.05]}>
        <mesh position={[0, 0.04, 0]}>
          <cylinderGeometry args={[0.05, 0.05, 0.01, 16]} />
          <meshStandardMaterial color="#e8f2f8" transparent opacity={0.5} />
        </mesh>
        <mesh position={[0, 0.1, 0]}>
          <cylinderGeometry args={[0.006, 0.006, 0.12, 8]} />
          <meshStandardMaterial color="#e8f2f8" transparent opacity={0.5} />
        </mesh>
        <mesh position={[0, 0.22, 0]}>
          <cylinderGeometry args={[0.055, 0.035, 0.14, 20, 1, true]} />
          <meshStandardMaterial color="#e8f2f8" transparent opacity={0.35} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, 0.16 + pour * 0.035, 0]}>
          <cylinderGeometry args={[0.035 + pour * 0.013, 0.035, 0.01 + pour * 0.07, 20]} />
          <meshStandardMaterial color="#6a0a14" roughness={0.1} />
        </mesh>
        {pour > 0 && pour < 1 ? (
          <mesh position={[0, 0.36, 0]}>
            <cylinderGeometry args={[0.006, 0.006, 0.3, 6]} />
            <meshStandardMaterial color="#6a0a14" />
          </mesh>
        ) : null}
      </group>
      {pour > 0 && pour < 1 ? (
        <mesh position={[0.1, 1.55, -0.05]} rotation={[0, 0, 2.2]}>
          <cylinderGeometry args={[0.05, 0.05, 0.4, 12]} />
          <meshStandardMaterial color="#1a2a1a" />
        </mesh>
      ) : null}
    </Shot>
  );
};

const ThreatShot: React.FC<{ from: number }> = ({ from }) => {
  const { t, local } = useT(from);
  const red = interpolate(t, [33.1, 33.6], [0, 1], clamp);
  return (
    <Shot bg="#08070c">
      <fog attach="fog" args={["#08070c", 8, 24]} />
      <ambientLight intensity={0.25 - red * 0.15} color="#c9c2d8" />
      {Array.from({ length: 6 }).map((_, i) => {
        const a = (i / 6) * Math.PI * 2;
        return <pointLight key={i} position={[Math.sin(a) * 4, 3, Math.cos(a) * 4]} intensity={red * 14} color="#ff2a3a" distance={9} />;
      })}
      <Cam pos={[0.3, 1.5, 4.6 - local * 0.5]} look={[0, 1.3, 0]} fov={42} />
      <Hall red={red} />
      <Person {...ILYA} position={[0, 0, 0]} headTilt={0.05} />
    </Shot>
  );
};

/* ---------------------------------------------------------------- refusal */

const RefuseShot: React.FC<{ from: number }> = ({ from }) => {
  const { t, local } = useT(from);
  const aim = interpolate(t, [44.19, 44.9], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const smile = t > 42.35;
  const k = interpolate(local, [0, 9.8], [0, 1], { easing: Easing.inOut(Easing.sin) });
  return (
    <Shot bg="#08070c">
      <fog attach="fog" args={["#08070c", 8, 24]} />
      <ambientLight intensity={0.12} color="#c9c2d8" />
      {Array.from({ length: 6 }).map((_, i) => {
        const a = (i / 6) * Math.PI * 2;
        return <pointLight key={i} position={[Math.sin(a) * 4, 3, Math.cos(a) * 4]} intensity={12} color="#ff2a3a" distance={9} />;
      })}
      <pointLight position={[0, 1.6, 1.4]} intensity={2 + aim * 6} color="#22d3ee" distance={4} />
      {/* over your shoulder, pushing in toward Ilya */}
      <Cam pos={[0.55 - k * 0.2, 1.8, 3.4 - k * 1.2]} look={[0, 1.45, 0]} fov={40} />
      <Hall red={1} />
      <Person {...ILYA} position={[0, 0, 0]} headTilt={smile ? -0.08 : 0} headTurn={smile ? 0.12 : 0} />
      {/* his smile */}
      {smile ? (
        <mesh position={[0, 1.775, 0.152]} rotation={[0, 0, Math.PI]}>
          <torusGeometry args={[0.035, 0.006, 6, 12, Math.PI]} />
          <meshBasicMaterial color="#3a0e10" />
        </mesh>
      ) : null}
      {/* the Brake, raised and aimed at you */}
      <group position={[0.22, 1.0 + aim * 0.45, 0.18 + aim * 0.35]} rotation={[aim * -1.2, 0, 0]}>
        <SilverBox open={1} glow={0.6 + aim * 1.5} />
      </group>
      <Person {...YOU} position={[0.15, 0, 2.2]} rotation={[0, Math.PI, 0]} />
    </Shot>
  );
};

const FireShot: React.FC<{ from: number }> = ({ from }) => {
  const { t, local } = useT(from);
  const beam = interpolate(t, [46.3, FIRE, 46.9], [0, 1, 0], clamp);
  const pale = interpolate(t, [48.78, 49.6], [0, 1], clamp);
  const skin = new THREE.Color("#d8b49a").lerp(new THREE.Color("#ece6e2"), pale).getStyle();
  const back = interpolate(t, [50.1, 51.2], [0, -0.4], { ...clamp, easing: Easing.out(Easing.cubic) });
  const reverse = t > 47.4; // after the flash: look at Ilya from your side
  const sparks = interpolate(t, [46.5, 48.5], [1, 0], clamp);
  return (
    <Shot bg="#08070c">
      <fog attach="fog" args={["#08070c", 8, 24]} />
      <ambientLight intensity={0.15 + beam * 0.8} color="#c9f4ff" />
      {Array.from({ length: 6 }).map((_, i) => {
        const a = (i / 6) * Math.PI * 2;
        return <pointLight key={i} position={[Math.sin(a) * 4, 3, Math.cos(a) * 4]} intensity={10} color="#ff2a3a" distance={9} />;
      })}
      <pointLight position={[0, 1.5, 1.6]} intensity={beam * 40 + sparks * 6} color="#22d3ee" distance={6} />
      {reverse ? (
        <Cam pos={[0.35, 1.75, 2.0 - local * 0.06]} look={[0, 1.6, 0]} fov={34} />
      ) : (
        <Cam pos={[1.6, 1.4, 1.2]} look={[0.1, 1.3, 1.1]} fov={44} />
      )}
      <Hall red={1} />
      <Person {...ILYA} skin={skin} position={[0, 0, back]} headTilt={pale * 0.1} />
      {/* the frown when it fails */}
      {pale > 0.3 ? (
        <mesh position={[0, 1.755 - pale * 0.01, 0.152 + back]}>
          <torusGeometry args={[0.03, 0.006, 6, 12, Math.PI]} />
          <meshBasicMaterial color="#3a0e10" />
        </mesh>
      ) : null}
      <group position={[0.22, 1.45, 0.53 + back]} rotation={[-1.2, 0, 0]}>
        <SilverBox open={1} glow={beam * 3} />
      </group>
      {/* slow-motion beam */}
      {beam > 0.01 ? (
        <mesh position={[0.2, 1.48, 1.35]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.04 * beam, 0.09 * beam, 1.7, 16, 1, true]} />
          <meshBasicMaterial color="#9ff3ff" transparent opacity={0.8} toneMapped={false} side={THREE.DoubleSide} />
        </mesh>
      ) : null}
      {/* you: untouched, cyan sparks sliding off */}
      <Person {...YOU} position={[0.15, 0, 2.2]} rotation={[0, Math.PI, 0]} />
      {sparks > 0
        ? Array.from({ length: 14 }).map((_, i) => (
            <Glow
              key={i}
              position={[0.15 + (rnd(i) - 0.5) * 0.8, 0.6 + rnd(i * 3) * 1.4 + (t - 46.5) * 0.3, 2.0 + (rnd(i * 5) - 0.5) * 0.4]}
              color="#22d3ee"
              size={0.12}
              opacity={sparks}
            />
          ))
        : null}
    </Shot>
  );
};

/* ---------------------------------------------------------------- config */

const cfg: EpisodeConfig = {
  dir: "ep4",
  duration: DURATION,
  shots: (
    [
      ["hall", HallShot],
      ["spheres", SpheresShot],
      ["candles", CandlesFieldShot],
      ["museum", MuseumShot],
      ["brake", BrakeShot],
      ["wine", WineShot],
      ["threat", ThreatShot],
      ["refuse", RefuseShot],
      ["fire", FireShot],
    ] as [keyof typeof T, React.FC<{ from: number }>][]
  ).map(([name, Comp]) => ({ name, from: T[name][0], to: T[name][1], Comp })),
  hud: (t) => {
    if (t >= END) return null;
    const used = t >= FIRE;
    const base = {
      year: "YEAR 312",
      counter: used ? "THE BRAKE: 0 USES" : "THE BRAKE: 1 USE",
      counterColor: used ? C.red : C.cyan,
    };
    if (t < T.spheres[0]) return { ...base, clock: "00:00", location: "THE ARCHIVE" };
    if (t < T.museum[0]) return { ...base, clock: "--:--", location: t < T.candles[0] ? "ABOVE" : "BELOW · THE BRIEF" };
    if (t < T.wine[0]) return { ...base, clock: "00:12", location: "ILYA · 3,000 YEARS" };
    return { ...base, clock: "00:19", location: "THE ARCHIVE" };
  },
  hook: { line1: "TWELVE IMMORTALS.", line2: "ELEVEN ARE AFRAID OF ONE.", line2At: 2.1, until: 5.0 },
  stamps: [
    { at: 18.1, dur: 1.6, text: "3,000 YEARS OLD", color: C.red },
    { at: 24.0, dur: 1.6, text: "ONE SHOT.", color: C.cyan },
    { at: 36.63, dur: 1.4, text: "NO.", color: C.red },
    { at: 47.58, dur: 1.5, text: "NOTHING HAPPENS.", color: C.cyan },
    { at: 52.32, dur: 2.4, text: "NOT ONE OF US?", color: C.red },
  ],
  flashes: [
    { at: T.spheres[0], color: "#000", frames: 8 },
    { at: T.museum[0], color: "#000", frames: 10 },
    { at: T.wine[0], color: "#000", frames: 8 },
    { at: FIRE, color: "#ffffff", frames: 16 },
  ],
  mascotAlert: [42.3, 55.2],
  end: {
    from: END,
    question: "Would you join the ones who rule… or stay with the ones who disappear?",
    a: "JOIN",
    b: "BRIEF",
  },
  sfx: [
    { file: "sfx_wine.mp3", at: 27.45, dur: 3 },
    { file: "sfx_blast.mp3", at: FIRE - 0.05, dur: 2.2 },
    ...[18.1, 24.0, 36.63, 52.32].map((s) => ({ file: "sfx_hit.mp3", at: s - 0.3, dur: 2 })),
  ],
};

export const Forever25Ep4: React.FC = () => <Episode cfg={cfg} />;
export const EP4_DURATION = DURATION;
