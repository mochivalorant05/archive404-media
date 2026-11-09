"""Pre-level FOREVER 25 audio so the narrator is always above every effect.

Targets (EBU R128 momentary loudness, before the final -14 LUFS master):
  voice   : loud speech (90th percentile of speech)  = -22.7
  sfx     : loudest moment                             = -28   (≈5 dB under the voice)
  hit     : loudest moment                             = -32   (stamp whooshes, ≈9 dB under)
  bed     : loudest moment                             = -34   (rain, wind, fire, drones)

usage: python3 scripts/level_audio.py <kind> <in> <out>   (kind: voice|sfx|hit|bed)
"""
import subprocess
import sys

TARGET = {"voice": -22.7, "sfx": -28.0, "hit": -32.0, "bed": -34.0}
kind, src, out = sys.argv[1:4]


def momentary(path):
    err = subprocess.run(["ffmpeg", "-hide_banner", "-i", path, "-af", "ebur128", "-f", "null", "-"],
                         capture_output=True, text=True).stderr
    vals = []
    for line in err.splitlines():
        if " M:" in line and "t:" in line:
            try:
                vals.append(float(line.split("M:")[1].split()[0]))
            except ValueError:
                pass
    return vals


m = momentary(src)
if kind == "voice":
    speech = sorted(v for v in m if v > -40)
    level = speech[int(len(speech) * 0.9)]
else:
    level = max(m)
gain = TARGET[kind] - level
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", src, "-af", f"volume={gain:.2f}dB",
                "-ar", "48000", "-ac", "2", "-c:a", "libmp3lame", "-b:a", "192k", out], check=True)
print(f"{kind:5s} {src}: level {level:.1f} -> {TARGET[kind]} ({gain:+.1f} dB) -> {out}")
