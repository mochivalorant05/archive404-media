import React from "react";
import * as THREE from "three";
import { Easing, interpolate } from "remotion";
import { C } from "../hud";
import { Episode, type EpisodeConfig } from "../Episode";
import { Building, Cam, Candle, Glow, Person, Shot, SkyBackground, Snow, rnd, useCanvasTexture, useT } from "../three-kit";

/* FOREVER 25 · Episode 3 "Year Three Hundred" — script & timings from the series doc. */

type V3 = [number, number, number];
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const YOU = { shirt: "#3a4a6b", pants: "#1d2333", hair: "#1c1512" };
const MARA = { skin: "#d9a98a", hair: "#1c1512", longHair: "#1c1512", dress: "#2f4a3a", shirt: "#2f4a3a", eyes: true };

const T = {
  arms: [0, 5.0],
  eras: [5.0, 9.6],
  write: [9.6, 16.2],
  rooftop: [16.2, 20.4],
  cinema: [20.4, 23.6],
  summit: [23.6, 27.4],
  map: [27.4, 31.6],
  train: [31.6, 34.0],
  cabin: [34.0, 37.0],
  mara: [37.0, 49.2],
  candles: [49.2, 55.2],
} as const;
const END = 55.2;
const DURATION = 63;

/* ------------------------------------------------------------------ arms */

const OLD_NAMES = ["Daniel", "Mark", "Elias", "Jonah", "Leo", "Tomás", "Henri", "Yuri"];

/** Forearm with marker notes. `reveal` 0..1 writes the new lines progressively. */
const useArmTexture = (lines: string[], reveal: number) =>
  useCanvasTexture(
    1024,
    256,
    (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      // old faded names, crossed out
      ctx.font = "italic 30px 'DejaVu Sans'";
      OLD_NAMES.forEach((n, i) => {
        const x = 30 + (i % 4) * 250;
        const y = i < 4 ? 40 : 230;
        ctx.fillStyle = "rgba(40,50,90,0.35)";
        ctx.fillText(n, x, y);
        ctx.strokeStyle = "rgba(40,50,90,0.4)";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x - 4, y - 10);
        ctx.lineTo(x + n.length * 16, y - 10);
        ctx.stroke();
      });
      // fresh marker lines
      ctx.fillStyle = "#14204a";
      ctx.font = "bold 74px 'DejaVu Sans'";
      const all = lines.join("|");
      const n = Math.floor(all.length * reveal);
      const shown = all.slice(0, n).split("|");
      shown.forEach((l, i) => ctx.fillText(l, 30, 120 + i * 82));
    },
    `${lines.join()}${Math.round(reveal * 60)}`,
  );

