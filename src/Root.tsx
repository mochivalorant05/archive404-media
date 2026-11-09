import React from "react";
import { Composition } from "remotion";
import { Short3D, type Short3DProps } from "./Short3D";
import { Forever25Ep1, EP1_FRAMES } from "./forever25/ep1/Ep1";
import { Forever25Ep2, EP2_DURATION } from "./forever25/ep2/Ep2";
import { Forever25Ep3, EP3_DURATION } from "./forever25/ep3/Ep3";
import { Forever25Ep4, EP4_DURATION } from "./forever25/ep4/Ep4";
import { Forever25Ep5, EP5_DURATION } from "./forever25/ep5/Ep5";

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
      <Composition
        id="Forever25-Ep1"
        component={Forever25Ep1}
        width={1080}
        height={1920}
        fps={FPS}
        durationInFrames={EP1_FRAMES(FPS)}
      />
      <Composition id="Forever25-Ep2" component={Forever25Ep2} width={1080} height={1920} fps={FPS} durationInFrames={EP2_DURATION * FPS} />
      <Composition id="Forever25-Ep3" component={Forever25Ep3} width={1080} height={1920} fps={FPS} durationInFrames={EP3_DURATION * FPS} />
      <Composition id="Forever25-Ep4" component={Forever25Ep4} width={1080} height={1920} fps={FPS} durationInFrames={EP4_DURATION * FPS} />
      <Composition id="Forever25-Ep5" component={Forever25Ep5} width={1080} height={1920} fps={FPS} durationInFrames={EP5_DURATION * FPS} />
    </>
  );
};
