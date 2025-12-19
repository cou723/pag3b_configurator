type ToExpression = { toExpression: () => string };
type ToConfig = { toConfig: () => string };
type VariableType = { VARIABLE_TYPE: "LENGTH" | "ANGLE" | "NUMBER" };

export type MilliMeter =
  & { type: "milliMeter"; value: number }
  & ToExpression
  & ToConfig
  & VariableType;

export function MilliMeter(value: number): MilliMeter {
  return {
    type: "milliMeter",
    value,
    toConfig: () => `${truncateDecimal(value, 3)}+millimeter`,
    toExpression: () => `${value.toFixed(1)} mm`,
    VARIABLE_TYPE: "LENGTH",
  };
}

function truncateDecimal(value: number, n: number): number {
  const factor = Math.pow(10, n); // 10^nを計算
  return Math.floor(value * factor) / factor; // 小数点を移動して切り捨て後、元に戻す
}
