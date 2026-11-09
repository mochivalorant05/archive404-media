import React from "react";
import * as THREE from "three";
import { Easing, interpolate, random, useCurrentFrame, useVideoConfig } from "remotion";
import { Building, Cam, Glow, Person, Shot, SkyBackground, shake, useCanvasTexture } from "../three-kit";
import { BEATS } from "./timeline";

type V3 = [number, number, number];
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** Absolute episode time (s) inside a shot mounted at `from` seconds. */
export const useT = (from: number) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return { t: from + frame / fps, local: frame / fps, frame };
};

const YOU = { shirt: "#3a4a6b", pants: "#1d2333", hair: "#1c1512" };

/* ------------------------------------------------------------------ street */

const Street: React.FC = () => (
  <>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -40]}>
      <planeGeometry args={[30, 140]} />
      <meshStandardMaterial color="#1a1d26" roughness={0.85} />
    </mesh>
    {/* lane dashes */}
    {Array.from({ length: 22 }).map((_, i) => (
      <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 6 - i * 6]}>
        <planeGeometry args={[0.18, 2.6]} />
        <meshStandardMaterial color="#d8d3b0" emissive="#d8d3b0" emissiveIntensity={0.15} />
      </mesh>
    ))}
    {/* crosswalk */}
    {Array.from({ length: 9 }).map((_, i) => (
      <mesh key={`c${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[-4.8 + i * 1.2, 0.012, 0.5]}>
        <planeGeometry args={[0.6, 3]} />
        <meshStandardMaterial color="#e8e8e8" emissive="#e8e8e8" emissiveIntensity={0.08} />
      </mesh>
    ))}
    {/* sidewalks */}
    {[-1, 1].map((s) => (
      <mesh key={s} position={[s * 8.5, 0.1, -40]}>
        <boxGeometry args={[3, 0.2, 140]} />
        <meshStandardMaterial color="#2a2e3a" />
      </mesh>
    ))}
    {/* buildings */}
    {Array.from({ length: 14 }).map((_, i) =>
      [-1, 1].map((s) => {
        const h = 10 + random(`bh${i}${s}`) * 26;
        return (
          <Building
            key={`${i}${s}`}
            position={[s * (13 + random(`bx${i}${s}`) * 2), 0, 4 - i * 9]}
            size={[7, h, 8]}
            seed={i * 2 + (s > 0 ? 1 : 0)}
          />
        );
      }),
    )}
    {/* street lamps */}
    {Array.from({ length: 6 }).map((_, i) =>
      [-1, 1].map((s) => (
        <group key={`${i}${s}`} position={[s * 7.4, 0, 2 - i * 16]}>
          <mesh position={[0, 3, 0]}>
            <cylinderGeometry args={[0.07, 0.09, 6, 6]} />
            <meshStandardMaterial color="#3b3f4c" />
          </mesh>
          <Glow position={[-s * 0.6, 6, 0]} color="#ffb24a" size={2.6} opacity={0.8} />
          <pointLight position={[-s * 0.6, 5.8, 0]} color="#ffad46" intensity={18} distance={14} decay={1.6} />
        </group>
      )),
    )}
  </>
);

const Truck: React.FC<{ position: V3; crumpled?: number; lights?: number; hazard?: boolean; frame?: number }> = ({
  position,
  crumpled = 0,
  lights = 1,
  hazard,
  frame = 0,
}) => {
  const hazardOn = hazard && Math.floor(frame / 10) % 2 === 0;
  return (
    <group position={position} rotation={[0, 0, crumpled * 0.05]}>
      {/* trailer */}
      <mesh position={[0, 2.3, -6.2]}>
        <boxGeometry args={[2.7, 3.6, 9]} />
        <meshStandardMaterial color="#b9bcc6" roughness={0.6} />
      </mesh>
      {/* cab */}
      <group position={[0, 0, crumpled * -0.5]} scale={[1, 1, 1 - crumpled * 0.35]}>
        <mesh position={[0, 1.75, -0.6]}>
          <boxGeometry args={[2.6, 2.5, 2.4]} />
          <meshStandardMaterial color="#8c1d24" roughness={0.45} metalness={0.3} />
        </mesh>
        {/* windshield */}
        <mesh position={[0, 2.35, 0.61]}>
          <planeGeometry args={[2.3, 1]} />
          <meshStandardMaterial color="#0e1420" metalness={0.8} roughness={0.15} />
        </mesh>
        {/* grill */}
        <mesh position={[0, 1.05, 0.62]}>
          <boxGeometry args={[1.6, 0.9, 0.05]} />
          <meshStandardMaterial color="#9aa0aa" metalness={0.9} roughness={0.3} />
        </mesh>
        {[-0.95, 0.95].map((x) => (
          <group key={x}>
            <mesh position={[x, 1.0, 0.63]}>
              <circleGeometry args={[0.22, 16]} />
              <meshBasicMaterial color={lights > 0 ? "#fff6dc" : "#333"} toneMapped={false} />
            </mesh>
            {lights > 0 ? <Glow position={[x, 1.0, 0.8]} color="#fff2cc" size={3.5 * lights} /> : null}
            {hazard ? (
              <Glow position={[x * 1.35, 1.6, 0.6]} color="#ff9a1f" size={hazardOn ? 1.6 : 0.01} />
            ) : null}
          </group>
        ))}
      </group>
      {/* wheels */}
      {[0.4, -3, -9].map((z) =>
        [-1.25, 1.25].map((x) => (
          <mesh key={`${z}${x}`} position={[x, 0.5, z]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.5, 0.5, 0.4, 14]} />
            <meshStandardMaterial color="#111" />
          </mesh>
        )),
      )}
      {lights > 0 ? (
        <pointLight position={[0, 1.4, 3]} intensity={90 * lights} distance={26} decay={1.4} color="#fff3d6" />
      ) : null}
    </group>
  );
};

/** 0:00–2:30 — POV behind you on a crosswalk; the truck charges at the camera. */
export const TruckShot: React.FC<{ from: number }> = ({ from }) => {
  const { t, frame } = useT(from);
  const z = interpolate(t, [0, BEATS.impact], [-75, -1.4], { ...clamp, easing: Easing.in(Easing.quad) });
  const sh = shake(frame, interpolate(t, [1.2, 2.3], [0, 0.12], clamp), 3);
  const dolly = interpolate(t, [0, 2.3], [4.2, 3.3], clamp);
  return (
    <Shot bg="#060912">
      <fog attach="fog" args={["#060912", 20, 90]} />
      <ambientLight intensity={0.25} color="#7f95c8" />
      <hemisphereLight args={["#3d5a9a", "#120c08", 0.4]} />
      <Cam pos={[0.7 + sh[0], 1.75 + sh[1], dolly]} look={[0.1, 1.5, -20]} fov={44} />
      <Street />
      <Person {...YOU} position={[0, 0, 0.5]} rotation={[0, Math.PI, 0]} headTurn={interpolate(t, [0.6, 1.2], [0.5, 0], clamp)} />
      <Truck position={[0, 0, z]} />
    </Shot>
  );
};

/** 2:30–4:74 — after the flash: you stand up from the asphalt, the truck is wrecked behind you. */
export const StandUpShot: React.FC<{ from: number }> = ({ from }) => {
  const { t, frame, local } = useT(from);
  const rise = interpolate(t, [BEATS.hookLine2 - 0.1, 3.6], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const camZ = interpolate(local, [0, 2.44], [5.2, 3.9], clamp);
  const sh = shake(frame, interpolate(local, [0, 0.5], [0.08, 0], clamp), 7);
  return (
    <Shot bg="#060912">
      <fog attach="fog" args={["#060912", 12, 60]} />
      <ambientLight intensity={0.35} color="#7f95c8" />
      <pointLight position={[2, 3, 3]} intensity={30} color="#ffb070" distance={14} />
      <Cam pos={[1.6 + sh[0], 0.45 + sh[1], camZ]} look={[0, 0.9, -1]} fov={46} />
      <Street />
      <Truck position={[0.6, 0, -4.5]} crumpled={1} lights={0.35} hazard frame={frame} />
      {/* smoke puffs */}
      {Array.from({ length: 14 }).map((_, i) => {
        const age = (local * 0.6 + random(`sm${i}`)) % 1;
        return (
          <mesh key={i} position={[0.6 + (random(`sx${i}`) - 0.5) * 2.4, 1 + age * 3.5, -3.7 + random(`sz${i}`)]} scale={0.4 + age * 1.2}>
            <sphereGeometry args={[1, 10, 8]} />
            <meshStandardMaterial color="#5c6270" transparent opacity={0.28 * (1 - age)} depthWrite={false} />
          </mesh>
        );
      })}
      {/* debris */}
      {Array.from({ length: 16 }).map((_, i) => (
        <mesh key={`d${i}`} position={[(random(`dx${i}`) - 0.5) * 6, 0.05, -2.5 + random(`dz${i}`) * 4]} rotation={[0, random(`dr${i}`) * 6, 0]}>
          <boxGeometry args={[0.15 + random(`ds${i}`) * 0.25, 0.04, 0.1 + random(`dt${i}`) * 0.2]} />
          <meshStandardMaterial color={i % 3 ? "#9aa0aa" : "#8c1d24"} metalness={0.5} />
        </mesh>
      ))}
      {/* you: pivot at the feet, rotating from lying (back to ground) to standing */}
      <group position={[0, 0, 0.6]} rotation={[0, -0.5, 0]}>
        <group position={[0, 0, 0]} rotation={[interpolate(rise, [0, 1], [-Math.PI / 2 + 0.1, 0]), 0, 0]}>
          <Person {...YOU} torn pose={rise < 0.6 ? "crouch" : "stand"} amount={1 - rise} rotation={[0, Math.PI, 0]} />
        </group>
      </group>
    </Shot>
  );
};

/* ---------------------------------------------------------------------- ER */

const Monitor: React.FC<{ t: number }> = ({ t }) => {
  const showAge = t >= BEATS.bodyIs25;
  const showLic = t >= BEATS.license43;
  const blink = Math.floor(t * 3) % 2 === 0;
  const key = `${Math.round(t * 15)}`;
  const tex = useCanvasTexture(
    512,
    320,
    (ctx, w, h) => {
      ctx.fillStyle = "#03121a";
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = "#0d3a44";
      for (let x = 0; x < w; x += 32) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      // heartbeat line
      ctx.strokeStyle = "#22d3ee";
      ctx.lineWidth = 4;
      ctx.beginPath();
      for (let x = 0; x < w; x += 4) {
        const ph = (x / w) * 3 + t * 1.4;
        const f = ph % 1;
        const y = f > 0.45 && f < 0.5 ? -60 : f > 0.5 && f < 0.55 ? 40 : Math.sin(ph * 20) * 2;
        if (x === 0) ctx.moveTo(x, 90 + y);
        else ctx.lineTo(x, 90 + y);
      }
      ctx.stroke();
      ctx.font = "bold 44px 'DejaVu Sans Mono', monospace";
      if (showAge) {
        ctx.fillStyle = "#22d3ee";
        ctx.fillText("BODY AGE:   25", 30, 210);
      }
      if (showLic) {
        ctx.fillStyle = blink ? "#ff3b4e" : "#7a1a24";
        ctx.fillText("LICENSE AGE: 43", 30, 280);
      }
    },
    key,
  );
  return (
    <group position={[0.9, 2.3, -2.4]}>
      <mesh>
        <boxGeometry args={[1.75, 1.15, 0.08]} />
        <meshStandardMaterial color="#20262f" />
      </mesh>
      <mesh position={[0, 0, 0.045]}>
        <planeGeometry args={[1.62, 1.01]} />
        <meshBasicMaterial map={tex} toneMapped={false} />
      </mesh>
      <pointLight position={[0, 0, 0.6]} color="#22d3ee" intensity={4} distance={4} />
    </group>
  );
};

/** 4:74–13:40 — the ER: scans, cyan scanner ring, the monitor reveals 25 vs 43. */
export const ErShot: React.FC<{ from: number }> = ({ from }) => {
  const { t, frame } = useT(from);
  // Camera: orbit the bed, then push to the monitor past a frozen doctor.
  const a = interpolate(t, [4.74, 8.6], [0.9, 0.2], { ...clamp, easing: Easing.inOut(Easing.sin) });
  const toMon = interpolate(t, [8.6, 11.0], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const orbit: V3 = [Math.sin(a) * 4.6, 3.1, Math.cos(a) * 4.6];
  const mon: V3 = [0.9, 2.3, 1.7];
  const pos = orbit.map((v, i) => v + (mon[i] - v) * toMon) as V3;
  const look: V3 = [0.9 * toMon, 0.8 + 1.5 * toMon, -2.4 * toMon];
  // (monitor is 1.75 wide; at ~4 units the portrait frame shows ~1.7 units across)
  const scanX = interpolate((t * 0.55) % 1, [0, 1], [-1.1, 1.1]);
  const sh = shake(frame, t > BEATS.license43 && t < BEATS.license43 + 0.4 ? 0.03 : 0, 2);
  return (
    <Shot bg="#0b1820">
      <ambientLight intensity={0.5} color="#bfe8ee" />
      <directionalLight position={[2, 6, 3]} intensity={1.6} color="#e6fbff" />
      <Cam pos={[pos[0] + sh[0], pos[1] + sh[1], pos[2]]} look={look} fov={42} />
      {/* room */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[14, 10]} />
        <meshStandardMaterial color="#9fb6ba" roughness={0.6} />
      </mesh>
      <mesh position={[0, 3, -2.6]}>
        <planeGeometry args={[14, 6]} />
        <meshStandardMaterial color="#5f8a91" />
      </mesh>
      <mesh position={[-4.5, 3, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[10, 6]} />
        <meshStandardMaterial color="#557d84" />
      </mesh>
      {/* bed */}
      <mesh position={[0, 0.55, 0]}>
        <boxGeometry args={[2.4, 0.25, 1.1]} />
        <meshStandardMaterial color="#e9f1f2" />
      </mesh>
      <mesh position={[0, 0.25, 0]}>
        <boxGeometry args={[2.2, 0.5, 0.9]} />
        <meshStandardMaterial color="#7d8b90" metalness={0.5} />
      </mesh>
      <Person {...YOU} torn pose="lie" position={[0, 0.58, 0]} rotation={[0, Math.PI / 2, 0]} />
      {/* scanner ring */}
      <mesh position={[scanX, 0.85, 0]} rotation={[0, Math.PI / 2, 0]}>
        <torusGeometry args={[0.75, 0.035, 8, 40]} />
        <meshBasicMaterial color="#22d3ee" toneMapped={false} />
      </mesh>
      <mesh position={[scanX, 0.85, 0]} rotation={[0, Math.PI / 2, 0]}>
        <circleGeometry args={[0.75, 40]} />
        <meshBasicMaterial color="#22d3ee" transparent opacity={0.12} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <pointLight position={[scanX, 1.1, 0]} color="#22d3ee" intensity={6} distance={3} />
      {/* doctors */}
      <Person coat="#e8eef0" pants="#3f8f8a" shirt="#3f8f8a" hair="#3a2a1f" position={[0.4, 0, -1.1]} headTilt={0.3} />
      <Person coat="#3f8f8a" pants="#3f8f8a" hair="#a5642f" skin="#c98e6c" position={[-0.8, 0, -1.15]} headTilt={0.35} headTurn={0.3} />
      <Person
        coat="#3f8f8a"
        pants="#3f8f8a"
        hair="#111"
        skin="#8d5a3b"
        position={[1.55, 0, 0.9]}
        rotation={[0, -2.2 + (t > BEATS.bodyIs25 ? 0 : Math.sin(t * 2) * 0.1), 0]}
        headTurn={t > BEATS.bodyIs25 ? -0.6 : 0}
      />
      {/* IV stand */}
      <mesh position={[-1.6, 1.1, -0.9]}>
        <cylinderGeometry args={[0.02, 0.02, 2.2, 6]} />
        <meshStandardMaterial color="#c0c6cc" metalness={0.8} />
      </mesh>
      <Monitor t={t} />
    </Shot>
  );
};

/* ---------------------------------------------------------------- montage */

/** 13:40–16:50 — "Weeks go by": day/night cycles through the window, clock spinning. */
export const WeeksShot: React.FC<{ from: number }> = ({ from }) => {
  const { t, local } = useT(from);
  const cycle = local * 1.6; // days per second
  const day = (Math.sin(cycle * Math.PI * 2) + 1) / 2;
  const sky = new THREE.Color("#0b1530").lerp(new THREE.Color("#ffb45a"), day);
  const week = Math.min(6, 1 + Math.floor(local * 1.7));
  const tex = useCanvasTexture(
    256,
    256,
    (ctx, w) => {
      ctx.fillStyle = "#f3eee2";
      ctx.fillRect(0, 0, w, w);
      ctx.fillStyle = "#c23a3a";
      ctx.fillRect(0, 0, w, 60);
      ctx.fillStyle = "#fff";
      ctx.font = "bold 40px Inter, Arial";
      ctx.textAlign = "center";
      ctx.fillText("WEEK", w / 2, 46);
      ctx.fillStyle = "#222";
      ctx.font = "900 150px Inter, Arial";
      ctx.fillText(String(week), w / 2, 210);
    },
    week,
  );
  return (
    <Shot bg="#140f0a">
      <ambientLight intensity={0.35} color="#ffd8a8" />
      <pointLight position={[0.6, 1.4, 0.8]} color="#ffb15c" intensity={10} distance={6} />
      <directionalLight position={[0, 2, -4]} intensity={0.3 + day * 2.2} color={sky} />
      <Cam pos={[interpolate(t, [13.4, 16.5], [1.6, 0.9]), 1.7, 3.6]} look={[0, 1.4, -1]} fov={44} />
      {/* wall + window */}
      <mesh position={[0, 2, -2]}>
        <planeGeometry args={[10, 6]} />
        <meshStandardMaterial color="#3a2d24" />
      </mesh>
      <mesh position={[-0.7, 2.1, -1.98]}>
        <planeGeometry args={[1.8, 1.6]} />
        <meshBasicMaterial color={sky} toneMapped={false} />
      </mesh>
      {/* sun/moon crossing the window */}
      <mesh position={[-0.7 + Math.cos(cycle * Math.PI * 2) * 0.7, 2.1 + Math.sin(cycle * Math.PI * 2) * 0.6, -1.97]}>
        <circleGeometry args={[0.12, 20]} />
        <meshBasicMaterial color={day > 0.5 ? "#fff1b8" : "#dfe6ff"} toneMapped={false} />
      </mesh>
      {[0, 1].map((i) => (
        <mesh key={i} position={[-0.7 + (i ? 0 : 0), 2.1, -1.96]} rotation={[0, 0, i ? Math.PI / 2 : 0]}>
          <planeGeometry args={[0.05, i ? 1.8 : 1.6]} />
          <meshStandardMaterial color="#1e1712" />
        </mesh>
      ))}
      {/* wall clock */}
      <group position={[1.15, 2.55, -1.95]}>
        <mesh>
          <circleGeometry args={[0.32, 32]} />
          <meshStandardMaterial color="#efe6d2" />
        </mesh>
        <mesh rotation={[0, 0, -local * 40]} position={[0, 0, 0.01]}>
          <planeGeometry args={[0.02, 0.5]} />
          <meshBasicMaterial color="#222" />
        </mesh>
        <mesh rotation={[0, 0, -local * 4]} position={[0, 0, 0.012]}>
          <planeGeometry args={[0.035, 0.32]} />
          <meshBasicMaterial color="#c23a3a" />
        </mesh>
      </group>
      {/* calendar */}
      <mesh position={[1.15, 1.6, -1.97]}>
        <planeGeometry args={[0.55, 0.55]} />
        <meshBasicMaterial map={tex} />
      </mesh>
      {/* desk + you working */}
      <mesh position={[0, 0.75, -0.6]}>
        <boxGeometry args={[2.2, 0.08, 1]} />
        <meshStandardMaterial color="#6b4a32" />
      </mesh>
      <mesh position={[0, 0.95, -0.85]} rotation={[-0.2, 0, 0]}>
        <boxGeometry args={[0.7, 0.45, 0.03]} />
        <meshStandardMaterial color="#222" emissive="#ffd6a0" emissiveIntensity={0.4} />
      </mesh>
      <Person {...YOU} pose="sit" position={[0, 0, 0.25]} rotation={[0, Math.PI, 0]} headTilt={0.15 + Math.sin(local * 9) * 0.05} />
    </Shot>
  );
};

/** 16:50–18:25 — "A cut closes by morning": close-up of the palm healing. */
export const CutShot: React.FC<{ from: number }> = ({ from }) => {
  const { t, local } = useT(from);
  const heal = interpolate(t, [BEATS.cutCloses + 0.2, 17.9], [1, 0], { ...clamp, easing: Easing.inOut(Easing.quad) });
  return (
    <Shot bg="#1a120b">
      <SkyBackground stops={[[0, "#3a2414"], [1, "#0f0a06"]]} k="cut" />
      <ambientLight intensity={0.6} color="#ffd9b0" />
      <directionalLight position={[2, 4, 2]} intensity={2} color="#ffc27a" />
      <Cam pos={[0.15, 2.0 - local * 0.12, 0.9]} look={[0, 0, 0]} fov={38} />
      <group rotation={[0, 0.3, 0]}>
        {/* palm */}
        <mesh>
          <boxGeometry args={[0.9, 0.18, 1.0]} />
          <meshStandardMaterial color="#d9a98a" roughness={0.6} />
        </mesh>
        {/* fingers */}
        {[-0.33, -0.11, 0.11, 0.33].map((x, i) => (
          <mesh key={x} position={[x, 0, -0.78 + Math.abs(x) * 0.25]} rotation={[Math.PI / 2, 0, 0]}>
            <capsuleGeometry args={[0.095, 0.5 - i * 0.02, 4, 8]} />
            <meshStandardMaterial color="#d9a98a" roughness={0.6} />
          </mesh>
        ))}
        <mesh position={[0.58, 0, 0.05]} rotation={[Math.PI / 2, 0, -0.9]}>
          <capsuleGeometry args={[0.1, 0.4, 4, 8]} />
          <meshStandardMaterial color="#d9a98a" roughness={0.6} />
        </mesh>
        {/* wrist */}
        <mesh position={[0, 0, 0.9]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.3, 0.32, 0.8, 12]} />
          <meshStandardMaterial color="#3a4a6b" />
        </mesh>
        {/* the cut */}
        <mesh position={[0, 0.095, 0]} rotation={[-Math.PI / 2, 0, 0.5]} scale={[Math.max(0.001, heal), 1, 1]}>
          <planeGeometry args={[0.85, 0.05]} />
          <meshBasicMaterial color="#b3121e" />
        </mesh>
        {/* healing sparkles */}
        {heal < 0.98 && heal > 0.02
          ? Array.from({ length: 10 }).map((_, i) => {
              const u = random(`sp${i}`) - 0.5;
              return (
                <Glow
                  key={i}
                  position={[Math.cos(0.5) * u * 0.85 * heal, 0.14 + ((local * 2 + random(`sy${i}`)) % 1) * 0.25, -Math.sin(0.5) * u * 0.85 * heal]}
                  color="#22d3ee"
                  size={0.12}
                />
              );
            })
          : null}
      </group>
    </Shot>
  );
};

/** 18:25–20:25 — "A fall barely stings": you drop from a roof and land in a dust ring. */
export const FallShot: React.FC<{ from: number }> = ({ from }) => {
  const { t, frame } = useT(from);
  const y = interpolate(t, [18.3, BEATS.fallLand], [16, 0], { ...clamp, easing: Easing.in(Easing.quad) });
  const landed = t >= BEATS.fallLand;
  const crouch = landed ? interpolate(t, [BEATS.fallLand, BEATS.fallLand + 0.15, 19.9], [0.3, 1, 0], clamp) : 0;
  const ring = interpolate(t, [BEATS.fallLand, BEATS.fallLand + 0.8], [0.2, 3.5], clamp);
  const sh = shake(frame, landed && t < BEATS.fallLand + 0.35 ? 0.09 : 0, 5);
  const lookY = Math.max(1, Math.min(y + 1, 9));
  return (
    <Shot bg="#2b1a10">
      <SkyBackground stops={[[0, "#f39a4a"], [0.6, "#7c3b2a"], [1, "#2b1a10"]]} k="fall" />
      <ambientLight intensity={0.5} color="#ffd2a1" />
      <directionalLight position={[-4, 10, 6]} intensity={2.2} color="#ffbf80" />
      <Cam pos={[3.6 + sh[0], 0.6 + sh[1], 4.2]} look={[0, lookY, 0]} fov={52} />
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color="#3b2c26" />
      </mesh>
      <Building position={[-3.2, 0, -1.5]} size={[4, 18, 5]} seed={9} base="#2a2230" litColor="#ffb867" />
      <Building position={[4, 0, -9]} size={[5, 22, 5]} seed={10} base="#2a2230" litColor="#ffb867" />
      <Person {...YOU} position={[0, y, 0]} pose={landed ? "crouch" : "stand"} amount={crouch} rotation={[0, 0.6, 0]} />
      {landed ? (
        <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[ring, ring, 1]}>
          <ringGeometry args={[0.6, 1, 40]} />
          <meshBasicMaterial color="#d9b48c" transparent opacity={interpolate(ring, [0.2, 3.5], [0.8, 0])} depthWrite={false} />
        </mesh>
      ) : null}
    </Shot>
  );
};

/** 20:25–26:60 — "you feel like a god": arms up on the rooftop, amber god-rays. */
export const GodShot: React.FC<{ from: number }> = ({ from }) => {
  const { t, local } = useT(from);
  const arms = interpolate(t, [21.6, 23.3], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const a = interpolate(t, [20.25, 26.6], [2.6, 3.6]);
  const r = interpolate(t, [20.25, 26.6], [6.5, 4.2]);
  const h = interpolate(t, [20.25, 26.6], [3.5, 0.9], { easing: Easing.inOut(Easing.cubic) });
  return (
    <Shot bg="#2b1306">
      <SkyBackground stops={[[0, "#3b1640"], [0.45, "#f0743a"], [0.62, "#ffc46b"], [1, "#2b1306"]]} k="god" />
      <fog attach="fog" args={["#c76a3a", 25, 90]} />
      <ambientLight intensity={0.55} color="#ffcf9a" />
      <directionalLight position={[0, 3, -10]} intensity={3} color="#ffb257" />
      <Cam pos={[Math.sin(a) * r, h, Math.cos(a) * r]} look={[0, 1.6, 0]} fov={46} />
      {/* rooftop */}
      <mesh position={[0, -0.25, 0]}>
        <boxGeometry args={[12, 0.5, 12]} />
        <meshStandardMaterial color="#4a3a36" />
      </mesh>
      {[-6, 6].map((x) => (
        <mesh key={x} position={[x, 0.25, 0]}>
          <boxGeometry args={[0.3, 0.5, 12]} />
          <meshStandardMaterial color="#5a4842" />
        </mesh>
      ))}
      {/* city far below */}
      {Array.from({ length: 30 }).map((_, i) => (
        <Building
          key={i}
          position={[(random(`gx${i}`) - 0.5) * 80, -30, -15 - random(`gz${i}`) * 50]}
          size={[5, 15 + random(`gh${i}`) * 30, 5]}
          seed={i + 20}
          base="#2a1b20"
          litColor="#ffcf7a"
        />
      ))}
      {/* god rays behind you */}
      <group position={[0, 2.2, -1.5]} rotation={[0, 0, local * 0.15]}>
        {Array.from({ length: 9 }).map((_, i) => (
          <mesh key={i} rotation={[0, 0, (i / 9) * Math.PI * 2]} position={[0, 0, 0]}>
            <planeGeometry args={[0.35, 14]} />
            <meshBasicMaterial
              color="#ffcf7a"
              transparent
              opacity={0.08 + arms * 0.12}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              side={THREE.DoubleSide}
            />
          </mesh>
        ))}
      </group>
      <Glow position={[0, 2.2, -1.6]} color="#ffd38a" size={2.5 + arms * 2.5} opacity={0.75} />
      <Person {...YOU} pose="armsUp" amount={arms} position={[0, 0, 0]} rotation={[0, Math.PI - 0.2, 0]} headTilt={-0.25 * arms} />
    </Shot>
  );
};
