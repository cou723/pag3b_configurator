import { MeasureParam } from "../entity/measure-param.entity.ts";

export interface MyMeasureRepository {
  get(): MeasureParam;
}
