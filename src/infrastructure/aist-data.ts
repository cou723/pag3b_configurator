import {
  AistTable,
  AistTableRepository,
} from "../domain/repository/aist-table.ts";
import { parse } from "@std/csv";

export class AistDataRepositoryLive implements AistTableRepository {
  readonly tables: {
    male_max: AistTable;
    male_min: AistTable;
    male_avg: AistTable;
    female_max: AistTable;
    female_min: AistTable;
    female_avg: AistTable;
  };
  readonly myTable: AistTable;

  constructor() {
    const csvContent = Deno.readTextFileSync("./statistics.csv");
    // parse returns string[][] by default
    const data = parse(csvContent) as unknown as string[][];

    const tables = {
      male_max: {} as Record<string, number>,
      male_min: {} as Record<string, number>,
      male_avg: {} as Record<string, number>,
      female_max: {} as Record<string, number>,
      female_min: {} as Record<string, number>,
      female_avg: {} as Record<string, number>,
    };

    for (const row of data) {
      const maleRow = [...row];
      const femaleRow = maleRow.splice(11);

      // Process Male
      this.processRow(
        maleRow,
        tables.male_avg,
        tables.male_min,
        tables.male_max,
      );
      // Process Female
      this.processRow(
        femaleRow,
        tables.female_avg,
        tables.female_min,
        tables.female_max,
      );
    }

    this.tables = {
      male_max: tables.male_max as AistTable,
      male_min: tables.male_min as AistTable,
      male_avg: tables.male_avg as AistTable,
      female_max: tables.female_max as AistTable,
      female_min: tables.female_min as AistTable,
      female_avg: tables.female_avg as AistTable,
    };

    // Use male_avg as a default for myTable since there is no source for it yet
    this.myTable = {
      ...this.tables.male_avg,
      L03: 67,
      L04: 96.5,
      L05: 97,
      L06: 92,
      L07: 82,
      L14: 52,
      L15: 75,
      L16: 85,
      L17: 81,
      L18: 67,
    };
  }

  private processRow(
    row: string[],
    avgTable: Record<string, number>,
    minTable: Record<string, number>,
    maxTable: Record<string, number>,
  ) {
    const id = row[0];
    // Check if ID is valid (Lxx, Bxx, Dxx, Cxx, Nxx)
    // Matches patterns like L01, B12, D05, etc.
    if (!id || !/^[LBDCN]\d+$/.test(id)) {
      return;
    }

    // Indices relative to start of the row array:
    // ID: 0, Name: 1, N: 2, Mean: 3, SD: 4, Min: 5, Max: 6

    if (row.length <= 6) return;

    const mean = parseFloat(row[3]);
    const min = parseFloat(row[5]);
    const max = parseFloat(row[6]);

    if (!isNaN(mean)) avgTable[id] = mean;
    if (!isNaN(min)) minTable[id] = min;
    if (!isNaN(max)) maxTable[id] = max;
  }
}