const Arms: React.FC<{ tex: THREE.Texture }> = ({ tex }) => (
  <group>
    {/* forearm (flattened capsule along x) */}
    <mesh rotation={[0, 0, Math.PI / 2]} scale={[1, 1, 0.72]}>
      <capsuleGeometry args={[0.16, 1.3, 6, 18]} />
      <meshStandardMaterial color="#d9a98a" roughness={0.65} />
    </mesh>
    {/* marker ink decal on top of the arm */}
    <mesh position={[0, 0.168, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[1.32, 0.33]} />
      <meshBasicMaterial map={tex} transparent depthWrite={false} />
    </mesh>
    <mesh position={[-0.92, 0, 0]} scale={[0.16, 0.07, 0.12]}>
      <sphereGeometry args={[1, 14, 10]} />
      <meshStandardMaterial color="#d9a98a" />
    </mesh>
    <mesh position={[0.86, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
      <cylinderGeometry args={[0.19, 0.19, 0.3, 16]} />
      <meshStandardMaterial color="#3a4a6b" />
    </mesh>
  </group>
);

const ArmsShot: React.FC<{ from: number }> = ({ from }) => {
  const { t, local } = useT(from);
  const writing = from > 1;
  const lines = writing ? ["YOU ARE NOT CRAZY.", "YOU ARE JUST... OLD."] : ["YOUR NAME IS ___", "DON'T FORGET."];
  const reveal = writing ? interpolate(t, [9.9, 14.4], [0, 1], clamp) : 1;
  const tex = useArmTexture(lines, reveal);
  const pen = writing && reveal < 1;
  const penX = -0.5 + (reveal * 2) % 1;
  return (
    <Shot bg="#0b0f1c">
      <ambientLight intensity={0.6} color="#bcd0ff" />
      <directionalLight position={[0.5, 2, 2]} intensity={1.6} color="#ffe3c4" />
      <pointLight position={[-1, 1, 1]} intensity={3} color="#22d3ee" distance={4} />
      <Cam pos={[0.05 + local * 0.02, 3.0 - local * 0.06, 0.9]} look={[0, 0, 0]} fov={42} roll={-0.1} />
      <group rotation={[0, 0, 0]}>
        <Arms tex={tex} />
        {pen ? (
          <group position={[penX, 0.32, 0.06]} rotation={[0.3, 0, 0.5]}>
            <mesh>
              <cylinderGeometry args={[0.018, 0.018, 0.4, 10]} />
              <meshStandardMaterial color="#111" />
            </mesh>
          </group>
        ) : null}
      </group>
      <mesh position={[0, -0.18, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[6, 4]} />
        <meshStandardMaterial color="#1a1612" />
      </mesh>
    </Shot>
  );
};

/* ------------------------------------------------------------------ eras */

const ERAS = [
  { sky: ["#c9b38a", "#5a4630"], ground: "#5b4a36", build: "#4a3a2a", lit: "#ffcf7a", label: "1740" },
  { sky: ["#8a8f96", "#3a3d42"], ground: "#3a3a3a", build: "#4a2a24", lit: "#ffb24a", label: "1860" },
  { sky: ["#9aa0a8", "#2a2c30"], ground: "#2a2a2a", build: "#2c2c2c", lit: "#f4f4f4", label: "1950" },
  { sky: ["#151a3a", "#05060f"], ground: "#15161c", build: "#141a2c", lit: "#ff4fd8", label: "2030" },
  { sky: ["#0a2a3a", "#020a12"], ground: "#0b1820", build: "#0d2430", lit: "#22d3ee", label: "2280" },
];
const WORDS = ["hola", "привет", "こんにちは", "bonjour", "ciao", "مرحبا", "hallo", "olá", "你好"];

const WordSprite: React.FC<{ text: string; position: V3; opacity: number }> = ({ text, position, opacity }) => {
  const tex = useCanvasTexture(
    256,
    96,
    (ctx, w, h) => {
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 54px 'DejaVu Sans', 'IPAGothic', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(text, w / 2, h / 2 + 18);
    },
    text,
  );
  return (
    <sprite position={position} scale={[1.2, 0.45, 1]}>
      <spriteMaterial map={tex} transparent opacity={opacity} depthWrite={false} />
    </sprite>
  );
};

const ErasShot: React.FC<{ from: number }> = ({ from }) => {
  const { t, local } = useT(from);
  const e = Math.min(ERAS.length - 1, Math.floor(local / 0.92));
  const era = ERAS[e];
  return (
    <Shot bg={era.sky[1]}>
      <SkyBackground stops={[[0, era.sky[0]], [1, era.sky[1]]]} k={`era${e}`} />
      <fog attach="fog" args={[era.sky[1], 10, 40]} />
      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 6, 4]} intensity={1.4} />
      <Cam pos={[0.6, 1.9, 4.2 - local * 0.2]} look={[0, 1.6, 0]} fov={42} />
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color={era.ground} />
      </mesh>
      {Array.from({ length: 10 }).map((_, i) => (
        <Building
          key={`${e}-${i}`}
          position={[(i % 2 ? 1 : -1) * (4 + (i % 3)), 0, -4 - Math.floor(i / 2) * 5]}
          size={[3.5, (e >= 3 ? 10 : 4) + rnd(i + e * 7) * (e >= 3 ? 20 : 5), 4]}
          seed={i + e * 13}
          base={era.build}
          litColor={era.lit}
        />
      ))}
      {/* faces blur: people streaking past */}
      {Array.from({ length: 6 }).map((_, i) => {
        const x = ((local * (3 + i) + i * 2.3) % 10) - 5;
        return (
          <Person
            key={i}
            position={[x, 0, -1.5 - (i % 3) * 1.2]}
            rotation={[0, Math.PI / 2, 0]}
            shirt={["#7a3f2a", "#3f6a8a", "#8a7a3f", "#5a3f7a"][i % 4]}
            hair={i % 2 ? "#5a3a1e" : "#222"}
          />
        );
      })}
      {/* you, unchanged, in the middle of every century */}
      <Person {...YOU} position={[0, 0, 0.6]} rotation={[0, Math.PI, 0]} />
      {/* languages mix */}
      {t > 8.3
        ? WORDS.map((w, i) => (
            <WordSprite
              key={w}
              text={w}
              position={[(rnd(i * 3) - 0.5) * 3.5, 1.6 + rnd(i * 5) * 2.2, -0.5 + rnd(i * 7)]}
              opacity={interpolate(t, [8.3 + i * 0.08, 8.6 + i * 0.08], [0, 0.9], clamp)}
            />
          ))
        : null}
    </Shot>
  );
};

/* --------------------------------------------------------- numb montage */

const RooftopShot: React.FC<{ from: number }> = ({ from }) => {
  const { local } = useT(from);
  const day = (Math.sin(local * 3.2) + 1) / 2;
  const top = new THREE.Color("#0b1530").lerp(new THREE.Color("#ff8a4a"), day).getStyle();
  const sunA = local * 3.2;
  return (
    <Shot bg="#0b1530">
      <SkyBackground stops={[[0, top], [1, "#0b0f1c"]]} k={Math.round(day * 20)} />
      <ambientLight intensity={0.4 + day * 0.4} />
      <directionalLight position={[Math.cos(sunA) * 10, Math.sin(sunA) * 8 + 2, -10]} intensity={1 + day * 2} color="#ffb257" />
      <Glow position={[Math.cos(sunA) * 14, Math.sin(sunA) * 7 + 3, -20]} color={day > 0.5 ? "#ffcf7a" : "#dfe6ff"} size={4} />
      <Cam pos={[2.2, 1.4, 3.6]} look={[0, 1.4, -2]} fov={44} />
      <mesh position={[0, -0.25, 0]}>
        <boxGeometry args={[10, 0.5, 10]} />
        <meshStandardMaterial color="#3a3436" />
      </mesh>
      {Array.from({ length: 16 }).map((_, i) => (
        <Building key={i} position={[(rnd(i) - 0.5) * 50, -25, -12 - rnd(i * 3) * 30]} size={[5, 10 + rnd(i * 5) * 25, 5]} seed={i + 40} />
      ))}
      <Person {...YOU} pose="sit" position={[0, 0, -0.4]} rotation={[0, Math.PI, 0]} />
    </Shot>
  );
};

const CinemaShot: React.FC<{ from: number }> = ({ from }) => {
  const { local, frame } = useT(from);
  const flick = 0.7 + rnd(Math.floor(frame / 3)) * 0.3;
  return (
    <Shot bg="#05050a">
      <ambientLight intensity={0.3} color="#9fb6ff" />
      <pointLight position={[0, 3, -5]} intensity={60 * flick} color="#bcd0ff" distance={16} />
      <pointLight position={[0, 4, 4]} intensity={6} color="#ffcf9a" distance={10} />
      <Cam pos={[0.5, 3.9 - local * 0.1, 6.8 - local * 0.3]} look={[0, 1.4, -6]} fov={44} />
      <mesh position={[0, 2.6, -7]}>
        <planeGeometry args={[7, 3.2]} />
        <meshBasicMaterial color={new THREE.Color("#9fb6ff").multiplyScalar(flick)} toneMapped={false} />
      </mesh>
      {Array.from({ length: 7 }).map((_, r) =>
        Array.from({ length: 9 }).map((_, c) => (
          <group key={`${r}-${c}`} position={[-3.2 + c * 0.8, r * 0.22, -3 + r * 1.1]}>
            <mesh position={[0, 0.3, 0]}>
              <boxGeometry args={[0.65, 0.12, 0.6]} />
              <meshStandardMaterial color="#5a1018" />
            </mesh>
            <mesh position={[0, 0.65, 0.28]}>
              <boxGeometry args={[0.65, 0.7, 0.1]} />
              <meshStandardMaterial color="#6a121c" />
            </mesh>
          </group>
        )),
      )}
      <Person {...YOU} pose="sit" position={[0, 0.66, -0.8]} rotation={[0, Math.PI, 0]} />
    </Shot>
  );
};

const SummitShot: React.FC<{ from: number }> = ({ from }) => {
  const { local } = useT(from);
  const a = 0.6 + local * 0.12;
  return (
    <Shot bg="#9fb6d8">
      <SkyBackground stops={[[0, "#3a5a8a"], [0.6, "#c9d6ea"], [1, "#eef3fa"]]} k="summit" />
      <ambientLight intensity={0.8} color="#dfe8ff" />
      <directionalLight position={[4, 6, 2]} intensity={2} />
      <Cam pos={[Math.sin(a) * 5, 2.4, Math.cos(a) * 5]} look={[0, 1.2, 0]} fov={44} />
      <mesh position={[0, -2.5, 0]}>
        <coneGeometry args={[3.5, 5, 7]} />
        <meshStandardMaterial color="#6a6f7a" flatShading />
      </mesh>
      <mesh position={[0, -0.32, 0]}>
        <coneGeometry args={[1.1, 0.9, 7]} />
        <meshStandardMaterial color="#f2f6ff" flatShading />
      </mesh>
      {/* sea of clouds */}
      {Array.from({ length: 30 }).map((_, i) => (
        <mesh key={i} position={[(rnd(i) - 0.5) * 30, -2.4 + rnd(i * 2) * 0.6, (rnd(i * 3) - 0.5) * 30]} scale={[2 + rnd(i * 4) * 2, 0.6, 2]}>
          <sphereGeometry args={[1, 10, 8]} />
          <meshStandardMaterial color="#f4f7fc" />
        </mesh>
      ))}
      <Person {...YOU} position={[0, 0.1, 0]} rotation={[0, Math.PI + 0.4, 0]} coat="#2a3346" />
    </Shot>
  );
};

/* -------------------------------------------------------------- the chase */

const useMapTexture = () =>
  useCanvasTexture(
    1024,
    640,
    (ctx, w, h) => {
      ctx.fillStyle = "#d8c9a6";
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "#b8a47a";
      // crude continents
      const blob = (x: number, y: number, rx: number, ry: number) => {
        ctx.beginPath();
        ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
        ctx.fill();
      };
      blob(230, 220, 150, 120);
      blob(300, 430, 80, 140);
      blob(520, 200, 90, 80);
      blob(560, 380, 90, 140);
      blob(760, 230, 200, 120);
      blob(840, 470, 80, 60);
      const pins: [number, number][] = [
        [220, 200], [520, 180], [600, 250], [700, 200], [820, 260], [560, 360], [300, 420], [880, 470], [760, 150], [470, 230],
      ];
      ctx.strokeStyle = "#c1121f";
      ctx.lineWidth = 4;
      ctx.beginPath();
      pins.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.stroke();
      pins.forEach(([x, y]) => {
        ctx.fillStyle = "#c1121f";
        ctx.beginPath();
        ctx.arc(x, y, 9, 0, Math.PI * 2);
        ctx.fill();
      });
    },
    "map",
  );

const useSepiaPhoto = () =>
  useCanvasTexture(
    300,
    360,
    (ctx, w, h) => {
      ctx.fillStyle = "#e9dcc0";
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "#8a6d48";
      ctx.fillRect(16, 16, w - 32, 280);
      ctx.fillStyle = "#c9a983";
      ctx.beginPath();
      ctx.arc(150, 140, 46, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#3a2a18";
      ctx.beginPath();
      ctx.arc(150, 128, 48, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = "#5a4630";
      ctx.fillRect(100, 190, 100, 106);
      ctx.fillStyle = "#b3121e";
      ctx.font = "900 40px 'DejaVu Sans'";
      ctx.fillText("1618", 170, 340);
    },
    "sepia",
  );

const MapShot: React.FC<{ from: number }> = ({ from }) => {
  const { local } = useT(from);
  const map = useMapTexture();
  const photo = useSepiaPhoto();
  return (
    <Shot bg="#140f0a">
      <ambientLight intensity={0.5} color="#ffe2bf" />
      <pointLight position={[0.3, 1.4, 0.5]} intensity={10} color="#ffcf8a" distance={4} />
      <Cam pos={[-0.6 + local * 0.25, 1.15 - local * 0.06, 0.6]} look={[-0.3 + local * 0.18, 0, -0.05]} fov={40} />
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.8, 1.12]} />
        <meshStandardMaterial map={map} />
      </mesh>
      <mesh position={[0.55, 0.004, 0.32]} rotation={[-Math.PI / 2, 0, -0.2]}>
        <planeGeometry args={[0.24, 0.29]} />
        <meshStandardMaterial map={photo} />
      </mesh>
      <mesh position={[0, -0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[4, 4]} />
        <meshStandardMaterial color="#3d2b22" />
      </mesh>
    </Shot>
  );
};

const TrainShot: React.FC<{ from: number }> = ({ from }) => {
  const { t, local } = useT(from);
  const x = -6 + local * 7;
  return (
    <Shot bg="#9fb0c8">
      <SkyBackground stops={[[0, "#5a6a88"], [1, "#d8e0ec"]]} k="train" />
      <fog attach="fog" args={["#c9d4e4", 8, 30]} />
      <ambientLight intensity={0.8} color="#dfe8ff" />
      <directionalLight position={[2, 5, 4]} intensity={1.2} />
      <Cam pos={[-1 + local * 0.6, 1.6, 6]} look={[x, 1, 0]} fov={42} />
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial color="#eef2f8" />
      </mesh>
      {/* rails */}
      {[-0.5, 0.5].map((z) => (
        <mesh key={z} position={[0, 0.05, z]}>
          <boxGeometry args={[60, 0.06, 0.08]} />
          <meshStandardMaterial color="#555" />
        </mesh>
      ))}
      {/* old steam train */}
      <group position={[x, 0, 0]}>
        {[0, -3.2, -6.4].map((dx, i) => (
          <mesh key={i} position={[dx, 0.95, 0]}>
            <boxGeometry args={[3, 1.6, 1.5]} />
            <meshStandardMaterial color={i === 0 ? "#2a2a2e" : "#5a1f18"} />
          </mesh>
        ))}
        <mesh position={[1.1, 2.0, 0]}>
          <cylinderGeometry args={[0.18, 0.22, 0.6, 10]} />
          <meshStandardMaterial color="#1a1a1a" />
        </mesh>
        {Array.from({ length: 6 }).map((_, i) => (
          <mesh key={`s${i}`} position={[1.1 - i * 0.7, 2.4 + i * 0.25, 0]} scale={0.4 + i * 0.2}>
            <sphereGeometry args={[1, 8, 6]} />
            <meshStandardMaterial color="#e8eaee" transparent opacity={0.6 - i * 0.08} />
          </mesh>
        ))}
        {/* warm windows */}
        {[-3.2, -6.4].map((dx) =>
          [-0.8, 0, 0.8].map((wx) => (
            <mesh key={`${dx}${wx}`} position={[dx + wx, 1.2, 0.76]}>
              <planeGeometry args={[0.45, 0.4]} />
              <meshBasicMaterial color="#ffcf7a" toneMapped={false} />
            </mesh>
          )),
        )}
      </group>
      {Array.from({ length: 14 }).map((_, i) => (
        <mesh key={`p${i}`} position={[-14 + i * 2.2, 1.2, -4 - rnd(i) * 6]}>
          <coneGeometry args={[0.6, 2.4, 6]} />
          <meshStandardMaterial color="#2a3a32" />
        </mesh>
      ))}
      <Snow t={t} count={200} area={20} wind={1.5} />
    </Shot>
  );
};

const Cabin: React.FC<{ glow?: number }> = ({ glow = 1 }) => (
  <group>
    <mesh position={[0, 1.1, 0]}>
      <boxGeometry args={[3, 2.2, 2.4]} />
      <meshStandardMaterial color="#4a3020" />
    </mesh>
    <mesh position={[0, 2.6, 0]} rotation={[0, Math.PI / 4, 0]}>
      <coneGeometry args={[2.4, 1.3, 4]} />
      <meshStandardMaterial color="#eef2f8" />
    </mesh>
    <mesh position={[0.6, 1.2, 1.21]}>
      <planeGeometry args={[0.7, 0.6]} />
      <meshBasicMaterial color={new THREE.Color("#ffb35a").multiplyScalar(glow)} toneMapped={false} />
    </mesh>
    <Glow position={[0.6, 1.2, 1.4]} color="#ffb35a" size={1.6 * glow} />
    <mesh position={[-0.6, 0.85, 1.21]}>
      <planeGeometry args={[0.7, 1.7]} />
      <meshStandardMaterial color="#2a1a10" />
    </mesh>
    <mesh position={[1, 2.9, -0.4]}>
      <boxGeometry args={[0.35, 0.9, 0.35]} />
      <meshStandardMaterial color="#5a4a40" />
    </mesh>
  </group>
);

const CabinShot: React.FC<{ from: number }> = ({ from }) => {
  const { t, local } = useT(from);
  return (
    <Shot bg="#0b1020">
      <SkyBackground stops={[[0, "#05070f"], [1, "#1b2440"]]} k="cabin" />
      <fog attach="fog" args={["#1b2440", 8, 30]} />
      <ambientLight intensity={0.35} color="#8fa6d6" />
      <directionalLight position={[-3, 5, 2]} intensity={0.8} color="#9fb6ff" />
      <pointLight position={[0.6, 1.2, 2.2]} intensity={8} color="#ffb35a" distance={6} />
      <Cam pos={[1.2, 1.7, 9 - local * 1.2]} look={[0, 1.2, 0]} fov={40} />
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial color="#dfe6f2" />
      </mesh>
      <Cabin />
      {Array.from({ length: 12 }).map((_, i) => (
        <mesh key={i} position={[(rnd(i) - 0.5) * 20, 1.4, -4 - rnd(i * 2) * 8]}>
          <coneGeometry args={[0.7, 2.8, 6]} />
          <meshStandardMaterial color="#1f2c28" />
        </mesh>
      ))}
      <Person {...YOU} coat="#2a2f3a" position={[0.4, 0, 6.4 - local * 0.9]} rotation={[0, Math.PI, 0]} />
      <Snow t={t} count={260} area={18} wind={1.2} />
    </Shot>
  );
};

/* ---------------------------------------------------------------- Mara */

const MaraShot: React.FC<{ from: number }> = ({ from }) => {
  const { t } = useT(from);
  const fire = interpolate(t, [38.2, 38.9], [0, 1], clamp);
  const turn = interpolate(t, [38.9, 39.6], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const speaking = t > 43.1;
  // camera: over your shoulder, then closer on her during the lines
  const k = interpolate(t, [37.0, 43.0, 49.2], [0, 0.4, 1], clamp);
  const pos: V3 = [0.6 - k * 0.3, 1.75 - k * 0.2, 3.1 - k * 1.3];
  return (
    <Shot bg="#0a0604">
      <ambientLight intensity={0.12} color="#8fa6d6" />
      <pointLight position={[-1.0, 0.6, -1.4]} intensity={2 + fire * 18 * (0.9 + Math.sin(t * 17) * 0.1)} color="#ff9a3c" distance={7} />
      <pointLight position={[1.4, 2.0, 1.4]} intensity={1.5} color="#6f8ed6" distance={5} />
      {/* candle-warm key on her face once she turns */}
      <pointLight position={[0.2, 1.7, 0.2]} intensity={1 + turn * 7} color="#ffb874" distance={3.5} />
      <Cam pos={pos} look={[-0.3, 1.25, -1.0]} fov={38} />
      {/* log walls */}
      <mesh position={[0, 1.6, -2.4]}>
        <planeGeometry args={[8, 3.4]} />
        <meshStandardMaterial color="#3a2618" />
      </mesh>
      {Array.from({ length: 8 }).map((_, i) => (
        <mesh key={i} position={[0, 0.2 + i * 0.42, -2.35]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.2, 0.2, 8, 10]} />
          <meshStandardMaterial color={i % 2 ? "#4a3020" : "#3e2818"} />
        </mesh>
      ))}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[8, 8]} />
        <meshStandardMaterial color="#2a1a10" />
      </mesh>
      {/* stone fireplace */}
      <mesh position={[-1.0, 0.6, -2.0]}>
        <boxGeometry args={[1.4, 1.2, 0.6]} />
        <meshStandardMaterial color="#5a5550" flatShading />
      </mesh>
      <mesh position={[-1.0, 0.45, -1.7]}>
        <boxGeometry args={[0.8, 0.6, 0.1]} />
        <meshStandardMaterial color="#0a0604" />
      </mesh>
      {fire > 0
        ? Array.from({ length: 6 }).map((_, i) => (
            <mesh key={i} position={[-1.2 + i * 0.08, 0.3 + Math.abs(Math.sin(t * 9 + i)) * 0.1, -1.68]} scale={[1, 1 + Math.sin(t * 13 + i) * 0.3, 1]}>
              <coneGeometry args={[0.06, 0.32 * fire, 6]} />
              <meshBasicMaterial color={i % 2 ? "#ffb347" : "#ff6a1f"} toneMapped={false} />
            </mesh>
          ))
        : null}
      {fire > 0 ? <Glow position={[-1.0, 0.45, -1.6]} color="#ff9a3c" size={1.6 * fire} /> : null}
      {/* Mara kneeling by the fire, then turning to you */}
      <group position={[-0.55, 0, -1.25]} rotation={[0, interpolate(turn, [0, 1], [-2.3, 0.35]), 0]}>
        <Person {...MARA} pose={turn > 0.5 ? "stand" : "crouch"} amount={1 - turn} headTilt={speaking ? -0.05 : 0} />
        {/* the scar */}
        <mesh position={[0.06, 1.62 - (turn > 0.5 ? 0 : 0.35), 0.13]} rotation={[0, 0, 0.7]}>
          <boxGeometry args={[0.05, 0.006, 0.005]} />
          <meshBasicMaterial color="#8a2a20" />
        </mesh>
      </group>
      {/* you, from behind */}
      <Person {...YOU} coat="#2a2f3a" position={[0.45, 0, 1.0]} rotation={[0, Math.PI - 0.5, 0]} />
    </Shot>
  );
};

/* -------------------------------------------------------------- candles */

const CandlesShot: React.FC<{ from: number }> = ({ from }) => {
  const { t, local, frame } = useT(from);
  // eleven go out one by one from 50.3 to 51.7; one stays lit
  const outAt = (i: number) => 50.3 + i * 0.13;
  const flip = interpolate(t, [51.9, 52.5], [0, Math.PI], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const d = interpolate(local, [0, 6], [2.0, 1.25], { easing: Easing.out(Easing.quad) });
  return (
    <Shot bg="#050304">
      <ambientLight intensity={0.05} />
      <Cam pos={[0, 0.85 + d * 0.5, d]} look={[0, 0.8, 0]} fov={40} />
      <pointLight position={[0, 1.2, 0]} intensity={3 + interpolate(t, [50.3, 51.8], [9, 1], clamp)} color="#ffb35a" distance={4} />
      <mesh position={[0, 0.76, 0]}>
        <cylinderGeometry args={[1.0, 1.0, 0.06, 32]} />
        <meshStandardMaterial color="#3d2b22" />
      </mesh>
      {Array.from({ length: 12 }).map((_, i) => {
        const a = (i / 12) * Math.PI * 2;
        const lit = i === 11 ? 1 : t < outAt(i) ? 1 : 0;
        return <Candle key={i} position={[Math.sin(a) * 0.7, 0.79, Math.cos(a) * 0.7]} lit={lit} flick={frame * 0.1 + i} />;
      })}
      {/* hourglass in the centre, flipped by her hand */}
      <group position={[0, 0.98, 0]} rotation={[0, 0, flip]}>
        <mesh position={[0, 0.1, 0]}>
          <coneGeometry args={[0.1, 0.2, 16, 1, true]} />
          <meshStandardMaterial color="#cfe6f0" transparent opacity={0.45} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, -0.1, 0]} rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[0.1, 0.2, 16, 1, true]} />
          <meshStandardMaterial color="#cfe6f0" transparent opacity={0.45} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, -0.14, 0]}>
          <coneGeometry args={[0.07, 0.1, 12]} />
          <meshStandardMaterial color="#e3c27a" />
        </mesh>
        {[0.21, -0.21].map((y) => (
          <mesh key={y} position={[0, y, 0]}>
            <cylinderGeometry args={[0.13, 0.13, 0.02, 16]} />
            <meshStandardMaterial color="#4a3020" />
          </mesh>
        ))}
      </group>
      {t > 51.6 && t < 52.8 ? (
        <mesh position={[0.25, 1.1, 0.05]} scale={[0.09, 0.03, 0.11]}>
          <sphereGeometry args={[1, 12, 8]} />
          <meshStandardMaterial color="#d9a98a" />
        </mesh>
      ) : null}
      {/* the one that stays lit: cyan hint of the Brake */}
      {t > 52.4 ? <Glow position={[Math.sin((11 / 12) * Math.PI * 2) * 0.7, 1.2, Math.cos((11 / 12) * Math.PI * 2) * 0.7]} color="#22d3ee" size={0.6} /> : null}
    </Shot>
  );
};

