import React from "react";
import * as THREE from "three";
import { Easing, interpolate, random } from "remotion";
import { Cam, Glow, Person, Shot, useCanvasTexture } from "../three-kit";
import { BEATS } from "./timeline";
import { useT } from "./shots-a";

type V3 = [number, number, number];
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const YOU = { shirt: "#3a4a6b", pants: "#1d2333", hair: "#1c1512" };
const FRIEND_YOUNG = { shirt: "#7a3f2a", pants: "#2c2a26", hair: "#5a3a1e", skin: "#e0b493" };
const FRIEND_OLD = { ...FRIEND_YOUNG, hair: "#b9bcc2", old: true };
const ILYA = { coat: "#15161c", pants: "#121318", shoes: "#060607", hair: "#0d0d10", skin: "#d8b49a", tie: "#d8202f" };

/** A drawn snapshot of you + your friend 18 years ago (amber, warm). */
const usePhotoTexture = (written: boolean) =>
  useCanvasTexture(
    420,
    500,
    (ctx, w, h) => {
      ctx.fillStyle = "#f4efe4";
      ctx.fillRect(0, 0, w, h);
      const g = ctx.createLinearGradient(0, 24, 0, 400);
      g.addColorStop(0, "#f6b25e");
      g.addColorStop(1, "#b55d36");
      ctx.fillStyle = g;
      ctx.fillRect(24, 24, w - 48, 376);
      // sun
      ctx.fillStyle = "rgba(255,240,200,0.9)";
      ctx.beginPath();
      ctx.arc(300, 120, 40, 0, Math.PI * 2);
      ctx.fill();
      // two friends (silhouettes): you (dark hair) and him (brown hair)
      const fig = (x: number, hair: string, shirt: string) => {
        ctx.fillStyle = shirt;
        ctx.beginPath();
        ctx.roundRect(x - 48, 250, 96, 150, 30);
        ctx.fill();
        ctx.fillStyle = "#e3b593";
        ctx.beginPath();
        ctx.arc(x, 212, 40, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = hair;
        ctx.beginPath();
        ctx.arc(x, 200, 41, Math.PI, 0);
        ctx.fill();
      };
      fig(150, "#1c1512", "#3a4a6b");
      fig(270, "#5a3a1e", "#7a3f2a");
      // arm over shoulder
      ctx.strokeStyle = "#7a3f2a";
      ctx.lineWidth = 22;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(230, 270);
      ctx.lineTo(178, 262);
      ctx.stroke();
      // aged tint
      ctx.fillStyle = "rgba(120,70,20,0.12)";
      ctx.fillRect(24, 24, w - 48, 376);
      if (written) {
        ctx.fillStyle = "#1f2a6b";
        ctx.font = "italic bold 46px 'DejaVu Serif', serif";
        ctx.textAlign = "center";
        ctx.fillText("summer '07", w / 2, 462);
      }
    },
    written,
  );

const Table: React.FC<{ color?: string; y?: number }> = ({ color = "#3b2a20", y = 0.78 }) => (
  <>
    <mesh position={[0, y - 0.04, 0]}>
      <boxGeometry args={[2.4, 0.08, 1.4]} />
      <meshStandardMaterial color={color} roughness={0.7} />
    </mesh>
    {[
      [-1.05, -0.6],
      [1.05, -0.6],
      [-1.05, 0.6],
      [1.05, 0.6],
    ].map(([x, z]) => (
      <mesh key={`${x}${z}`} position={[x, (y - 0.08) / 2, z]}>
        <boxGeometry args={[0.08, y - 0.08, 0.08]} />
        <meshStandardMaterial color={color} />
      </mesh>
    ))}
  </>
);

/** 26:60–30:75 — the old photo on the table, cold light; "18 years ago" is written on it. */
export const PhotoShot: React.FC<{ from: number }> = ({ from }) => {
  const { t, local } = useT(from);
  const tex = usePhotoTexture(t >= BEATS.eighteenYears - 0.6);
  const d = interpolate(local, [0, 4.15], [1.6, 0.95], { easing: Easing.out(Easing.quad) });
  return (
    <Shot bg="#05080f">
      <ambientLight intensity={0.25} color="#8fb3ff" />
      <spotLight position={[0.5, 3, 1]} angle={0.6} penumbra={0.8} intensity={30} color="#bcd7ff" />
      <directionalLight position={[-1, 3, 2]} intensity={1.0} color="#9fc4ff" />
      <Cam pos={[0.15, d, d * 0.55]} look={[0, 0.78, 0]} fov={40} roll={0.05} />
      <Table color="#2c2420" />
      <group position={[0, 0.79, 0]} rotation={[-Math.PI / 2, 0, 0.12 + local * 0.01]}>
        <mesh>
          <planeGeometry args={[0.42, 0.5]} />
          <meshStandardMaterial map={tex} roughness={0.5} />
        </mesh>
      </group>
      {/* friend's hand holding the photo edge — aged */}
      <mesh position={[0.32, 0.82, 0.18]} rotation={[0, 0.6, 0]}>
        <boxGeometry args={[0.16, 0.06, 0.24]} />
        <meshStandardMaterial color="#c9a184" roughness={0.9} />
      </mesh>
      <mesh position={[0.48, 0.84, 0.3]} rotation={[0, 0.6, Math.PI / 2]}>
        <cylinderGeometry args={[0.07, 0.08, 0.3, 10]} />
        <meshStandardMaterial color="#7a3f2a" />
      </mesh>
    </Shot>
  );
};

/** 30:75–33:20 — your friend now: gray, older, next to you (unchanged). */
export const FriendShot: React.FC<{ from: number }> = ({ from }) => {
  const { local } = useT(from);
  const x = interpolate(local, [0, 2.45], [-0.6, 0.3], { easing: Easing.inOut(Easing.sin) });
  return (
    <Shot bg="#070b14">
      <ambientLight intensity={0.35} color="#a8c4ff" />
      <directionalLight position={[3, 4, 3]} intensity={1.8} color="#cfe0ff" />
      <pointLight position={[-2, 2, 1]} intensity={6} color="#22d3ee" distance={6} />
      <Cam pos={[x, 1.6, 2.6]} look={[x * 0.5, 1.45, 0]} fov={40} />
      <mesh position={[0, 2, -1.5]}>
        <planeGeometry args={[10, 5]} />
        <meshStandardMaterial color="#1b2333" />
      </mesh>
      {/* framed picture on the wall */}
      <mesh position={[1.4, 2.1, -1.48]}>
        <planeGeometry args={[0.7, 0.5]} />
        <meshStandardMaterial color="#3a4458" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[10, 6]} />
        <meshStandardMaterial color="#232838" />
      </mesh>
      <Person {...FRIEND_OLD} position={[-0.45, 0, 0]} rotation={[0, 0.35, 0]} headTurn={0.35} headTilt={0.12} />
      {/* you: three-quarter back view (bible: never a full face) */}
      <Person {...YOU} position={[0.45, 0, 0.2]} rotation={[0, Math.PI - 0.5, 0]} />
    </Shot>
  );
};

