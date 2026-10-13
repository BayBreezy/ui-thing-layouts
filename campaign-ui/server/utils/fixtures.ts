import { Faker, en } from "@faker-js/faker";

import type { Campaign, DemoState, Member, Performance } from "../../shared/types";
import { channels, stages, referenceDate } from "../../shared/types";

export function createDemoState(): DemoState {
  const faker = new Faker({ locale: en });
  faker.seed(42);
  faker.setDefaultRefDate(referenceDate + "T12:00:00Z");
  const members: Member[] = [
    {
      id: "member-1",
      name: "Alex Morgan",
      email: "alex@example.com",
      role: "Campaign strategist",
      initials: "AM",
      color: "violet",
    },
    {
      id: "member-2",
      name: "Sam Rivera",
      email: "sam@example.com",
      role: "Creative director",
      initials: "SR",
      color: "amber",
    },
    {
      id: "member-3",
      name: "Jordan Lee",
      email: "jordan@example.com",
      role: "Growth marketer",
      initials: "JL",
      color: "teal",
    },
    {
      id: "member-4",
      name: "Casey Brooks",
      email: "casey@example.com",
      role: "Content designer",
      initials: "CB",
      color: "rose",
    },
    {
      id: "member-5",
      name: "Riley Chen",
      email: "riley@example.com",
      role: "Account manager",
      initials: "RC",
      color: "violet",
    },
    {
      id: "member-6",
      name: "Taylor Reed",
      email: "taylor@example.com",
      role: "Marketing analyst",
      initials: "TR",
      color: "teal",
    },
  ];
  const names = [
    "Make room for better work",
    "The autumn essentials",
    "A little thank you goes a long way",
    "Built for your next big idea",
    "Meet your new daily ritual",
    "Less busywork. More possibility.",
    "From first click to favorite",
    "A launch worth talking about",
    "The creative reset",
    "Small teams, big momentum",
    "Your next chapter starts here",
    "Bring your community closer",
    "The summer edit",
    "A warm welcome back",
    "Ideas that move you",
    "The weekend workshop",
    "Make every moment count",
    "A fresh perspective",
  ];
  const campaigns: Campaign[] = names.map((name, i) => ({
    id: "campaign-" + (i + 1),
    name,
    objective: ["Grow qualified leads", "Build brand awareness", "Increase repeat purchases"][
      i % 3
    ]!,
    description:
      "A thoughtful " +
      channels[i % 4]!.toLowerCase() +
      " campaign for people ready to discover a better way. Lead with a clear benefit, give the audience something useful, and measure what matters.",
    channel: channels[i % 4]!,
    ownerId: members[i % 6]!.id,
    memberIds: [members[i % 6]!.id, members[(i + 1) % 6]!.id],
    budget: faker.number.int({ min: 25, max: 160 }) * 100,
    startDate: "2026-09-01",
    endDate: "2026-10-31",
    status: i < 4 ? "Draft" : i < 12 ? "In progress" : "Completed",
    archived: i >= 16,
    checklist: [
      "Define the audience",
      "Approve the creative",
      "Review tracking",
      "Share the results",
    ].map((title, j) => ({ id: "task-" + j, title, done: i >= 12 || (i >= 4 && j < 2 + (i % 2)) })),
    createdAt: "2026-08-20T12:00:00Z",
    updatedAt: "2026-10-" + String(12 - (i % 10)).padStart(2, "0") + "T12:00:00Z",
  }));
  const performance: Performance[] = [];
  for (const campaign of campaigns.filter((item) => item.status !== "Draft")) {
    for (let day = 0; day < 60; day++) {
      const date = new Date(referenceDate + "T12:00:00Z");
      date.setUTCDate(date.getUTCDate() - day);
      const spend = faker.number.int({ min: 12, max: 55 });
      performance.push({
        campaignId: campaign.id,
        date: date.toISOString().slice(0, 10),
        revenue: spend * faker.number.int({ min: 2, max: 5 }),
        spend,
        impressions: faker.number.int({ min: 800, max: 4500 }),
        clicks: faker.number.int({ min: 30, max: 150 }),
        orders: faker.number.int({ min: 1, max: 8 }),
      });
    }
  }
  const leads = Array.from({ length: 64 }, (_, i) => ({
    id: "lead-" + (i + 1),
    name: faker.person.fullName(),
    email: "contact" + (i + 1) + "@example.com",
    company: faker.company.name(),
    value: faker.number.int({ min: 2, max: 40 }) * 100,
    stage: stages[i % 5]!,
    ownerId: members[i % 6]!.id,
    campaignId: campaigns[i % 18]!.id,
    notes:
      "Interested in the upcoming launch. Follow up with a short overview and a helpful next step.",
    updatedAt: "2026-10-10T12:00:00Z",
  }));
  const documents = [
    "Autumn campaign brief",
    "Audience research notes",
    "Creative direction",
    "Launch checklist",
    "Welcome sequence",
    "Community playbook",
    "Results and learnings",
    "Brand voice guide",
  ].map((title, i) => ({
    id: "document-" + (i + 1),
    title,
    campaignId: campaigns[i]!.id,
    favorite: i < 3,
    updatedAt: "2026-10-10T12:00:00Z",
    content:
      "# " +
      title +
      "\n\n## The opportunity\n\nHelp small teams find more room for meaningful work.\n\n## Our audience\n\nCurious makers and growing teams who value a clear, thoughtful experience.\n\n## What we will say\n\n- Start with one useful benefit.\n- Make the next step easy.\n- Keep the promise specific.\n\n## Success looks like\n\nA stronger qualified pipeline and a campaign the team is proud to share.",
  }));
  const threads = Array.from({ length: 4 }, (_, i) => ({
    id: "thread-" + (i + 1),
    title: ["Creative review", "Launch coordination", "Growth experiments", "Weekly check-in"][i]!,
    campaignId: campaigns[i + 4]!.id,
    unread: i < 2,
    messages: [
      {
        id: "message-" + i + "-1",
        memberId: "member-2",
        content:
          "The first creative direction is ready. Could we get a quick review before the team check-in?",
        createdAt: "2026-10-12T09:00:00Z",
        simulated: true,
      },
      {
        id: "message-" + i + "-2",
        memberId: "member-3",
        content:
          "Looks promising. Let's keep the main benefit above the fold and make the next step clearer.",
        createdAt: "2026-10-12T09:10:00Z",
        simulated: true,
      },
    ],
  }));
  return {
    version: 1,
    profile: {
      id: "member-1",
      name: "Alex Morgan",
      email: "alex@example.com",
      role: "Campaign strategist",
    },
    preferences: { appearance: "system", notify: true },
    signedIn: false,
    members,
    campaigns,
    performance,
    leads,
    documents,
    threads,
    tickets: [
      {
        id: "ticket-1",
        subject: "How do I review campaign results?",
        category: "Campaigns",
        description: "I'd like to understand the reporting period.",
        status: "Resolved",
        response:
          "Open a campaign and choose Results. The demo uses a fixed reporting period, and the table contains the same samples as the chart.",
        createdAt: "2026-10-09T12:00:00Z",
      },
    ],
    activity: campaigns.slice(0, 8).map((item, i) => ({
      id: "activity-" + i,
      title: item.name + " was updated",
      href: "/campaigns/" + item.id,
      campaignId: item.id,
      createdAt: item.updatedAt,
    })),
    notifications: [
      {
        id: "notification-1",
        title: "Sam shared a creative review",
        href: "/chat/thread-1",
        read: false,
      },
      {
        id: "notification-2",
        title: "Your campaign results are ready",
        href: "/campaigns/campaign-5",
        read: false,
      },
    ],
  };
}