/* ---------------------------------------------------------------- config */

const cfg: EpisodeConfig = {
  dir: "ep3",
  duration: DURATION,
  shots: (
    [
      ["arms", ArmsShot],
      ["eras", ErasShot],
      ["write", ArmsShot],
      ["rooftop", RooftopShot],
      ["cinema", CinemaShot],
      ["summit", SummitShot],
      ["map", MapShot],
      ["train", TrainShot],
      ["cabin", CabinShot],
      ["mara", MaraShot],
      ["candles", CandlesShot],
    ] as [keyof typeof T, React.FC<{ from: number }>][]
  ).map(([name, Comp]) => ({ name, from: T[name][0], to: T[name][1], Comp })),
  hud: (t) => {
    if (t >= END) return null;
    const mem = Math.max(38, 61 - Math.floor(t / 2.4));
    const base = { year: "YEAR 300", counter: `MEMORY: ${mem}%`, counterColor: mem < 45 ? C.red : C.amber };
    if (t < T.eras[0]) return { ...base, clock: "03:33", location: "??? (NAME UNKNOWN)" };
    if (t < T.write[0]) return { ...base, clock: "--:--", location: ERAS[Math.min(4, Math.floor((t - 5) / 0.92))].label };
    if (t < T.rooftop[0]) return { ...base, clock: "03:41", location: "HOME" };
    if (t < T.map[0]) return { ...base, clock: "--:--", location: t < T.cinema[0] ? "EVERY JOB" : t < T.summit[0] ? "EVERY COUNTRY" : "EVERY LOVE" };
    if (t < T.cabin[0]) return { ...base, clock: "--:--", location: "10 COUNTRIES · 2 CENTURIES" };
    return { ...base, clock: "23:58", location: "CABIN, NORWAY" };
  },
  hook: { line1: "YEAR 300.", line2: "YOU FORGOT YOUR OWN NAME.", line2At: 1.8, until: 4.8 },
  stamps: [
    { at: 23.8, dur: 1.8, text: "NOTHING HURTS.", color: C.cyan },
    { at: 42.18, dur: 1.5, text: "ALIVE SINCE 1612", color: C.amber },
    { at: 47.64, dur: 1.7, text: "A SENTENCE.", color: C.red },
    { at: 52.43, dur: 2.4, text: "THE BRAKE", color: C.cyan },
  ],
  flashes: [
    { at: T.eras[0], color: "#fff", frames: 8 },
    { at: T.rooftop[0], color: "#000", frames: 8 },
    { at: T.map[0], color: "#000", frames: 10 },
    { at: T.mara[0], color: "#000", frames: 10 },
    { at: T.candles[0], color: "#000", frames: 10 },
  ],
  mascotAlert: [37.2, 55.2],
  end: {
    from: END,
    question: "If you could forget one year of your life forever… which year would it be?",
    prompt: "TELL ME WHICH YEAR IN THE COMMENTS ↓",
  },
  sfx: [
    { file: "sfx_wind.mp3", at: 31.6, dur: 17.6, loop: true },
    { file: "sfx_fire.mp3", at: 38.2, dur: 11.0, loop: true },
    ...[23.8, 42.18, 47.64, 52.43].map((s) => ({ file: "sfx_hit.mp3", at: s - 0.3, dur: 2 })),
  ],
};

export const Forever25Ep3: React.FC = () => <Episode cfg={cfg} />;
export const EP3_DURATION = DURATION;
