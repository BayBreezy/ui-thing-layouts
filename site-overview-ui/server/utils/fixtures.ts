import { Faker, en } from "@faker-js/faker";

import { runReport } from "../../shared/analytics";
import { addDays, dataStart, daysBetween, eachDay, weekdayIndex } from "../../shared/dates";
import { defaultPreferences } from "../../shared/demo";
import { buildInsights } from "../../shared/insights";
import { hashString, mulberry32, pickWeighted } from "../../shared/random";
import { channels, referenceDate, referenceHour } from "../../shared/types";
import type {
  Annotation,
  Channel,
  DemoState,
  Dataset,
  Device,
  Goal,
  PageInfo,
  SavedReport,
  Session,
  Site,
} from "../../shared/types";

/**
 * Seeded demo data. This is the only module that imports Faker, and it only runs on the server, so
 * the browser bundle never ships it. Volume comes from a tiny seeded generator because tens of
 * thousands of sessions per site need to build in milliseconds.
 */

interface PageSpec extends PageInfo {
  /** Relative chance a session views this page. Zero means it is only reachable through the journey. */
  weight: number;
}
interface JourneyStep {
  path: string;
  /** Chance of taking this step once the previous one happened. */
  p: number;
}
interface SiteSpec {
  site: Omit<Site, "pages" | "createdAt">;
  pages: PageSpec[];
  sessionsPerDay: number;
  /** Fractional daily growth, so the whole window trends upward. */
  growth: number;
  channelWeights: number[];
  mobileShare: number;
  countryWeights: Record<string, number>;
  referrers: Partial<Record<Channel, string[]>>;
  campaigns: Partial<Record<Channel, string[]>>;
  returningByChannel: number[];
  /** Pages that only appear at the end of an engaged visit, in order. */
  journey: JourneyStep[];
  events: { name: string; p: number; afterPath?: string; minPages?: number }[];
  /** Multiplies a channel's traffic between two dates. */
  surges: { from: string; to: string; channel: Channel | "all"; factor: number }[];
  goals: { id: string; name: string; kind: Goal["kind"]; match: string }[];
  funnel: string[];
  annotations: Omit<Annotation, "id" | "siteId">[];
}

const hourWeights = [1, 1, 1, 1, 1, 2, 3, 5, 7, 8, 9, 9, 9, 9, 8, 8, 8, 8, 9, 10, 10, 8, 5, 3];
const weekdayFactor = [1.0, 1.06, 1.06, 1.02, 0.9, 0.62, 0.66];
const countryCodes = ["US", "CA", "GB", "DE", "FR", "AU", "IN", "BR", "NL", "JP", "ES", "MX"];
const browsers = ["Chrome", "Safari", "Firefox", "Edge", "Samsung Internet"];

