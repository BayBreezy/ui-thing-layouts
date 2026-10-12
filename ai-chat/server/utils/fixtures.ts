import { Faker, en } from "@faker-js/faker";

import { defaultPreferences, demoReferenceDate, models } from "../../shared/types";
import type {
  Assistant,
  ChatResult,
  DemoState,
  Preferences,
  TranscriptSegment,
} from "../../shared/types";

export function createFaker(seed = 42) {
  const faker = new Faker({ locale: en });
  faker.seed(seed);
  faker.setDefaultRefDate(demoReferenceDate);
  return faker;
}
const assistantTemplates = [
  [
    "Design partner",
    "Turn rough ideas into thoughtful product experiences.",
    "Help the user design clear, accessible product experiences. Explain decisions and offer practical next steps.",
    "lucide:lightbulb",
    "Design",
    "Product",
  ],
  [
    "Code companion",
    "A second pair of eyes for your next great build.",
    "Review code for clarity, correctness and accessibility. Provide small, actionable examples in TypeScript.",
    "lucide:code-2",
    "Engineering",
    "Vue",
  ],
  [
    "Research analyst",
    "Find the signal in interviews, notes, and feedback.",
    "Summarize research using themes, evidence, and unanswered questions. Separate observations from assumptions.",
    "lucide:search",
    "Research",
    "Strategy",
  ],
  [
    "Writing editor",
    "Make every word work a little harder.",
    "Improve writing with a warm, direct voice. Prefer active verbs, short sentences, and specific examples.",
    "lucide:pen-line",
    "Writing",
    "Content",
  ],
  [
    "Data storyteller",
    "Turn numbers into an understandable next step.",
    "Explain metrics clearly. Identify meaningful trends and suggest measurable actions without overstating certainty.",
    "lucide:chart-no-axes-combined",
    "Analytics",
    "Insights",
  ],
  [
    "Launch planner",
    "From the first announcement to the final checklist.",
    "Plan focused product launches with clear ownership, audience, milestones, and success measures.",
    "lucide:megaphone",
    "Marketing",
    "Planning",
  ],
];
export const transcript: TranscriptSegment[] = [
  {
    speaker: "Alex",
    start: 0,
    end: 5,
    text: "Let's make the first five minutes feel effortless. What's the one thing a new user needs?",
  },
  {
    speaker: "Sam",
    start: 5,
    end: 11,
    text: "A useful starting point. We could offer three example projects instead of an empty dashboard.",
  },
  {
    speaker: "Alex",
    start: 11,
    end: 17,
    text: "Good. Let's prototype that, test it with five people, and measure how quickly they reach their first result.",
  },
];

export function createDemoState(): DemoState {
  const faker = createFaker();
  const workspaces = [
    { id: "studio", name: "Orbit Studio", description: "A little space for your next big idea" },
    {
      id: "personal",
      name: "Personal space",
      description: "Side projects, fresh starts, and everything in between",
    },
  ];
  const assistants: Assistant[] = assistantTemplates.map((item, i) => ({
    id: `assistant-${i + 1}`,
    workspaceId: i === 5 ? "personal" : "studio",
    name: item[0]!,
    description: item[1]!,
    instructions: item[2]!,
    icon: item[3]!,
    tags: item.slice(4),
    modelId: i === 1 ? "orbit-code" : "orbit-pro",
    writingStyle: "concise",
    createdAt: faker.date.recent({ days: 30 }).toISOString(),
  }));
  const topics = [
    "A better onboarding experience",
    "Review my Vue component",
    "What our customers are telling us",
    "A launch email worth opening",
    "Making sense of retention",
    "Next quarter, thoughtfully",
    "A weekend project",
    "Writing with a clearer voice",
    "An accessible settings page",
    "Interview questions that work",
    "Ideas for a fresh start",
    "Our product principles",
  ];
  const prompts = [
    "Help me design a more welcoming onboarding experience.",
    "What should I look for when reviewing a Vue component?",
    "Summarize the themes from our customer interviews.",
    "Draft a short product launch email.",
    "How should we interpret our retention metrics?",
    "Help me plan a focused product launch.",
  ];
  const conversations = topics
    .map((title, i) => {
      const workspaceId = i === 6 || i === 10 ? "personal" : "studio";
      const specialist = assistants.filter((item) => item.workspaceId === workspaceId)[
        i % assistants.filter((item) => item.workspaceId === workspaceId).length
      ]!;
      const preferences = { ...defaultPreferences, modelId: i === 1 ? "orbit-code" : "orbit-pro" };
      const createdAt = faker.date.recent({ days: 10 }).toISOString();
      return {
        id: `conversation-${i + 1}`,
        workspaceId,
        title,
        assistantId: specialist.id,
        favorite: i === 0 || i === 2,
        createdAt,
        updatedAt: createdAt,
        preferences,
        messages: [
          {
            id: `seed-user-${i}`,
            role: "user" as const,
            content: prompts[i % 6]!,
            createdAt,
            status: "complete" as const,
          },
          {
            ...createReply(prompts[i % 6]!, preferences, workspaceId, specialist, i).message,
            id: `seed-reply-${i}`,
            createdAt,
          },
        ],
      };
    })
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const usage = Array.from({ length: 90 }, (_, i) => {
    const model = models[i % 3]!;
    const tokens = faker.number.int({ min: 350, max: 5200 });
    return {
      id: faker.string.uuid(),
      workspaceId: i % 7 === 0 ? "personal" : "studio",
      modelId: model.id,
      tokens,
      cost: (tokens / 1000) * model.costPerThousand,
      latencyMs: faker.number.int({ min: 250, max: 1800 }),
      createdAt: new Date(
        Date.parse(demoReferenceDate) - Math.floor(i / 3) * 86400000
      ).toISOString(),
      source: i % 8 === 0 ? ("audio" as const) : ("chat" as const),
    };
  });
  return {
    version: 1,
    models: models.map((model) => ({ ...model })),
    profile: {
      id: "demo-user",
      name: "Alex Morgan",
      email: "alex@orbit.example",
      role: "Product designer",
    },
    workspaces,
    activeWorkspaceId: "studio",
    preferences: { ...defaultPreferences },
    assistants,
    conversations,
    usage,
    recordings: [
      {
        id: "sample-discovery",
        workspaceId: "studio",
        name: "The first five minutes",
        duration: 17,
        mimeType: "audio/wav",
        sampleUrl: "/audio/discovery.wav",
        createdAt: demoReferenceDate,
      },
    ],
    sessions: [
      {
        id: "session-seed",
        workspaceId: "studio",
        name: "An idea worth exploring",
        createdAt: demoReferenceDate,
        messages: [],
        summary:
          "Explored a welcoming onboarding flow. Next step: prototype three guided starting points and test with five people.",
      },
    ],
  };
}

