import { MeasureParam } from "../domain/entity/measure-param.ts";
import { MyMeasureRepository } from "../domain/repository/my-measure.ts";

export class MyMeasureRepositoryLive implements MyMeasureRepository {
  public get(): MeasureParam {
    return {
      perFinger: {
        thumb: { wristToMcpMm: 75, mcpToTipMm: 47 },
        index: { wristToMcpMm: 95, mcpToTipMm: 73, pipWidthMm: 19 },
        middle: { wristToMcpMm: 95, mcpToTipMm: 80, pipWidthMm: 18 },
        ring: { wristToMcpMm: 91, mcpToTipMm: 75, pipWidthMm: 17 },
        little: { wristToMcpMm: 84, mcpToTipMm: 55, pipWidthMm: 15 },
      },
      littleStartToThumbStartMm: 84, // 小指MPから親指MPまでの距離（例）
    };
  }
}