/** 33:20–38:60 — the mirror: you from behind, the reflection identical to the photo. */
export const MirrorShot: React.FC<{ from: number }> = ({ from }) => {
  const { local } = useT(from);
  const z = interpolate(local, [0, 5.4], [3.3, 2.5], { easing: Easing.out(Easing.quad) });
  const tex = usePhotoTexture(true);
  return (
    <Shot bg="#05080f">
      <ambientLight intensity={0.2} color="#9fbfff" />
      <pointLight position={[0, 2.6, 0.2]} intensity={12} color="#d6e6ff" distance={6} />
      <Cam pos={[0.75, 1.95, z]} look={[0, 1.55, -1]} fov={40} />
      {/* mirror frame (4 bars) + see-through glass */}
      {[
        [0, 2.29, 1.26, 0.07],
        [0, 1.01, 1.26, 0.07],
        [-0.6, 1.65, 0.07, 1.35],
        [0.6, 1.65, 0.07, 1.35],
      ].map(([x, y, w, h], i) => (
        <mesh key={`f${i}`} position={[x, y, -1.02]}>
          <boxGeometry args={[w, h, 0.04]} />
          <meshStandardMaterial color="#9aa3ad" metalness={0.8} roughness={0.3} />
        </mesh>
      ))}
      <mesh position={[0, 1.65, -1.03]}>
        <planeGeometry args={[1.14, 1.24]} />
        <meshBasicMaterial color="#9fc4ff" transparent opacity={0.08} depthWrite={false} />
      </mesh>
      {/* reflected room (behind the glass) — fake mirror: a copy of you facing the camera */}
      <group position={[0, 0, -2.0]}>
        <pointLight position={[0, 2.6, 0.5]} intensity={6} color="#d6e6ff" distance={4} />
        <Person {...YOU} position={[0.05, 0, 0.1]} rotation={[0, 0, 0]} />
      </group>
      {/* clip anything that isn't inside the mirror with dark walls around it */}
      {[
        [-1.95, 1.65, 1.4, 5],
        [1.95, 1.65, 1.4, 5],
      ].map(([x, y, w, h], i) => (
        <mesh key={i} position={[x, y, -1.04]}>
          <planeGeometry args={[w * 2, h]} />
          <meshStandardMaterial color="#26303f" />
        </mesh>
      ))}
      <mesh position={[0, 3.3, -1.04]}>
        <planeGeometry args={[6, 2]} />
        <meshStandardMaterial color="#26303f" />
      </mesh>
      <mesh position={[0, 0.27, -1.04]}>
        <planeGeometry args={[6, 1.54]} />
        <meshStandardMaterial color="#26303f" />
      </mesh>
      {/* the old photo tucked in the mirror frame */}
      <mesh position={[0.5, 2.05, -1.0]} rotation={[0, 0, -0.18]}>
        <planeGeometry args={[0.3, 0.36]} />
        <meshStandardMaterial map={tex} />
      </mesh>
      {/* sink */}
      <mesh position={[0, 0.9, -0.75]}>
        <boxGeometry args={[1.2, 0.12, 0.55]} />
        <meshStandardMaterial color="#d8dde3" />
      </mesh>
      {/* you, from behind */}
      <Person {...YOU} position={[0.05, 0, -0.1]} rotation={[0, Math.PI, 0]} />
    </Shot>
  );
};

