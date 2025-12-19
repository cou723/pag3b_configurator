export type FileWriter = (
  path: string,
  data: ReadableStream<Uint8Array>,
) => Promise<void>;