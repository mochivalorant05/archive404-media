import React from "react";
import * as THREE from "three";
import { Easing, interpolate } from "remotion";
import { C } from "../hud";
import { Episode, type EpisodeConfig } from "../Episode";
import { Cam, Glow, Person, Rain, Shot, SilverCar, Building, Umbrella, useCanvasTexture, useT, rnd, SkyBackground } from "../three-kit";

/* FOREVER 25 · Episode 2 "Older Than You" — script & timings from the series doc. */

type V3 = [number, number, number];
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const YOU = { shirt: "#3a4a6b", pants: "#1d2333", hair: "#1c1512" };
const DAUGHTER_OLD = { hair: "#c9ccd3", skin: "#e2b89d", shirt: "#d9e3ea", longHair: "#c9ccd3", eyes: true, old: true };
const ILYA = { coat: "#15161c", pants: "#121318", shoes: "#060607", hair: "#0d0d10", skin: "#d8b49a", tie: "#d8202f", eyes: true };

const T = {
  bed: [0, 4.7],
  photo: [4.7, 8.9],
  hands: [8.9, 15.4],
  passport: [15.4, 17.9],
  bank: [17.9, 19.4],
  graves: [19.4, 21.1],
  names: [21.1, 23.0],
  disguise: [23.0, 26.6],
  window: [26.6, 33.2],
  mirror: [33.2, 37.6],
  funeral: [37.6, 45.0],
  oldPhoto: [45.0, 54.9],
} as const;
const END = 54.9;
const DURATION = 62;

/* ------------------------------------------------------------ hospital */

const HospitalRoom: React.FC<{ t: number }> = ({ t }) => (
  <>
    <ambientLight intensity={0.35} color="#9fb6d8" />
    <pointLight position={[-1.2, 2.4, 0.8]} intensity={9} color="#ffd2a0" distance={6} />
    <pointLight position={[1.6, 2.2, -1.4]} intensity={3 + Math.sin(t * 6) * 0.3} color="#22d3ee" distance={4} />
    <mesh rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[12, 10]} />
      <meshStandardMaterial color="#5a6b70" />
    </mesh>
    <mesh position={[0, 2.5, -2.2]}>
      <planeGeometry args={[12, 5]} />
      <meshStandardMaterial color="#3e5357" />
    </mesh>
    {/* window with night */}
    <mesh position={[-1.8, 2.2, -2.18]}>
      <planeGeometry args={[1.4, 1.2]} />
      <meshBasicMaterial color="#0f1d3a" />
    </mesh>
    {/* bed */}
    <mesh position={[0, 0.55, 0]}>
      <boxGeometry args={[1.1, 0.25, 2.3]} />
      <meshStandardMaterial color="#e9f1f2" />
    </mesh>
    <mesh position={[0, 0.72, -0.95]} rotation={[0.5, 0, 0]}>
      <boxGeometry args={[1.0, 0.12, 0.6]} />
      <meshStandardMaterial color="#f4f7f8" />
    </mesh>
    <mesh position={[0, 0.25, 0]}>
      <boxGeometry args={[1, 0.5, 2.1]} />
      <meshStandardMaterial color="#7d8b90" metalness={0.5} />
    </mesh>
    {/* blanket */}
    <mesh position={[0, 0.72, 0.35]}>
      <boxGeometry args={[1.05, 0.12, 1.5]} />
      <meshStandardMaterial color="#8fa9c4" />
    </mesh>
    {/* heart monitor */}
    <group position={[1.1, 1.6, -1.2]} rotation={[0, -0.5, 0]}>
      <mesh>
        <boxGeometry args={[0.6, 0.45, 0.12]} />
        <meshStandardMaterial color="#20262f" />
      </mesh>
      <mesh position={[0, 0, 0.065]}>
        <planeGeometry args={[0.52, 0.36]} />
        <meshBasicMaterial color="#04161c" />
      </mesh>
      <mesh position={[((t * 0.6) % 1) * 0.5 - 0.25, 0, 0.07]}>
        <planeGeometry args={[0.03, 0.03 + (((t * 0.6) % 1) > 0.9 ? 0.2 : 0)]} />
        <meshBasicMaterial color="#22d3ee" toneMapped={false} />
      </mesh>
    </group>
  </>
);

/** Old daughter lying in bed (head on the raised pillow). */
const OldDaughterInBed: React.FC = () => (
  <group>
    <Person {...DAUGHTER_OLD} pose="lie" position={[0, 0.62, 0.05]} />
  </group>
);

