import type { PageRow, RankedRow } from "./types";

/** Spreadsheets run cells that start with these characters as formulas. */
const dangerous = /^[=+\-@\t\r]/;
export function csvCell(value: string | number | boolean) {
  let text = String(value);
  if (dangerous.test(text)) text = "'" + text;
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}
const toCsv = (rows: (string | number | boolean)[][]) =>
  rows.map((row) => row.map(csvCell).join(",")).join("\r\n") + "\r\n";

export function pagesCsv(rows: PageRow[]) {
  return toCsv([
    ["Path", "Title", "Pageviews", "Visitors", "Entrances", "Bounce rate", "Avg. duration (s)"],
    ...rows.map((row) => [
      row.path,
      row.title,
      row.views,
      row.visitors,
      row.entrances,
      `${(row.bounceRate * 100).toFixed(1)}%`,
      Math.round(row.avgDuration),
    ]),
  ]);
}

export function rankedCsv(label: string, rows: RankedRow[]) {
  return toCsv([
    [label, "Sessions", "Visitors", "Share", "Bounce rate"],
    ...rows.map((row) => [
      row.label,
      row.sessions,
      row.visitors,
      `${(row.share * 100).toFixed(1)}%`,
      `${(row.bounceRate * 100).toFixed(1)}%`,
    ]),
  ]);
}
