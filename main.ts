import { downloadAll } from "./src/app/download-all.usecase.ts";
import { downloadCurrentValue } from "./src/app/download-save-current-value.usecase.ts";
import { update } from "./src/app/update.usecase.ts";
import { AistDataRepositoryLive } from "./src/infrastructure/aist-data.ts";
import { writeFileLive } from "./src/infrastructure/file.ts";
import { MyMeasureRepositoryLive } from "./src/infrastructure/my-measure.ts";
import { OnshapeRepositoryLive } from "./src/infrastructure/onshape.ts";
import { credentials } from "./credentials.ts";
import { ParameterConverter } from "./src/domain/service/parameter-converter.ts";

const onshapeRepo = new OnshapeRepositoryLive(
  credentials.accessKey,
  credentials.secretKey,
  "3ffdc12ef628d57872d38415",
  "fa9a0b18837b0207b62dc1c9",
  "486ec8569cd27b2d34eed21a",
  "3b3cb69da9e6944e977c27f4",
);
const fileWriter = writeFileLive;

const command = Deno.args[0];

if (!command) {
  console.error(
    "Please provide a command: download-all, download-current, update",
  );
  Deno.exit(1);
}

try {
  switch (command) {
    case "download-all": {
      const aistRepo = new AistDataRepositoryLive();
      const myMeasureRepo = new MyMeasureRepositoryLive();
      await downloadAll(aistRepo, fileWriter, myMeasureRepo, onshapeRepo);
      console.log("Download all completed.");
      break;
    }
    case "download-current": {
      await downloadCurrentValue(fileWriter, onshapeRepo);
      console.log("Download current value completed.");
      break;
    }
    case "update": {
      const myMeasureRepo = new MyMeasureRepositoryLive();
      const converter = new ParameterConverter();
      const myParams = converter.toOnshapeParams(myMeasureRepo.get());
      await update(myParams, onshapeRepo);
      console.log("Update completed with MyMeasure params.");
      break;
    }
    default: {
      console.error(
        `Unknown command: ${command}. Available: download-all, download-current, update`,
      );
      Deno.exit(1);
    }
  }
} catch (error) {
  console.error("An error occurred:", error);
  Deno.exit(1);
}
