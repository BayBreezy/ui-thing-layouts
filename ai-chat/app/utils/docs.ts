export const docs = [
  {
    slug: "getting-started",
    title: "Welcome to Orbit",
    description: "Take a two-minute tour of your workspace.",
    icon: "lucide:orbit",
    category: "Start here",
    body: `## A little space for your next big idea
Orbit is a working portfolio demo. Start exploring immediately: the workspace is already populated with conversations, assistants, and sample activity.

1. Start a chat with one of the suggested prompts.
2. Try an assistant to give the reply a different perspective.
3. Explore audio or a real-time session.
4. Open history to rename, favorite, export, or revisit your work.

## Your workspace, your browser
Text data is saved locally. Files and recordings stay in IndexedDB on your device. Switching workspaces changes the conversations, assistants, media, and activity you see.

Signing in is optional. Simulated authentication updates your demo identity and never creates a real account. Use fictional details and a fictional password.

## Start fresh
Settings lets you export your demo data or restore the original examples. Export text before resetting if you want to keep it.`,
  },
  {
    slug: "chat",
    title: "Better conversations",
    description: "Models, preferences, attachments, and your history.",
    icon: "lucide:message-circle",
    category: "Guides",
    body: `## Give your idea a starting point
Write a prompt or choose a suggested one. Press Enter to send and Shift + Enter for a new line. Orbit reveals a scripted response progressively. Stop interrupts the reveal; retry requests a new response to your last prompt.

## Choose a perspective
Orbit Pro, Orbit Fast, and Orbit Code are fictional models. Model choice influences the response and simulated usage. Response style changes the level of detail; JSON produces a structured response. Creativity changes the closing suggestion and the output limit caps the reply.

## Keep context nearby
Attach up to three PNG, JPEG, PDF, or text files, each under 10 MB. Files stay on your device. The demo does not analyze their contents. You can preview images and download local files.

## Make it useful later
Copy a conversation, export Markdown or JSON, and leave feedback on replies. History supports search, favorites, rename, and confirmed deletion.`,
  },
  {
    slug: "assistants",
    title: "A specialist for every idea",
    description: "Build, edit, and launch your own assistants.",
    icon: "lucide:bot",
    category: "Guides",
    body: `## Give an assistant a purpose
Choose a name, description, instructions, specialties, fictional model, and response style. Instructions influence the scripted response category: design, code, research, writing, or analytics.

## Try a conversation
Start a conversation from an assistant card. Its model and style become the chat defaults. You can adjust these before sending.

## Make room for experimentation
Duplicate an assistant before trying a different instruction. Assistants belong to the active workspace and remain available after refresh. Deleting one keeps its existing conversations.`,
  },
  {
    slug: "audio",
    title: "From sound to story",
    description: "Recording, playback, and simulated transcripts.",
    icon: "lucide:mic",
    category: "Guides",
    body: `## Record locally
Microphone permission is requested only when you choose Record audio or Use microphone. Recording stops after 60 seconds. Orbit detects supported recording formats and releases microphone tracks when you stop or leave the page.

If permission is denied or recording is unsupported, use the bundled sample in Audio studio. You can play recordings, seek through the transcript, and copy or download the text.

## Understand the simulation
Transcription returns a scripted discovery conversation. Recorded speech is not recognized. Only metadata is sent to the API; audio blobs stay on your device.

Real-time microphone input triggers a scripted onboarding prompt. Typed input selects the same reply variants as chat. Optional browser speech reads the response aloud where your browser supports it. Ending a session saves a local summary.`,
  },
  {
    slug: "api",
    title: "Demo API reference",
    description: "Stateless, typed Nitro routes with validated inputs.",
    icon: "lucide:braces",
    category: "Engineering",
    body: `## Stateless by design
All routes live under /api/demo. The server generates and validates records; visitor edits live in the browser. No function memory acts as a database. Invalid bodies return HTTP 400 and an errors array. Unknown auth actions return 404.

## Bootstrap
GET /api/demo/bootstrap returns version 1 state: profile, workspaces, preferences, assistants, conversations, usage, recordings, and sessions. Faker uses seed 42 and a fixed reference date.

## Chat and real-time
POST /api/demo/chat and POST /api/demo/realtime/turn accept prompt, workspaceId, preferences, optional assistant, and turn. They return message and usage. The client progressively reveals chat text; this is a simulated stream.

POST /api/demo/realtime/session accepts workspaceId and name and returns an empty session with a unique ID.

## Editors
POST /api/demo/assistants/save accepts an assistant record and returns the validated record. POST /api/demo/settings/save accepts profile and preferences. Both use shared Yup schemas.

## Audio
POST /api/demo/audio/transcribe accepts name, duration, mimeType, and workspaceId. It returns segments and simulated: true. It never accepts audio bytes.

## Account flows
POST /api/demo/auth/login accepts email and password. Signup also accepts name. Both return a presentation-only profile. Forgot-password accepts email and returns a clearly labeled demo reset link. Reset-password accepts token and password. Logout returns success. No passwords are stored or emailed.

## Example
\`\`\`json
{ "prompt": "Help me design onboarding", "workspaceId": "studio", "turn": 0, "preferences": { "modelId": "orbit-pro", "writingStyle": "concise", "format": "markdown", "temperature": 0.7, "maxTokens": 2048, "topP": 0.9 } }
\`\`\``,
  },
  {
    slug: "architecture",
    title: "Under the surface",
    description: "SSR, local state, validation, and deployment.",
    icon: "lucide:layers",
    category: "Engineering",
    body: `## Nuxt from end to end
Nuxt 4 renders the seeded workspace on the server through useAsyncData. A client plugin restores a validated, versioned localStorage snapshot after hydration. Routes that depend on browser-only records show a loading state until restoration finishes.

## Two kinds of storage
Text records live in localStorage. Blob data lives in IndexedDB through idb. When storage is unavailable, the active session continues in memory with visible save feedback. Workspace IDs isolate local edits.

## Predictable demo data
Faker is imported only in server utilities. Metadata is reproducible; replies and transcripts are written by hand. Shared TypeScript models and Yup schemas define API boundaries.

## Interaction and accessibility
UI Thing components use Reka UI primitives. The shell offers keyboard navigation, a command palette, visible focus, responsive drawers, light and dark themes, and reduced-motion support. Charts load on demand and include a text table.

## Delivery
Bun manages dependencies and scripts. Node runs Nuxt builds and the server. Oxfmt formats Vue and TypeScript; Oxlint checks scripts, and Nuxt typecheck checks types. Vitest and Playwright cover validation, APIs, persistence, media cleanup, and key browser flows. Netlify uses Nitro server functions so demo APIs remain available.`,
  },
  {
    slug: "changelog",
    title: "What’s new in Orbit",
    description: "A static layout becomes a working workspace.",
    icon: "lucide:git-pull-request",
    category: "Updates",
    body: `## 1.0 · October 2026
- A new Orbit identity with indigo accents, local Inter typography, and light/dark themes.
- Working chat, history, assistants, audio, real-time, metrics, documentation, and settings.
- Optional simulated login, signup, and password recovery.
- Browser-local persistence and stateless, validated Nitro demo APIs.
- Current UI Thing components, Reka UI, and Tailwind 4.
- Nuxt 4, Bun, Oxfmt, Oxlint, tests, and an app-specific CI workflow.

## Attribution
Designed and developed by Behon Baker. Components built with UI Thing and Reka UI. Icons by Lucide. Demo metadata generated by Faker. Orbit’s model names, people, activity, and costs are fictional.`,
  },
];
export const resources = [
  {
    title: "UI Thing",
    description:
      "The component foundation behind Orbit. Explore accessible Nuxt components and examples.",
    href: "https://uithing.com",
    icon: "lucide:blocks",
  },
  {
    title: "Nuxt",
    description: "The full-stack Vue framework powering pages, rendering, and demo APIs.",
    href: "https://nuxt.com",
    icon: "lucide:triangle",
  },
  {
    title: "The project",
    description: "Explore the source, architectural decisions, and other layouts by Behon Baker.",
    href: "https://github.com/BayBreezy/ui-thing-layouts",
    icon: "lucide:github",
  },
  {
    title: "Behon Baker",
    description: "Meet the developer and discover more thoughtful interface work.",
    href: "https://behonbaker.com",
    icon: "lucide:arrow-up-right",
  },
];
