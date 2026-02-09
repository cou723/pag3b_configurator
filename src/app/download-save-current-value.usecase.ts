import { FileWriter } from "../domain/repository/file.ts";
import { OnshapeRepository } from "../domain/repository/onshape.ts";

export async function downloadCurrentValue(
  fileWriter: FileWriter,
  onshapeRepository: OnshapeRepository,
) {
  const stlData = await onshapeRepository.fetchStl();
  if (!stlData) {
    console.error("Failed to fetch STL data for current value");
    return;
  }
  await fileWriter("current_value.stl", stlData);
}
