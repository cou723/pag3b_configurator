import { FileWriter } from "../domain/repository/file.ts";

export const writeFileLive: FileWriter = async (path, stream) => {
  const file = await Deno.open(path, { write: true, create: true });
  await stream.pipeTo(file.writable);
};
