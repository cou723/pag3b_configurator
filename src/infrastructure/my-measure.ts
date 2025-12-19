import { MeasureParam } from "../domain/entity/measure-param.entity.ts";
import { MyMeasureRepository } from "../domain/repository/my-measure.ts";

export class MyMeasureRepositoryLive implements MyMeasureRepository {
  public get(): MeasureParam {
    // main.ts の myParam から逆算した値
    return {
      perFinger: {
        thumb: {
          wristToMcpMm: 73, // L03
          mcpToTipMm: 48.4, // L14
        },
        index: {
          wristToMcpMm: 0, // 未使用? L04はwristToStartHeightsMmへ
          mcpToTipMm: 79.3, // L15
        },
        middle: {
          wristToMcpMm: 83.9, // L05
          mcpToTipMm: 85.7, // L16
        },
        ring: {
          wristToMcpMm: 0, // 未使用?
          mcpToTipMm: 79.8, // L17
        },
        little: {
          wristToMcpMm: 0, // 未使用?
          mcpToTipMm: 62.3, // L18
        },
      },
      palmLengthMm: 0, // 未使用ダミー
      wristToStartHeightsMm: {
        indexMm: 82.5, // L04
        ringMm: 78.4, // L06
        littleMm: 67.5, // L07
        clamped: false,
      },
      metacarpalLengthEstMm: {
        thumbMm: 0,
        indexMm: 0,
        middleMm: 0,
        ringMm: 0,
        littleMm: 0,
        method: "projection",
        frame: "mcp_row",
      },
      mpJointSpacingMm: {
        indexToMiddleMm: 21.7, // index_to_middle
        middleToRingMm: 19.19, // middle_to_ring
        ringToLittleMm: 15.87, // ring_to_little
        method: "parallel_line_distance",
      },
      littleStartToThumbStartMm: 89.6, // little_start_to_thumb_start_mm
    };
  }
}