const specs: SiteSpec[] = [
  {
    site: {
      id: "northwind",
      name: "Northwind Outfitters",
      domain: "northwind.example",
      blurb: "Outdoor gear shop",
    },
    pages: [
      { path: "/", title: "Home", weight: 30 },
      { path: "/shop", title: "Shop all gear", weight: 16 },
      { path: "/shop/trail-jackets", title: "Trail jackets", weight: 11 },
      { path: "/shop/boots", title: "Hiking boots", weight: 9 },
      { path: "/shop/packs", title: "Packs and bags", weight: 7 },
      { path: "/sale", title: "Autumn sale", weight: 8 },
      { path: "/blog/winter-layering", title: "The winter layering guide", weight: 6 },
      { path: "/blog/trail-guide", title: "A first-timer's trail guide", weight: 5 },
      { path: "/about", title: "Our story", weight: 3 },
      { path: "/contact", title: "Contact us", weight: 2 },
      { path: "/returns", title: "Returns and exchanges", weight: 2 },
      { path: "/gift-cards", title: "Gift cards", weight: 2 },
      { path: "/cart", title: "Your cart", weight: 0 },
      { path: "/checkout", title: "Checkout", weight: 0 },
      { path: "/checkout/thanks", title: "Order confirmed", weight: 0 },
    ],
    sessionsPerDay: 380,
    growth: 0.0016,
    channelWeights: [24, 34, 14, 13, 7, 8],
    mobileShare: 0.58,
    countryWeights: {
      US: 46,
      CA: 12,
      GB: 11,
      DE: 5,
      FR: 4,
      AU: 7,
      IN: 3,
      BR: 2,
      NL: 3,
      JP: 2,
      ES: 3,
      MX: 2,
    },
    referrers: {
      organic: ["google.com", "bing.com", "duckduckgo.com"],
      social: ["instagram.com", "facebook.com", "pinterest.com", "reddit.com"],
      email: ["mail.northwind.example"],
      referral: ["outdoorgearlab.example", "trailnotes.example", "wirecutter.example"],
      paid: ["google.com"],
    },
    campaigns: {
      paid: ["autumn-sale", "retarget-boots"],
      email: ["trail-newsletter"],
      social: ["ig-lookbook"],
    },
    returningByChannel: [0.52, 0.22, 0.3, 0.2, 0.6, 0.25],
    journey: [
      { path: "/cart", p: 0.17 },
      { path: "/checkout", p: 0.56 },
      { path: "/checkout/thanks", p: 0.63 },
    ],
    events: [
      { name: "add_to_cart", p: 0.95, afterPath: "/cart" },
      { name: "newsletter_signup", p: 0.035, minPages: 2 },
    ],
    surges: [
      { from: "2026-09-21", to: "2026-09-27", channel: "paid", factor: 2.7 },
      { from: "2026-09-10", to: "2026-10-13", channel: "organic", factor: 1.32 },
      { from: "2026-10-02", to: "2026-10-02", channel: "all", factor: 0.52 },
    ],
    goals: [
      { id: "northwind-cart", name: "Added to cart", kind: "event", match: "add_to_cart" },
      { id: "northwind-checkout", name: "Started checkout", kind: "pageview", match: "/checkout" },
      { id: "northwind-purchase", name: "Purchase", kind: "pageview", match: "/checkout/thanks" },
      {
        id: "northwind-newsletter",
        name: "Newsletter signup",
        kind: "event",
        match: "newsletter_signup",
      },
    ],
    funnel: ["northwind-cart", "northwind-checkout", "northwind-purchase"],
    annotations: [
      { date: "2026-08-18", label: "Redesigned product pages shipped", kind: "deploy" },
      { date: "2026-09-10", label: "Winter layering guide published", kind: "note" },
      { date: "2026-09-21", label: "Autumn sale campaign starts", kind: "campaign" },
      { date: "2026-09-28", label: "Autumn sale campaign ends", kind: "campaign" },
      {
        date: "2026-10-02",
        label: "Checkout v2.4 deploy: slow pages for most of the day",
        kind: "incident",
      },
    ],
  },
  {
    site: {
      id: "fernlight",
      name: "Fernlight Docs",
      domain: "docs.fernlight.example",
      blurb: "Developer documentation and sign-ups",
    },
    pages: [
      { path: "/", title: "Home", weight: 14 },
      { path: "/docs", title: "Documentation", weight: 20 },
      { path: "/docs/quickstart", title: "Quickstart", weight: 18 },
      { path: "/docs/api/authentication", title: "Authentication", weight: 11 },
      { path: "/docs/api/webhooks", title: "Webhooks", weight: 8 },
      { path: "/docs/guides/migrate-v2", title: "Migrating to v2", weight: 9 },
      { path: "/changelog", title: "Changelog", weight: 5 },
      { path: "/pricing", title: "Pricing", weight: 7 },
      { path: "/blog/launching-v2", title: "Launching Fernlight v2", weight: 4 },
      { path: "/community", title: "Community", weight: 2 },
      { path: "/signup", title: "Create an account", weight: 0 },
      { path: "/signup/welcome", title: "Welcome", weight: 0 },
    ],
    sessionsPerDay: 150,
    growth: 0.0021,
    channelWeights: [20, 46, 4, 8, 6, 16],
    mobileShare: 0.2,
    countryWeights: {
      US: 30,
      CA: 6,
      GB: 10,
      DE: 12,
      FR: 5,
      AU: 4,
      IN: 14,
      BR: 5,
      NL: 5,
      JP: 4,
      ES: 3,
      MX: 2,
    },
    referrers: {
      organic: ["google.com", "bing.com", "duckduckgo.com"],
      social: ["x.com", "linkedin.com", "reddit.com"],
      email: ["mail.fernlight.example"],
      referral: ["github.com", "news.ycombinator.com", "stackoverflow.com", "dev.to"],
      paid: ["google.com"],
    },
    campaigns: {
      paid: ["docs-search-ads"],
      email: ["v2-launch-email"],
      social: ["v2-launch-thread"],
    },
    returningByChannel: [0.62, 0.3, 0.4, 0.22, 0.66, 0.32],
    journey: [
      { path: "/pricing", p: 0.12 },
      { path: "/signup", p: 0.42 },
      { path: "/signup/welcome", p: 0.7 },
    ],
    events: [
      { name: "api_key_created", p: 0.8, afterPath: "/signup/welcome" },
      { name: "docs_search", p: 0.22, minPages: 2 },
    ],
    surges: [
      { from: "2026-09-15", to: "2026-09-17", channel: "social", factor: 4.2 },
      { from: "2026-09-15", to: "2026-09-18", channel: "referral", factor: 3.1 },
    ],
    goals: [
      { id: "fernlight-pricing", name: "Viewed pricing", kind: "pageview", match: "/pricing" },
      { id: "fernlight-signup", name: "Signed up", kind: "pageview", match: "/signup/welcome" },
      { id: "fernlight-key", name: "API key created", kind: "event", match: "api_key_created" },
    ],
    funnel: ["fernlight-pricing", "fernlight-signup", "fernlight-key"],
    annotations: [
      { date: "2026-09-15", label: "Fernlight v2 launch", kind: "campaign" },
      { date: "2026-10-06", label: "Docs search shipped", kind: "deploy" },
    ],
  },
  {
    site: {
      id: "harbor-pine",
      name: "Harbor & Pine Café",
      domain: "harborandpine.example",
      blurb: "Neighbourhood café and online ordering",
    },
    pages: [
      { path: "/", title: "Home", weight: 28 },
      { path: "/menu", title: "Menu", weight: 22 },
      { path: "/menu/brunch", title: "Weekend brunch", weight: 10 },
      { path: "/order", title: "Order online", weight: 12 },
      { path: "/catering", title: "Catering", weight: 5 },
      { path: "/events", title: "Events", weight: 4 },
      { path: "/about", title: "About us", weight: 3 },
      { path: "/visit", title: "Visit and hours", weight: 9 },
      { path: "/gift-cards", title: "Gift cards", weight: 2 },
      { path: "/order/confirmed", title: "Order confirmed", weight: 0 },
    ],
    sessionsPerDay: 52,
    growth: 0.0012,
    channelWeights: [30, 38, 6, 16, 6, 4],
    mobileShare: 0.7,
    countryWeights: {
      US: 86,
      CA: 7,
      GB: 2,
      DE: 1,
      FR: 1,
      AU: 1,
      IN: 0.4,
      BR: 0.3,
      NL: 0.4,
      JP: 0.3,
      ES: 0.3,
      MX: 0.5,
    },
    referrers: {
      organic: ["google.com", "bing.com", "maps.google.com"],
      social: ["instagram.com", "facebook.com"],
      email: ["mail.harborandpine.example"],
      referral: ["yelp.com", "tripadvisor.com", "eater.example"],
      paid: ["google.com"],
    },
    campaigns: { email: ["weekend-specials"], social: ["ig-brunch"] },
    returningByChannel: [0.58, 0.28, 0.3, 0.3, 0.6, 0.28],
    journey: [{ path: "/order/confirmed", p: 0.1 }],
    events: [
      { name: "directions_click", p: 0.18, afterPath: "/visit" },
      { name: "reservation_click", p: 0.06, minPages: 2 },
    ],
    surges: [{ from: "2026-10-09", to: "2026-10-11", channel: "social", factor: 2.4 }],
    goals: [
      { id: "harbor-order", name: "Order placed", kind: "pageview", match: "/order/confirmed" },
      {
        id: "harbor-directions",
        name: "Directions click",
        kind: "event",
        match: "directions_click",
      },
      {
        id: "harbor-reservation",
        name: "Reservation click",
        kind: "event",
        match: "reservation_click",
      },
    ],
    funnel: ["harbor-directions", "harbor-order"],
    annotations: [{ date: "2026-10-10", label: "Fall menu launch weekend", kind: "campaign" }],
  },
];

