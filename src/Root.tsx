import React from "react";
import { Composition } from "remotion";
import { Short3D, type Short3DProps } from "./Short3D";

export const FPS = 30;

// Vertical 9:16 to match the existing series (1080x1920 @ 30fps).
const defaultProps: Short3DProps = {
  durationInSeconds: 12,
  captionsFile: "captions/example.json",
  audioFile: "",
  musicFile: "",
  musicVolume: 0.25,
  title: "DAY 1",
};

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="Short3D"
        component={Short3D}
        width={1080}
        height={1920}
        fps={FPS}
        durationInFrames={defaultProps.durationInSeconds * FPS}
        defaultProps={defaultProps}
        // Lets you change the length from the props (`--props`) without code edits.
        calculateMetadata={({ props }) => ({
          durationInFrames: Math.round(props.durationInSeconds * FPS),
        })}
      />
    </>
  );
};
