import { array, boolean, number, object, string } from "yup";

import {
  bulkActions,
  deletableKinds,
  groupColors,
  groupIcons,
  interactionTypes,
  priorities,
  relationships,
  sources,
} from "./types";

const text = (label: string, max = 200) => string().trim().required().max(max).label(label);
const optionalText = (label: string, max = 200) => string().trim().defined().max(max).label(label);
const id = () => text("ID", 100);
const timestamp = () =>
  string()
    .required()
    .test("timestamp", "Invalid timestamp", (value) => Number.isFinite(Date.parse(value)));
const optionalTimestamp = () =>
  string()
    .defined()
    .test(
      "timestamp",
      "Invalid timestamp",
      (value) => value === "" || Number.isFinite(Date.parse(value))
    );
const calendarDate = (label = "Date") =>
  string()
    .defined()
    .label(label)
    .test(
      "date",
      "Use a valid date",
      (value) =>
        value === "" ||
        (/^\d{4}-\d{2}-\d{2}$/.test(value) &&
          Number.isFinite(Date.parse(value)) &&
          new Date(value).toISOString().slice(0, 10) === value)
    );
const phone = () =>
  string()
    .trim()
    .required()
    .max(30)
    .matches(/^[+()\d\s.\-x]{3,30}$/, "Enter a valid phone number")
    .label("Phone");

export const labeledEmailSchema = object({
  label: text("Label", 30),
  value: string().trim().email("Enter a valid email address").required().max(200).label("Email"),
  primary: boolean().required(),
});
export const labeledPhoneSchema = object({
  label: text("Label", 30),
  value: phone(),
  primary: boolean().required(),
});
export const addressSchema = object({
  label: text("Label", 30),
  street: optionalText("Street", 200),
  city: optionalText("City", 100),
  region: optionalText("Region", 100),
  postal: optionalText("Postal code", 20),
  country: optionalText("Country", 100),
});
export const socialsSchema = object({
  linkedin: optionalText("LinkedIn", 200),
  x: optionalText("X", 200),
  github: optionalText("GitHub", 200),
  instagram: optionalText("Instagram", 200),
});
export const contactSchema = object({
  id: id(),
  firstName: optionalText("First name", 80),
  lastName: optionalText("Last name", 80),
  nickname: optionalText("Nickname", 80),
  company: optionalText("Company", 120),
  jobTitle: optionalText("Job title", 120),
  emails: array().of(labeledEmailSchema).required().max(10),
  phones: array().of(labeledPhoneSchema).required().max(10),
  addresses: array().of(addressSchema).required().max(5),
  websites: array().of(string().trim().required().max(200)).required().max(5),
  socials: socialsSchema.required(),
  birthday: calendarDate("Birthday"),
  groupIds: array().of(id()).required().max(50),
  labels: array().of(text("Label", 30)).required().max(20),
  relationship: string().oneOf(relationships).required(),
  favorite: boolean().required(),
  archived: boolean().required(),
  referredById: string().defined(),
  avatarHue: number().integer().min(0).max(360).required(),
  notes: string().defined().max(5000),
  source: string().oneOf(sources).required(),
  lastContactedAt: optionalTimestamp(),
  createdAt: timestamp(),
  updatedAt: timestamp(),
}).test("has-name", "Add a name or a company", (value) =>
  Boolean(
    value &&
    (value.firstName?.trim() ||
      value.lastName?.trim() ||
      value.company?.trim() ||
      value.nickname?.trim())
  )
);
export const groupSchema = object({
  id: id(),
  name: text("Group name", 60),
  description: optionalText("Description", 300),
  color: string().oneOf(groupColors).required(),
  icon: string().oneOf(groupIcons).required(),
});
export const interactionSchema = object({
  id: id(),
  contactId: id(),
  type: string().oneOf(interactionTypes).required(),
  summary: text("Summary", 1000),
  occurredAt: timestamp(),
});
export const followUpSchema = object({
  id: id(),
  contactId: id(),
  title: text("Title", 200),
  dueDate: calendarDate("Due date").required("Choose a due date"),
  done: boolean().required(),
  priority: string().oneOf(priorities).required(),
});
export const profileSchema = object({
  id: id(),
  name: text("Name", 100),
  email: string().email().required().max(200),
  role: text("Role", 100),
});
export const preferencesSchema = object({
  appearance: string().oneOf(["system", "light", "dark"]).required(),
  notify: boolean().required(),
  defaultView: string().oneOf(["table", "grid"]).required(),
  nameOrder: string().oneOf(["first-last", "last-first"]).required(),
  pageSize: number().oneOf([10, 20, 50]).required(),
});
export const settingsSchema = object({
  profile: profileSchema.required(),
  preferences: preferencesSchema.required(),
});
export const contextSchema = object({
  groupIds: array().of(id()).required().max(100),
  contactIds: array().of(id()).required().max(2000),
});
export const bulkSchema = object({
  action: string().oneOf(bulkActions).required(),
  ids: array().of(id()).required().min(1, "Select at least one contact").max(2000),
  value: string().defined().max(100),
  context: contextSchema.required(),
});
export const importSchema = object({
  csv: string().required("Choose a CSV file or paste some rows").max(500000),
  context: object({
    groups: array()
      .of(object({ id: id(), name: text("Group name", 60) }))
      .required()
      .max(100),
    emails: array().of(string().required().max(200)).required().max(5000),
  }).required(),
});
export const mergeSchema = object({
  primary: contactSchema.required(),
  secondary: contactSchema.required(),
});
export const deleteSchema = object({
  kind: string().oneOf(deletableKinds).required(),
  id: id(),
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
    token: string().oneOf(["verdant-demo-reset"]).required(),
    password: string().required().min(8).max(128),
  }),
};
const hrefSchema = () =>
  string()
    .matches(/^\/(?!\/)/)
    .required();
export const demoStateSchema = object({
  version: number().oneOf([1]).required(),
  profile: profileSchema.required(),
  preferences: preferencesSchema.required(),
  signedIn: boolean().required(),
  contacts: array().of(contactSchema).required(),
  groups: array().of(groupSchema).required(),
  interactions: array().of(interactionSchema).required(),
  followUps: array().of(followUpSchema).required(),
  activity: array()
    .of(
      object({
        id: id(),
        title: text("Activity", 500),
        href: hrefSchema(),
        contactId: string().defined(),
        createdAt: timestamp(),
      })
    )
    .required(),
  notifications: array()
    .of(
      object({
        id: id(),
        title: text("Notification", 500),
        href: hrefSchema(),
        read: boolean().required(),
      })
    )
    .required(),
});