export function createReply(
  prompt: string,
  preferences: Preferences,
  workspaceId: string,
  assistant?: Assistant,
  turn = 0
): ChatResult {
  const lower = `${prompt} ${assistant?.instructions ?? ""}`.toLowerCase();
  let title = "A useful place to start";
  let steps = [
    "Name the outcome you want to achieve.",
    "Break the work into one small, testable step.",
    "Review what you learn before choosing the next step.",
  ];
  let code = "";
  if (preferences.modelId === "orbit-code" || /code|vue|typescript|component/.test(lower)) {
    title = "Build a component you can trust";
    steps = [
      "Keep props explicit and state local to the feature.",
      "Handle loading, empty, and error states before adding polish.",
      "Test the user's interaction, including keyboard navigation.",
    ];
    code =
      "\n\n```typescript\nconst status = ref<'idle' | 'loading' | 'error'>('idle')\nconst canSubmit = computed(() => prompt.value.trim().length > 0)\n```";
  } else if (/research|interview|customer|summar/.test(lower)) {
    title = "Three themes worth investigating";
    steps = [
      "People want a useful starting point rather than a blank screen.",
      "Clear progress gives people confidence to keep going.",
      "The next step should be visible exactly when it becomes relevant.",
    ];
  } else if (/email|writing|write|draft|announcement/.test(lower)) {
    title = "Make room for your next great idea";
    steps = [
      "Lead with the change your reader will experience.",
      "Give one concrete example of what they can do.",
      "Close with one clear invitation to try it.",
    ];
  } else if (/metric|data|retention|analytics/.test(lower)) {
    title = "Look for the story behind the number";
    steps = [
      "Compare consistent cohorts over the same period.",
      "Check activation before treating retention as an isolated problem.",
      "Pair the trend with interviews to understand why it changed.",
    ];
  } else if (/design|onboard|product|launch|plan/.test(lower)) {
    title = "Make the first five minutes feel effortless";
    steps = [
      "Start with a useful example, so the first screen gives something back.",
      "Ask only for information that changes the next step.",
      "Give people a small win, then offer a clear path forward.",
    ];
  }
  if (turn > 0)
    steps.push("For your next iteration, pick one change and define how you will know it helped.");
  const detail =
    preferences.writingStyle === "detailed"
      ? "\n\n**Why this works**\nA focused first step makes the experience easier to understand and gives you something concrete to learn from. Try it with a small group before expanding the scope."
      : preferences.writingStyle === "technical"
        ? "\n\n**Acceptance criteria**\n- Keyboard and pointer interactions produce the same outcome.\n- Pending requests have a visible state and can be cancelled.\n- Refreshing the page preserves completed work."
        : "";
  const intro = assistant
    ? `Working with **${assistant.name}**, here's a practical direction.`
    : preferences.modelId === "orbit-fast"
      ? "Here’s a quick direction to get you moving."
      : "Let's turn that into something you can work with.";
  let content = `### ${title}\n\n${intro}\n\n${steps.map((step, i) => `${i + 1}. ${step}`).join("\n")}${code}${detail}\n\n${preferences.temperature > 1 ? "**Another angle:** try a deliberately different version and compare the two." : "**Next step:** make a small prototype and see what you learn."}`;
  if (preferences.format === "json")
    content = `\`\`\`json\n${JSON.stringify({ title, model: preferences.modelId, style: preferences.writingStyle, steps }, null, 2)}\n\`\`\``;
  content = content.slice(0, preferences.maxTokens * 4);
  const tokens = Math.ceil((prompt.length + content.length) / 4);
  const model = models.find((item) => item.id === preferences.modelId)!;
  const createdAt = new Date().toISOString();
  return {
    message: { id: crypto.randomUUID(), role: "assistant", content, createdAt, status: "complete" },
    usage: {
      id: crypto.randomUUID(),
      workspaceId,
      modelId: model.id,
      tokens,
      cost: (tokens / 1000) * model.costPerThousand,
      latencyMs: Math.round(250 + preferences.topP * 300),
      createdAt,
      source: "chat",
    },
  };
}
