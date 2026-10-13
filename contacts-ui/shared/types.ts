/** The fixed "today" of the demo. Seed dates are generated relative to it, so the data always looks fresh. */
export const referenceDate = "2026-10-12";

export const relationships = ["close", "friend", "colleague", "acquaintance"] as const;
export const sources = ["manual", "import", "referral", "event"] as const;
export const interactionTypes = ["call", "email", "meeting", "message", "note"] as const;
export const priorities = ["low", "medium", "high"] as const;
export const groupColors = ["emerald", "teal", "sky", "amber", "rose", "violet", "slate"] as const;
export const groupIcons = [
  "users",
  "heart",
  "briefcase",
  "building-2",
  "star",
  "handshake",
  "graduation-cap",
  "home",
] as const;
export const fieldLabels = ["work", "home", "mobile", "other"] as const;
export const bulkActions = [
  "favorite",
  "unfavorite",
  "archive",
  "restore",
  "delete",
  "add-group",
  "remove-group",
  "add-label",
  "remove-label",
] as const;
export const deletableKinds = ["interaction", "follow-up", "group"] as const;

export type Relationship = (typeof relationships)[number];
export type Source = (typeof sources)[number];
export type InteractionType = (typeof interactionTypes)[number];
export type Priority = (typeof priorities)[number];
export type GroupColor = (typeof groupColors)[number];
export type GroupIcon = (typeof groupIcons)[number];
export type BulkAction = (typeof bulkActions)[number];
export type DeletableKind = (typeof deletableKinds)[number];

export interface LabeledValue {
  label: string;
  value: string;
  primary: boolean;
}
export interface Address {
  label: string;
  street: string;
  city: string;
  region: string;
  postal: string;
  country: string;
}
export interface Socials {
  linkedin: string;
  x: string;
  github: string;
  instagram: string;
}
export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  nickname: string;
  company: string;
  jobTitle: string;
  emails: LabeledValue[];
  phones: LabeledValue[];
  addresses: Address[];
  websites: string[];
  socials: Socials;
  /** `YYYY-MM-DD` or an empty string. */
  birthday: string;
  groupIds: string[];
  labels: string[];
  relationship: Relationship;
  favorite: boolean;
  archived: boolean;
  /** Contact id of whoever introduced this person, or an empty string. */
  referredById: string;
  avatarHue: number;
  notes: string;
  source: Source;
  /** ISO timestamp of the latest logged interaction, or an empty string. */
  lastContactedAt: string;
  createdAt: string;
  updatedAt: string;
}
export interface Group {
  id: string;
  name: string;
  description: string;
  color: GroupColor;
  icon: GroupIcon;
}
export interface Interaction {
  id: string;
  contactId: string;
  type: InteractionType;
  summary: string;
  occurredAt: string;
}
export interface FollowUp {
  id: string;
  contactId: string;
  title: string;
  /** `YYYY-MM-DD` */
  dueDate: string;
  done: boolean;
  priority: Priority;
}
export interface Activity {
  id: string;
  title: string;
  href: string;
  contactId: string;
  createdAt: string;
}
export interface Notification {
  id: string;
  title: string;
  href: string;
  read: boolean;
}
export interface Profile {
  id: string;
  name: string;
  email: string;
  role: string;
}
export interface Preferences {
  appearance: "system" | "light" | "dark";
  notify: boolean;
  defaultView: "table" | "grid";
  nameOrder: "first-last" | "last-first";
  pageSize: 10 | 20 | 50;
}
export interface SettingsRecord {
  profile: Profile;
  preferences: Preferences;
}
export interface DemoState {
  version: 1;
  profile: Profile;
  preferences: Preferences;
  signedIn: boolean;
  contacts: Contact[];
  groups: Group[];
  interactions: Interaction[];
  followUps: FollowUp[];
  activity: Activity[];
  notifications: Notification[];
}
export interface ReferenceContext {
  groupIds: string[];
  contactIds: string[];
}
export interface SaveRequest<T> {
  record: T;
  context: ReferenceContext;
}
export interface BulkRequest {
  action: BulkAction;
  ids: string[];
  /** Group id or label, for the actions that need one. */
  value: string;
  context: ReferenceContext;
}
export interface ImportRow {
  line: number;
  contact: Contact;
  /** Id of an existing contact with the same email, when there is one. */
  duplicateOf: string;
}
export interface ImportError {
  line: number;
  message: string;
}
export interface ImportResult {
  rows: ImportRow[];
  errors: ImportError[];
  total: number;
}
export interface MergeResult {
  merged: Contact;
  removedId: string;
}
