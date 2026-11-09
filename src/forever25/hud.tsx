import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

// Series palette (bible): night blue bg, cyan = immortal/Brake, amber = human, red = Ilya/threat.
export const C = {
  bg: "#070b1a",
  cyan: "#22d3ee",
  amber: "#fbb024",
  red: "#ff3b4e",
  yellow: "#ffd400",
  white: "#f4f6ff",
};

const mono = "'JetBrains Mono', 'DejaVu Sans Mono', monospace";
const sans = "Inter, 'Inter Display', Arial, sans-serif";

const Box: React.FC<{ color: string; children: React.ReactNode; style?: React.CSSProperties }> = ({
  color,
  children,
  style,
}) => (
  <div
    style={{
      border: `4px solid ${color}`,
      borderRadius: 16,
      padding: "10px 18px",
      color,
      background: "rgba(5,8,20,0.55)",
      boxShadow: `0 0 18px ${color}55`,
      ...style,
    }}
  >
    {children}
  </div>
);

/** Top HUD, same layout as the series1 videos: left box, centre clock + location, right counter. */
export const Hud: React.FC<{
  year: string;
  clock: string;
  location: string;
  /** Second, changing counter under BODY AGE (e.g. LICENSE: 43). */
  counter: string;
  counterBlink?: boolean;
  counterColor?: string;
}> = ({ year, clock, location, counter, counterBlink = true, counterColor = C.red }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const blinkOn = !counterBlink || Math.floor((frame / fps) * 2) % 2 === 0;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 420,
          background: "linear-gradient(rgba(4,6,14,0.75), rgba(4,6,14,0.35) 60%, rgba(4,6,14,0))",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 190,
          left: 40,
          right: 40,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <Box color={C.amber} style={{ fontFamily: sans,
          fontWeight: 900, fontSize: year.length > 10 ? 26 : 40, letterSpacing: -1 }}>
          {year}
        </Box>
        <div style={{ textAlign: "center", marginTop: -6 }}>
          <div style={{ fontFamily: mono, fontWeight: 700, fontSize: 64, color: C.white, textShadow: "0 0 14px rgba(0,0,0,0.9)" }}>
            {clock}
          </div>
          <div
            style={{
              fontFamily: "Arial, sans-serif",
              fontWeight: 700,
              fontSize: 26,
              color: "#c9d2f0",
              textShadow: "0 0 10px rgba(0,0,0,0.9)",
              display: "flex",
              alignItems: "center",
              gap: 14,
              justifyContent: "center",
            }}
          >
            <span style={{ width: 16, height: 16, borderRadius: 8, background: C.red, display: "inline-block" }} />
            {location}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 12 }}>
          <Box color={C.cyan} style={{ fontFamily: mono, fontWeight: 700, fontSize: 34 }}>
            BODY AGE: 25
          </Box>
          <Box
            color={counterColor}
            style={{
              fontFamily: mono,
              fontWeight: 700,
              fontSize: 30,
              opacity: blinkOn ? 1 : 0.25,
              padding: "6px 14px",
            }}
          >
            {counter}
          </Box>
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** The channel's "404" eye-cube mascot, bottom-left, as in series1. */
export const Mascot: React.FC<{ alert?: boolean }> = ({ alert }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  // Eye looks around slowly; blinks every ~3.7 s.
  const lookX = Math.sin(t * 0.9) * 10;
  const lookY = Math.cos(t * 0.7) * 6;
  const blinkPhase = (t % 3.7) / 3.7;
  const blink = blinkPhase > 0.96 ? 0.1 : 1;
  const bob = Math.sin(t * 2.2) * 4;
  return (
    <div style={{ position: "absolute", left: 80, bottom: 330, transform: `translateY(${bob}px)` }}>
      <div
        style={{
          position: "absolute",
          top: -26,
          left: 34,
          background: "#9cc8ff",
          border: "4px solid #f5a524",
          borderBottom: "none",
          borderRadius: "10px 10px 0 0",
          padding: "0 12px",
          fontFamily: mono,
          fontWeight: 700,
          fontSize: 22,
          color: "#16325c",
        }}
      >
        404
      </div>
      <div
        style={{
          width: 170,
          height: 150,
          background: "#a9cdf5",
          border: "6px solid #f5a524",
          borderRadius: 22,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: 128,
            height: 128 * blink,
            borderRadius: "50%",
            background: "white",
            border: "5px solid #10162a",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: "50%",
              background: "#1fb6e0",
              transform: `translate(${lookX}px, ${lookY}px)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#0b1020" }} />
          </div>
        </div>
      </div>
      {alert ? (
        <div
          style={{
            position: "absolute",
            top: -50,
            right: -40,
            width: 64,
            height: 64,
            borderRadius: 32,
            background: "#10162a",
            border: "5px solid #f5c400",
            color: "#f5c400",
            fontFamily: sans,
          fontWeight: 900,
            fontSize: 40,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          !
        </div>
      ) : null}
    </div>
  );
};

/** Tilted label that slams in, like the "DEAD AIR" stamp in series1. Use inside a <Sequence>. */
export const Stamp: React.FC<{ text: string; color?: string; top?: number; rotate?: number }> = ({
  text,
  color = C.red,
  top = 760,
  rotate = -4,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 11, stiffness: 260 } });
  const scale = interpolate(s, [0, 1], [2.2, 1]);
  return (
    <AbsoluteFill style={{ alignItems: "center", pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          top,
          transform: `rotate(${rotate}deg) scale(${scale})`,
          opacity: interpolate(s, [0, 0.3], [0, 1], { extrapolateRight: "clamp" }),
          background: color,
          color: "white",
          fontFamily: sans,
          fontWeight: 900,
          fontSize: 86,
          padding: "14px 46px",
          borderRadius: 14,
          boxShadow: "0 18px 40px rgba(0,0,0,0.55)",
          whiteSpace: "nowrap",
        }}
      >
        {text}
      </div>
    </AbsoluteFill>
  );
};

/** Hook text for 0:00-0:05: big two-line title. Use inside a <Sequence>. */
export const Hook: React.FC<{ line1: string; line2: string; line2At: number }> = ({ line1, line2, line2At }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const a = spring({ frame, fps, config: { damping: 13, stiffness: 220 } });
  const b = spring({ frame: frame - line2At, fps, config: { damping: 13, stiffness: 220 } });
  const shake = frame >= line2At && frame < line2At + 8 ? Math.sin(frame * 3) * 10 : 0;
  return (
    <AbsoluteFill style={{ alignItems: "center", pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          top: 420,
          textAlign: "center",
          fontFamily: sans,
          fontWeight: 900,
          // shrink very long single words (e.g. "5,000,000,000.") so they fit the 1080 px frame
          fontSize: Math.min(108, Math.floor(1300 / Math.max(10, ...[line1, line2].flatMap((l) => l.split(" ")).map((w) => w.length)))),
          lineHeight: 1.05,
          color: "white",
          WebkitTextStroke: "12px #05070f",
          paintOrder: "stroke fill",
          transform: `translateX(${shake}px)`,
        }}
      >
        <div style={{ transform: `scale(${a})` }}>{line1}</div>
        <div style={{ transform: `scale(${Math.max(0, b)})`, color: C.yellow }}>{line2}</div>
      </div>
    </AbsoluteFill>
  );
};

/** Full-screen colour flash that decays. Use inside a <Sequence>. */
export const Flash: React.FC<{ color?: string; frames?: number }> = ({ color = "white", frames = 10 }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, frames], [1, 0], { extrapolateRight: "clamp" });
  return <AbsoluteFill style={{ backgroundColor: color, opacity, pointerEvents: "none" }} />;
};

/** Final question card: black screen + two answer buttons. Use inside a <Sequence>. */
export const EndCard: React.FC<{ question: string; a?: string; b?: string; prompt?: string }> = ({
  question,
  a,
  b,
  prompt,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const q = spring({ frame, fps, config: { damping: 16 } });
  const btn = (delay: number) => spring({ frame: frame - delay, fps, config: { damping: 10, stiffness: 180 } });
  const pulse = 1 + Math.sin((frame / fps) * 6) * 0.03;
  const button = (label: string, color: string, delay: number) => (
    <div
      style={{
        transform: `scale(${btn(delay) * pulse})`,
        width: 420,
        padding: label.length > 6 ? "46px 0" : "34px 0",
        textAlign: "center",
        borderRadius: 28,
        border: `6px solid ${color}`,
        color,
        fontFamily: sans,
          fontWeight: 900,
        fontSize: label.length > 7 ? 58 : label.length > 5 ? 72 : 96,
        whiteSpace: "nowrap",
        background: `${color}1f`,
        boxShadow: `0 0 40px ${color}66`,
      }}
    >
      {label}
    </div>
  );
  return (
    <AbsoluteFill style={{ backgroundColor: "#000", alignItems: "center", justifyContent: "center" }}>
      <div
        style={{
          opacity: q,
          transform: `translateY(${(1 - q) * 40}px)`,
          color: "white",
          fontFamily: sans,
          fontWeight: 900,
          fontSize: 76,
          lineHeight: 1.12,
          textAlign: "center",
          padding: "0 80px",
          marginBottom: 110,
        }}
      >
        {question}
      </div>
      <div style={{ display: "flex", gap: 60 }}>
        {a ? button(a, C.cyan, 12) : null}
        {b ? button(b, C.red, 18) : null}
      </div>
      <div
        style={{
          marginTop: 90,
          opacity: interpolate(frame, [30, 45], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
          color: "#9aa6c8",
          fontFamily: "Arial, sans-serif",
          fontWeight: 700,
          fontSize: 44,
          letterSpacing: 2,
        }}
      >
        {prompt ?? `COMMENT ${a} OR ${b}`}
      </div>
    </AbsoluteFill>
  );
};

/** Subtle film grain + vignette over everything (bible: "subtle film grain"). */
export const Grain: React.FC = () => {
  const frame = useCurrentFrame();
  const seed = frame % 8;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <AbsoluteFill
        style={{
          background: "radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(0,0,0,0.55) 100%)",
        }}
      />
      <svg width="100%" height="100%" style={{ position: "absolute", opacity: 0.09, mixBlendMode: "overlay" }}>
        <filter id={`g${seed}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={seed} />
        </filter>
        <rect width="100%" height="100%" filter={`url(#g${seed})`} />
      </svg>
    </AbsoluteFill>
  );
};
