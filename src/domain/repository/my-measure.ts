import { MeasureParam } from "../entity/measure-param.ts";

export interface MyMeasureRepository {
  get(): MeasureParam;
}
