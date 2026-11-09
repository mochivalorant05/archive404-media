import React, { useEffect, useMemo, useState } from "react";
import {
  AbsoluteFill,
  Sequence,
  continueRender,
  delayRender,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { createTikTokStyleCaptions, type Caption, type TikTokPage } from "@remotion/captions";

// How long words are grouped into one on-screen "page". Lower = fewer words at a time.
const COMBINE_WITHIN_MS = 1200;
const HIGHLIGHT = "#ffd400";

export type CaptionStyle = {
  /** Distance from the bottom of the frame to the caption block (px). */
  bottom?: number;
  fontSize?: number;
  fontFamily?: string;
  /** Black outline around letters (series default: off, soft shadow instead). */
  stroke?: boolean;
  highlight?: string;
  /** Words closer together than this are shown on the same "page". */
  combineMs?: number;
};

export const Captions: React.FC<{ src: string; style?: CaptionStyle }> = ({ src, style }) => {
  const [captions, setCaptions] = useState<Caption[] | null>(null);
  const [handle] = useState(() => delayRender(`Loading captions ${src}`));
  const { fps } = useVideoConfig();

  useEffect(() => {
    fetch(src)
      .then((r) => r.json())
      .then((data: Caption[]) => {
        setCaptions(data);
        continueRender(handle);
      })
      .catch((err) => {
        console.error(err);
        continueRender(handle);
      });
  }, [src, handle]);

  const pages = useMemo(() => {
    if (!captions) return [];
    return createTikTokStyleCaptions({
      captions,
      combineTokensWithinMilliseconds: style?.combineMs ?? COMBINE_WITHIN_MS,
    }).pages;
  }, [captions, style?.combineMs]);

  return (
    <AbsoluteFill>
      {pages.map((page, i) => {
        const next = pages[i + 1];
        const from = Math.round((page.startMs / 1000) * fps);
        const endMs = next ? Math.min(next.startMs, page.startMs + page.durationMs + 400) : page.startMs + page.durationMs + 400;
        const duration = Math.max(1, Math.round((endMs / 1000) * fps) - from);
        return (
          <Sequence key={i} from={from} durationInFrames={duration} layout="none">
            <CaptionPage page={page} style={style ?? {}} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

const CaptionPage: React.FC<{ page: TikTokPage; style: CaptionStyle }> = ({ page, style }) => {
  const {
    bottom = 520,
    fontSize = 84,
    fontFamily = "'Arial Black', 'Helvetica Neue', Arial, sans-serif",
    stroke = true,
    highlight = HIGHLIGHT,
  } = style;
  const frame = useCurrentFrame(); // relative to the Sequence start
  const { fps } = useVideoConfig();
  const absoluteMs = page.startMs + (frame / fps) * 1000;

  const pop = spring({ frame, fps, config: { damping: 14, stiffness: 200 }, durationInFrames: 8 });
  const scale = interpolate(pop, [0, 1], [0.85, 1]);

  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: bottom }}>
      <div
        style={{
          transform: `scale(${scale})`,
          maxWidth: 920,
          textAlign: "center",
          fontFamily,
          fontWeight: 900,
          fontSize,
          lineHeight: 1.15,
          textTransform: "uppercase",
          color: "white",
          WebkitTextStroke: stroke ? "10px black" : undefined,
          paintOrder: "stroke",
          textShadow: stroke
            ? "0 8px 24px rgba(0,0,0,0.6)"
            : "0 4px 0 rgba(0,0,0,0.85), 0 0 22px rgba(0,0,0,0.9), 0 0 6px rgba(0,0,0,0.9)",
          whiteSpace: "pre-wrap",
        }}
      >
        {page.tokens.map((t) => {
          const active = t.fromMs <= absoluteMs && t.toMs > absoluteMs;
          return (
            <span key={t.fromMs} style={{ color: active ? highlight : "white" }}>
              {t.text}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
