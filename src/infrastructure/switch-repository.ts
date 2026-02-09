import createClient, { Client } from "openapi-fetch";
import { SwitchRepository } from "../domain/repository/onshape.ts";
import { SwitchConfiguration, SwitchPartName } from "../domain/entity/switch-config.ts";
import { MilliMeter } from "../domain/entity/millimeter.ts";
import { paths } from "./api.d.ts";

const PART_IDS: Record<SwitchPartName, string> = {
  "upper case": "JHD",
  "stem": "JID",
  "keycap": "JdD",
};

export class SwitchRepositoryLive implements SwitchRepository {
  readonly client: Client<paths>;

  constructor(
    readonly accessKey: string,
    readonly secretKey: string,
    readonly documentId: string,
    readonly workspaceId: string,
    readonly elementId: string,
  ) {
    this.client = createClient<paths>({
      baseUrl: "https://cad.onshape.com/api/v10",
      headers: {
        "Authorization": `Basic ${btoa(this.accessKey + ":" + this.secretKey)}`,
      },
    });
  }

  async setSwitchConfiguration(config: SwitchConfiguration): Promise<void> {
    const body = {
      currentConfiguration: [
        {
          parameterName: "width",
          valueString: config.width.value.toFixed(1) + " mm",
        },
        {
          parameterName: "height",
          valueString: config.height.toString(),
        },
      ],
    };

    // onshapeの公開しているopenapiの型定義が不完全なためanyで受け取る
    // deno-lint-ignore no-explicit-any
    await this.client.POST(
      "/elements/d/{did}/{wvm}/{wvmid}/e/{eid}/configuration" as any,
      {
        params: {
          path: {
            did: this.documentId,
            wvm: "w",
            wvmid: this.workspaceId,
            eid: this.elementId,
          },
        },
        body: body as any,
      },
    );
  }

  async fetchSwitchStl(partName: SwitchPartName): Promise<ReadableStream<Uint8Array> | null> {
    const partId = PART_IDS[partName];

    const urlResponse = await this.client.GET(
      "/parts/d/{did}/{wvm}/{wvmid}/e/{eid}/partid/{partid}/stl",
      {
        params: {
          path: {
            did: this.documentId,
            eid: this.elementId,
            wvm: "w",
            wvmid: this.workspaceId,
            partid: partId,
          },
          query: {
            mode: "binary",
            grouping: true,
            scale: 1,
            units: "millimeter",
            angleTolerance: 0.5,
            chordTolerance: 0.01,
          },
        },
        redirect: "manual",
      },
    );

    const redirectUrl = urlResponse.response.headers.get("Location");
    if (!redirectUrl) {
      console.error(`No Location header in STL URL response for part: ${partName}`);
      return null;
    }

    const stlResponse = await fetch(redirectUrl, {
      headers: {
        "Authorization": `Basic ${btoa(this.accessKey + ":" + this.secretKey)}`,
        "Accept": "application/vnd.onshape.v1+octet-stream",
      },
    });

    if (!stlResponse.body) {
      console.error(`No body in STL response for part: ${partName}`);
      return null;
    }
    return stlResponse.body;
  }
}
