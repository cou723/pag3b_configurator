export type FingerSegment = {
  wristToMcpMm: number;
  mcpToTipMm: number;
  pipWidthMm: number;
};

export type ThumbSegment = Omit<FingerSegment, "pipWidthMm">;

export type PerFinger = {
  thumb: ThumbSegment;
  index: FingerSegment;
  middle: FingerSegment;
  ring: FingerSegment;
  little: FingerSegment;
};

export type MeasureParam = {
  perFinger: PerFinger;
  /** 小指MP関節から親指MP関節までの距離（mm） */
  littleStartToThumbStartMm: number;
};
