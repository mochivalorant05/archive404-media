import React from "react";
import { AbsoluteFill, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Audio } from "@remotion/media";
import { Captions } from "../../components/Captions";
import { C, EndCard, Flash, Grain, Hook, Hud, Mascot, Stamp } from "../hud";
import { BEATS, EP1_DURATION, HUD_BY_SHOT, SHOTS, type ShotName } from "./timeline";
import { CutShot, ErShot, FallShot, GodShot, StandUpShot, TruckShot, WeeksShot } from "./shots-a";
import { BoxShot, FriendShot, KitchenShot, MirrorShot, PhotoShot } from "./shots-b";

const SHOT_COMPONENTS: Record<Exclude<ShotName, "end">, React.FC<{ from: number }>> = {
  truck: TruckShot,
  standUp: StandUpShot,
  er: ErShot,
  weeks: WeeksShot,
  cut: CutShot,
  fall: FallShot,
  god: GodShot,
  photo: PhotoShot,
  friend: FriendShot,
  mirror: MirrorShot,
  kitchen: KitchenShot,
  box: BoxShot,
};

// ---- Mix -------------------------------------------------------------------------------
// Rule: the narrator is ALWAYS on top. Levels were measured with EBU R128 (momentary loudness):
//   voice.mp3 loud speech ≈ -23 LUFS · sfx peaks: truck -1.7, hit -3.5, box -3.6 · drone -28.
// Each effect's loudest moment is set ~5 dB under the narrator's loud speech (≈ 75 vs 50),
// the drone bed ~12 dB under. Change the dB values here to rebalance.
const dB = (x: number) => Math.pow(10, x / 20);
const VOICE_VOL = 1;
const TRUCK_VOL = dB(-26); // peak -1.7 → ≈ -28
const HIT_VOL = dB(-28.5); // peak -3.5 → ≈ -32 (under the softest lines, e.g. "like a god")
const BOX_VOL = dB(-24.5); // peak -3.6 → ≈ -28
const DRONE_VOL = dB(-7); // -28 → ≈ -35

const f = (s: number, fps: number) => Math.round(s * fps);
const ep = (p: string) => staticFile(`forever25/ep1/${p}`);

/** Which shot is on screen at time t (for the HUD). */
const shotAt = (t: number): ShotName =>
  (Object.keys(SHOTS) as ShotName[]).find((k) => t >= SHOTS[k][0] && t < SHOTS[k][1]) ?? "end";

const HudLayer: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const shot = shotAt(t);
  const hud = HUD_BY_SHOT[shot];
  // Black beat after the box flash: no HUD.
  if (!hud || (t > BEATS.boxFlash + 0.25 && shot === "box")) return null;
  // "Weeks go by": the clock spins through hours.
  const clock =
    shot === "weeks"
      ? `${String(Math.floor((t * 37) % 24)).padStart(2, "0")}:${String(Math.floor((t * 613) % 60)).padStart(2, "0")}`
      : hud.clock;
  return <Hud year="YEAR 0" clock={clock} location={hud.location} counter="LICENSE: 43" />;
};

