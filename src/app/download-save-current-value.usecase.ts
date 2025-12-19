import { FileWriter } from "../domain/repository/file.ts";
import { OnshapeRepository } from "../domain/repository/onshape.ts";

export async function downloadCurrentValue(
  fileWriter: FileWriter,
  onshapeRepository: OnshapeRepository,
) {
  await fileWriter("current_value.stl", await onshapeRepository.fetchStl());
}
