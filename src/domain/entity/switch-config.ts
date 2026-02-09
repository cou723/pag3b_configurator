import { MilliMeter } from "./millimeter.ts";

export type SwitchConfiguration = {
  width: MilliMeter;
  height: number; // Configuration APIでは整数値
};

export type SwitchPartName = "upper case" | "stem" | "keycap";
