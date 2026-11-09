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

export const Captions: React.FC<{ src: string }> = ({ src }) => {
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
      combineTokensWithinMilliseconds: COMBINE_WITHIN_MS,
    }).pages;
  }, [captions]);

  return (
    <AbsoluteFill>
      {pages.map((page, i) => {
        const next = pages[i + 1];
        const from = Math.round((page.startMs / 1000) * fps);
        const endMs = next ? Math.min(next.startMs, page.startMs + page.durationMs + 400) : page.startMs + page.durationMs + 400;
        const duration = Math.max(1, Math.round((endMs / 1000) * fps) - from);
        return (
          <Sequence key={i} from={from} durationInFrames={duration} layout="none">
            <CaptionPage page={page} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

const CaptionPage: React.FC<{ page: TikTokPage }> = ({ page }) => {
  const frame = useCurrentFrame(); // relative to the Sequence start
  const { fps } = useVideoConfig();
  const absoluteMs = page.startMs + (frame / fps) * 1000;

  const pop = spring({ frame, fps, config: { damping: 14, stiffness: 200 }, durationInFrames: 8 });
  const scale = interpolate(pop, [0, 1], [0.85, 1]);

  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 520 }}>
      <div
        style={{
          transform: `scale(${scale})`,
          maxWidth: 920,
          textAlign: "center",
          fontFamily: "'Arial Black', 'Helvetica Neue', Arial, sans-serif",
          fontWeight: 900,
          fontSize: 84,
          lineHeight: 1.15,
          textTransform: "uppercase",
          color: "white",
          WebkitTextStroke: "10px black",
          paintOrder: "stroke",
          textShadow: "0 8px 24px rgba(0,0,0,0.6)",
          whiteSpace: "pre-wrap",
        }}
      >
        {page.tokens.map((t) => {
          const active = t.fromMs <= absoluteMs && t.toMs > absoluteMs;
          return (
            <span key={t.fromMs} style={{ color: active ? HIGHLIGHT : "white" }}>
              {t.text}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
