import type {
  AistTable,
  AistTableRepository,
} from "../repository/aist-table.ts";

export type MatrixLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

type MinMax = { min: number; max: number };

export class MatrixGenerator {
  /**
   * 6つのAISTテーブルから各パラメータの絶対最小値・最大値を計算
   */
  private calculateAbsoluteMinMax(
    tables: AistTableRepository["tables"],
  ): {
    L: Record<string, MinMax>;
    B: Record<string, MinMax>;
  } {
    const allTables = [
      tables.male_avg,
      Object.entries(tables.male_min).map(([key, value]) => ({
        [key]: value * 1.1,
      })).reduce((a, b) => ({ ...a, ...b })),
      tables.male_max,
      tables.female_avg,
      Object.entries(tables.female_min).map(([key, value]) => ({
        [key]: value * 1.1,
      })).reduce((a, b) => ({ ...a, ...b })),
      tables.female_max,
    ];

    const lMinMax: Record<string, MinMax> = {};
    const bMinMax: Record<string, MinMax> = {};

    // L系パラメータ（L01-L22）の最小値・最大値を計算
    for (let i = 1; i <= 22; i++) {
      const key = `L${i.toString().padStart(2, "0")}`;
      const values = allTables
        .map((table) => table[key as keyof AistTable] as number)
        .filter((v) => !Number.isNaN(v) && v !== undefined);

      if (values.length > 0) {
        lMinMax[key] = {
          min: Math.min(...values),
          max: Math.max(...values),
        };
      }
    }

    // B系パラメータ（B01-B13）の最小値・最大値を計算
    for (let i = 1; i <= 13; i++) {
      const key = `B${i.toString().padStart(2, "0")}`;
      const values = allTables
        .map((table) => table[key as keyof AistTable] as number)
        .filter((v) => !Number.isNaN(v) && v !== undefined);

      if (values.length > 0) {
        bMinMax[key] = {
          min: Math.min(...values),
          max: Math.max(...values),
        };
      }
    }

    return { L: lMinMax, B: bMinMax };
  }

  /**
   * 線形補間で指定レベルの値を計算
   * formula: value = min + (max - min) × (level - 1) / 7
   */
  private interpolate(min: number, max: number, level: MatrixLevel): number {
    return min + ((max - min) * (level - 1)) / 7;
  }

  /**
   * 64パターンのAistTableを生成
   * D/C/Nパラメータは0で埋める
   */
  generate(tables: AistTableRepository["tables"]): Map<string, AistTable> {
    const { L: lMinMax, B: bMinMax } = this.calculateAbsoluteMinMax(tables);
    const result = new Map<string, AistTable>();

    for (let lengthLevel = 1; lengthLevel <= 8; lengthLevel++) {
      for (let widthLevel = 1; widthLevel <= 8; widthLevel++) {
        const table: Partial<AistTable> = {};

        // L系パラメータを線形補間した値で設定
        for (let i = 1; i <= 22; i++) {
          const key = `L${i.toString().padStart(2, "0")}`;
          if (lMinMax[key]) {
            table[key as keyof AistTable] = this.interpolate(
              lMinMax[key].min,
              lMinMax[key].max,
              lengthLevel as MatrixLevel,
            ) as any;
          } else {
            table[key as keyof AistTable] = 0 as any;
          }
        }

        // B系パラメータを線形補間した値で設定
        for (let i = 1; i <= 13; i++) {
          const key = `B${i.toString().padStart(2, "0")}`;
          if (bMinMax[key]) {
            table[key as keyof AistTable] = this.interpolate(
              bMinMax[key].min,
              bMinMax[key].max,
              widthLevel as MatrixLevel,
            ) as any;
          } else {
            table[key as keyof AistTable] = 0 as any;
          }
        }

        // D系パラメータ（D01-D16）を0で埋める
        for (let i = 1; i <= 16; i++) {
          const key = `D${i.toString().padStart(2, "0")}`;
          table[key as keyof AistTable] = 0 as any;
        }

        // C系パラメータ（C01-C06）を0で埋める
        for (let i = 1; i <= 6; i++) {
          const key = `C${i.toString().padStart(2, "0")}`;
          table[key as keyof AistTable] = 0 as any;
        }

        // N系パラメータ（N01-N15）を0で埋める
        for (let i = 1; i <= 15; i++) {
          const key = `N${i.toString().padStart(2, "0")}`;
          table[key as keyof AistTable] = 0 as any;
        }

        const filename = `length_${lengthLevel}_width_${widthLevel}`;
        result.set(filename, table as AistTable);
      }
    }

    return result;
  }

  /**
   * 指定したlengthLevelとwidthLevelのAistTableを1つだけ生成
   */
  generateSingle(
    tables: AistTableRepository["tables"],
    lengthLevel: MatrixLevel,
    widthLevel: MatrixLevel,
  ): AistTable {
    const { L: lMinMax, B: bMinMax } = this.calculateAbsoluteMinMax(tables);
    const table: Partial<AistTable> = {};

    // L系パラメータを線形補間した値で設定
    for (let i = 1; i <= 22; i++) {
      const key = `L${i.toString().padStart(2, "0")}`;
      if (lMinMax[key]) {
        table[key as keyof AistTable] = this.interpolate(
          lMinMax[key].min,
          lMinMax[key].max,
          lengthLevel,
        ) as any;
      } else {
        table[key as keyof AistTable] = 0 as any;
      }
    }

    // B系パラメータを線形補間した値で設定
    for (let i = 1; i <= 13; i++) {
      const key = `B${i.toString().padStart(2, "0")}`;
      if (bMinMax[key]) {
        table[key as keyof AistTable] = this.interpolate(
          bMinMax[key].min,
          bMinMax[key].max,
          widthLevel,
        ) as any;
      } else {
        table[key as keyof AistTable] = 0 as any;
      }
    }

    // D系パラメータ（D01-D16）を0で埋める
    for (let i = 1; i <= 16; i++) {
      const key = `D${i.toString().padStart(2, "0")}`;
      table[key as keyof AistTable] = 0 as any;
    }

    // C系パラメータ（C01-C06）を0で埋める
    for (let i = 1; i <= 6; i++) {
      const key = `C${i.toString().padStart(2, "0")}`;
      table[key as keyof AistTable] = 0 as any;
    }

    // N系パラメータ（N01-N15）を0で埋める
    for (let i = 1; i <= 15; i++) {
      const key = `N${i.toString().padStart(2, "0")}`;
      table[key as keyof AistTable] = 0 as any;
    }

    return table as AistTable;
  }
}
