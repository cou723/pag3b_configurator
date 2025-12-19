import { MilliMeter } from "../entity/millimeter.ts";

export type OnshapeParameters = {
  thumb_palm_length: MilliMeter;
  index_palm_length: MilliMeter;
  middle_palm_length: MilliMeter;
  ring_palm_length: MilliMeter;
  little_palm_length: MilliMeter;
  thumb_finger_length: MilliMeter;
  index_finger_length: MilliMeter;
  middle_finger_length: MilliMeter;
  ring_finger_length: MilliMeter;
  little_finger_length: MilliMeter;
  index_to_middle: MilliMeter;
  middle_to_ring: MilliMeter;
  ring_to_little: MilliMeter;
  little_start_to_thumb_start_mm: MilliMeter;
};

export interface OnshapeRepository {
  readonly workspaceId: string;
  readonly documentId: string;
  readonly topPlateElementId: string;

  set(params: OnshapeParameters): Promise<void>;
  fetchStl(): Promise<ReadableStream<Uint8Array>>;
}
