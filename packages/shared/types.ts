export type Brain = "local" | "codex" | "claude" | "openrouter";
export type Model = {
  id: string;
  name: string;
  vision: boolean;
  efforts: string[];
};
export type Settings = {
  name: string;
  brain: Brain;
  model: string;
  effort: string;
  persona: string;
  voice: boolean;
  preset: "knowledge" | "creative" | "work" | "custom";
  onboarded: boolean;
  mediaEnabled: boolean;
  focusEnabled: boolean;
  screenEnabled: boolean;
  claudeEnabled: boolean;
  reflexEnabled: boolean;
  mediaMaxJobs: number;
  releaseChannel: "stable" | "preview";
};
export type Note = {
  id: string;
  title: string;
  content: string;
  kind: "note" | "memory";
  source: string;
  created_at: string;
  updated_at: string;
};
export type Message = {
  id: string;
  conversation_id: string;
  role: "user" | "assistant";
  content: string;
  sources: Pick<Note, "id" | "title" | "content">[];
  created_at: string;
};
export type Run = {
  id: string;
  kind: "chat" | "image" | "video";
  state: string;
  provider: string;
  model: string;
  input: any;
  output: any;
  error: string | null;
  remote_id: string | null;
  created_at: string;
  updated_at: string;
};
export type Connection = {
  id: string;
  name: string;
  state: "connected" | "disconnected" | "missing" | "error" | "pending";
  detail: string;
};
export const defaults: Settings = {
  name: "Jarvis v7",
  brain: "local",
  model: "",
  effort: "medium",
  persona:
    "Responda em português, com clareza e concisão. Humor discreto, nunca forçado.",
  voice: false,
  preset: "knowledge",
  onboarded: false,
  mediaEnabled: false,
  focusEnabled: true,
  screenEnabled: true,
  claudeEnabled: false,
  reflexEnabled: false,
  mediaMaxJobs: 2,
  releaseChannel: "stable",
};
