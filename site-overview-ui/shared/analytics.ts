import { addDays, dataStart, previousRange, rangeLength, weekStart } from "./dates";
import { channelLabels, countryNames, deviceLabels, pctChange } from "./format";
import { referenceDate } from "./types";
import type {
  Channel,
  Dataset,
  Device,
  FunnelStep,
  Goal,
  GoalRow,
  Interval,
  PageRow,
  RankedRow,
  ReportQuery,
  ReportResult,
  Segment,
  Session,
  SeriesPoint,
  Totals,
} from "./types";

/**
 * Beacon's reporting rules. Everything here is pure and framework-free so the same code can run in
 * the Nitro API, in tests, and later in a real backend.
 */

export const emptyFilters = (): ReportQuery["filters"] => ({
  channel: "",
  device: "",
  country: "",
  page: "",
});

/** A "bounce" is a visit that viewed a single page. */
export const isBounce = (session: Session) => session.pg.length <= 1;

export function matchesSegment(session: Session, segment: Segment) {
  switch (segment) {
    case "all":
      return true;
    case "mobile":
      return session.dv === "mobile";
    case "returning":
      return session.rt;
    default:
      return session.ch === segment;
  }
}

export function matchesFilters(
  session: Session,
  filters: ReportQuery["filters"],
  pageIndex: number | null
) {
  if (filters.channel && session.ch !== filters.channel) return false;
  if (filters.device && session.dv !== filters.device) return false;
  if (filters.country && session.co !== filters.country) return false;
  if (pageIndex !== null && !session.pg.includes(pageIndex)) return false;
  return true;
}

/** Clamps a query to the window the data covers and fixes a reversed range. */
export function normalizeQuery(query: ReportQuery, today = referenceDate): ReportQuery {
  let { from, to } = query;
  if (from > to) [from, to] = [to, from];
  if (to > today) to = today;
  if (from < dataStart) from = dataStart;
  if (from > to) from = to;
  return { ...query, from, to };
}

export const intervalFor = (query: ReportQuery): Interval =>
  query.interval === "auto"
    ? rangeLength(query.from, query.to) <= 31
      ? "day"
      : "week"
    : query.interval;

function totalsOf(rows: Session[], goalSessions: Set<Session> | null): Totals {
  const visitors = new Set<number>();
  let pageviews = 0;
  let bounces = 0;
  let duration = 0;
  let conversions = 0;
  for (const row of rows) {
    visitors.add(row.v);
    pageviews += row.pg.length;
    duration += row.du;
    if (isBounce(row)) bounces++;
    if (goalSessions?.has(row)) conversions++;
  }
  const sessions = rows.length;
  return {
    sessions,
    visitors: visitors.size,
    pageviews,
    bounceRate: sessions ? bounces / sessions : 0,
    avgDuration: sessions ? duration / sessions : 0,
    pagesPerSession: sessions ? pageviews / sessions : 0,
    conversions,
  };
}

function bucketKey(date: string, interval: Interval) {
  return interval === "week" ? weekStart(date) : date;
}

function seriesOf(rows: Session[], from: string, to: string, interval: Interval): SeriesPoint[] {
  const groups = new Map<string, Session[]>();
  // Seed every bucket so days with no traffic still draw as zero instead of being skipped.
  for (let day = from; day <= to; day = addDays(day, 1)) groups.set(bucketKey(day, interval), []);
  for (const row of rows) groups.get(bucketKey(row.d, interval))?.push(row);
  return [...groups.entries()].map(([date, group]) => {
    const totals = totalsOf(group, null);
    return {
      date,
      sessions: totals.sessions,
      visitors: totals.visitors,
      pageviews: totals.pageviews,
      bounceRate: totals.bounceRate,
      avgDuration: totals.avgDuration,
    };
  });
}

function rank(
  rows: Session[],
  previous: Session[] | null,
  keyOf: (session: Session) => string | null,
  labelOf: (key: string) => string,
  limit = 10
): RankedRow[] {
  const collect = (list: Session[]) => {
    const map = new Map<string, Session[]>();
    for (const row of list) {
      const key = keyOf(row);
      if (key === null || key === "") continue;
      const bucket = map.get(key);
      if (bucket) bucket.push(row);
      else map.set(key, [row]);
    }
    return map;
  };
  const current = collect(rows);
  const before = previous ? collect(previous) : null;
  let counted = 0;
  for (const bucket of current.values()) counted += bucket.length;
  return [...current.entries()]
    .map(([key, bucket]) => {
      const totals = totalsOf(bucket, null);
      return {
        key,
        label: labelOf(key),
        sessions: totals.sessions,
        visitors: totals.visitors,
        share: counted ? totals.sessions / counted : 0,
        change: before ? pctChange(totals.sessions, before.get(key)?.length ?? 0) : null,
        bounceRate: totals.bounceRate,
      };
    })
    .sort((a, b) => b.sessions - a.sessions || a.key.localeCompare(b.key))
    .slice(0, limit);
}