/** Young hand (yours) over an old hand (hers). */
const Hands: React.FC<{ position: V3; rotation?: V3 }> = ({ position, rotation = [0, 0, 0] }) => (
  <group position={position} rotation={rotation}>
    {/* her old hand */}
    <mesh position={[0, 0, 0]} scale={[0.085, 0.03, 0.11]}>
      <sphereGeometry args={[1, 16, 12]} />
      <meshStandardMaterial color="#e6c4ad" roughness={0.95} />
    </mesh>
    {[-0.05, -0.017, 0.017, 0.05].map((x) => (
      <mesh key={x} position={[x, -0.005, -0.12]} rotation={[Math.PI / 2, 0, 0]}>
        <capsuleGeometry args={[0.014, 0.06, 4, 8]} />
        <meshStandardMaterial color="#e6c4ad" roughness={0.95} />
      </mesh>
    ))}
    {[0, 1, 2].map((i) => (
      <mesh key={i} position={[-0.03 + i * 0.03, 0.026, 0.02 + i * 0.03]}>
        <sphereGeometry args={[0.008, 6, 6]} />
        <meshStandardMaterial color="#b98a6a" />
      </mesh>
    ))}
    <mesh position={[0, -0.01, 0.22]} rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[0.05, 0.055, 0.3, 10]} />
      <meshStandardMaterial color="#d9e3ea" />
    </mesh>
    {/* your young hand on top */}
    <group position={[0.01, 0.04, -0.02]} rotation={[0, 0.3, 0]}>
      <mesh scale={[0.09, 0.032, 0.115]}>
        <sphereGeometry args={[1, 16, 12]} />
        <meshStandardMaterial color="#d9a98a" roughness={0.55} />
      </mesh>
      {[-0.055, -0.018, 0.018, 0.055].map((x) => (
        <mesh key={x} position={[x, 0, -0.125]} rotation={[Math.PI / 2, 0, 0]}>
          <capsuleGeometry args={[0.016, 0.07, 4, 8]} />
          <meshStandardMaterial color="#d9a98a" roughness={0.55} />
        </mesh>
      ))}
    </group>
    <mesh position={[0.12, 0.06, -0.22]} rotation={[Math.PI / 2, 0, 0.3]}>
      <cylinderGeometry args={[0.055, 0.06, 0.35, 10]} />
      <meshStandardMaterial color="#3a4a6b" />
    </mesh>
  </group>
);

const BedShot: React.FC<{ from: number }> = ({ from }) => {
  const { t, local } = useT(from);
  const k = interpolate(local, [0, 4.7], [0, 1], { easing: Easing.inOut(Easing.cubic) });
  const pos: V3 = [1.9 - k * 0.7, 1.75 - k * 0.4, 2.4 - k * 0.9];
  const look: V3 = [0.15, 0.75, -0.25 + k * 0.2];
  return (
    <Shot bg="#0a1218">
      <HospitalRoom t={t} />
      <Cam pos={pos} look={look} fov={38} />
      <OldDaughterInBed />
      <Hands position={[0.38, 0.8, 0.15]} rotation={[0, -0.4, 0]} />
      <Person {...YOU} pose="sit" position={[0.95, 0, 0.55]} rotation={[0, -1.9, 0]} />
      <mesh position={[0.95, 0.45, 0.55]}>
        <boxGeometry args={[0.5, 0.06, 0.5]} />
        <meshStandardMaterial color="#555" />
      </mesh>
    </Shot>
  );
};

