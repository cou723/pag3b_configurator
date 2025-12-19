import { MeasureParam } from "../entity/measure-param.ts";
import { MilliMeter } from "../entity/millimeter.ts";
import { AistTable } from "../repository/aist-table.ts";
import { OnshapeParameters } from "../repository/onshape.ts";

const MY_B03 = 73; // 自分の手のB03の実測値(mm)

export type Sex = "male" | "female" | "total";
export type Stat = "mean" | "min" | "max";

export class ParameterConverter {
  /**
   * 自分の計測データをOnshapeパラメータに変換する
   */
  toOnshapeParams(measure: MeasureParam): OnshapeParameters {
    return {
      thumb_palm_length: MilliMeter(measure.perFinger.thumb.wristToMcpMm),
      index_palm_length: MilliMeter(measure.wristToStartHeightsMm.indexMm),
      middle_palm_length: MilliMeter(measure.perFinger.middle.wristToMcpMm),
      ring_palm_length: MilliMeter(measure.wristToStartHeightsMm.ringMm),
      little_palm_length: MilliMeter(measure.wristToStartHeightsMm.littleMm),
      thumb_finger_length: MilliMeter(measure.perFinger.thumb.mcpToTipMm),
      index_finger_length: MilliMeter(measure.perFinger.index.mcpToTipMm),
      middle_finger_length: MilliMeter(measure.perFinger.middle.mcpToTipMm),
      ring_finger_length: MilliMeter(measure.perFinger.ring.mcpToTipMm),
      little_finger_length: MilliMeter(measure.perFinger.little.mcpToTipMm),
      index_to_middle: MilliMeter(measure.mpJointSpacingMm.indexToMiddleMm),
      middle_to_ring: MilliMeter(measure.mpJointSpacingMm.middleToRingMm),
      ring_to_little: MilliMeter(measure.mpJointSpacingMm.ringToLittleMm),
      little_start_to_thumb_start_mm: MilliMeter(
        measure.littleStartToThumbStartMm,
      ),
    };
  }

  /**
   * AIST統計データテーブルからOnshapeパラメータを生成する
   * @param table AISTデータテーブル
   * @param myParams 基準となる自分のパラメータ（指間隔の比率計算に使用）
   * @param multipleScale 全体の倍率 (デフォルト1.0)
   */
  fromAistTable(
    table: AistTable,
    myParams: OnshapeParameters,
    multipleScale: number = 1.0,
  ): OnshapeParameters {
    // 値の取得
    const rawValues = {
      L03: table.L03,
      L04: table.L04,
      L05: table.L05,
      L06: table.L06,
      L07: table.L07,
      L14: table.L14,
      L15: table.L15,
      L16: table.L16,
      L17: table.L17,
      L18: table.L18,
    };

    // 1. AIST値への補正 (AistToAIMeasurement相当)
    // 画像認識だと結構L04~L07が大きめに出る傾向があるので自分の手の実測値との差分を引く
    const corrected = {
      L03: rawValues.L03 + 6,
      L04: rawValues.L04 - 16,
      L05: rawValues.L05 - 18,
      L06: rawValues.L06 - 16,
      L07: rawValues.L07 - 16,
      L14: rawValues.L14 - 4,
      L15: rawValues.L15 - 1,
      L16: rawValues.L16 - 2,
      L17: rawValues.L17 + 0,
      L18: rawValues.L18 + 0,
    };

    // 倍率適用
    const scaled = Object.entries(corrected).reduce(
      (acc: typeof corrected, [key, val]) => {
        acc[key as keyof typeof corrected] = val * multipleScale;
        return acc;
      },
      {} as typeof corrected,
    );

    // 2. 指間隔の計算
    const b03 = table.B03;
    const b04 = table.B04;

    const scaledB03 = b03 * multipleScale;
    const scaledB04 = b04 * multipleScale;

    const fingerSpacing = {
      index_to_middle: (scaledB03 / MY_B03) * myParams.index_to_middle.value,
      middle_to_ring: (scaledB03 / MY_B03) * myParams.middle_to_ring.value,
      ring_to_little: (scaledB03 / MY_B03) * myParams.ring_to_little.value,
      little_start_to_thumb_start_mm: (scaledB04 / 80) * 70,
    };

    return {
      thumb_palm_length: MilliMeter(scaled.L03),
      index_palm_length: MilliMeter(scaled.L04),
      middle_palm_length: MilliMeter(scaled.L05),
      ring_palm_length: MilliMeter(scaled.L06),
      little_palm_length: MilliMeter(scaled.L07),
      thumb_finger_length: MilliMeter(scaled.L14),
      index_finger_length: MilliMeter(scaled.L15),
      middle_finger_length: MilliMeter(scaled.L16),
      ring_finger_length: MilliMeter(scaled.L17),
      little_finger_length: MilliMeter(scaled.L18),
      index_to_middle: MilliMeter(fingerSpacing.index_to_middle),
      middle_to_ring: MilliMeter(fingerSpacing.middle_to_ring),
      ring_to_little: MilliMeter(fingerSpacing.ring_to_little),
      little_start_to_thumb_start_mm: MilliMeter(
        fingerSpacing.little_start_to_thumb_start_mm,
      ),
    };
  }
}
