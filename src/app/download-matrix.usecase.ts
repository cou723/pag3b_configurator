import { MatrixGenerator } from "../domain/service/matrix-generator.ts";
import { ParameterConverter } from "../domain/service/parameter-converter.ts";
import type { AistTableRepository } from "../domain/repository/aist-table.ts";
import type {
  OnshapeParameters,
  OnshapeRepository,
} from "../domain/repository/onshape.ts";
import type { FileWriter } from "../domain/repository/file.ts";

export async function downloadMatrix(
  aistDataRepo: AistTableRepository,
  myParams: OnshapeParameters,
  fileWriter: FileWriter,
  onshapeRepository: OnshapeRepository,
) {
  const generator = new MatrixGenerator();
  const converter = new ParameterConverter();

  console.log("Generating matrix (8×8 = 64 patterns)...");
  const matrixTables = generator.generate(aistDataRepo.tables);

  let count = 0;
  for (const [name, table] of matrixTables.entries()) {
    count++;
    console.log(`[${count}/64] Processing: ${name}`);

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
      console.error(`  ✗ Failed to fetch STL for ${name}`);
      continue;
    }
    console.log("  ✓ STL data fetched");
    await fileWriter(`${name}.stl`, stlData);

    console.log(`  ✓ ${name}.stl saved`);
  }

  console.log("Download matrix completed: 64 files generated.");
}