/** Framed photo of her at 13, on the nightstand. */
const useGirlPhoto = (age13: boolean, sepia = false, scar = false, stamp = false) =>
  useCanvasTexture(
    400,
    480,
    (ctx, w, h) => {
      ctx.fillStyle = sepia ? "#e9dcc0" : "#f4efe4";
      ctx.fillRect(0, 0, w, h);
      const g = ctx.createLinearGradient(0, 20, 0, 400);
      g.addColorStop(0, sepia ? "#b79a6e" : "#7fb6e6");
      g.addColorStop(1, sepia ? "#6d5638" : "#e8c27a");
      ctx.fillStyle = g;
      ctx.fillRect(20, 20, w - 40, 380);
      // girl
      ctx.fillStyle = sepia ? "#5a4630" : "#c24a6a";
      ctx.beginPath();
      ctx.roundRect(140, 250, 120, 150, 36);
      ctx.fill();
      ctx.fillStyle = sepia ? "#c9a983" : "#e7bc9a";
      ctx.beginPath();
      ctx.arc(200, 205, 56, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = sepia ? "#3a2a18" : "#4a2c18";
      ctx.beginPath();
      ctx.arc(200, 190, 58, Math.PI, 0);
      ctx.fill();
      ctx.fillRect(142, 190, 22, 90);
      ctx.fillRect(236, 190, 22, 90);
      // eyes (your eyes)
      ctx.fillStyle = "#1a2a3a";
      ctx.beginPath();
      ctx.arc(180, 210, 7, 0, Math.PI * 2);
      ctx.arc(220, 210, 7, 0, Math.PI * 2);
      ctx.fill();
      if (scar) {
        ctx.strokeStyle = "#8a3a2a";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(226, 226);
        ctx.lineTo(244, 244);
        ctx.stroke();
      }
      if (sepia) {
        ctx.fillStyle = "rgba(80,50,20,0.18)";
        ctx.fillRect(20, 20, w - 40, 380);
      }
      ctx.fillStyle = "#1f2a6b";
      ctx.font = "italic bold 40px 'DejaVu Serif', serif";
      ctx.textAlign = "center";
      if (age13) ctx.fillText("Emma, 13", w / 2, 448);
      if (stamp) {
        ctx.save();
        ctx.translate(310, 360);
        ctx.rotate(-0.25);
        ctx.strokeStyle = "#b3121e";
        ctx.lineWidth = 6;
        ctx.strokeRect(-70, -34, 140, 68);
        ctx.fillStyle = "#b3121e";
        ctx.font = "900 50px 'DejaVu Sans', sans-serif";
        ctx.fillText("1618", 0, 18);
        ctx.restore();
      }
    },
    `${age13}${sepia}${scar}${stamp}`,
  );

const PhotoShot: React.FC<{ from: number }> = ({ from }) => {
  const { t, local } = useT(from);
  const tex = useGirlPhoto(true);
  const d = interpolate(local, [0, 4.2], [1.4, 0.75], { easing: Easing.out(Easing.quad) });
  return (
    <Shot bg="#0a1218">
      <HospitalRoom t={t} />
      <Cam pos={[-1.5 + 0.2, 1.05 + d * 0.15, -0.3 + d]} look={[-1.5, 0.95, -0.4]} fov={34} />
      {/* nightstand */}
      <mesh position={[-1.5, 0.35, -0.4]}>
        <boxGeometry args={[0.6, 0.7, 0.5]} />
        <meshStandardMaterial color="#6d5b49" />
      </mesh>
      <group position={[-1.5, 0.92, -0.45]} rotation={[-0.15, 0.15, 0]}>
        <mesh>
          <boxGeometry args={[0.36, 0.43, 0.03]} />
          <meshStandardMaterial color="#c9a46a" metalness={0.6} roughness={0.35} />
        </mesh>
        <mesh position={[0, 0, 0.017]}>
          <planeGeometry args={[0.3, 0.36]} />
          <meshStandardMaterial map={tex} />
        </mesh>
      </group>
      {/* small vase */}
      <mesh position={[-1.3, 0.82, -0.3]}>
        <cylinderGeometry args={[0.05, 0.04, 0.24, 10]} />
        <meshStandardMaterial color="#9fc4d8" transparent opacity={0.7} />
      </mesh>
      <Glow position={[-1.28, 1.0, -0.3]} color="#ffb6c9" size={0.15} />
    </Shot>
  );
};

const HandsShot: React.FC<{ from: number }> = ({ from }) => {
  const { t, local } = useT(from);
  // 8.9–11.5 her face looking at you; 11.5–15.4 back to hands, push in.
  const faceView = t < 11.5;
  const k = interpolate(local, [0, 6.5], [0, 1]);
  return (
    <Shot bg="#0a1218">
      <HospitalRoom t={t} />
      {faceView ? (
        <Cam pos={[1.0, 1.65, 0.45 - k * 0.2]} look={[0, 0.8, -0.75]} fov={34} />
      ) : (
        <Cam pos={[-0.65 + k * 0.15, 1.5 - k * 0.15, 1.35 - k * 0.25]} look={[0.35, 0.8, 0.1]} fov={34} />
      )}
      <OldDaughterInBed />
      <Hands position={[0.38, 0.8, 0.15]} rotation={[0, -0.4, 0]} />
      <Person {...YOU} pose="sit" position={[0.95, 0, 0.55]} rotation={[0, -1.9, 0]} headTilt={0.25} />
      {/* a tear catching the cyan light */}
      {!faceView && t > 13.2 ? <Glow position={[0.86, 1.3, 0.45]} color="#bfefff" size={0.05} /> : null}
    </Shot>
  );
};

/* ----------------------------------------------------- disguise montage */

const useCardTexture = (draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void, key: unknown, w = 512, h = 340) =>
  useCanvasTexture(w, h, draw, key);

const PassportShot: React.FC<{ from: number }> = ({ from }) => {
  const { t, local } = useT(from);
  const expired = t >= 17.34;
  const tex = useCardTexture(
    (ctx, w, h) => {
      ctx.fillStyle = "#e9e4d6";
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "#2c3e66";
      ctx.fillRect(0, 0, w, 54);
      ctx.fillStyle = "#fff";
      ctx.font = "bold 30px 'DejaVu Sans'";
      ctx.fillText("PASSPORT", 20, 38);
      ctx.fillStyle = "#c9b79a";
      ctx.fillRect(24, 80, 150, 190);
      ctx.fillStyle = "#3a4a6b";
      ctx.beginPath();
      ctx.arc(99, 150, 42, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(49, 200, 100, 70);
      ctx.fillStyle = "#222";
      ctx.font = "bold 24px 'DejaVu Sans Mono'";
      ["NAME: D. HALE", "BORN: 1983", "AGE:  57", "EXPIRES: 2040"].forEach((l, i) => ctx.fillText(l, 200, 110 + i * 46));
      if (expired) {
        ctx.save();
        ctx.translate(330, 230);
        ctx.rotate(-0.22);
        ctx.strokeStyle = "#c1121f";
        ctx.lineWidth = 8;
        ctx.strokeRect(-150, -42, 300, 84);
        ctx.fillStyle = "#c1121f";
        ctx.font = "900 62px 'DejaVu Sans'";
        ctx.textAlign = "center";
        ctx.fillText("EXPIRED", 0, 22);
        ctx.restore();
      }
    },
    expired,
  );
  return (
    <Shot bg="#140f0a">
      <ambientLight intensity={0.6} color="#ffe2bf" />
      <directionalLight position={[1, 3, 2]} intensity={1.8} color="#ffd29a" />
      <Cam pos={[0.15, 1.05 - local * 0.05, 0.6]} look={[0, 0, 0]} fov={40} roll={-0.08} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <planeGeometry args={[4, 4]} />
        <meshStandardMaterial color="#4a3426" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0.1]}>
        <planeGeometry args={[0.75, 0.5]} />
        <meshStandardMaterial map={tex} />
      </mesh>
    </Shot>
  );
};

