import createClient, { Client } from "openapi-fetch";
import {
  OnshapeParameters,
  OnshapeRepository,
} from "../domain/repository/onshape.ts";
import { paths } from "./api.d.ts";

export class OnshapeRepositoryLive implements OnshapeRepository {
  readonly client: Client<paths>;
  constructor(
    readonly accessKey: string,
    readonly secretKey: string,
    readonly documentId: string,
    readonly workspaceId: string,
    readonly topPlateElementId: string,
    readonly globalVariablesElementId: string,
  ) {
    this.client = createClient<paths>({
      baseUrl: "https://cad.onshape.com/api/v10",
      headers: {
        "Authorization": `Basic ${btoa(this.accessKey + ":" + this.secretKey)}`,
      },
    });
  }
  async set(param: OnshapeParameters): Promise<void> {
    const body = Object.entries(param).flatMap(([key, value]) => ({
      name: key,
      expression: value.value.toFixed(1) + " mm",
      type: "LENGTH",
    }));
    await this.client.POST(
      "/variables/d/{did}/w/{wid}/e/{eid}/variables",
      {
        params: {
          path: {
            did: this.documentId,
            eid: this.globalVariablesElementId,
            wid: this.workspaceId,
          },
        },
        body,
      },
    );
    return;
  }
  async fetchStl(): Promise<ReadableStream<Uint8Array>> {
    const { data, error } = await this.client.GET(
      "/parts/d/{did}/{wvm}/{wvmid}/e/{eid}",
      {
        params: {
          path: {
            did: this.documentId,
            eid: this.topPlateElementId,
            wvm: "w",
            wvmid: this.workspaceId,
          },
        },
      },
    );
    if (!data) {
      if (error) {
        console.error("Error fetching part metadata:", error);
        throw error;
      }
      throw new Error("No data received from Onshape API");
    }

    // onshapeの公開しているopenapiの型定義が不完全なためanyで受け取る
    // deno-lint-ignore no-explicit-any
    const topPlateId = (data as unknown as any[])!.find((part) =>
      part.name === "Part 1"
    )?.partId;

    const urlResponse = await this.client.GET(
      "/parts/d/{did}/{wvm}/{wvmid}/e/{eid}/partid/{partid}/stl",
      {
        params: {
          path: {
            did: this.documentId,
            eid: this.topPlateElementId,
            wvm: "w",
            wvmid: this.workspaceId,
            partid: topPlateId,
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

    const redirectUrl = urlResponse.response.headers.get("Location")!;
    const stlResponse = await fetch(
      redirectUrl,
      {
        headers: {
          "Authorization": `Basic ${
            btoa(this.accessKey + ":" + this.secretKey)
          }`,
          "Accept": "application/vnd.onshape.v1+octet-stream",
        },
      },
    );
    if (!stlResponse.body) throw new Error("No body in STL response");
    return stlResponse.body;
  }
}
