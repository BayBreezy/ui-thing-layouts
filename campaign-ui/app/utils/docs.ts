export const guides = [
  {
    slug: "onboarding",
    title: "Your first five minutes",
    description: "A quick tour of your marketing workspace.",
    content:
      "# Welcome to Launchpad\n\nA little space for thoughtful campaigns and good collaboration.\n\n## Start with an idea\n\nOpen Campaigns and choose New campaign. Add an objective, an owner, a budget, and a few dates. Your new idea starts as a draft with zero performance results.\n\n## Bring the team along\n\nAssign teammates and work through the checklist. Open a team conversation to share an update. Replies are simulated; messages stay in your browser.\n\n## Keep the details close\n\nAdd a lead and link it to your campaign. Create a document for your brief, then preview and export it.\n\n## Review and reflect\n\nExplore Results, change the reporting period, and open the data table. Archive a campaign when you want it out of the active workspace. Restore it from Archive later.\n\n## Make it yours\n\nSettings lets you edit your profile, choose a theme, export your snapshot, or reset the demo. Try Command or Control + K to search.",
  },
  {
    slug: "guidelines",
    title: "Campaign guidelines",
    description: "A little clarity before your next launch.",
    content:
      "# Campaign guidelines\n\n## Start with one clear goal\n\nChoose an audience and an outcome you can describe in a sentence. Give the campaign an owner and a realistic budget.\n\n## Build a useful brief\n\n- Describe the audience and their need.\n- Lead with one specific benefit.\n- Give the creative team a clear direction.\n- Make the next step easy to understand.\n\n## Review together\n\nUse the campaign checklist to review the audience, creative, tracking, and results. Checklist progress and campaign status are separate.\n\n## Measure thoughtfully\n\nRevenue and spend come from the same performance samples across the workspace. Changing metadata or checking a task does not manufacture results.",
  },
  {
    slug: "rules",
    title: "How this demo works",
    description: "What is simulated, and where your data lives.",
    content:
      "# How this demo works\n\n## Your browser is your workspace\n\nEdits are saved in versioned localStorage. Another browser or device gets a fresh workspace. Reset clears your current workspace, and exporting a snapshot gives you a portable JSON record.\n\n## Fictional by design\n\nAll campaigns, leads, teammates, messages, and metrics are illustrative. No advertisements run, emails are sent, or external accounts are connected.\n\n## Local accounts\n\nAccount pages validate fictional credentials. Passwords are never saved or returned. Recovery provides a labeled demo reset link.\n\n## Storage failures\n\nIf browser storage is unavailable, your session remains usable in memory. A save warning explains that your edits will not survive a refresh.\n\n## Documents\n\nThe editor supports headings, lists, paragraphs, and fenced code blocks. HTML is displayed as text; documents cannot execute scripts or components.",
  },
  {
    slug: "architecture",
    title: "Architecture & data flow",
    description: "Nuxt, validated APIs, and a visitor-owned snapshot.",
    content:
      "# Architecture & data flow\n\n## Layers\n\n- Nuxt pages and layouts provide real routes and the workspace shell.\n- Shared TypeScript records and Yup schemas connect the client and server.\n- Nitro handlers generate fixtures and validate proposed changes.\n- The useDemo composable owns reactive visitor state and derived views.\n- A client plugin restores and persists the validated browser snapshot.\n\n## First render\n\nThe bootstrap endpoint supplies a deterministic seed through useAsyncData. After hydration, the client restores its snapshot. Browser-created record routes wait for restoration before deciding that a record is missing.\n\n## Mutations\n\nEach editor sends a proposed record with reference context. The server validates and returns the canonical result. Only a successful response changes local state. The composable updates activity and notifications alongside the record.\n\n## Reset\n\nReset aborts pending mutations and increments a revision. Results from an earlier revision cannot change the fresh workspace.\n\n## Reporting\n\nPerformance samples are linked to campaigns. Shared aggregation functions power charts, tables, and exports. Archived campaigns retain their historical samples.",
  },
  {
    slug: "api",
    title: "Demo API reference",
    description: "Try the fictional data and validation endpoints.",
    content:
      "# Demo API reference\n\n## GET /api/demo/bootstrap\n\nReturns the full reproducible workspace, including campaigns, leads, members, documents, threads, support tickets, performance samples, activity, and notifications. No authentication is required.\n\n## POST /api/demo/campaigns/save\n\nAccepts a record plus context with memberIds and campaignIds. Returns the validated campaign. The same pattern is used by leads/save, documents/save, tickets/save, and settings/save.\n\n## POST /api/demo/chat/message\n\nAccepts threadId, memberId, replyMemberId, content, and reference context. Returns the sent message and a scripted teammate reply.\n\n## POST /api/demo/auth/:action\n\nSupports login, signup, forgot-password, and reset-password. Returns a fictional profile or demo recovery result. Passwords are never returned.\n\n## Errors and ownership\n\nInvalid requests return HTTP 400 with readable validation errors. Unknown account actions return 404. Handlers do not retain visitor edits; a later bootstrap always returns the seed. Reference context supports browser-created records without shared server memory.",
  },
];
export const faqs = [
  {
    question: "Will this launch a real campaign?",
    answer:
      "No. Launchpad is an interactive demo with fictional campaigns and results. No advertising service is connected.",
  },
  {
    question: "Where do my edits go?",
    answer:
      "They stay in this browser's localStorage. Another browser starts with a fresh seed. Export or reset your snapshot in Settings.",
  },
  {
    question: "Why do results use a fixed period?",
    answer:
      "A fixed demo period keeps the seed reproducible and prevents an empty dashboard as time passes. New campaigns start with zero results.",
  },
  {
    question: "Does archiving remove results?",
    answer:
      "No. Archive hides a campaign from the active board and retains its historical results, linked leads, and documents.",
  },
  {
    question: "Can I contact a teammate or support?",
    answer:
      "Messages and tickets are simulations. They are saved locally and return scripted responses. Nothing is sent to a real person.",
  },
];