const BankShot: React.FC<{ from: number }> = ({ from }) => {
  const { t } = useT(from);
  const declined = t >= 18.76;
  const tex = useCardTexture(
    (ctx, w, h) => {
      ctx.fillStyle = declined ? "#2a0508" : "#071a12";
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = declined ? "#ff3b4e" : "#39ff88";
      ctx.font = "900 70px 'DejaVu Sans'";
      ctx.textAlign = "center";
      ctx.fillText(declined ? "DECLINED" : "PROCESSING…", w / 2, h / 2 + 10);
      ctx.font = "bold 28px 'DejaVu Sans Mono'";
      ctx.fillText(declined ? "IDENTITY CHECK FAILED" : "PLEASE WAIT", w / 2, h / 2 + 70);
    },
    declined,
  );
  return (
    <Shot bg="#05080f">
      <ambientLight intensity={0.3} />
      <pointLight position={[0, 1, 1]} intensity={4} color={declined ? "#ff3b4e" : "#39ff88"} distance={4} />
      <Cam pos={[0.25, 0.55, 0.9]} look={[0, 0.25, 0]} fov={36} />
      <mesh position={[0, 0.2, 0]} rotation={[-0.5, 0, 0]}>
        <boxGeometry args={[0.6, 0.42, 0.12]} />
        <meshStandardMaterial color="#1b1f27" />
      </mesh>
      <mesh position={[0, 0.25, 0.065]} rotation={[-0.5, 0, 0]}>
        <planeGeometry args={[0.52, 0.34]} />
        <meshBasicMaterial map={tex} toneMapped={false} />
      </mesh>
      {/* the card */}
      <mesh position={[0.32, 0.32, 0.25]} rotation={[-0.4, 0.3, 0.2]}>
        <boxGeometry args={[0.34, 0.215, 0.01]} />
        <meshStandardMaterial color="#c9a46a" metalness={0.7} roughness={0.3} />
      </mesh>
    </Shot>
  );
};

const GravesShot: React.FC<{ from: number }> = ({ from }) => {
  const { t, local } = useT(from);
  const second = t >= 20.5;
  const stone = (name: string, years: string) =>
    (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      ctx.fillStyle = "#8b8f97";
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "#2b2e35";
      ctx.textAlign = "center";
      ctx.font = "bold 46px 'DejaVu Serif'";
      ctx.fillText("R.I.P.", w / 2, 90);
      ctx.font = "bold 40px 'DejaVu Serif'";
      ctx.fillText(name, w / 2, 170);
      ctx.font = "32px 'DejaVu Serif'";
      ctx.fillText(years, w / 2, 230);
    };
  const a = useCardTexture(stone("DANIEL HALE", "1983 – 2031"), 0, 400, 300);
  const b = useCardTexture(stone("MARK WREN", "1994 – 2052"), 0, 400, 300);
  const rise = interpolate(t, [20.4, 20.8], [-1, 0], { ...clamp, easing: Easing.out(Easing.back(1.4)) });
  return (
    <Shot bg="#0a0d14">
      <SkyBackground stops={[[0, "#1b2438"], [1, "#05070c"]]} k="graves" />
      <ambientLight intensity={0.35} color="#9fb3d1" />
      <directionalLight position={[2, 4, 3]} intensity={1.4} color="#bcd0ff" />
      <Cam pos={[0.2 + local * 0.1, 1.0, 2.8 - local * 0.25]} look={[0.3, 0.6, 0]} fov={42} />
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[14, 14]} />
        <meshStandardMaterial color="#1f2a1c" />
      </mesh>
      <mesh position={[-0.45, 0.6, 0]}>
        <boxGeometry args={[0.8, 1.2, 0.15]} />
        <meshStandardMaterial color="#8b8f97" />
      </mesh>
      <mesh position={[-0.45, 0.6, 0.077]}>
        <planeGeometry args={[0.76, 0.57]} />
        <meshStandardMaterial map={a} />
      </mesh>
      {second ? (
        <group position={[0.65, rise * 1.3, 0]}>
          <mesh position={[0, 0.6, 0]}>
            <boxGeometry args={[0.8, 1.2, 0.15]} />
            <meshStandardMaterial color="#8b8f97" />
          </mesh>
          <mesh position={[0, 0.6, 0.077]}>
            <planeGeometry args={[0.76, 0.57]} />
            <meshStandardMaterial map={b} />
          </mesh>
        </group>
      ) : null}
      {/* you watching your own funeral from behind a tree */}
      <Person {...YOU} position={[1.6, 0, 1.6]} rotation={[0, Math.PI + 0.7, 0]} coat="#22252c" />
    </Shot>
  );
};

