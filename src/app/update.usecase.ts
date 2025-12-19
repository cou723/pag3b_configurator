import {
  OnshapeParameters,
  OnshapeRepository,
} from "../domain/repository/onshape.ts";

export async function update(
  param: OnshapeParameters,
  onshape: OnshapeRepository,
) {
  await onshape.set(param);
}
