// FOREVER 25 · Episode 1 "A Truck Hit You" — master timeline in seconds.
// Voice-over beats come from the ElevenLabs Scribe word timestamps after re-timing
// (see scripts/retime_voice.py). Shot cuts land on the first word of each line.

export const EP1_DURATION = 62;

export const SHOTS = {
  truck: [0, 2.3],
  standUp: [2.3, 4.74],
  er: [4.74, 13.4],
  weeks: [13.4, 16.5],
  cut: [16.5, 18.25],
  fall: [18.25, 20.25],
  god: [20.25, 26.6],
  photo: [26.6, 30.75],
  friend: [30.75, 33.2],
  mirror: [33.2, 38.6],
  kitchen: [38.6, 48.0],
  box: [48.0, 54.8],
  end: [54.8, EP1_DURATION],
} as const;

export type ShotName = keyof typeof SHOTS;

// Key beats (seconds)
export const BEATS = {
  impact: 2.3, // flash, crash SFX
  hookLine2: 2.66, // "You stand up"
  bodyIs25: 10.36,
  license43: 11.72,
  mismatchStamp: 12.45,
  cutCloses: 16.62,
  fallLand: 18.95,
  likeAGod: 24.4,
  eighteenYears: 29.4,
  grayNow: 30.84,
  notOneLine: 34.64,
  stranger: 41.22, // lamp turns on
  welcome: 42.74,
  watching: 44.4,
  boxSet: 48.3,
  others: 52.68,
  boxFlash: 53.1,
  question: 55.0,
};

/** HUD state per shot: clock and location (bible: left YEAR, centre clock, right BODY AGE + counter). */
export const HUD_BY_SHOT: Record<ShotName, { clock: string; location: string } | null> = {
  truck: { clock: "23:47", location: "NEW YORK, NY" },
  standUp: { clock: "23:47", location: "NEW YORK, NY" },
  er: { clock: "00:31", location: "EMERGENCY ROOM" },
  weeks: { clock: "--:--", location: "WEEK 1 → 6" },
  cut: { clock: "07:02", location: "HOME" },
  fall: { clock: "14:15", location: "ROOFTOP" },
  god: { clock: "19:58", location: "ROOFTOP" },
  photo: { clock: "18:20", location: "BROOKLYN, NY" },
  friend: { clock: "18:21", location: "BROOKLYN, NY" },
  mirror: { clock: "22:09", location: "HOME" },
  kitchen: { clock: "03:12", location: "YOUR KITCHEN" },
  box: { clock: "03:14", location: "YOUR KITCHEN" },
  end: null,
};
