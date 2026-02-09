/*
    aist平均値における平均値、男性の平均値、女性の平均値、最大値、最小値、設定値をダウンロードする
 */

import { ParameterConverter } from "../domain/service/parameter-converter.ts";
import { AistTableRepository } from "../domain/repository/aist-table.ts";
import { FileWriter } from "../domain/repository/file.ts";
import { MyMeasureRepository } from "../domain/repository/my-measure.ts";
import { OnshapeRepository } from "../domain/repository/onshape.ts";

export async function downloadAll(
  aistDataRepo: AistTableRepository,
  fileWriter: FileWriter,
  myMeasureRepo: MyMeasureRepository,
  onshapeRepository: OnshapeRepository,
) {
  const converter = new ParameterConverter();
  const myMeasureData = myMeasureRepo.get();
  const myParams = converter.toOnshapeParams(myMeasureData);

  // 1. Download Mine
  console.log("Processing: Mine");
  await onshapeRepository.set(myParams);
  const mineStl = await onshapeRepository.fetchStl();
  if (mineStl) {
    await fileWriter("mine.stl", mineStl);
  } else {
    console.error("Failed to fetch STL for mine");
  }

  // AIST Data Processing
  const aistData = { ...aistDataRepo.tables, mine: aistDataRepo.myTable };

  for (const [key, value] of Object.entries(aistData)) {
    console.log(`Processing: ${key}`);
    const params = converter.fromAistTable(value, myParams);
    await onshapeRepository.set(params);
    const stlData = await onshapeRepository.fetchStl();
    if (stlData) {
      await fileWriter(`${key}.stl`, stlData);
    } else {
      console.error(`Failed to fetch STL for ${key}`);
    }
  }
}