const NAMES = ["DANIEL HALE", "MARK WREN", "ELIAS STONE", "JONAH REED", "LEO MARSH"];
const NamesShot: React.FC<{ from: number }> = ({ from }) => {
  const { t } = useT(from);
  const shown = Math.min(5, Math.max(1, Math.floor((t - 21.1) / 0.32) + 1));
  return (
    <Shot bg="#120d0a">
      <ambientLight intensity={0.7} color="#ffe2bf" />
      <directionalLight position={[1, 3, 2]} intensity={1.6} color="#ffd29a" />
      <Cam pos={[0, 1.35, 0.55]} look={[0, 0, 0]} fov={42} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <planeGeometry args={[4, 4]} />
        <meshStandardMaterial color="#3d2b22" />
      </mesh>
      {NAMES.slice(0, shown).map((n, i) => (
        <IdCard key={n} name={n} index={i} crossed={i < shown - 1} />
      ))}
    </Shot>
  );
};

const IdCard: React.FC<{ name: string; index: number; crossed: boolean }> = ({ name, index, crossed }) => {
  const tex = useCardTexture(
    (ctx, w, h) => {
      ctx.fillStyle = "#f1efe8";
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "#3b5bdb";
      ctx.fillRect(0, 0, w, 50);
      ctx.fillStyle = "#c9b79a";
      ctx.fillRect(20, 70, 130, 170);
      ctx.fillStyle = "#3a4a6b";
      ctx.beginPath();
      ctx.arc(85, 135, 36, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#111";
      ctx.font = "bold 38px 'DejaVu Sans'";
      ctx.fillText(name, 170, 150);
      ctx.font = "26px 'DejaVu Sans Mono'";
      ctx.fillText("AGE 25", 170, 200);
      if (crossed) {
        ctx.strokeStyle = "#c1121f";
        ctx.lineWidth = 12;
        ctx.beginPath();
        ctx.moveTo(10, h - 20);
        ctx.lineTo(w - 10, 20);
        ctx.stroke();
      }
    },
    crossed,
  );
  return (
    <mesh position={[-0.28 + index * 0.14, index * 0.002, -0.1 + index * 0.06]} rotation={[-Math.PI / 2, 0, -0.35 + index * 0.17]}>
      <planeGeometry args={[0.42, 0.28]} />
      <meshStandardMaterial map={tex} />
    </mesh>
  );
};

const HAIR = ["#1c1512", "#a8742f", "#e1cf9b", "#5a1f18", "#2d2d2d"];
const DisguiseShot: React.FC<{ from: number }> = ({ from }) => {
  const { t, local } = useT(from);
  const i = Math.min(HAIR.length - 1, Math.floor(local / 0.72));
  return (
    <Shot bg="#0b0f1c">
      <ambientLight intensity={0.3} color="#9fb6d8" />
      <pointLight position={[0, 2.6, 0.8]} intensity={10} color="#ffe0b8" distance={6} />
      <Cam pos={[0.7, 1.95, 2.2 - local * 0.15]} look={[0, 1.55, -1]} fov={40} />
      {/* fake mirror: copy of you behind a frame */}
      {[
        [0, 2.29, 1.26, 0.07],
        [0, 1.01, 1.26, 0.07],
        [-0.6, 1.65, 0.07, 1.35],
        [0.6, 1.65, 0.07, 1.35],
      ].map(([x, y, w, h], k) => (
        <mesh key={k} position={[x, y, -1.02]}>
          <boxGeometry args={[w, h, 0.04]} />
          <meshStandardMaterial color="#9aa3ad" metalness={0.8} roughness={0.3} />
        </mesh>
      ))}
      {[
        [-1.95, 1.65, 2.8, 5],
        [1.95, 1.65, 2.8, 5],
        [0, 3.3, 6, 2],
        [0, 0.27, 6, 1.54],
      ].map(([x, y, w, h], k) => (
        <mesh key={`w${k}`} position={[x, y, -1.04]}>
          <planeGeometry args={[w, h]} />
          <meshStandardMaterial color="#2a2f3f" />
        </mesh>
      ))}
      <group position={[0, 0, -2.0]}>
        <pointLight position={[0, 2.6, 0.5]} intensity={6} color="#ffe0b8" distance={4} />
        <Person {...YOU} hair={HAIR[i]} old={i === 2} position={[0.05, 0, 0.1]} />
      </group>
      <Person {...YOU} hair={HAIR[i]} position={[0.05, 0, -0.1]} rotation={[0, Math.PI, 0]} />
      {/* a dye bottle on the sink */}
      <mesh position={[0, 0.9, -0.75]}>
        <boxGeometry args={[1.2, 0.12, 0.55]} />
        <meshStandardMaterial color="#d8dde3" />
      </mesh>
      <mesh position={[0.4, 1.06, -0.7]}>
        <cylinderGeometry args={[0.05, 0.05, 0.2, 10]} />
        <meshStandardMaterial color={HAIR[(i + 1) % HAIR.length]} />
      </mesh>
      {t > 23 ? null : null}
    </Shot>
  );
};

/* ----------------------------------------------------------- silver car */

const CITY_TINT = ["#1a2238", "#2a1a2a", "#16262a", "#2a2216"];
const WindowShot: React.FC<{ from: number }> = ({ from }) => {
  const { t, local, frame } = useT(from);
  // A different city every ~1.6 s until "a silver car outside your window", then hold & push.
  const city = t < 31.2 ? Math.floor(local / 1.15) % 4 : 3;
  const push = interpolate(t, [31.2, 33.2], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  return (
    <Shot bg="#05070d">
      <SkyBackground stops={[[0, "#05070d"], [1, CITY_TINT[city]]]} k={`c${city}`} />
      <fog attach="fog" args={["#05070d", 12, 45]} />
      <ambientLight intensity={0.25} color="#8fa6d6" />
      {/* street lamp over the car */}
      <pointLight position={[0.5, 4, 0]} intensity={30} color="#ffb24a" distance={10} />
      <Glow position={[0.5, 4.1, 0]} color="#ffb24a" size={1.8} />
      <mesh position={[0.5, 2, -0.6]}>
        <cylinderGeometry args={[0.06, 0.08, 4, 6]} />
        <meshStandardMaterial color="#333" />
      </mesh>
      {/* POV from upstairs window, looking down */}
      <Cam pos={[-7 + push * 3, 10 - push * 4.5, 12 - push * 5]} look={[0.5, 0.6, 0]} fov={34} />
      <pointLight position={[-3, 6, 6]} intensity={14} color="#6f8ed6" distance={18} />
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color="#1a1c22" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[3, 0.01, 0]}>
        <planeGeometry args={[3, 40]} />
        <meshStandardMaterial color="#2a2e3a" />
      </mesh>
      {Array.from({ length: 8 }).map((_, i) => (
        <Building
          key={`${city}-${i}`}
          position={[5 + (i % 2) * 7, 0, -18 + i * 5]}
          size={[5, 6 + rnd(i + city * 10) * 18, 4]}
          seed={i + city * 10}
          base={CITY_TINT[city]}
        />
      ))}
      <SilverCar position={[0, 0, 0]} rotation={0.1} lights={0} />
      {frame % 2 === 0 ? null : null}
    </Shot>
  );
};

/** Rear-view mirror: the stranger's calm eyes. */
const MirrorCarShot: React.FC<{ from: number }> = ({ from }) => {
  const { t, local } = useT(from);
  const eyes = useCanvasTexture(
    512,
    180,
    (ctx, w, h) => {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, "#1a1d24");
      g.addColorStop(1, "#0b0c10");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "#d8b49a";
      ctx.fillRect(60, 30, w - 120, 130);
      ctx.fillStyle = "#0d0d10";
      ctx.fillRect(60, 0, w - 120, 40);
      // brows + eyes, calm
      ctx.fillStyle = "#2a2018";
      ctx.fillRect(150, 62, 80, 10);
      ctx.fillRect(285, 62, 80, 10);
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.ellipse(190, 98, 34, 16, 0, 0, Math.PI * 2);
      ctx.ellipse(325, 98, 34, 16, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#3a1a14";
      ctx.beginPath();
      ctx.arc(194, 98, 12, 0, Math.PI * 2);
      ctx.arc(329, 98, 12, 0, Math.PI * 2);
      ctx.fill();
    },
    0,
  );
  const count = Math.min(9, Math.floor((t - 33.2) * 2.4));
  return (
    <Shot bg="#05070d">
      <ambientLight intensity={0.15} />
      <pointLight position={[0.3, 0.4, 1]} intensity={3} color="#ffb24a" distance={4} />
      <pointLight position={[-0.6, 0, 0.8]} intensity={1.5} color="#ff3b4e" distance={3} />
      <Cam pos={[0.1, -0.05, 1.1 - local * 0.08]} look={[0, 0, 0]} fov={36} />
      {/* windshield frame + mirror */}
      <mesh position={[0, 0.45, -0.1]}>
        <boxGeometry args={[3, 0.1, 0.1]} />
        <meshStandardMaterial color="#0b0c10" />
      </mesh>
      <mesh position={[0, 0.32, -0.05]}>
        <cylinderGeometry args={[0.012, 0.012, 0.2, 6]} />
        <meshStandardMaterial color="#222" />
      </mesh>
      <mesh position={[0, 0.1, 0]}>
        <boxGeometry args={[0.62, 0.24, 0.05]} />
        <meshStandardMaterial color="#15161c" />
      </mesh>
      <mesh position={[0, 0.1, 0.027]}>
        <planeGeometry args={[0.58, 0.2]} />
        <meshBasicMaterial map={eyes} />
      </mesh>
      {/* tally marks scratched on the dashboard: he's counting */}
      {Array.from({ length: count }).map((_, i) => (
        <mesh key={i} position={[-0.3 + i * 0.045 + (i % 5 === 4 ? -0.09 : 0), -0.32, 0.05]} rotation={[0, 0, i % 5 === 4 ? 1.1 : 0]}>
          <planeGeometry args={[0.01, i % 5 === 4 ? 0.22 : 0.12]} />
          <meshBasicMaterial color="#e8e8e8" />
        </mesh>
      ))}
      <mesh position={[0, -0.33, 0]}>
        <planeGeometry args={[3, 0.3]} />
        <meshStandardMaterial color="#1a1c22" />
      </mesh>
    </Shot>
  );
};

/* -------------------------------------------------------------- funeral */

const FuneralShot: React.FC<{ from: number }> = ({ from }) => {
  const { t, local } = useT(from);
  const k = interpolate(local, [0, 7.4], [0, 1], { easing: Easing.inOut(Easing.sin) });
  const pos: V3 = [interpolate(k, [0, 1], [3, 0.9]), interpolate(k, [0, 1], [5.5, 1.95]), interpolate(k, [0, 1], [7, 1.9])];
  const look: V3 = [0, interpolate(k, [0, 1], [0.6, 1.5]), interpolate(k, [0, 1], [0, -1.5])];
  const speak = t > 40.3 && t < 43.7;
  return (
    <Shot bg="#0b0f16">
      <SkyBackground stops={[[0, "#2a3140"], [1, "#0b0f16"]]} k="funeral" />
      <fog attach="fog" args={["#232a36", 6, 26]} />
      <ambientLight intensity={0.45} color="#a8b6cc" />
      <directionalLight position={[2, 6, 3]} intensity={1.2} color="#c9d6ea" />
      <Cam pos={pos} look={look} fov={40} />
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color="#1e2a1d" />
      </mesh>
      {/* grave + coffin */}
      <mesh position={[0, 0.02, -2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.2, 2.4]} />
        <meshStandardMaterial color="#120e0c" />
      </mesh>
      <mesh position={[0, 0.25, -2]}>
        <boxGeometry args={[0.7, 0.4, 2]} />
        <meshStandardMaterial color="#3d2418" roughness={0.4} />
      </mesh>
      {Array.from({ length: 6 }).map((_, i) => (
        <mesh key={`f${i}`} position={[-0.2 + (i % 3) * 0.2, 0.48, -2.5 + Math.floor(i / 3) * 0.3]}>
          <sphereGeometry args={[0.07, 8, 8]} />
          <meshStandardMaterial color={i % 2 ? "#e8e4ea" : "#c9a0dc"} />
        </mesh>
      ))}
      {/* mourners with black umbrellas */}
      {Array.from({ length: 9 }).map((_, i) => {
        const a = -2.4 + i * 0.6;
        const p: V3 = [Math.sin(a) * 2.3, 0, -2 - Math.cos(a) * 2.3];
        return (
          <group key={i}>
            <Person coat="#16171c" pants="#16171c" hair={i % 3 ? "#2a1f18" : "#777"} position={p} rotation={[0, Math.PI - a, 0]} headTilt={0.3} />
            <Umbrella position={[p[0], 1.9, p[2]]} color="#0e0f12" tilt={0.08} />
          </group>
        );
      })}
      {/* you (back) + the stranger with the red umbrella next to you */}
      <Person {...YOU} coat="#16171c" position={[0.1, 0, 0.3]} rotation={[0, Math.PI, 0]} headTilt={0.25} />
      <Umbrella position={[0.1, 1.9, 0.3]} color="#0e0f12" />
      <Person {...ILYA} position={[-0.75, 0, 0.15]} rotation={[0, Math.PI + (speak ? 0.8 : 0.3), 0]} headTurn={speak ? 0.5 : 0} />
      <Umbrella position={[-0.75, 1.92, 0.15]} color="#d8202f" />
      <Rain t={t} count={320} area={10} />
    </Shot>
  );
};

/* --------------------------------------------------------- 1618 photo */

const OldPhotoShot: React.FC<{ from: number }> = ({ from }) => {
  const { t, local } = useT(from);
  const tex = useGirlPhoto(false, true, t >= 48.5, t >= 51.38);
  const handIn = interpolate(t, [45.1, 46.2], [-0.8, 0], { ...clamp, easing: Easing.out(Easing.cubic) });
  const d = interpolate(local, [0, 9.9], [1.1, 0.55], { easing: Easing.inOut(Easing.sin) });
  const dark = interpolate(t, [53.3, 54.6], [0, 1], clamp);
  return (
    <Shot bg="#05070d">
      <ambientLight intensity={0.3 * (1 - dark)} color="#a8b6cc" />
      <pointLight position={[0.3, 1.2, 0.8]} intensity={6 * (1 - dark)} color="#e6ecf5" distance={4} />
      <pointLight position={[-0.6, 0.6, 0.3]} intensity={(t > 51.38 ? 4 : 0) * (1 - dark)} color="#ff3b4e" distance={3} />
      <Cam pos={[0.05, 0.1, d]} look={[0, 0.05, 0]} fov={36} />
      {/* rain-dark background */}
      <mesh position={[0, 0, -2]}>
        <planeGeometry args={[8, 8]} />
        <meshStandardMaterial color="#141820" />
      </mesh>
      <group position={[0, handIn * 0.3, handIn]} rotation={[-0.1, 0.05, 0.04]}>
        <mesh>
          <planeGeometry args={[0.3, 0.36]} />
          <meshStandardMaterial map={tex} side={THREE.DoubleSide} />
        </mesh>
        {/* gloved hand + sleeve */}
        <mesh position={[0.17, -0.12, -0.01]}>
          <boxGeometry args={[0.1, 0.12, 0.04]} />
          <meshStandardMaterial color="#0d0d10" />
        </mesh>
        <mesh position={[0.3, -0.22, -0.05]} rotation={[0, 0, 0.8]}>
          <cylinderGeometry args={[0.055, 0.06, 0.3, 10]} />
          <meshStandardMaterial color="#15161c" />
        </mesh>
      </group>
    </Shot>
  );
};

/* ---------------------------------------------------------- config */

const CITIES = ["CHICAGO, IL", "LISBON", "OSAKA", "BERLIN", "TORONTO"];

const cfg: EpisodeConfig = {
  dir: "ep2",
  duration: DURATION,
  shots: (
    [
      ["bed", BedShot],
      ["photo", PhotoShot],
      ["hands", HandsShot],
      ["passport", PassportShot],
      ["bank", BankShot],
      ["graves", GravesShot],
      ["names", NamesShot],
      ["disguise", DisguiseShot],
      ["window", WindowShot],
      ["mirror", MirrorCarShot],
      ["funeral", FuneralShot],
      ["oldPhoto", OldPhotoShot],
    ] as [keyof typeof T, React.FC<{ from: number }>][]
  ).map(([name, Comp]) => ({ name, from: T[name][0], to: T[name][1], Comp })),
  hud: (t) => {
    if (t >= END || t > 54.4) return null;
    const base = { year: "YEAR 40", counter: "DAUGHTER: 53", counterColor: C.amber };
    if (t < T.passport[0]) return { ...base, clock: "04:12", location: "ST. ANNE'S WARD" };
    if (t < T.window[0]) return { ...base, clock: "--:--", location: CITIES[Math.floor((t - 15.4) / 2.25) % CITIES.length] };
    if (t < T.funeral[0]) return { ...base, clock: "02:47", location: CITIES[Math.min(4, Math.floor((t - 26.6) / 1.15))] };
    return { ...base, clock: "16:05", location: "GREENWOOD CEMETERY", counter: "DAUGHTER: †" };
  },
  hook: { line1: "YOUR DAUGHTER", line2: "IS OLDER THAN YOU.", line2At: 2.35, until: 4.6 },
  stamps: [
    { at: 11.8, dur: 1.9, text: "SHE'S 53. YOU'RE 25.", color: C.amber },
    { at: 17.34, dur: 1.1, text: "EXPIRED", color: C.red },
    { at: 20.5, dur: 1.2, text: "DEAD ×2", color: "#3b5bdb" },
    { at: 35.1, dur: 2.0, text: "HE'S COUNTING.", color: C.red },
    { at: 51.38, dur: 2.6, text: "1618", color: C.red, top: 640 },
  ],
  flashes: [
    { at: T.photo[0], color: "#000", frames: 8 },
    { at: T.passport[0], color: "#fff", frames: 8 },
    { at: T.window[0], color: "#000", frames: 10 },
    { at: T.funeral[0], color: "#000", frames: 10 },
    { at: 51.38, color: C.red, frames: 10 },
  ],
  mascotAlert: [26.8, 37.6],
  end: {
    from: END,
    question: "Would you rather outlive everyone you love… or never love anyone at all?",
    a: "OUTLIVE",
    b: "NEVER LOVE",
  },
  sfx: [
    // the monitor sits under the softest lines ("She still calls you Dad"), so -6 dB
    { file: "sfx_monitor.mp3", at: 0, dur: 4.6, vol: 0.25 },
    { file: "sfx_monitor.mp3", at: 12.6, trimBefore: 4.4, dur: 2.8, vol: 0.5 },
    { file: "sfx_rain.mp3", at: 37.6, dur: 7.4, loop: true },
    ...[11.8, 17.34, 20.5, 35.1, 51.38].map((s) => ({ file: "sfx_hit.mp3", at: s - 0.3, dur: 2 })),
  ],
};

export const Forever25Ep2: React.FC = () => <Episode cfg={cfg} />;
export const EP2_DURATION = DURATION;
