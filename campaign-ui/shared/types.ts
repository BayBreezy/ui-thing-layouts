export const channels = ["Email", "Social", "Search", "Events"] as const;
export const statuses = ["Draft", "In progress", "Completed"] as const;
export const stages = ["New", "Qualified", "Negotiating", "Won", "Lost"] as const;
export type Channel = (typeof channels)[number];
export type CampaignStatus = (typeof statuses)[number];
export type LeadStage = (typeof stages)[number];
export const referenceDate = "2026-10-12";
export interface Member {
  id: string;
  name: string;
  email: string;
  role: string;
  initials: string;
  color: string;
}
export interface Campaign {
  id: string;
  name: string;
  objective: string;
  description: string;
  channel: Channel;
  ownerId: string;
  memberIds: string[];
  budget: number;
  startDate: string;
  endDate: string;
  status: CampaignStatus;
  archived: boolean;
  checklist: { id: string; title: string; done: boolean }[];
  createdAt: string;
  updatedAt: string;
}
export interface Performance {
  campaignId: string;
  date: string;
  revenue: number;
  spend: number;
  impressions: number;
  clicks: number;
  orders: number;
}
export interface Lead {
  id: string;
  name: string;
  email: string;
  company: string;
  value: number;
  stage: LeadStage;
  ownerId: string;
  campaignId: string;
  notes: string;
  updatedAt: string;
}
export interface Brief {
  id: string;
  title: string;
  content: string;
  campaignId: string;
  favorite: boolean;
  updatedAt: string;
}
export interface Message {
  id: string;
  memberId: string;
  content: string;
  createdAt: string;
  simulated: boolean;
}
export interface Thread {
  id: string;
  title: string;
  campaignId: string;
  unread: boolean;
  messages: Message[];
}
export interface Ticket {
  id: string;
  subject: string;
  category: "Campaigns" | "Account" | "Feedback";
  description: string;
  status: "Open" | "Resolved";
  response: string;
  createdAt: string;
}
export interface Activity {
  id: string;
  title: string;
  href: string;
  campaignId: string;
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
}
export interface DemoState {
  version: 1;
  profile: Profile;
  preferences: Preferences;
  signedIn: boolean;
  members: Member[];
  campaigns: Campaign[];
  performance: Performance[];
  leads: Lead[];
  documents: Brief[];
  threads: Thread[];
  tickets: Ticket[];
  activity: Activity[];
  notifications: Notification[];
}
export type SaveKind = "campaigns" | "leads" | "documents" | "tickets" | "settings";
export interface ReferenceContext {
  memberIds: string[];
  campaignIds: string[];
}
export interface SaveRequest<T> {
  record: T;
  context: ReferenceContext;
}
export interface SettingsRecord {
  profile: Profile;
  preferences: Preferences;
}
