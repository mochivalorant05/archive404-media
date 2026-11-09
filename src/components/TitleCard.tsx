import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";

/** Fades a title in at the top of the frame for the first ~2.5 seconds. */
export const TitleCard: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (!text) return null;

  const opacity = interpolate(frame, [0, 0.4 * fps, 2 * fps, 2.6 * fps], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const y = interpolate(frame, [0, 0.4 * fps], [-30, 0], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ alignItems: "center", paddingTop: 260, opacity }}>
      <div
        style={{
          transform: `translateY(${y}px)`,
          fontFamily: "'Courier New', monospace",
          fontWeight: 700,
          fontSize: 96,
          letterSpacing: 18,
          color: "#e8e8e8",
          textShadow: "0 0 30px rgba(120,180,255,0.6)",
        }}
      >
        {text}
      </div>
    </AbsoluteFill>
  );
};