/** 38:60–48:00 — the dark kitchen. A stranger is sitting there. The lamp comes on. */
export const KitchenShot: React.FC<{ from: number }> = ({ from }) => {
  const { t, frame } = useT(from);
  const on = t >= BEATS.stranger;
  // Short seeded flicker when the lamp switches on.
  const flick = on && t < BEATS.stranger + 0.35 ? (random(`fl${frame}`) > 0.45 ? 1 : 0.15) : 1;
  const lamp = on ? flick : 0;
  const camZ = interpolate(t, [38.6, 48], [6.2, 3.0], { easing: Easing.inOut(Easing.sin) });
  const camY = interpolate(t, [38.6, 48], [1.75, 1.45]);
  const tilt = t > BEATS.welcome ? interpolate(t, [BEATS.welcome, BEATS.welcome + 0.6], [0, 0.12], clamp) : 0;
  return (
    <Shot bg="#03050b">
      <ambientLight intensity={0.14} color="#5e78b8" />
      {/* moonlight from the window behind him: silhouette */}
      <directionalLight position={[1, 3, -6]} intensity={1.8} color="#6f8ed6" />
      <directionalLight position={[-2, 2, 4]} intensity={0.25} color="#33456e" />
      <pointLight position={[0, 2.4, 0]} intensity={lamp * 16} color="#ffc27a" distance={7} decay={1.5} />
      <pointLight position={[-1.5, 1.8, -2.2]} intensity={lamp * 5} color="#ff3b4e" distance={4} />
      <Cam pos={[0.25, camY, camZ]} look={[0, 1.2, -0.6]} fov={38} />
      {/* room */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial color="#1a1c22" />
      </mesh>
      <mesh position={[0, 2, -2.6]}>
        <planeGeometry args={[10, 4]} />
        <meshStandardMaterial color="#1d2230" />
      </mesh>
      {/* window with moon */}
      <mesh position={[1.4, 1.9, -2.58]}>
        <planeGeometry args={[1.2, 1.1]} />
        <meshBasicMaterial color="#1b2e5c" toneMapped={false} />
      </mesh>
      <Glow position={[1.65, 2.2, -2.55]} color="#bcd0ff" size={0.6} />
      <mesh position={[1.4, 1.9, -2.57]}>
        <planeGeometry args={[0.04, 1.1]} />
        <meshBasicMaterial color="#0b0d14" />
      </mesh>
      {/* counters + fridge */}
      <mesh position={[-1.4, 0.45, -2.25]}>
        <boxGeometry args={[2.6, 0.9, 0.6]} />
        <meshStandardMaterial color="#2a2f3a" />
      </mesh>
      <mesh position={[-1.4, 0.92, -2.25]}>
        <boxGeometry args={[2.65, 0.05, 0.65]} />
        <meshStandardMaterial color="#545b68" roughness={0.3} />
      </mesh>
      <mesh position={[-3.2, 1.0, -2.2]}>
        <boxGeometry args={[0.9, 2.0, 0.7]} />
        <meshStandardMaterial color="#9aa1ab" metalness={0.5} roughness={0.35} />
      </mesh>
      {/* pendant lamp */}
      <mesh position={[0, 3.1, -0.6]}>
        <cylinderGeometry args={[0.01, 0.01, 1.1, 4]} />
        <meshStandardMaterial color="#111" />
      </mesh>
      <mesh position={[0, 2.5, -0.6]}>
        <coneGeometry args={[0.32, 0.28, 24, 1, true]} />
        <meshStandardMaterial color="#1a1a1a" side={THREE.DoubleSide} emissive="#ffb35a" emissiveIntensity={lamp * 0.3} />
      </mesh>
      <mesh position={[0, 2.4, -0.6]}>
        <sphereGeometry args={[0.07, 12, 12]} />
        <meshBasicMaterial color={lamp ? "#fff1cf" : "#2a2a2a"} toneMapped={false} />
      </mesh>
      {lamp ? <Glow position={[0, 2.35, -0.6]} color="#ffd59a" size={1.2} opacity={lamp} /> : null}
      {/* table + chairs */}
      <group position={[0, 0, -0.6]}>
        <Table color="#3d2b22" />
        <mesh position={[0, 0.45, -1.0]}>
          <boxGeometry args={[0.5, 0.06, 0.5]} />
          <meshStandardMaterial color="#2a1e18" />
        </mesh>
        <mesh position={[0, 0.85, -1.22]}>
          <boxGeometry args={[0.5, 0.8, 0.06]} />
          <meshStandardMaterial color="#2a1e18" />
        </mesh>
        {/* the empty chair waiting for you */}
        <mesh position={[0.2, 0.45, 1.0]} rotation={[0, 0.3, 0]}>
          <boxGeometry args={[0.5, 0.06, 0.5]} />
          <meshStandardMaterial color="#2a1e18" />
        </mesh>
      </group>
      {/* Ilya, seated, calm */}
      <group position={[0, 0, -1.55]}>
        <Person {...ILYA} pose="sit" headTilt={tilt} headTurn={Math.sin(t * 0.4) * 0.03} />
        {/* folded hands on the table */}
        <mesh position={[0, 0.83, 0.62]}>
          <sphereGeometry args={[0.1, 10, 8]} />
          <meshStandardMaterial color="#d8b49a" />
        </mesh>
      </group>
    </Shot>
  );
};

/** 48:00–54:80 — the silver box: set on the table, cyan seam glows, lid cracks, flash. */
export const BoxShot: React.FC<{ from: number }> = ({ from }) => {
  const { t, local } = useT(from);
  const slide = interpolate(t, [BEATS.boxSet - 0.2, BEATS.boxSet + 1.0], [-0.9, 0], { ...clamp, easing: Easing.out(Easing.cubic) });
  const handAway = interpolate(t, [49.6, 50.4], [0, -1.2], { ...clamp, easing: Easing.in(Easing.quad) });
  const glow = interpolate(t, [50.2, BEATS.others, BEATS.boxFlash], [0.05, 0.5, 3], clamp);
  const lid = interpolate(t, [BEATS.others, BEATS.boxFlash], [0, 0.35], { ...clamp, easing: Easing.in(Easing.cubic) });
  const black = t > BEATS.boxFlash + 0.25;
  const d = interpolate(local, [0, 5], [1.5, 0.75], { ...clamp, easing: Easing.inOut(Easing.sin) });
  if (black) {
    return (
      <Shot bg="#000">
        <Cam pos={[0, 1, 2]} look={[0, 0, 0]} />
      </Shot>
    );
  }
  return (
    <Shot bg="#03050b">
      <ambientLight intensity={0.12} color="#8fa6d6" />
      <pointLight position={[0, 2.4, 0]} intensity={14} color="#ffc27a" distance={6} decay={1.5} />
      <pointLight position={[0.8, 1.4, 0.8]} intensity={4} color="#dfe8ff" distance={4} />
      <pointLight position={[0, 0.95, 0]} intensity={glow * 6} color="#22d3ee" distance={3} />
      <Cam pos={[0.35 * d, 0.78 + d * 0.55, d]} look={[0, 0.84, 0]} fov={36} />
      <group position={[0, 0, 0]}>
        <Table color="#3d2b22" />
      </group>
      {/* the Brake: silver box */}
      <group position={[0, 0.8, slide]}>
        <mesh position={[0, 0.07, 0]}>
          <boxGeometry args={[0.36, 0.14, 0.24]} />
          <meshStandardMaterial color="#c9ced6" metalness={0.9} roughness={0.22} />
        </mesh>
        {/* lid hinged at the back */}
        <group position={[0, 0.145, -0.12]} rotation={[-lid, 0, 0]}>
          <mesh position={[0, 0.015, 0.12]}>
            <boxGeometry args={[0.37, 0.03, 0.25]} />
            <meshStandardMaterial color="#d7dbe2" metalness={0.9} roughness={0.2} />
          </mesh>
        </group>
        {/* glowing seam */}
        <mesh position={[0, 0.14, 0.121]}>
          <boxGeometry args={[0.37, 0.008, 0.005]} />
          <meshBasicMaterial color="#22d3ee" toneMapped={false} transparent opacity={Math.min(1, 0.3 + glow)} />
        </mesh>
        <Glow position={[0, 0.16, 0.05]} color="#22d3ee" size={0.2 + glow * 0.45} opacity={Math.min(1, glow)} />
        {lid > 0.02 ? (
          <mesh position={[0, 0.3, -0.02]}>
            <cylinderGeometry args={[0.02, 0.17, 0.35, 24, 1, true]} />
            <meshBasicMaterial color="#22d3ee" transparent opacity={0.45} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
          </mesh>
        ) : null}
      </group>
      {/* Ilya's hand + suit sleeve */}
      <group position={[0, 0.84, slide - 0.32 + handAway]}>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.13, 0.05, 0.16]} />
          <meshStandardMaterial color="#d8b49a" />
        </mesh>
        <mesh position={[0, 0.02, -0.22]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.065, 0.07, 0.32, 10]} />
          <meshStandardMaterial color="#15161c" />
        </mesh>
        <mesh position={[0, 0.02, -0.07]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.066, 0.066, 0.03, 10]} />
          <meshStandardMaterial color="#eeeeee" />
        </mesh>
      </group>
    </Shot>
  );
};

export type { V3 };