export const Forever25Ep1: React.FC = () => {
  const { fps } = useVideoConfig();
  const S = (k: ShotName) => ({ from: f(SHOTS[k][0], fps), durationInFrames: f(SHOTS[k][1] - SHOTS[k][0], fps) });

  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      {/* ---------- 3D shots (each its own canvas, mounted only while on screen) ---------- */}
      {(Object.keys(SHOT_COMPONENTS) as Exclude<ShotName, "end">[]).map((k) => {
        const Comp = SHOT_COMPONENTS[k];
        return (
          <Sequence key={k} name={`shot:${k}`} {...S(k)}>
            <Comp from={SHOTS[k][0]} />
          </Sequence>
        );
      })}

      {/* ---------- transitions ---------- */}
      <Sequence name="impact flash" from={f(BEATS.impact, fps)} durationInFrames={14}>
        <Flash frames={14} />
      </Sequence>
      {(["er", "weeks", "photo", "kitchen"] as ShotName[]).map((k) => (
        <Sequence key={k} name={`cut:${k}`} from={f(SHOTS[k][0], fps)} durationInFrames={8}>
          <Flash color="#000" frames={8} />
        </Sequence>
      ))}
      <Sequence name="box flash" from={f(BEATS.boxFlash, fps)} durationInFrames={12}>
        <Flash color={C.cyan} frames={12} />
      </Sequence>

      <Grain />

      {/* ---------- 2D overlays ---------- */}
      <Sequence name="HUD" from={0} durationInFrames={f(SHOTS.end[0], fps)}>
        <HudLayer />
      </Sequence>

      {/* Hook 0:00–0:05 (bible: "A TRUCK HIT YOU. YOU STOOD UP.") */}
      <Sequence name="hook" from={3} durationInFrames={f(4.6, fps)}>
        <Hook line1="A TRUCK HIT YOU." line2="YOU STOOD UP." line2At={f(BEATS.hookLine2, fps) - 3} />
      </Sequence>

      {/* Stamps on the key beats, like "DEAD AIR" in series 1 */}
      <Sequence name="stamp 25≠43" from={f(BEATS.mismatchStamp, fps)} durationInFrames={f(0.95, fps)}>
        <Stamp text="25 ≠ 43" color={C.red} top={700} />
      </Sequence>
      <Sequence name="stamp god" from={f(BEATS.likeAGod - 0.1, fps)} durationInFrames={f(2.1, fps)}>
        <Stamp text="LIKE A GOD." color={C.amber} top={720} rotate={3} />
      </Sequence>
      <Sequence name="stamp 18y" from={f(BEATS.eighteenYears, fps)} durationInFrames={f(1.3, fps)}>
        <Stamp text="18 YEARS AGO" color="#3b5bdb" top={700} rotate={-3} />
      </Sequence>
      <Sequence name="stamp unchanged" from={f(BEATS.notOneLine, fps)} durationInFrames={f(2.2, fps)}>
        <Stamp text="0 CHANGES" color={C.cyan} top={700} rotate={-4} />
      </Sequence>
      <Sequence name="stamp watching" from={f(BEATS.watching + 0.9, fps)} durationInFrames={f(1.9, fps)}>
        <Stamp text="WATCHED: 18 YEARS" color={C.red} top={700} rotate={2} />
      </Sequence>

      <Sequence name="mascot" from={0} durationInFrames={f(SHOTS.end[0], fps)}>
        <Mascot alert={false} />
      </Sequence>
      <Sequence name="mascot alert" from={f(BEATS.stranger, fps)} durationInFrames={f(BEATS.boxFlash - BEATS.stranger, fps)}>
        <Mascot alert />
      </Sequence>

      {/* Captions (word-highlight), off during the end card which shows the question itself */}
      <Sequence name="captions" from={0} durationInFrames={f(SHOTS.end[0], fps)}>
        <Captions
          src={ep("captions.json")}
          style={{ bottom: 600, fontSize: 82, fontFamily: "Inter, Arial, sans-serif", stroke: false, combineMs: 450 }}
        />
      </Sequence>

      {/* End card 0:55–1:02 */}
      <Sequence name="end card" {...S("end")}>
        <EndCard question="Would you want to live forever… if you could never tell anyone?" a="YES" b="NO" />
      </Sequence>

      {/* ---------- audio ---------- */}
      <Audio src={ep("voice.mp3")} volume={VOICE_VOL} />
      <Audio src={ep("drone.mp3")} volume={DRONE_VOL} />
      {/* horn + crash: the crash in the file is at 3.0 s, so start 0.7 s in to hit the 2.3 s impact */}
      <Audio src={ep("sfx_truck.mp3")} trimBefore={f(0.7, fps)} volume={TRUCK_VOL} />
      {[BEATS.mismatchStamp, BEATS.likeAGod, BEATS.eighteenYears, BEATS.notOneLine, BEATS.watching + 0.9].map((s) => (
        <Sequence key={s} name="sfx hit" from={f(s - 0.3, fps)} durationInFrames={f(2, fps)}>
          <Audio src={ep("sfx_hit.mp3")} volume={HIT_VOL} />
        </Sequence>
      ))}
      <Sequence name="sfx box" from={f(BEATS.others - 0.2, fps)} durationInFrames={f(2.1, fps)}>
        <Audio src={ep("sfx_box.mp3")} volume={BOX_VOL} />
      </Sequence>
    </AbsoluteFill>
  );
};

export const EP1_FRAMES = (fps: number) => Math.round(EP1_DURATION * fps);
