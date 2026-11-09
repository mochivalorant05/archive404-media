"""Re-time an ElevenLabs voice-over to an episode timeline and build Remotion captions.

The voice is cut in the silences between script beats and each beat is moved to its
new start time, so visuals get room to breathe (bible target: 60-63 s per episode).

usage:
  python3 scripts/retime_voice.py words.json voice_raw.mp3 voice.mp3 captions.json \
      0:0 4.74:5.0 13.40:14.6 24.27:26.6 34.98:38.6 43.73:48.0 48.89:55.0

`words.json` is the Scribe transcript of voice_raw.mp3 ({"words":[{text,type,start,end}]}).
Each `cut:start` pair: the beat that begins at `cut` seconds in the raw voice starts at `start`.
"""
import json
import subprocess
import sys

words_path, src, out_audio, out_caps, *pairs = sys.argv[1:]
segs = [tuple(map(float, p.split(":"))) for p in pairs]
words = [w for w in json.load(open(words_path))["words"] if w["type"] == "word"]

caps = []
for w in words:
    k = max(j for j, (cut, _) in enumerate(segs) if cut <= w["start"])
    shift = segs[k][1] - segs[k][0]
    s, e = w["start"] + shift, w["end"] + shift
    caps.append({
        "text": ("" if not caps else " ") + w["text"],
        "startMs": round(s * 1000),
        "endMs": round(e * 1000),
        "timestampMs": round((s + e) * 500),
        "confidence": 1,
    })
json.dump(caps, open(out_caps, "w"), indent=0)

parts, labels = [], []
for i, (cut, start) in enumerate(segs):
    end = segs[i + 1][0] if i + 1 < len(segs) else 9999
    d = int(round(start * 1000))
    parts.append(f"[0:a]atrim={cut}:{end},asetpts=PTS-STARTPTS,adelay={d}|{d}[s{i}]")
    labels.append(f"[s{i}]")
fc = ";".join(parts) + ";" + "".join(labels) + f"amix=inputs={len(segs)}:normalize=0[out]"
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", src, "-filter_complex", fc, "-map", "[out]",
                "-ar", "48000", "-ac", "2", "-c:a", "libmp3lame", "-b:a", "192k", out_audio], check=True)
print(f"{len(caps)} words; last word ends at {caps[-1]['endMs'] / 1000:.2f}s")
