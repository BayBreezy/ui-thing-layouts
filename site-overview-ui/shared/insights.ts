import { channelLabels, formatChange, formatNumber, pctChange } from "./format";
import { referenceDate } from "./types";
import type { Channel, Notification, ReportResult, Site } from "./types";

/**
 * Turns a seven-day report (with comparison) into the notes the inbox shows. Rules, not magic:
 * a channel that moved 15% or more on at least 30 sessions, and the overall traffic trend.
 */
export function buildInsights(site: Site, report: ReportResult): Notification[] {
  const notes: Notification[] = [];
  const stamp = `${referenceDate}T09:00:00`;
  const add = (tone: Notification["tone"], title: string, detail: string, href: string) =>
    notes.push({
      id: `insight-${site.id}-${notes.length + 1}`,
      siteId: site.id,
      title,
      detail,
      href,
      tone,
      read: false,
      createdAt: stamp,
    });
  const previous = report.previous;
  if (previous) {
    const change = pctChange(report.totals.sessions, previous.sessions);
    if (change !== null && Math.abs(change) >= 5)
      add(
        change > 0 ? "up" : "down",
        `${site.name}: traffic is ${change > 0 ? "up" : "down"} ${Math.abs(change).toFixed(1)}%`,
        `${formatNumber(report.totals.sessions)} sessions in the last 7 days against ${formatNumber(previous.sessions)} the week before.`,
        "/"
      );
  }
  for (const row of report.channels) {
    if (row.change === null || Math.abs(row.change) < 15 || row.sessions < 30) continue;
    add(
      row.change > 0 ? "up" : "down",
      `${channelLabels[row.key as Channel]} traffic ${formatChange(row.change)} week over week`,
      `${site.name} received ${formatNumber(row.sessions)} ${channelLabels[row.key as Channel].toLowerCase()} sessions this week.`,
      "/sources"
    );
  }
  const top = report.pages[0];
  if (top)
    add(
      "info",
      `${site.name}: ${top.title} is the most viewed page`,
      `${formatNumber(top.views)} views from ${formatNumber(top.visitors)} visitors in the last 7 days.`,
      "/pages"
    );
  return notes.slice(0, 5);
}
