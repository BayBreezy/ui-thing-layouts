/**
 * Domain types for Beacon. Dates are site-local `YYYY-MM-DD` strings and hours are 0-23 integers,
 * so nothing here depends on the browser's time zone.
 */

/** The fixed demo clock. Every "today" in the app resolves to this day so the data is stable. */
export const referenceDate = "2026-10-13";
export const referenceHour = 14;
/** The seeded data covers this many days ending on the reference date. */
export const dataDays = 180;

export const channels = ["direct", "organic", "paid", "social", "email", "referral"] as const;
export type Channel = (typeof channels)[number];

export const devices = ["desktop", "mobile", "tablet"] as const;
export type Device = (typeof devices)[number];

export const segments = ["all", "direct", "organic", "paid", "mobile", "returning"] as const;
export type Segment = (typeof segments)[number];

export const rangePresets = ["today", "7d", "30d", "90d", "custom"] as const;
export type RangePreset = (typeof rangePresets)[number];

export const metrics = ["sessions", "visitors", "pageviews", "bounceRate", "avgDuration"] as const;
export type Metric = (typeof metrics)[number];

export const widgetIds = ["trend", "pages", "sources", "countries", "devices"] as const;
export type WidgetId = (typeof widgetIds)[number];

export type Interval = "day" | "week";

export interface PageInfo {
  path: string;
  title: string;
}

export interface Site {
  id: string;
  name: string;
  domain: string;
  /** What the site does, shown in the site switcher. */
  blurb: string;
  pages: PageInfo[];
  createdAt: string;
}

/** One visit. Kept compact because the server holds tens of thousands of these per site. */
export interface Session {
  /** Date, `YYYY-MM-DD`. */
  d: string;
  /** Hour of day, 0-23. */
  h: number;
  ch: Channel;
  dv: Device;
  /** ISO country code. */
  co: string;
  br: string;
  /** Visitor id, reused by returning visitors. */
  v: number;
  rt: boolean;
  /** Indexes into the site's page list, in the order they were viewed. */
  pg: number[];
  /** Seconds on site. */
  du: number;
  /** Referrer host, or an empty string for direct visits. */
  rf: string;
  /** UTM campaign, or an empty string. */
  cp: string;
  /** Custom events fired during the visit. */
  ev: string[];
}

export interface Dataset {
  pages: PageInfo[];
  sessions: Session[];
}

export type GoalKind = "pageview" | "event";
export interface Goal {
  id: string;
  siteId: string;
  name: string;
  kind: GoalKind;
  /** A page path for pageview goals, an event name for event goals. */
  match: string;
}

export interface Annotation {
  id: string;
  siteId: string;
  date: string;
  label: string;
  kind: "deploy" | "campaign" | "incident" | "note";
}

export interface Filters {
  channel: Channel | "";
  device: Device | "";
  country: string;
  page: string;
}

export interface ReportQuery {
  siteId: string;
  from: string;
  to: string;
  compare: boolean;
  segment: Segment;
  filters: Filters;
  interval: Interval | "auto";
}

export interface Totals {
  sessions: number;
  visitors: number;
  pageviews: number;
  /** 0-1. */
  bounceRate: number;
  /** Seconds. */
  avgDuration: number;
  pagesPerSession: number;
  conversions: number;
}

export interface SeriesPoint {
  date: string;
  sessions: number;
  visitors: number;
  pageviews: number;
  bounceRate: number;
  avgDuration: number;
}

export interface RankedRow {
  key: string;
  label: string;
  sessions: number;
  visitors: number;
  share: number;
  /** Percent change in sessions against the previous period, or null when it is not defined. */
  change: number | null;
  bounceRate: number;
}

export interface PageRow {
  path: string;
  title: string;
  views: number;
  visitors: number;
  entrances: number;
  bounceRate: number;
  avgDuration: number;
  change: number | null;
}

export interface GoalRow {
  goalId: string;
  conversions: number;
  previous: number | null;
  /** Conversions per session, 0-1. */
  rate: number;
  change: number | null;
}

export interface FunnelStep {
  label: string;
  sessions: number;
  /** Share of the first step. */
  rate: number;
}

export interface ReportResult {
  query: ReportQuery;
  interval: Interval;
  previousRange: { from: string; to: string } | null;
  /** False when the previous period reaches back before the seeded data begins. */
  previousAvailable: boolean;
  totals: Totals;
  previous: Totals | null;
  series: SeriesPoint[];
  previousSeries: SeriesPoint[];
  pages: PageRow[];
  channels: RankedRow[];
  referrers: RankedRow[];
  campaigns: RankedRow[];
  countries: RankedRow[];
  devices: RankedRow[];
  browsers: RankedRow[];
  visitorTypes: RankedRow[];
  goals: GoalRow[];
  funnel: FunnelStep[];
  generatedAt: string;
}

export interface Profile {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface WidgetPref {
  id: WidgetId;
  visible: boolean;
}

export interface Preferences {
  appearance: "system" | "light" | "dark";
  siteId: string;
  range: { preset: RangePreset; from: string; to: string };
  compare: boolean;
  segment: Segment;
  filters: Filters;
  metric: Metric;
  widgets: WidgetPref[];
  /** Goal ids that make up the funnel on the Goals page, in order. */
  funnel: string[];
  notify: boolean;
  weeklyDigest: boolean;
  retentionMonths: number;
}

export interface SavedReport {
  id: string;
  siteId: string;
  name: string;
  range: { preset: RangePreset; from: string; to: string };
  compare: boolean;
  segment: Segment;
  filters: Filters;
  digest: "off" | "weekly" | "monthly";
  createdAt: string;
}

export interface Notification {
  id: string;
  siteId: string;
  title: string;
  detail: string;
  href: string;
  tone: "up" | "down" | "info";
  read: boolean;
  createdAt: string;
}

export interface DemoState {
  profile: Profile;
  signedIn: boolean;
  sites: Site[];
  goals: Goal[];
  annotations: Annotation[];
  reports: SavedReport[];
  notifications: Notification[];
  preferences: Preferences;
}

/** What a settings save sends and returns. */
export interface SettingsRecord {
  profile: Profile;
  preferences: Preferences;
}

export interface LiveEvent {
  id: string;
  at: string;
  path: string;
  title: string;
  country: string;
  device: Device;
  channel: Channel;
}
