import { MeasureParam } from "../entity/measure-param.ts";
import { MilliMeter } from "../entity/millimeter.ts";
import { AistTable } from "../repository/aist-table.ts";
import { OnshapeParameters } from "../repository/onshape.ts";

export type Sex = "male" | "female" | "total";
export type Stat = "mean" | "min" | "max";

/**
 * atlas-hand-measureプロジェクトで計算された補正値（符号反転済み）
 * https://github.com/cou723/atlas-hand-measure
 *
 * AIST統計データをシステム計測値に合わせるためのオフセット値。
 * 正の値: AIST値よりもシステム計測値が大きい
 * 負の値: AIST値よりもシステム計測値が小さい
 */
const CORRECTION_OFFSET_MM = {
  // MCPから指先までの長さ (L14-L18)
  mcpToTip: {
    thumb: -3.3,
    index: -10.8,
    middle: -10.9,
    ring: -9.7,
    little: -3.4,
  },
  // 手首からMCPまでの長さ (L03-L07)
  wristToMcp: {
    thumb: 8.2,
    index: -0.5,
    middle: 1.3,
    ring: 2.0,
    little: 3.8,
  },
  // PIP関節幅 (B06,B08,B10,B12: 近位関節幅)
  pipWidth: {
    index: 3.8,
    middle: 2.7,
    ring: 2.9,
    little: 2.7,
  },
} as const;

export class ParameterConverter {
  /**
   * 自分の計測データをOnshapeパラメータに変換する
   */
  toOnshapeParams(measure: MeasureParam): OnshapeParameters {
    return {
      // perFingerから全てのwristToMcpMmを直接取得
      thumb_palm_length: MilliMeter(measure.perFinger.thumb.wristToMcpMm),
      index_palm_length: MilliMeter(measure.perFinger.index.wristToMcpMm),
      middle_palm_length: MilliMeter(measure.perFinger.middle.wristToMcpMm),
      ring_palm_length: MilliMeter(measure.perFinger.ring.wristToMcpMm),
      little_palm_length: MilliMeter(measure.perFinger.little.wristToMcpMm),

      // finger_lengthは変更なし
      thumb_finger_length: MilliMeter(measure.perFinger.thumb.mcpToTipMm),
      index_finger_length: MilliMeter(measure.perFinger.index.mcpToTipMm),
      middle_finger_length: MilliMeter(measure.perFinger.middle.mcpToTipMm),
      ring_finger_length: MilliMeter(measure.perFinger.ring.mcpToTipMm),
      little_finger_length: MilliMeter(measure.perFinger.little.mcpToTipMm),

      index_pip_thick: MilliMeter(measure.perFinger.index.pipWidthMm),
      middle_pip_thick: MilliMeter(measure.perFinger.middle.pipWidthMm),
      ring_pip_thick: MilliMeter(measure.perFinger.ring.pipWidthMm),
      little_pip_thick: MilliMeter(measure.perFinger.little.pipWidthMm),
    };
  }

  /**
   * AIST統計データテーブルからOnshapeパラメータを生成する
   * @param table AISTデータテーブル
   * @param _myParams 基準となる自分のパラメータ（将来的に使用する可能性があるため引数は残す）
   * @param multipleScale 全体の倍率 (デフォルト1.0)
   * @param applyCorrection 補正値を適用するか (デフォルトtrue)
   */
  fromAistTable(
    table: AistTable,
    _myParams: OnshapeParameters,
    multipleScale: number = 1.0,
    applyCorrection: boolean = true,
  ): OnshapeParameters {
    // 値の取得
    const rawValues = {
      // 手首からMCPまでの長さ
      L03: table.L03,
      L04: table.L04,
      L05: table.L05,
      L06: table.L06,
      L07: table.L07,
      // MCPから指先までの長さ
      L14: table.L14,
      L15: table.L15,
      L16: table.L16,
      L17: table.L17,
      L18: table.L18,
      // 近位関節幅 (PIP関節幅)
      B06: table.B06, // 第２指近位関節幅
      B08: table.B08, // 第３指近位関節幅
      B10: table.B10, // 第４指近位関節幅
      B12: table.B12, // 第５指近位関節幅
    };

    // 1. AIST値への補正 (atlas-hand-measureの補正値を適用)
    const corrected = applyCorrection
      ? {
        // wristToMcpの補正
        L03: rawValues.L03 + CORRECTION_OFFSET_MM.wristToMcp.thumb,
        L04: rawValues.L04 + CORRECTION_OFFSET_MM.wristToMcp.index,
        L05: rawValues.L05 + CORRECTION_OFFSET_MM.wristToMcp.middle,
        L06: rawValues.L06 + CORRECTION_OFFSET_MM.wristToMcp.ring,
        L07: rawValues.L07 + CORRECTION_OFFSET_MM.wristToMcp.little,
        // mcpToTipの補正
        L14: rawValues.L14 + CORRECTION_OFFSET_MM.mcpToTip.thumb,
        L15: rawValues.L15 + CORRECTION_OFFSET_MM.mcpToTip.index,
        L16: rawValues.L16 + CORRECTION_OFFSET_MM.mcpToTip.middle,
        L17: rawValues.L17 + CORRECTION_OFFSET_MM.mcpToTip.ring,
        L18: rawValues.L18 + CORRECTION_OFFSET_MM.mcpToTip.little,
        // pipWidthの補正
        B06: rawValues.B06 + CORRECTION_OFFSET_MM.pipWidth.index,
        B08: rawValues.B08 + CORRECTION_OFFSET_MM.pipWidth.middle,
        B10: rawValues.B10 + CORRECTION_OFFSET_MM.pipWidth.ring,
        B12: rawValues.B12 + CORRECTION_OFFSET_MM.pipWidth.little,
      }
      : rawValues;

    // 倍率適用
    const scaled = Object.entries(corrected).reduce(
      (acc: typeof corrected, [key, val]) => {
        acc[key as keyof typeof corrected] = val * multipleScale;
        return acc;
      },
      {} as typeof corrected,
    );

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
      index_pip_thick: MilliMeter(scaled.B06),
      middle_pip_thick: MilliMeter(scaled.B08),
      ring_pip_thick: MilliMeter(scaled.B10),
      little_pip_thick: MilliMeter(scaled.B12),
    };
  }
}
