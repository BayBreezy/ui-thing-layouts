import { array, boolean, number, object, string } from "yup";

import { isDate } from "./dates";
import { channels, devices, metrics, rangePresets, segments, widgetIds } from "./types";
import type { Channel, Device, Metric, RangePreset, Segment, WidgetId } from "./types";

const text = (label: string, max: number) =>
  string()
    .trim()
    .required(`${label} is required`)
    .max(max, `${label} must be ${max} characters or fewer`);
const id = () => string().required().max(80);
const email = () =>
  string().trim().required("Enter your email").email("Enter a valid email address").max(200);
const date = (label = "Date") =>
  string()
    .required(`${label} is required`)
    .test("date", `${label} must be a real date`, (value) => isDate(value));
const timestamp = () => string().required().max(40);

export const filtersSchema = object({
  channel: string()
    .oneOf(["", ...channels])
    .defined(),
  device: string()
    .oneOf(["", ...devices])
    .defined(),
  country: string().max(2).defined(),
  page: string().max(200).defined(),
});

export const rangeSchema = object({
  preset: string()
    .oneOf([...rangePresets])
    .required(),
  from: string().defined().max(10),
  to: string().defined().max(10),
});

export const reportQuerySchema = object({
  siteId: id(),
  from: date("Start date"),
  to: date("End date"),
  compare: boolean().required(),
  segment: string()
    .oneOf([...segments])
    .required(),
  filters: filtersSchema.required(),
  interval: string().oneOf(["auto", "day", "week"]).required(),
});

export const goalSchema = object({
  id: id(),
  siteId: id(),
  name: text("Name", 60),
  kind: string().oneOf(["pageview", "event"]).required(),
  match: string()
    .trim()
    .required("Enter a page path or event name")
    .max(120)
    .when("kind", {
      is: "pageview",
      then: (schema) => schema.matches(/^\/[^\s]*$/, "A page path starts with / and has no spaces"),
      otherwise: (schema) =>
        schema.matches(/^[a-z][a-z0-9_]*$/, "Use lowercase letters, numbers and underscores"),
    }),
});

export const siteSchema = object({
  id: id(),
  name: text("Site name", 60),
  domain: string()
    .trim()
    .required("Enter the site's domain")
    .max(120)
    .matches(
      /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/i,
      "Enter a domain like example.com"
    ),
  blurb: string().trim().max(160).defined(),
  pages: array()
    .of(object({ path: string().required().max(200), title: string().required().max(120) }))
    .defined(),
  createdAt: timestamp(),
});

export const savedReportSchema = object({
  id: id(),
  siteId: id(),
  name: text("Report name", 60),
  range: rangeSchema.required(),
  compare: boolean().required(),
  segment: string()
    .oneOf([...segments])
    .required(),
  filters: filtersSchema.required(),
  digest: string().oneOf(["off", "weekly", "monthly"]).required(),
  createdAt: timestamp(),
});

export const profileSchema = object({
  id: id(),
  name: text("Name", 100),
  email: email(),
  role: text("Role", 80),
});

export const preferencesSchema = object({
  appearance: string().oneOf(["system", "light", "dark"]).required(),
  siteId: id(),
  range: rangeSchema.required(),
  compare: boolean().required(),
  segment: string()
    .oneOf([...segments])
    .required(),
  filters: filtersSchema.required(),
  metric: string()
    .oneOf([...metrics])
    .required(),
  widgets: array()
    .of(
      object({
        id: string()
          .oneOf([...widgetIds])
          .required(),
        visible: boolean().required(),
      })
    )
    .required(),
  funnel: array().of(string().required()).required(),
  notify: boolean().required(),
  weeklyDigest: boolean().required(),
  retentionMonths: number().integer().oneOf([3, 6, 14, 26]).required(),
});

export const settingsSchema = object({
  profile: profileSchema.required(),
  preferences: preferencesSchema.required(),
});

export const authSchemas = {
  login: object({
    email: email(),
    password: string().required("Enter your password").min(8).max(200),
  }),
  signup: object({
    name: text("Name", 100),
    email: email(),
    password: string().required("Choose a password").min(8, "Use at least 8 characters").max(200),
  }),
  "forgot-password": object({ email: email() }),
  "reset-password": object({
    password: string().required("Choose a password").min(8, "Use at least 8 characters").max(200),
  }),
} as const;

export const deletableKinds = ["goal", "report", "site", "annotation"] as const;

export const demoStateSchema = object({
  profile: profileSchema.required(),
  signedIn: boolean().required(),
  sites: array().of(siteSchema).required().min(1),
  goals: array().of(goalSchema).required(),
  annotations: array()
    .of(
      object({
        id: id(),
        siteId: id(),
        date: date(),
        label: text("Label", 120),
        kind: string().oneOf(["deploy", "campaign", "incident", "note"]).required(),
      })
    )
    .required(),
  reports: array().of(savedReportSchema).required(),
  notifications: array()
    .of(
      object({
        id: id(),
        siteId: id(),
        title: text("Title", 200),
        detail: string().defined().max(400),
        href: string().defined(),
        tone: string().oneOf(["up", "down", "info"]).required(),
        read: boolean().required(),
        createdAt: timestamp(),
      })
    )
    .required(),
  preferences: preferencesSchema.required(),
});

export const typed = {
  channel: (value: string): value is Channel => (channels as readonly string[]).includes(value),
  device: (value: string): value is Device => (devices as readonly string[]).includes(value),
  segment: (value: string): value is Segment => (segments as readonly string[]).includes(value),
  preset: (value: string): value is RangePreset =>
    (rangePresets as readonly string[]).includes(value),
  metric: (value: string): value is Metric => (metrics as readonly string[]).includes(value),
  widget: (value: string): value is WidgetId => (widgetIds as readonly string[]).includes(value),
};