const factorFor = (spec: SiteSpec, date: string, channel: Channel) =>
  spec.surges.reduce(
    (factor, surge) =>
      date >= surge.from &&
      date <= surge.to &&
      (surge.channel === "all" || surge.channel === channel)
        ? factor * surge.factor
        : factor,
    1
  );

function generate(spec: SiteSpec, pages: PageInfo[], seed: string): Dataset {
  const random = mulberry32(hashString(seed));
  const faker = new Faker({ locale: [en] });
  faker.seed(hashString(seed));
  // A long tail of small referrers so the referrer list does not look hand-typed.
  const tail = Array.from({ length: 6 }, () => faker.internet.domainName());
  const referrers: Partial<Record<Channel, string[]>> = {
    ...spec.referrers,
    referral: [...(spec.referrers.referral ?? []), ...tail],
  };
  const pageWeights = pages.map(
    (page) => spec.pages.find((candidate) => candidate.path === page.path)?.weight ?? 0
  );
  const indexOf = (path: string) => pages.findIndex((page) => page.path === path);
  const journey = spec.journey
    .map((step) => ({ index: indexOf(step.path), p: step.p }))
    .filter((step) => step.index >= 0);
  const countryWeights = countryCodes.map((code) => spec.countryWeights[code] ?? 0.2);
  const hourTotal = hourWeights.reduce((sum, weight) => sum + weight, 0);
  const sessions: Session[] = [];
  let nextVisitor = 1;
  const channelMobileBias: Record<Channel, number> = {
    direct: 0,
    organic: 0,
    paid: 0.05,
    social: 0.18,
    email: 0.08,
    referral: -0.05,
  };

  for (const date of eachDay(dataStart, referenceDate)) {
    const dayIndex = daysBetween(dataStart, date);
    const isToday = date === referenceDate;
    const hours = isToday ? hourWeights.slice(0, referenceHour + 1) : hourWeights;
    const dayShare = isToday ? hours.reduce((sum, weight) => sum + weight, 0) / hourTotal : 1;
    const base =
      spec.sessionsPerDay * (1 + spec.growth * dayIndex) * (weekdayFactor[weekdayIndex(date)] ?? 1);
    const weights = spec.channelWeights.map(
      (weight, index) => weight * factorFor(spec, date, channels[index]!)
    );
    const weightSum = weights.reduce((sum, weight) => sum + weight, 0);
    const baseWeightSum = spec.channelWeights.reduce((sum, weight) => sum + weight, 0);
    const noise = 0.92 + random() * 0.16;
    const count = Math.round(base * (weightSum / baseWeightSum) * noise * dayShare);

    for (let n = 0; n < count; n++) {
      const channel = pickWeighted(random, channels, weights);
      const channelIndex = channels.indexOf(channel);
      const mobile = Math.min(0.95, Math.max(0.05, spec.mobileShare + channelMobileBias[channel]));
      const roll = random();
      const device: Device = roll < mobile ? "mobile" : roll < mobile + 0.06 ? "tablet" : "desktop";
      const browser =
        device === "mobile"
          ? pickWeighted(random, browsers, [30, 56, 3, 1, 10])
          : pickWeighted(random, browsers, [62, 18, 9, 10, 1]);
      const returning =
        random() < (spec.returningByChannel[channelIndex] ?? 0.25) && nextVisitor > 1;
      // Returning visitors lean towards people who came recently, as real audiences do.
      const visitor = returning
        ? nextVisitor - 1 - Math.floor(random() ** 3 * Math.min(nextVisitor - 1, 6000))
        : nextVisitor++;

      // Journeys: engaged visits browse a few pages, and some continue down the conversion path.
      const entry = pickWeighted(
        random,
        pages.map((_, index) => index),
        pageWeights
      );
      const engagement =
        channel === "paid" ? 0.5 : channel === "email" ? 0.7 : channel === "social" ? 0.42 : 0.58;
      const viewed = [entry];
      while (viewed.length < 9 && random() < engagement * (viewed.length === 1 ? 1 : 0.74)) {
        viewed.push(
          pickWeighted(
            random,
            pages.map((_, index) => index),
            pageWeights
          )
        );
      }
      if (viewed.length >= 2) {
        for (const step of journey) {
          if (random() >= step.p) break;
          viewed.push(step.index);
        }
      }
      const paths = viewed.map((index) => pages[index]!.path);
      const events: string[] = [];
      for (const event of spec.events) {
        if (event.afterPath && !paths.includes(event.afterPath)) continue;
        if (event.minPages && viewed.length < event.minPages) continue;
        if (random() < event.p) events.push(event.name);
      }
      const duration =
        viewed.length === 1
          ? 3 + Math.floor(random() * 28)
          : Math.round(viewed.length * (22 + random() * 52) * (0.6 + random() * 0.8));

      const referrerList = referrers[channel] ?? [];
      const campaignList = spec.campaigns[channel] ?? [];
      sessions.push({
        d: date,
        h: pickWeighted(
          random,
          hours.map((_, hour) => hour),
          hours
        ),
        ch: channel,
        dv: device,
        co: pickWeighted(random, countryCodes, countryWeights),
        br: browser,
        v: visitor,
        rt: returning,
        pg: viewed,
        du: duration,
        rf:
          channel === "direct" || referrerList.length === 0
            ? ""
            : pickWeighted(
                random,
                referrerList,
                referrerList.map((_, index) => 1 / (index + 1))
              ),
        cp:
          campaignList.length && (channel === "paid" || channel === "email" || random() < 0.35)
            ? campaignList[Math.floor(random() * campaignList.length)]!
            : "",
        ev: events,
      });
    }
  }
  return { pages, sessions };
}

