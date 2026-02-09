import { MatrixGenerator, type MatrixLevel } from "../domain/service/matrix-generator.ts";
import { ParameterConverter } from "../domain/service/parameter-converter.ts";
import type { AistTableRepository } from "../domain/repository/aist-table.ts";
import type {
  OnshapeParameters,
  OnshapeRepository,
} from "../domain/repository/onshape.ts";
import type { FileWriter } from "../domain/repository/file.ts";

export async function downloadMatrixSingle(
  aistDataRepo: AistTableRepository,
  myParams: OnshapeParameters,
  lengthLevel: MatrixLevel,
  widthLevel: MatrixLevel,
  fileWriter: FileWriter,
  onshapeRepository: OnshapeRepository,
) {
  const generator = new MatrixGenerator();
  const converter = new ParameterConverter();

  const filename = `length_${lengthLevel}_width_${widthLevel}`;
  console.log(`Generating single matrix pattern: ${filename}...`);

  // 指定されたレベルでAistTableを生成
  const table = generator.generateSingle(
    aistDataRepo.tables,
    lengthLevel,
    widthLevel,
  );

  // 補正値を適用して変換
  const params = converter.fromAistTable(
    table,
    myParams, // MY_B03比率計算のため必要
    1.0, // multipleScale
  );

  await onshapeRepository.set(params);
  console.log("  ✓ Onshape parameters set");
  const stlData = await onshapeRepository.fetchStl();
  if (!stlData) {
    console.error(`  ✗ Failed to fetch STL for ${filename}`);
    return;
  }
  console.log("  ✓ STL data fetched");
  await fileWriter(`${filename}.stl`, stlData);

  console.log(`  ✓ ${filename}.stl saved`);
}
