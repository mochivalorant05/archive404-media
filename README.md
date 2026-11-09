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
