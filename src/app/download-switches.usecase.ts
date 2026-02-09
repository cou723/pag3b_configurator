import { FileWriter } from "../domain/repository/file.ts";
import {
  OnshapeParameters,
  OnshapeRepository,
  SwitchRepository,
} from "../domain/repository/onshape.ts";
import { SwitchHeightCalculator } from "../domain/service/switch-height-calculator.ts";
import { SwitchPartName } from "../domain/entity/switch-config.ts";

export async function downloadSwitches(
  onshapeRepository: OnshapeRepository,
  switchRepository: SwitchRepository,
  fileWriter: FileWriter,
  params: OnshapeParameters,
) {
  const calculator = new SwitchHeightCalculator();
  const keyWidths = await onshapeRepository.getKeyWidths();

  // 親指を除外（4指のみスイッチを持つ）
  const fingers: Array<"index" | "middle" | "ring" | "little"> = [
    "index",
    "middle",
    "ring",
    "little",
  ];

  for (const finger of fingers) {
    const widthKey = `${finger}_key_width`;
    const width = keyWidths[widthKey];

    if (!width) {
      console.warn(`${widthKey} not found, skipping`);
      continue;
    }

    const height = calculator.calculateHeight(params, finger);

    console.log(`Processing ${finger}: width=${width.value}mm, height=${height}`);

    await switchRepository.setSwitchConfiguration({ width, height });

    const parts: SwitchPartName[] = ["upper case", "stem", "keycap"];
    for (const part of parts) {
      const filename = `switch_${finger}_${part.replace(" ", "_")}.stl`;
      const stlData = await switchRepository.fetchSwitchStl(part);

      // nullチェック: エラー時にnullが返される可能性がある
      if (!stlData) {
        console.error(`  ✗ Failed to fetch STL for ${filename}`);
        continue;
      }

      await fileWriter(filename, stlData);
      console.log(`  ✓ ${filename} saved`);
    }
  }

  console.log("Switch download completed: 12 files (4 fingers × 3 parts)");
}
