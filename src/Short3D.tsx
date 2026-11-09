import React from "react";
import { AbsoluteFill, staticFile, useVideoConfig } from "remotion";
import { Audio } from "@remotion/media";
import { ThreeCanvas } from "@remotion/three";
import { LonelyPlanetScene } from "./scenes/LonelyPlanetScene";
import { Captions } from "./components/Captions";
import { TitleCard } from "./components/TitleCard";

export type Short3DProps = {
  durationInSeconds: number;
  /** Path inside public/ to a JSON array of Remotion `Caption` objects. Empty = no captions. */
  captionsFile: string;
  /** Path inside public/ to the voice-over (mp3/wav). Empty = none. */
  audioFile: string;
  /** Path inside public/ to background music. Empty = none. */
  musicFile: string;
  musicVolume: number;
  title: string;
};

export const Short3D: React.FC<Short3DProps> = ({
  captionsFile,
  audioFile,
  musicFile,
  musicVolume,
  title,
}) => {
  const { width, height } = useVideoConfig();

  return (
    <AbsoluteFill style={{ backgroundColor: "#05060a" }}>
      {/* 3D layer: everything inside ThreeCanvas is React Three Fiber.
          Animate with useCurrentFrame(), never with useFrame()/clocks,
          so every render is deterministic frame-by-frame. */}
      <ThreeCanvas width={width} height={height} camera={{ fov: 45, position: [0, 5, 14] }}>
        <LonelyPlanetScene />
      </ThreeCanvas>

      {/* 2D overlay layers (regular HTML/CSS on top of the 3D). */}
      <TitleCard text={title} />
      {captionsFile ? <Captions src={staticFile(captionsFile)} /> : null}

      {/* Audio */}
      {audioFile ? <Audio src={staticFile(audioFile)} /> : null}
      {musicFile ? <Audio src={staticFile(musicFile)} volume={musicVolume} loop /> : null}
    </AbsoluteFill>
  );
};
