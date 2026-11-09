# archive404-media

3D animated short-form videos (1080×1920, 30 fps) built with:

- **Three.js** via [React Three Fiber](https://r3f.docs.pmnd.rs/) + `@remotion/three` for the 3D animation
- **Remotion** for captions (`@remotion/captions`), audio (`@remotion/media`) and rendering to MP4

## Setup

```bash
npm install
npm run studio          # live preview + timeline in the browser
```

## Render

```bash
npx remotion render Short3D out/video.mp4
```

Pass different content with props (no code changes needed):

```bash
npx remotion render Short3D out/day2.mp4 --props='{
  "durationInSeconds": 48,
  "title": "DAY 2",
  "captionsFile": "captions/day2.json",
  "audioFile": "audio/day2-voice.mp3",
  "musicFile": "audio/ambient.mp3",
  "musicVolume": 0.2
}'
```

**No GPU?** (cloud machines, CI) use software WebGL: `REMOTION_GL=swangle npx remotion render ...`

## Project layout

```
src/
  Root.tsx                  # registers the "Short3D" composition (size, fps, duration)
  Short3D.tsx               # stacks the layers: 3D canvas → title → captions → audio
  scenes/LonelyPlanetScene.tsx  # example 3D scene (copy this to make new scenes)
  components/Captions.tsx   # TikTok-style word-highlight captions
  components/TitleCard.tsx  # fading title at the top
public/
  captions/*.json           # caption files
  audio/                    # voice-overs and music
series1/                    # finished videos
src/forever25/              # FOREVER 25 series (HUD, mascot, stamps, end card, 3D kit)
  ep1/                      # Episode 1 "A Truck Hit You": timeline, shots, composition
public/forever25/ep1/       # voice-over, captions, SFX for episode 1
scripts/                    # retime_voice.py, stills.mjs
```

## Making a new 3D scene

Copy `src/scenes/LonelyPlanetScene.tsx` and swap it into `Short3D.tsx`. Two rules keep renders correct:

1. Animate everything from `useCurrentFrame()` (e.g. `const t = frame / fps`), **not** R3F's `useFrame`, `Date.now()` or `requestAnimationFrame`. Remotion renders frames out of order, in parallel.
2. Use Remotion's `random("seed")` instead of `Math.random()`.

Use `interpolate()`, `spring()` and `Easing` from `remotion` for camera moves and timing.
GLTF models: put `.glb` files in `public/models/` and load them with drei's `useGLTF(staticFile("models/x.glb"))`.

## Captions

Caption files are a JSON array of Remotion `Caption` objects (times in ms):

```json
[{ "text": "Day", "startMs": 2600, "endMs": 2900, "timestampMs": 2750, "confidence": 1 },
 { "text": " one.", "startMs": 2900, "endMs": 3500, "timestampMs": 3200, "confidence": 1 }]
```

Note the leading space on every word after the first. Words close together are grouped into one "page" and the
word being spoken is highlighted (`COMBINE_WITHIN_MS` / `HIGHLIGHT` in `Captions.tsx`).
To get word timings from a voice-over automatically, transcribe it with Whisper
(`@remotion/install-whisper-cpp` → `toCaptions()`), or convert an `.srt` with `parseSrt()` from `@remotion/captions`.

## FOREVER 25

Series bible and scripts live in the doc "Miniserie: ¿Y si nunca envejecieses?". Each episode is a
Remotion composition (`Forever25-Ep1`, ...) built from:

- `src/forever25/hud.tsx` - series look: HUD (left `YEAR`, centre clock + location, right `BODY AGE: 25`
  + the episode's blinking counter), the 404 mascot, slam-in stamps, hook title, flashes, the end card with two buttons, film grain.
- `src/forever25/three-kit.tsx` - 3D building blocks: `Shot` (one canvas per shot), `Cam`, the faceless `Person`
  (you are always seen from behind, per the bible), buildings, glows, canvas textures.
- `src/forever25/ep1/timeline.ts` - every shot and beat in seconds. Change timings here.

```bash
npx remotion render Forever25-Ep1 out/forever25_ep1.mp4
node scripts/stills.mjs Forever25-Ep1 out/stills 0.5 1.5 12.6 24.6   # quick check frames (seconds)
```

### Voice-over workflow (per episode)
1. Generate the narration with ElevenLabs (voice **Aaden**, model v4) → `voice_raw.mp3`.
2. Transcribe it with Scribe to get word timestamps → `words_raw.json`.
3. Re-time the beats onto the episode timeline and build the captions:
   `python3 scripts/retime_voice.py words_raw.json voice_raw.mp3 voice.mp3 captions.json 0:0 4.74:5.0 ...`
