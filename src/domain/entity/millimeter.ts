export type MilliMeter = { type: "milliMeter"; value: number };

export function MilliMeter(value: number): MilliMeter {
  return {
    type: "milliMeter",
    value,
  };
}
