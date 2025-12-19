
const officialFilePath = "openapi_official.json";
const cleanedFilePath = "openapi_cleaned.json";

const openapi = JSON.parse(await Deno.readTextFile(officialFilePath));

// Recursive function to traverse and clean the schema
function cleanSchema(schema: any) {
  if (!schema || typeof schema !== "object") return;

  // properties内の btType を無条件に削除する
  // 理由: discriminator によって btType: "Literal" が自動付与されるべき場所で、
  // btType: { type: "string" } が明示されていると衝突するため。
  // Onshape APIにおいて btType は常にメタデータであり、ユーザーが任意の文字列を入れるフィールドではないため、
  // properties から削除して discriminator のマッピング（リテラル型）に任せるのが安全。
  if (schema.properties && schema.properties.btType) {
    delete schema.properties.btType;
  }

  // allOf の中も同様に探索
  if (schema.allOf && Array.isArray(schema.allOf)) {
    schema.allOf.forEach((subSchema: any) => {
        cleanSchema(subSchema); // allOf内のスキーマも再帰的にクリーンアップ
    });
  }
}

if (openapi.components && openapi.components.schemas) {
  for (const key in openapi.components.schemas) {
    cleanSchema(openapi.components.schemas[key]);
  }
}

await Deno.writeTextFile(cleanedFilePath, JSON.stringify(openapi, null, 2));
console.log(`${cleanedFilePath} created.`);
