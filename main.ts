import { downloadAll } from "./src/app/download-all.usecase.ts";
import { downloadCurrentValue } from "./src/app/download-save-current-value.usecase.ts";
import { downloadMatrix } from "./src/app/download-matrix.usecase.ts";
import { downloadMatrixSingle } from "./src/app/download-matrix-single.usecase.ts";
import { downloadSwitches } from "./src/app/download-switches.usecase.ts";
import { update } from "./src/app/update.usecase.ts";
import type { MatrixLevel } from "./src/domain/service/matrix-generator.ts";
import { AistDataRepositoryLive } from "./src/infrastructure/aist-data.ts";
import { writeFileLive } from "./src/infrastructure/file.ts";
import { MyMeasureRepositoryLive } from "./src/infrastructure/my-measure.ts";
import { OnshapeRepositoryLive } from "./src/infrastructure/onshape.ts";
import { SwitchRepositoryLive } from "./src/infrastructure/switch-repository.ts";
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

const switchRepo = new SwitchRepositoryLive(
  credentials.accessKey,
  credentials.secretKey,
  "15b0b06437e22a73f90f177f",
  "3bb5d50dedb32a79834f3276",
  "3c7a70fd450bbaa7b9c95808",
);

const fileWriter = writeFileLive;

const command = Deno.args[0];

if (!command) {
  console.error(
    "Please provide a command: download-all, download-current, download-matrix, download-matrix-single, download-switches, update",
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
    case "download-matrix": {
      const aistRepo = new AistDataRepositoryLive();
      const myMeasureRepo = new MyMeasureRepositoryLive();
      const converter = new ParameterConverter();
      const myParams = converter.toOnshapeParams(myMeasureRepo.get());
      await downloadMatrix(aistRepo, myParams, fileWriter, onshapeRepo);
      console.log("Download matrix completed.");
      break;
    }
    case "update-mine": {
      const myMeasureRepo = new MyMeasureRepositoryLive();
      const converter = new ParameterConverter();
      const myParams = converter.toOnshapeParams(myMeasureRepo.get());
      await update(myParams, onshapeRepo);
      console.log("Update completed with MyMeasure params.");
      break;
    }
    case "download-matrix-single": {
      // 引数バリデーション
      if (Deno.args.length < 3) {
        console.error(
          "Usage: download-matrix-single <lengthLevel> <widthLevel>",
        );
        console.error("  lengthLevel: 1-4");
        console.error("  widthLevel: 1-4");
        Deno.exit(1);
      }

      const lengthLevel = parseInt(Deno.args[1], 10);
      const widthLevel = parseInt(Deno.args[2], 10);

      // 値の範囲チェック
      if (
        !Number.isInteger(lengthLevel) ||
        !Number.isInteger(widthLevel) ||
        lengthLevel < 1 || lengthLevel > 8 ||
        widthLevel < 1 || widthLevel > 8
      ) {
        console.error(
          "Error: lengthLevel and widthLevel must be integers between 1 and 4",
        );
        console.error(
          `  Provided: lengthLevel=${Deno.args[1]}, widthLevel=${Deno.args[2]}`,
        );
        Deno.exit(1);
      }

      const aistRepo = new AistDataRepositoryLive();
      const myMeasureRepo = new MyMeasureRepositoryLive();
      const converter = new ParameterConverter();
      const myParams = converter.toOnshapeParams(myMeasureRepo.get());

      await downloadMatrixSingle(
        aistRepo,
        myParams,
        lengthLevel as MatrixLevel,
        widthLevel as MatrixLevel,
        fileWriter,
        onshapeRepo,
      );

      console.log(
        `Download matrix single completed: length_${lengthLevel}_width_${widthLevel}.stl generated.`,
      );
      break;
    }
    case "download-switches": {
      const myMeasureRepo = new MyMeasureRepositoryLive();
      const converter = new ParameterConverter();
      const myParams = converter.toOnshapeParams(myMeasureRepo.get());
      await downloadSwitches(onshapeRepo, switchRepo, fileWriter, myParams);
      console.log("Download switches completed.");
      break;
    }
    default: {
      console.error(
        `Unknown command: ${command}. Available: download-all, download-current, download-matrix, download-matrix-single, download-switches, update`,
      );
      Deno.exit(1);
    }
  }
} catch (error) {
  console.error("An error occurred:", error);
  Deno.exit(1);
}
