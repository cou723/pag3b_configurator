import createClient, { Client } from "openapi-fetch";
import {
  OnshapeParameters,
  OnshapeRepository,
} from "../domain/repository/onshape.ts";
import { MilliMeter } from "../domain/entity/millimeter.ts";
import { paths } from "./api.d.ts";

// APIレスポンス型
type BTVariableInfo = {
  description?: string;
  expression: string;
  name: string;
  type: string;
  value: string | null;
};

type BTVariableTableInfo = {
  variableStudioReference?: unknown;
  variables: BTVariableInfo[];
};

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
  async fetchStl(): Promise<ReadableStream<Uint8Array> | null> {
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
      }
      console.error("No data received from Onshape API");
      return null;
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

    const redirectUrl = urlResponse.response.headers.get("Location");
    if (!redirectUrl) {
      console.error("No Location header in STL URL response");
      return null;
    }

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
    if (!stlResponse.body) {
      console.error("No body in STL response");
      return null;
    }
    return stlResponse.body;
  }

  async getKeyWidths(): Promise<Record<string, MilliMeter>> {
    // 指定されたエレメントIDから変数を取得するヘルパー関数
    const fetchFromElement = async (
      elementId: string,
    ): Promise<Record<string, MilliMeter>> => {
      // openapi-fetchの型推論が不完全なため、手動で型を指定
      const response = await this.client.GET(
        "/variables/d/{did}/{wv}/{wvid}/e/{eid}/variables",
        {
          params: {
            path: {
              did: this.documentId,
              wv: "w",
              wvid: this.workspaceId,
              eid: elementId,
            },
          },
        },
      );

      // レスポンス型の検証とデータ取得
      // openapi-fetchの型推論が正しく機能しないため型アサーションを使用
      // deno-lint-ignore no-explicit-any
      const responseData = response.data as any;
      if (!responseData) {
        if (response.error) {
          console.error("Error fetching variables:", response.error);
        }
        return {};
      }

      // レスポンスはBTVariableTableInfo[]配列
      const variableTables = responseData as unknown;
      const firstTable = Array.isArray(variableTables)
        ? variableTables[0]
        : variableTables;

      if (
        !firstTable ||
        !("variables" in firstTable) ||
        !Array.isArray(firstTable.variables)
      ) {
        return {};
      }

      const variables = firstTable.variables as BTVariableInfo[];

      return variables
        .filter((v): v is BTVariableInfo & { name: string } =>
          // thumb_key_widthを除外（親指はスイッチを持たない）
          typeof v.name === "string" &&
          v.name.includes("key_width") &&
          v.name !== "thumb_key_width"
        )
        .reduce((acc, v) => {
          let value: number;

          // valueがnullでない場合はそれを使用
          if (v.value !== null && v.value !== undefined) {
            value = parseFloat(v.value);
          } else {
            // expressionから数値を抽出（例: "18.9 mm" や "max(..., 11mm)"）
            const numberMatch = v.expression.match(/(\d+\.?\d*)\s*mm/);
            if (numberMatch) {
              value = parseFloat(numberMatch[1]);
            } else {
              console.warn(
                `Could not extract numeric value from expression: ${v.expression}`,
              );
              return acc;
            }
          }

          if (!Number.isNaN(value)) {
            acc[v.name] = MilliMeter(value);
          }
          return acc;
        }, {} as Record<string, MilliMeter>);
    };

    // まずglobalVariablesElementIdで試す
    let result = await fetchFromElement(this.globalVariablesElementId);

    if (Object.keys(result).length > 0) {
      console.log(
        "Found key_width variables in globalVariablesElementId:",
        Object.keys(result),
      );
      return result;
    }

    // 見つからない場合はtopPlateElementIdを試す
    console.warn(
      "No key_width variables found in globalVariablesElementId, trying topPlateElementId",
    );
    result = await fetchFromElement(this.topPlateElementId);

    if (Object.keys(result).length > 0) {
      console.log(
        "Found key_width variables in topPlateElementId:",
        Object.keys(result),
      );
    } else {
      console.warn("No key_width variables found in any element");
    }

    return result;
  }
}
