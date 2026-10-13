import { array, boolean, number, object, string } from "yup";

import { channels, statuses, stages } from "./types";

const text = (label: string, max = 200) => string().trim().required().max(max).label(label);
const id = () => text("ID", 100);
const timestamp = () =>
  string()
    .required()
    .test("timestamp", "Invalid timestamp", (value) => Number.isFinite(Date.parse(value)));
const calendarDate = () =>
  string()
    .defined()
    .test(
      "date",
      "Use a valid date",
      (value) =>
        value === "" ||
        (/^\d{4}-\d{2}-\d{2}$/.test(value) &&
          Number.isFinite(Date.parse(value)) &&
          new Date(value).toISOString().slice(0, 10) === value)
    );
export const memberSchema = object({
  id: id(),
  name: text("Name"),
  email: string().email().required(),
  role: text("Role"),
  initials: text("Initials", 5),
  color: string().oneOf(["violet", "amber", "teal", "rose"]).required(),
});
export const campaignSchema = object({
  id: id(),
  name: text("Campaign name", 120),
  objective: text("Objective", 500),
  description: string().defined().max(3000),
  channel: string().oneOf(channels).required(),
  ownerId: id(),
  memberIds: array().of(id()).required().max(20),
  budget: number().required().min(0).max(10000000),
  startDate: calendarDate(),
  endDate: calendarDate(),
  status: string().oneOf(statuses).required(),
  archived: boolean().required(),
  checklist: array()
    .of(object({ id: id(), title: text("Checklist item"), done: boolean().required() }))
    .required()
    .max(30),
  createdAt: timestamp(),
  updatedAt: timestamp(),
}).test(
  "dates",
  "End date must be on or after start date",
  (value) => !value.startDate || !value.endDate || value.endDate >= value.startDate
);
export const leadSchema = object({
  id: id(),
  name: text("Name"),
  email: string().email().required().max(200),
  company: text("Company"),
  value: number().min(0).max(10000000).required(),
  stage: string().oneOf(stages).required(),
  ownerId: id(),
  campaignId: string().defined().max(100),
  notes: string().defined().max(5000),
  updatedAt: timestamp(),
});
export const briefSchema = object({
  id: id(),
  title: text("Title"),
  content: text("Content", 20000),
  campaignId: string().defined().max(100),
  favorite: boolean().required(),
  updatedAt: timestamp(),
});
export const ticketSchema = object({
  id: id(),
  subject: text("Subject"),
  category: string().oneOf(["Campaigns", "Account", "Feedback"]).required(),
  description: text("Description", 5000),
  status: string().oneOf(["Open", "Resolved"]).required(),
  response: string().defined().max(5000),
  createdAt: timestamp(),
});
export const profileSchema = object({
  id: id(),
  name: text("Name"),
  email: string().email().required().max(200),
  role: text("Role"),
});
export const preferencesSchema = object({
  appearance: string().oneOf(["system", "light", "dark"]).required(),
  notify: boolean().required(),
});
export const settingsSchema = object({
  profile: profileSchema.required(),
  preferences: preferencesSchema.required(),
});
export const contextSchema = object({
  memberIds: array().of(id()).required().max(100),
  campaignIds: array().of(id()).required().max(500),
});
export const messageSchema = object({
  id: id(),
  memberId: id(),
  content: text("Message", 3000),
  createdAt: timestamp(),
  simulated: boolean().required(),
});
export const chatSchema = object({
  threadId: id(),
  memberId: id(),
  replyMemberId: id(),
  content: text("Message", 3000),
  context: contextSchema.required(),
});
export const authSchemas = {
  login: object({
    email: string().email().required(),
    password: string().required().min(8).max(128),
  }),
  signup: object({
    name: text("Name"),
    email: string().email().required(),
    password: string().required().min(8).max(128),
  }),
  "forgot-password": object({ email: string().email().required() }),
  "reset-password": object({
    token: string().oneOf(["launchpad-demo-reset"]).required(),
    password: string().required().min(8).max(128),
  }),
};
export const demoStateSchema = object({
  version: number().oneOf([1]).required(),
  profile: profileSchema.required(),
  preferences: preferencesSchema.required(),
  signedIn: boolean().required(),
  members: array().of(memberSchema).required(),
  campaigns: array().of(campaignSchema).required(),
  performance: array()
    .of(
      object({
        campaignId: id(),
        date: calendarDate().required(),
        revenue: number().min(0).required(),
        spend: number().min(0).required(),
        impressions: number().min(0).integer().required(),
        clicks: number().min(0).integer().required(),
        orders: number().min(0).integer().required(),
      })
    )
    .required(),
  leads: array().of(leadSchema).required(),
  documents: array().of(briefSchema).required(),
  threads: array()
    .of(
      object({
        id: id(),
        title: text("Title"),
        campaignId: string().defined(),
        unread: boolean().required(),
        messages: array().of(messageSchema).required(),
      })
    )
    .required(),
  tickets: array().of(ticketSchema).required(),
  activity: array()
    .of(
      object({
        id: id(),
        title: text("Activity", 500),
        href: string()
          .matches(/^\/(?!\/)/)
          .required(),
        campaignId: string().defined(),
        createdAt: timestamp(),
      })
    )
    .required(),
  notifications: array()
    .of(
      object({
        id: id(),
        title: text("Notification", 500),
        href: string()
          .matches(/^\/(?!\/)/)
          .required(),
        read: boolean().required(),
      })
    )
    .required(),
});