function pageRows(dataset: Dataset, rows: Session[], previous: Session[] | null): PageRow[] {
  const stats = (list: Session[]) => {
    const views = dataset.pages.map(() => 0);
    const visitors = dataset.pages.map(() => new Set<number>());
    const entrances = dataset.pages.map(() => ({ count: 0, bounces: 0, duration: 0 }));
    for (const row of list) {
      for (const index of row.pg) {
        views[index]!++;
        visitors[index]!.add(row.v);
      }
      const first = row.pg[0];
      if (first !== undefined) {
        const entry = entrances[first]!;
        entry.count++;
        entry.duration += row.du;
        if (isBounce(row)) entry.bounces++;
      }
    }
    return { views, visitors, entrances };
  };
  const now = stats(rows);
  const before = previous ? stats(previous) : null;
  return dataset.pages
    .map((page, index) => {
      const entry = now.entrances[index]!;
      return {
        path: page.path,
        title: page.title,
        views: now.views[index]!,
        visitors: now.visitors[index]!.size,
        entrances: entry.count,
        bounceRate: entry.count ? entry.bounces / entry.count : 0,
        avgDuration: entry.count ? entry.duration / entry.count : 0,
        change: before ? pctChange(now.views[index]!, before.views[index]!) : null,
      };
    })
    .filter((row) => row.views > 0)
    .sort((a, b) => b.views - a.views || a.path.localeCompare(b.path));
}

/** The sessions that reached a goal: a viewed page for page goals, a fired event for event goals. */
export function reached(session: Session, goal: Goal, dataset: Dataset) {
  if (goal.kind === "event") return session.ev.includes(goal.match);
  return session.pg.some((index) => dataset.pages[index]?.path === goal.match);
}

export interface ReportOptions {
  goals: Goal[];
  /** Goal ids, in funnel order. */
  funnel: string[];
}

export function runReport(
  dataset: Dataset,
  rawQuery: ReportQuery,
  options: ReportOptions,
  generatedAt = `${referenceDate}T14:20:00`
): ReportResult {
  const query = normalizeQuery(rawQuery);
  const interval = intervalFor(query);
  const pageIndex = query.filters.page
    ? dataset.pages.findIndex((page) => page.path === query.filters.page)
    : null;
  const keep = (session: Session) =>
    matchesSegment(session, query.segment) && matchesFilters(session, query.filters, pageIndex);
  const inRange = (from: string, to: string) =>
    dataset.sessions.filter((session) => session.d >= from && session.d <= to && keep(session));

  const rows = pageIndex === -1 ? [] : inRange(query.from, query.to);
  const prior = previousRange(query.from, query.to);
  const previousAvailable = query.compare && prior.from >= dataStart;
  const before = previousAvailable && pageIndex !== -1 ? inRange(prior.from, prior.to) : null;

  const goals = options.goals.filter((goal) => goal.siteId === query.siteId);
  const anyGoal = (list: Session[]) =>
    new Set(list.filter((session) => goals.some((goal) => reached(session, goal, dataset))));
  const totals = totalsOf(rows, anyGoal(rows));
  const previous = before ? totalsOf(before, anyGoal(before)) : null;

  const goalRows: GoalRow[] = goals.map((goal) => {
    const conversions = rows.filter((session) => reached(session, goal, dataset)).length;
    const was = before ? before.filter((session) => reached(session, goal, dataset)).length : null;
    return {
      goalId: goal.id,
      conversions,
      previous: was,
      rate: rows.length ? conversions / rows.length : 0,
      change: was === null ? null : pctChange(conversions, was),
    };
  });

  const steps = options.funnel
    .map((id) => goals.find((goal) => goal.id === id))
    .filter((goal): goal is Goal => Boolean(goal));
  const funnel: FunnelStep[] = [
    { label: "All sessions", sessions: rows.length, rate: rows.length ? 1 : 0 },
  ];
  let remaining = rows;
  for (const goal of steps) {
    remaining = remaining.filter((session) => reached(session, goal, dataset));
    funnel.push({
      label: goal.name,
      sessions: remaining.length,
      rate: rows.length ? remaining.length / rows.length : 0,
    });
  }

  return {
    query,
    interval,
    previousRange: query.compare ? prior : null,
    previousAvailable,
    totals,
    previous,
    series: seriesOf(rows, query.from, query.to, interval),
    previousSeries: before ? seriesOf(before, prior.from, prior.to, interval) : [],
    pages: pageRows(dataset, rows, before),
    channels: rank(
      rows,
      before,
      (s) => s.ch,
      (k) => channelLabels[k as Channel] ?? k,
      6
    ),
    referrers: rank(
      rows,
      before,
      (s) => s.rf,
      (k) => k,
      10
    ),
    campaigns: rank(
      rows,
      before,
      (s) => s.cp,
      (k) => k,
      10
    ),
    countries: rank(
      rows,
      before,
      (s) => s.co,
      (k) => countryNames[k] ?? k,
      12
    ),
    devices: rank(
      rows,
      before,
      (s) => s.dv,
      (k) => deviceLabels[k as Device] ?? k,
      3
    ),
    browsers: rank(
      rows,
      before,
      (s) => s.br,
      (k) => k,
      6
    ),
    visitorTypes: rank(
      rows,
      before,
      (s) => (s.rt ? "returning" : "new"),
      (k) => (k === "returning" ? "Returning visitors" : "New visitors"),
      2
    ),
    goals: goalRows,
    funnel,
    generatedAt,
  };
}

export type { ReportResult };
