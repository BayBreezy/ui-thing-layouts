import { array, boolean, mixed, number, object, string } from "yup";

import { models } from "./types";

const id = () => string().trim().required().max(100);
export const preferencesSchema = object({
  modelId: string()
    .oneOf(models.map((model) => model.id))
    .required(),
  writingStyle: mixed<"concise" | "detailed" | "technical">()
    .oneOf(["concise", "detailed", "technical"])
    .required(),
  format: mixed<"markdown" | "json">().oneOf(["markdown", "json"]).required(),
  temperature: number().min(0).max(2).required(),
  maxTokens: number().integer().min(128).max(8192).required(),
  topP: number().min(0).max(1).required(),
});
export const profileSchema = object({
  id: id(),
  name: string().trim().min(2).max(80).required().label("Name"),
  email: string().trim().email().max(200).required().label("Email"),
  role: string().max(100).required(),
});
export const assistantSchema = object({
  id: id(),
  workspaceId: id(),
  name: string().trim().min(2).max(60).required().label("Name"),
  description: string().trim().min(5).max(240).required().label("Description"),
  instructions: string().trim().min(10).max(4000).required().label("Instructions"),
  icon: string()
    .oneOf([
      "lucide:code-2",
      "lucide:pen-line",
      "lucide:search",
      "lucide:chart-no-axes-combined",
      "lucide:lightbulb",
      "lucide:megaphone",
    ])
    .required(),
  tags: array(string().trim().max(24).required()).max(6).required(),
  modelId: string()
    .oneOf(models.map((model) => model.id))
    .required(),
  writingStyle: mixed<"concise" | "detailed" | "technical">()
    .oneOf(["concise", "detailed", "technical"])
    .required(),
  createdAt: string().required(),
});
export const chatSchema = object({
  prompt: string().trim().min(1).max(10000).required().label("Prompt"),
  workspaceId: id(),
  preferences: preferencesSchema.required(),
  assistant: assistantSchema.optional().default(undefined),
  turn: number().integer().min(0).max(10000).default(0),
});
export const settingsSchema = object({
  profile: profileSchema.required(),
  preferences: preferencesSchema.required(),
});
export const loginSchema = object({
  email: string().trim().email().max(200).required().label("Email"),
  password: string().min(8).max(128).required().label("Password"),
});
export const signupSchema = loginSchema.shape({
  name: string().trim().min(2).max(80).required().label("Name"),
});
export const recoverySchema = object({
  email: string().trim().email().max(200).required().label("Email"),
});
export const resetSchema = object({
  token: string().oneOf(["orbit-demo-reset"], "This demo reset link is invalid.").required(),
  password: string().min(8).max(128).required().label("Password"),
});
export const recordingSchema = object({
  name: string().trim().max(150).required(),
  duration: number().min(0).max(600).required(),
  mimeType: string().max(100).required(),
  workspaceId: id(),
});
export const sessionSchema = object({
  workspaceId: id(),
  name: string().trim().min(2).max(100).default("Discovery session"),
});

const messageSchema = object({
  id: id(),
  role: string().oneOf(["user", "assistant"]).required(),
  content: string().max(100000).defined(),
  createdAt: string().required(),
  status: string().oneOf(["complete", "stopped"]).required(),
  feedback: string().oneOf(["up", "down"]).optional(),
  attachments: array(
    object({
      id: id(),
      name: string().required(),
      type: string().defined(),
      size: number().min(0).required(),
      blobId: string().optional(),
    })
  ).optional(),
});
export const demoStateSchema = object({
  version: number().oneOf([1]).required(),
  models: array(
    object({
      id: id(),
      name: string().required(),
      description: string().required(),
      icon: string().required(),
      costPerThousand: number().min(0).required(),
    })
  )
    .min(1)
    .required(),
  profile: profileSchema.required(),
  activeWorkspaceId: id(),
  workspaces: array(
    object({ id: id(), name: string().required(), description: string().defined() })
  )
    .min(1)
    .required(),
  preferences: preferencesSchema.required(),
  assistants: array(assistantSchema).required(),
  conversations: array(
    object({
      id: id(),
      workspaceId: id(),
      title: string().required(),
      assistantId: string().optional(),
      favorite: boolean().required(),
      createdAt: string().required(),
      updatedAt: string().required(),
      preferences: preferencesSchema.required(),
      messages: array(messageSchema).required(),
    })
  ).required(),
  usage: array(
    object({
      id: id(),
      workspaceId: id(),
      modelId: string().required(),
      tokens: number().min(0).required(),
      cost: number().min(0).required(),
      latencyMs: number().min(0).required(),
      createdAt: string().required(),
      source: string().oneOf(["chat", "audio", "realtime"]).required(),
    })
  ).required(),
  recordings: array(
    object({
      id: id(),
      workspaceId: id(),
      name: string().required(),
      duration: number().min(0).required(),
      mimeType: string().required(),
      createdAt: string().required(),
      sampleUrl: string().optional(),
      blobId: string().optional(),
      transcript: array(
        object({
          speaker: string().required(),
          start: number().required(),
          end: number().required(),
          text: string().required(),
        })
      ).optional(),
    })
  ).required(),
  sessions: array(
    object({
      id: id(),
      workspaceId: id(),
      name: string().required(),
      createdAt: string().required(),
      messages: array(messageSchema).required(),
      summary: string().defined(),
    })
  ).required(),
});
