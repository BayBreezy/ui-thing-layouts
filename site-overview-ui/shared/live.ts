import { hashString, mulberry32, pickWeighted } from "./random";
import { channels, devices } from "./types";
import type { Channel, Device, LiveEvent, Site } from "./types";

const countries = ["US", "CA", "GB", "DE", "FR", "AU", "IN", "BR", "NL", "JP"];
const countryWeights = [34, 9, 10, 8, 6, 5, 9, 6, 4, 3];
const channelWeights = [24, 36, 14, 12, 6, 8];
const deviceWeights = [46, 44, 10];

/**
 * One simulated pageview for the live feed. The same `index` always yields the same event for a
 * site, so the stream is reproducible; only the timestamp comes from the caller.
 */
export function liveEvent(site: Site, index: number, at: string): LiveEvent {
  const random = mulberry32(hashString(`${site.id}:${index}`));
  const weights = site.pages.map((_, position) => 1 / (position + 1.5));
  const page = pickWeighted(random, site.pages, weights);
  return {
    id: `${site.id}-live-${index}`,
    at,
    path: page.path,
    title: page.title,
    country: pickWeighted(random, countries, countryWeights),
    device: pickWeighted<Device>(random, devices, deviceWeights),
    channel: pickWeighted<Channel>(random, channels, channelWeights),
  };
}

/** A plausible "visitors right now" number that drifts a little each minute. */
export function liveVisitors(site: Site, minute: number) {
  const base = 12 + (hashString(site.id) % 40);
  const wobble = Math.round(Math.sin(minute / 3.7) * 4 + Math.sin(minute / 1.3) * 2);
  return Math.max(1, base + wobble);
}
