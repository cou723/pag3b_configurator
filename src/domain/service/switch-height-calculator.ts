import { OnshapeParameters } from "../repository/onshape.ts";
import { MilliMeter } from "../entity/millimeter.ts";

export class SwitchHeightCalculator {
  /**
   * 指定された指のheightを計算
   * formula: max(round(((finger_length + palm_length - 1)/1)-0.5), 6)
   */
  calculateHeight(
    params: OnshapeParameters,
    finger: "thumb" | "index" | "middle" | "ring" | "little",
  ): number {
    const fingerLengthKey = `${finger}_finger_length` as keyof OnshapeParameters;
    const palmLengthKey = `${finger}_palm_length` as keyof OnshapeParameters;

    const fingerLength = params[fingerLengthKey].value;
    const palmLength = params[palmLengthKey].value;

    const rawHeight = ((fingerLength + palmLength - 1) / 1) - 0.5;
    const roundedHeight = Math.round(rawHeight);
    const finalHeight = Math.max(roundedHeight, 6);

    return finalHeight;
  }
}
