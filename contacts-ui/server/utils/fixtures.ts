import { Faker, en } from "@faker-js/faker";

import { addDays, displayName, hueFor } from "../../shared/contacts";
import type {
  Activity,
  Contact,
  DemoState,
  FollowUp,
  Group,
  Interaction,
  InteractionType,
  Notification,
  Relationship,
} from "../../shared/types";
import { referenceDate } from "../../shared/types";

const groups: Group[] = [
  {
    id: "group-1",
    name: "Family",
    description: "The people who know your coffee order.",
    color: "rose",
    icon: "heart",
  },
  {
    id: "group-2",
    name: "Friends",
    description: "Weekend plans, group chats and long catch-ups.",
    color: "emerald",
    icon: "users",
  },
  {
    id: "group-3",
    name: "Clients",
    description: "Customers and accounts you look after.",
    color: "sky",
    icon: "briefcase",
  },
  {
    id: "group-4",
    name: "Colleagues",
    description: "Current and former teammates.",
    color: "teal",
    icon: "building-2",
  },
  {
    id: "group-5",
    name: "Partners & vendors",
    description: "Suppliers, agencies and collaborators.",
    color: "amber",
    icon: "handshake",
  },
  {
    id: "group-6",
    name: "Community",
    description: "Meetups, clubs and neighbors.",
    color: "violet",
    icon: "star",
  },
  {
    id: "group-7",
    name: "Mentors",
    description: "People who make you better at what you do.",
    color: "slate",
    icon: "graduation-cap",
  },
];

const companies = [
  "Northwind Studio",
  "Harbor & Pine",
  "Lumen Labs",
  "Fernway Foods",
  "Brightside Health",
  "Cobalt Freight",
  "Juniper Works",
  "Atlas Learning",
  "Willow Creek Realty",
  "Pixel Orchard",
  "Meridian Legal",
  "Saffron Kitchen",
  "Tidewater Analytics",
  "Copperleaf Design",
  "Summit Outdoor Co.",
  "Marigold Dental",
  "Ironbridge Capital",
  "Kestrel Aviation",
  "Bluebird Books",
  "Foxglove Events",
];
const titles = [
  "Founder",
  "Product Manager",
  "Software Engineer",
  "Designer",
  "Account Executive",
  "Operations Lead",
  "Marketing Director",
  "Consultant",
  "Researcher",
  "Office Manager",
  "Photographer",
  "Attorney",
  "Nurse Practitioner",
  "Teacher",
  "Chef",
];
const places = [
  { city: "Portland", region: "OR", country: "United States" },
  { city: "Austin", region: "TX", country: "United States" },
  { city: "Chicago", region: "IL", country: "United States" },
  { city: "Brooklyn", region: "NY", country: "United States" },
  { city: "Denver", region: "CO", country: "United States" },
  { city: "Atlanta", region: "GA", country: "United States" },
  { city: "Seattle", region: "WA", country: "United States" },
  { city: "Toronto", region: "ON", country: "Canada" },
  { city: "Vancouver", region: "BC", country: "Canada" },
  { city: "London", region: "", country: "United Kingdom" },
  { city: "Berlin", region: "", country: "Germany" },
  { city: "Lisbon", region: "", country: "Portugal" },
  { city: "Lagos", region: "", country: "Nigeria" },
  { city: "Melbourne", region: "VIC", country: "Australia" },
];
const labelPool = [
  "VIP",
  "Birthday card",
  "Newsletter",
  "Conference",
  "Neighbor",
  "Referral source",
];
const relationshipPool: Relationship[] = ["close", "friend", "colleague", "acquaintance"];
const topics = [
  "the spring product launch",
  "a possible collaboration",
  "their move to a new city",
  "the quarterly review",
  "an introduction to a friend",
  "the upcoming conference",
  "a recommendation letter",
  "weekend plans",
  "renewing the contract",
  "feedback on the proposal",
];
const summaries: Record<InteractionType, (topic: string) => string> = {
  call: (topic) => `Caught up by phone about ${topic}.`,
  email: (topic) => `Sent a follow-up email about ${topic}.`,
  meeting: (topic) => `Met for coffee and talked through ${topic}.`,
  message: (topic) => `Quick chat thread about ${topic}.`,
  note: (topic) => `Jotted down a few thoughts on ${topic}.`,
};
const followUpTitles = [
  "Send a thank-you note",
  "Check in about the proposal",
  "Share the article we discussed",
  "Schedule a catch-up call",
  "Send birthday wishes",
  "Introduce to the design team",
  "Confirm dinner plans",
  "Ask about the new role",
  "Return the borrowed book",
  "Send the signed agreement",
];

const slug = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "");
const stamp = (dateKey: string, hour = 12) =>
  `${dateKey}T${String(hour).padStart(2, "0")}:00:00.000Z`;

