export type WritingStyle = "concise" | "detailed" | "technical";
export interface Preferences {
  modelId: string;
  writingStyle: WritingStyle;
  format: "markdown" | "json";
  temperature: number;
  maxTokens: number;
  topP: number;
}
export interface Profile {
  id: string;
  name: string;
  email: string;
  role: string;
}
export interface Workspace {
  id: string;
  name: string;
  description: string;
}
export interface Model {
  id: string;
  name: string;
  description: string;
  icon: string;
  costPerThousand: number;
}
export interface Assistant {
  id: string;
  workspaceId: string;
  name: string;
  description: string;
  instructions: string;
  icon: string;
  tags: string[];
  modelId: string;
  writingStyle: WritingStyle;
  createdAt: string;
}
export interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  blobId?: string;
}
export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  status: "complete" | "stopped";
  feedback?: "up" | "down";
  attachments?: Attachment[];
}
export interface Conversation {
  id: string;
  workspaceId: string;
  title: string;
  assistantId?: string;
  favorite: boolean;
  createdAt: string;
  updatedAt: string;
  preferences: Preferences;
  messages: Message[];
}
export interface UsageEvent {
  id: string;
  workspaceId: string;
  modelId: string;
  tokens: number;
  cost: number;
  latencyMs: number;
  createdAt: string;
  source: "chat" | "audio" | "realtime";
}
export interface TranscriptSegment {
  speaker: string;
  start: number;
  end: number;
  text: string;
}
export interface Recording {
  id: string;
  workspaceId: string;
  name: string;
  duration: number;
  mimeType: string;
  createdAt: string;
  sampleUrl?: string;
  blobId?: string;
  transcript?: TranscriptSegment[];
}
export interface RealtimeSession {
  id: string;
  workspaceId: string;
  name: string;
  createdAt: string;
  messages: Message[];
  summary: string;
}
export interface DemoState {
  version: 1;
  models: Model[];
  profile: Profile;
  workspaces: Workspace[];
  activeWorkspaceId: string;
  preferences: Preferences;
  assistants: Assistant[];
  conversations: Conversation[];
  usage: UsageEvent[];
  recordings: Recording[];
  sessions: RealtimeSession[];
}
export interface ChatResult {
  message: Message;
  usage: UsageEvent;
}

export const models: Model[] = [
  {
    id: "orbit-pro",
    name: "Orbit Pro",
    description: "Thoughtful answers for complex work",
    icon: "lucide:sparkles",
    costPerThousand: 0.008,
  },
  {
    id: "orbit-fast",
    name: "Orbit Fast",
    description: "Quick answers for everyday tasks",
    icon: "lucide:zap",
    costPerThousand: 0.002,
  },
  {
    id: "orbit-code",
    name: "Orbit Code",
    description: "A companion for building things",
    icon: "lucide:code-2",
    costPerThousand: 0.005,
  },
];
export const defaultPreferences: Preferences = {
  modelId: "orbit-pro",
  writingStyle: "concise",
  format: "markdown",
  temperature: 0.7,
  maxTokens: 2048,
  topP: 0.9,
};
export const demoReferenceDate = "2026-10-11T12:00:00.000Z";