const cache = new Map<string, Dataset>();
const cacheLimit = 8;

/** Pages for sites the visitor added themselves. Their traffic is seeded from the site id. */
export const genericSpec: SiteSpec = {
  site: { id: "generic", name: "Generic site", domain: "example.com", blurb: "" },
  pages: [],
  sessionsPerDay: 90,
  growth: 0.0014,
  channelWeights: [26, 36, 10, 14, 6, 8],
  mobileShare: 0.5,
  countryWeights: {
    US: 40,
    CA: 8,
    GB: 10,
    DE: 6,
    FR: 4,
    AU: 5,
    IN: 8,
    BR: 4,
    NL: 3,
    JP: 3,
    ES: 3,
    MX: 3,
  },
  referrers: {
    organic: ["google.com", "bing.com", "duckduckgo.com"],
    social: ["linkedin.com", "x.com", "facebook.com"],
    email: ["mail.example.com"],
    referral: ["github.com", "medium.com"],
    paid: ["google.com"],
  },
  campaigns: { paid: ["brand-search"], email: ["monthly-update"] },
  returningByChannel: [0.5, 0.25, 0.3, 0.2, 0.55, 0.25],
  journey: [],
  events: [{ name: "newsletter_signup", p: 0.03, minPages: 2 }],
  surges: [],
  goals: [],
  funnel: [],
  annotations: [],
};

