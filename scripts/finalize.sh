#!/usr/bin/env bash
# Master a rendered episode for social (≈ -14 LUFS, true peak -1.5 dB) without touching the video.
# usage: scripts/finalize.sh out/forever25_epN.mp4 forever25/epN_title.mp4
set -euo pipefail
in="$1"; out="$2"
ffmpeg -v error -y -i "$in" -c:v copy \
  -af "loudnorm=I=-14:TP=-1.5:LRA=11,volume=2dB,alimiter=limit=0.84:level=false" \
  -c:a aac -b:a 192k -ar 48000 "$out"
ffmpeg -hide_banner -i "$out" -vn -af ebur128 -f null - 2>&1 | grep -E "^\s+I:" | tail -1