/**
 * Builds the full demo workspace. It is deterministic: the same seed and reference date always
 * produce the same records. Faker only ever runs here, on the server, and never ships to the
 * browser.
 */
export function createDemoState(): DemoState {
  const faker = new Faker({ locale: en });
  faker.seed(42);
  faker.setDefaultRefDate(stamp(referenceDate));
  const pick = <T>(items: T[]) => faker.helpers.arrayElement(items);
  const int = (min: number, max: number) => faker.number.int({ min, max });
  let phoneCounter = 0;

  const contacts: Contact[] = [];
  function addContact(overrides: Partial<Contact> & Pick<Contact, "firstName" | "lastName">) {
    const number = contacts.length + 1;
    const company = overrides.company ?? pick(companies);
    const place = pick(places);
    const createdDate = addDays(referenceDate, -int(5, 420));
    const base: Contact = {
      id: `contact-${number}`,
      nickname: "",
      company,
      jobTitle: pick(titles),
      emails: [],
      phones: [],
      addresses: [
        {
          label: "home",
          street: "",
          city: place.city,
          region: place.region,
          postal: "",
          country: place.country,
        },
      ],
      websites: [],
      socials: { linkedin: "", x: "", github: "", instagram: "" },
      birthday: "",
      groupIds: [],
      labels: [],
      relationship: pick(relationshipPool),
      favorite: false,
      archived: false,
      referredById: "",
      avatarHue: 0,
      notes: "",
      source: pick(["manual", "manual", "import", "event", "referral"] as const),
      lastContactedAt: "",
      createdAt: stamp(createdDate, int(8, 18)),
      updatedAt: stamp(createdDate, int(8, 18)),
      ...overrides,
    };
    const handle = `${slug(base.firstName)}.${slug(base.lastName)}`;
    if (!overrides.emails) {
      base.emails = [
        {
          label: base.relationship === "colleague" ? "work" : pick(["work", "home"]),
          value: `${handle}@${slug(base.company) || "mail"}.example`,
          primary: true,
        },
      ];
    }
    if (!overrides.phones && faker.number.float() > 0.2) {
      base.phones = [
        {
          label: "mobile",
          value: `+1 (555) 555-01${String(phoneCounter++ % 100).padStart(2, "0")}`,
          primary: true,
        },
      ];
    }
    base.avatarHue = hueFor(displayName(base));
    contacts.push(base);
    return base;
  }

  for (let index = 0; index < 54; index++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const relationship = pick(relationshipPool);
    const groupFor: Record<Relationship, string[]> = {
      close: ["group-1", "group-2"],
      friend: ["group-2", "group-6"],
      colleague: ["group-4", "group-3", "group-5"],
      acquaintance: ["group-6", "group-5", "group-3"],
    };
    const options = groupFor[relationship];
    const groupIds = faker.helpers.arrayElements(options, int(1, 2));
    if (faker.number.float() > 0.9) groupIds.push("group-7");
    const contact = addContact({
      firstName,
      lastName,
      relationship,
      groupIds: [...new Set(groupIds)],
      labels: faker.helpers.arrayElements(labelPool, faker.number.float() > 0.55 ? int(1, 2) : 0),
      favorite: faker.number.float() > 0.82,
      birthday:
        faker.number.float() > 0.4
          ? `19${int(62, 99)}-${String(int(1, 12)).padStart(2, "0")}-${String(int(1, 28)).padStart(2, "0")}`
          : "",
      notes:
        faker.number.float() > 0.6
          ? `Met through ${pick(["a friend", "work", "a conference", "the neighborhood"])}. ${faker.lorem.sentence()}`
          : "",
      websites: faker.number.float() > 0.75 ? [`https://${slug(lastName)}.example`] : [],
      socials:
        faker.number.float() > 0.6
          ? {
              linkedin: `linkedin.com/in/${slug(firstName)}${slug(lastName)}`,
              x: "",
              github: "",
              instagram: "",
            }
          : { linkedin: "", x: "", github: "", instagram: "" },
    });
    if (index > 3 && faker.number.float() > 0.75) contact.referredById = `contact-${int(1, index)}`;
  }

  // Birthdays inside the next few weeks so the overview always has something to celebrate.
  [4, 11, 19, 27, 38].forEach((position, order) => {
    const date = addDays(referenceDate, 2 + order * 6);
    contacts[position]!.birthday = `${int(1970, 1996)}${date.slice(4)}`;
  });
  // A few records with gaps, so the clean-up page and data-health card have something to show.
  [6, 13, 21, 33].forEach((position) => (contacts[position]!.emails = []));
  [8, 14, 29].forEach((position) => (contacts[position]!.phones = []));
  [17, 24].forEach((position) => (contacts[position]!.company = ""));
  [15].forEach((position) => (contacts[position]!.groupIds = []));
  [9, 30, 41, 47].forEach((position) => (contacts[position]!.archived = true));

  // Planted duplicates: one by email, one by phone, one by identical name.
  const jon = contacts[2]!;
  addContact({
    firstName: "Jonathan",
    lastName: jon.lastName,
    company: jon.company,
    emails: jon.emails.map((item) => ({ ...item })),
    phones: [],
    groupIds: ["group-3"],
    source: "import",
  });
  const sam = contacts[18]!;
  addContact({
    firstName: sam.firstName.slice(0, 3),
    lastName: sam.lastName,
    emails: [
      {
        label: "home",
        value: `${slug(sam.lastName)}.${slug(sam.firstName)}@mail.example`,
        primary: true,
      },
    ],
    phones: sam.phones.length
      ? sam.phones.map((item) => ({ ...item }))
      : [{ label: "mobile", value: "+1 (555) 555-0199", primary: true }],
    source: "import",
  });
  if (!sam.phones.length)
    sam.phones = [{ label: "mobile", value: "+1 (555) 555-0199", primary: true }];
  const twin = contacts[26]!;
  addContact({
    firstName: twin.firstName,
    lastName: twin.lastName,
    emails: [
      {
        label: "work",
        value: `${slug(twin.firstName)}@${slug(twin.company) || "mail"}.example`,
        primary: true,
      },
    ],
    company: twin.company,
    source: "event",
  });

  // Interactions, newest first per contact.
  const interactions: Interaction[] = [];
  const types: InteractionType[] = ["call", "email", "meeting", "message", "note"];
  for (const contact of contacts) {
    const count = contact.archived ? int(0, 2) : int(0, 6);
    const days = faker.helpers.uniqueArray(() => int(1, 240), count).sort((a, b) => a - b);
    for (const offset of days) {
      const type = pick(types);
      interactions.push({
        id: `interaction-${interactions.length + 1}`,
        contactId: contact.id,
        type,
        summary: summaries[type](pick(topics)),
        occurredAt: stamp(addDays(referenceDate, -offset), int(8, 18)),
      });
    }
    contact.lastContactedAt = days.length ? stamp(addDays(referenceDate, -days[0]!), 12) : "";
  }
  // Keep the stored timestamp equal to the most recent interaction exactly.
  for (const contact of contacts) {
    const latest = interactions
      .filter((item) => item.contactId === contact.id)
      .map((item) => item.occurredAt)
      .sort()
      .at(-1);
    contact.lastContactedAt = latest ?? "";
  }

  // Follow-ups: some overdue, a few due today, the rest coming up, plus a handful already done.
  const active = contacts.filter((contact) => !contact.archived);
  const followUps: FollowUp[] = [];
  const plan: { offset: number; done: boolean }[] = [
    ...[-12, -9, -6, -4, -2, -1].map((offset) => ({ offset, done: false })),
    ...[0, 0, 0].map((offset) => ({ offset, done: false })),
    ...[1, 2, 3, 5, 6, 8, 10, 13, 16, 20, 24, 28].map((offset) => ({ offset, done: false })),
    ...[-20, -15, -8, -3].map((offset) => ({ offset, done: true })),
  ];
  plan.forEach((entry, order) => {
    const contact = active[(order * 7) % active.length]!;
    followUps.push({
      id: `follow-up-${order + 1}`,
      contactId: contact.id,
      title: followUpTitles[order % followUpTitles.length]!,
      dueDate: addDays(referenceDate, entry.offset),
      done: entry.done,
      priority: pick(["low", "medium", "medium", "high"] as const),
    });
  });

  const activity: Activity[] = interactions
    .slice()
    .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
    .slice(0, 8)
    .map((item, order) => {
      const contact = contacts.find((entry) => entry.id === item.contactId)!;
      return {
        id: `activity-${order + 1}`,
        title: `${item.type[0]!.toUpperCase()}${item.type.slice(1)} logged with ${displayName(contact)}`,
        href: `/contacts/${contact.id}`,
        contactId: contact.id,
        createdAt: item.occurredAt,
      };
    });
  const notifications: Notification[] = followUps
    .filter((item) => !item.done && item.dueDate <= referenceDate)
    .slice(0, 3)
    .map((item) => {
      const contact = contacts.find((entry) => entry.id === item.contactId)!;
      return {
        id: `notification-${item.id}`,
        title: `${item.title} · ${displayName(contact)}`,
        href: "/follow-ups",
        read: false,
      };
    });

  return {
    version: 1,
    profile: {
      id: "profile-1",
      name: "Alex Morgan",
      email: "alex@example.com",
      role: "Account owner",
    },
    preferences: {
      appearance: "system",
      notify: true,
      defaultView: "table",
      nameOrder: "first-last",
      pageSize: 10,
    },
    signedIn: true,
    contacts,
    groups: structuredClone(groups),
    interactions,
    followUps,
    activity,
    notifications,
  };
}
