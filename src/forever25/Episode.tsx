import React from "react";
import { AbsoluteFill, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Audio } from "@remotion/media";
import { Captions } from "../components/Captions";
import { C, EndCard, Flash, Grain, Hook, Hud, Mascot, Stamp } from "./hud";

/**
 * Generic FOREVER 25 episode: everything the series repeats (3D shots, HUD, hook, stamps,
 * flashes, mascot, captions, end card, audio mix) driven by a plain config object.
 *
 * Audio levels: every file in public/forever25/epN/ is pre-levelled by scripts/level_audio.py
 * (voice loud speech ≈ -22.7 LUFS momentary, effects ≈ 5 dB under it, stamp hits ≈ 9 dB under,
 * ambience beds ≈ 11 dB under), so the narrator is always on top and `vol` here stays near 1.
 */

export type ShotDef = { name: string; from: number; to: number; Comp: React.FC<{ from: number }> };

export type HudState = { year: string; clock: string; location: string; counter: string; counterColor?: string } | null;

export type EpisodeConfig = {
  dir: string; // public/forever25/<dir>/
  duration: number; // seconds
  shots: ShotDef[];
  hud: (t: number) => HudState;
  hook: { line1: string; line2: string; line2At: number; until: number };
  stamps: { at: number; dur: number; text: string; color: string; rotate?: number; top?: number }[];
  flashes: { at: number; color?: string; frames?: number }[];
  mascotAlert?: [number, number];
  end: { from: number; question: string; a?: string; b?: string; prompt?: string };
  sfx: { file: string; at: number; dur?: number; vol?: number; trimBefore?: number; loop?: boolean }[];
};

const f = (s: number, fps: number) => Math.round(s * fps);

const HudLayer: React.FC<{ hud: EpisodeConfig["hud"] }> = ({ hud }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = hud(frame / fps);
  if (!s) return null;
  return <Hud year={s.year} clock={s.clock} location={s.location} counter={s.counter} counterColor={s.counterColor} />;
};

export const Episode: React.FC<{ cfg: EpisodeConfig }> = ({ cfg }) => {
  const { fps } = useVideoConfig();
  const ep = (p: string) => staticFile(`forever25/${cfg.dir}/${p}`);
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      {cfg.shots.map(({ name, from, to, Comp }) => (
        <Sequence key={name} name={`shot:${name}`} from={f(from, fps)} durationInFrames={f(to - from, fps)}>
          <Comp from={from} />
        </Sequence>
      ))}

      {cfg.flashes.map((fl, i) => (
        <Sequence key={i} name="flash" from={f(fl.at, fps)} durationInFrames={fl.frames ?? 10}>
          <Flash color={fl.color ?? "white"} frames={fl.frames ?? 10} />
        </Sequence>
      ))}

      <Grain />

      <Sequence name="HUD" from={0} durationInFrames={f(cfg.end.from, fps)}>
        <HudLayer hud={cfg.hud} />
      </Sequence>

      <Sequence name="hook" from={3} durationInFrames={f(cfg.hook.until, fps) - 3}>
        <Hook line1={cfg.hook.line1} line2={cfg.hook.line2} line2At={f(cfg.hook.line2At, fps) - 3} />
      </Sequence>

      {cfg.stamps.map((s, i) => (
        <Sequence key={i} name={`stamp ${s.text}`} from={f(s.at, fps)} durationInFrames={f(s.dur, fps)}>
          <Stamp text={s.text} color={s.color} rotate={s.rotate ?? (i % 2 ? 3 : -4)} top={s.top ?? 700} />
        </Sequence>
      ))}

      <Sequence name="mascot" from={0} durationInFrames={f(cfg.end.from, fps)}>
        <Mascot alert={false} />
      </Sequence>
      {cfg.mascotAlert ? (
        <Sequence
          name="mascot alert"
          from={f(cfg.mascotAlert[0], fps)}
          durationInFrames={f(cfg.mascotAlert[1] - cfg.mascotAlert[0], fps)}
        >
          <Mascot alert />
        </Sequence>
      ) : null}

      <Sequence name="captions" from={0} durationInFrames={f(cfg.end.from, fps)}>
        <Captions
          src={ep("captions.json")}
          style={{ bottom: 600, fontSize: 82, fontFamily: "Inter, Arial, sans-serif", stroke: false, combineMs: 450 }}
        />
      </Sequence>

      <Sequence name="end card" from={f(cfg.end.from, fps)} durationInFrames={f(cfg.duration - cfg.end.from, fps)}>
        <EndCard question={cfg.end.question} a={cfg.end.a} b={cfg.end.b} prompt={cfg.end.prompt} />
      </Sequence>

      <Audio src={ep("voice.mp3")} />
      {/* dark drone bed: kept very low (-12 dB, ≈23 dB under the voice) so it never competes */}
      <Audio src={ep("drone.mp3")} volume={0.25} />
      {cfg.sfx.map((s, i) => (
        <Sequence
          key={i}
          name={`sfx ${s.file}`}
          from={f(s.at, fps)}
          durationInFrames={s.dur ? f(s.dur, fps) : f(cfg.duration - s.at, fps)}
        >
          <Audio src={ep(s.file)} volume={s.vol ?? 1} trimBefore={s.trimBefore ? f(s.trimBefore, fps) : undefined} loop={s.loop} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
