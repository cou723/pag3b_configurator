export type FingerSegment = {
  wristToMcpMm: number;
  mcpToTipMm: number;
};

export type PerFinger = {
  thumb: FingerSegment;
  index: FingerSegment;
  middle: FingerSegment;
  ring: FingerSegment;
  little: FingerSegment;
};

export type WristToStartHeights = {
  indexMm: number;
  ringMm: number;
  littleMm: number;
  clamped: boolean;
};

export type metacarpalEstimatesSchema = {
  thumbMm: number;
  indexMm: number;
  middleMm: number;
  ringMm: number;
  littleMm: number;
  method: "projection";
  frame: "mcp_row";
};

export type MpJointSpacing = {
  indexToMiddleMm: number;
  middleToRingMm: number;
  ringToLittleMm: number;
  method: "parallel_line_distance";
};

export type MeasureParam = {
  perFinger: PerFinger;
  palmLengthMm: number;
  wristToStartHeightsMm: WristToStartHeights;
  metacarpalLengthEstMm: metacarpalEstimatesSchema;
  mpJointSpacingMm: MpJointSpacing;
  littleStartToThumbStartMm: number;
};
