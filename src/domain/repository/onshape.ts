/*
L01	手長：茎突点より	Hand length (4.3.1 of ISO 7250-1)
L02	手長：手首のしわより	Hand length from the wrist crease
L03	手掌長第１指	Palm length from the wrist crease - thumb
L04	手掌長第２指	Palm length from the wrist crease - index finger
L05	手掌長第３指	Palm length from the wrist crease - middle finger
L06	手掌長第４指	Palm length from the wrist crease - ring finger
L07	手掌長第５指	Palm length from the wrist crease - little finger
L08	指股-第２指先端	Crotch to tip of index finger
L09	第１指長	Thumb length
L10	第２指長	Index finger length (4.3.4. Of ISO 7250-1)
L11	第３指長	Middle finger length
L12	第４指長	Ring finger length
L13	第５指長	Little finger length
L14	第１指背側長	Thumb length, dorsal
L15	第２指背側長	Index finger length, dorsal
L16	第３指背側長	Middle finger length, dorsal
L17	第４指背側長	Ring finger length, dorsal
L18	第５指背側長	Little finger length, dorsal
L19	第２指中手骨頭+背側長	MC head and back length - index finger
L20	第３指中手骨頭+背側長	MC head and back length - middle finger
L21	第４指中手骨頭+背側長	MC head and back length - ring finger
L22	第５指中手骨頭+背側長	MC head and back length - little finger
 */
import { MilliMeter } from "../entity/milimater.entity.ts";

export type OnshapeParameters = {
  L03: MilliMeter; //
  L04: MilliMeter;
  L05: MilliMeter;
  L06: MilliMeter;
  L07: MilliMeter;
  L14: MilliMeter;
  L15: MilliMeter;
  L16: MilliMeter;
  L17: MilliMeter;
  L18: MilliMeter;
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