/**
 * The dataset behind a site. Known sites use their hand-tuned spec; any other site id gets a
 * generic, deterministic dataset built on the pages the client says the site has.
 */
export function datasetFor(site: { id: string; pages: PageInfo[] }): Dataset {
  const spec = specs.find((item) => item.site.id === site.id);
  const pages = spec ? spec.pages.map(({ path, title }) => ({ path, title })) : site.pages;
  const key = spec ? site.id : `${site.id}:${pages.map((page) => page.path).join(",")}`;
  const cached = cache.get(key);
  if (cached) return cached;
  const generated = spec
    ? generate(spec, pages, site.id)
    : generate(
        {
          ...genericSpec,
          pages: pages.map((page, index) => ({ ...page, weight: Math.max(1, 20 - index * 3) })),
        },
        pages,
        site.id
      );
  if (cache.size >= cacheLimit) cache.delete(cache.keys().next().value as string);
  cache.set(key, generated);
  return generated;
}

const seededAt = `${referenceDate}T09:00:00`;

export function createDemoState(): DemoState {
  const faker = new Faker({ locale: [en] });
  faker.seed(42);
  const first = faker.person.firstName();
  const last = faker.person.lastName();

  const sites: Site[] = specs.map((spec) => ({
    ...spec.site,
    pages: spec.pages.map(({ path, title }) => ({ path, title })),
    createdAt: "2026-04-17T09:00:00",
  }));
  const goals: Goal[] = specs.flatMap((spec) =>
    spec.goals.map((goal) => ({ ...goal, siteId: spec.site.id }))
  );
  const annotations: Annotation[] = specs.flatMap((spec) =>
    spec.annotations.map((item, index) => ({
      ...item,
      id: `${spec.site.id}-note-${index + 1}`,
      siteId: spec.site.id,
    }))
  );
  const notifications = sites.flatMap((site) => {
    const spec = specs.find((item) => item.site.id === site.id)!;
    const report = runReport(
      datasetFor(site),
      {
        siteId: site.id,
        from: addDays(referenceDate, -6),
        to: referenceDate,
        compare: true,
        segment: "all",
        filters: { channel: "", device: "", country: "", page: "" },
        interval: "day",
      },
      { goals, funnel: spec.funnel }
    );
    return buildInsights(site, report);
  });
  const reports: SavedReport[] = [
    {
      id: "report-weekly-overview",
      siteId: "northwind",
      name: "Weekly overview",
      range: { preset: "7d", from: "", to: "" },
      compare: true,
      segment: "all",
      filters: { channel: "", device: "", country: "", page: "" },
      digest: "weekly",
      createdAt: seededAt,
    },
    {
      id: "report-mobile-organic",
      siteId: "northwind",
      name: "Organic on mobile",
      range: { preset: "30d", from: "", to: "" },
      compare: true,
      segment: "organic",
      filters: { channel: "", device: "mobile", country: "", page: "" },
      digest: "off",
      createdAt: seededAt,
    },
    {
      id: "report-paid-campaign",
      siteId: "northwind",
      name: "Autumn sale campaign",
      range: { preset: "custom", from: "2026-09-21", to: "2026-09-27" },
      compare: true,
      segment: "paid",
      filters: { channel: "", device: "", country: "", page: "" },
      digest: "off",
      createdAt: seededAt,
    },
    {
      id: "report-docs-launch",
      siteId: "fernlight",
      name: "v2 launch week",
      range: { preset: "custom", from: "2026-09-14", to: "2026-09-20" },
      compare: true,
      segment: "all",
      filters: { channel: "", device: "", country: "", page: "" },
      digest: "monthly",
      createdAt: seededAt,
    },
  ];

  return {
    profile: {
      id: "profile-1",
      name: `${first} ${last}`,
      email: `${first}.${last}@beacon.example`.toLowerCase().replace(/[^a-z0-9.@]/g, ""),
      role: "Growth lead",
    },
    signedIn: false,
    sites,
    goals,
    annotations,
    reports,
    notifications,
    preferences: defaultPreferences(
      "northwind",
      specs.flatMap((spec) => spec.funnel)
    ),
  };
}
