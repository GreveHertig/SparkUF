import type { Dictionary } from "./dictionary";

export const en = {
  common: {
    languageSwitch: {
      sv: "SV",
      en: "EN",
      label: "Switch language",
    },
    conceptBadge: "Concept · partnership in exploration",
    demoDataBadge: "Demo data",
    sourceTag: {
      openDetails: "Show source details",
      quoteLabel: "Quote",
      linkLabel: "Open source",
    },
    pulseWhyItMattersPrefix: "Why it matters:",
    doneItemsLabel: "Already done",
    simulationLabel: "Simulation",
    upToPointsBefore: "Can earn up to",
    upToPointsAfter: "points",
  },
  score: {
    levels: {
      unproven: {
        name: "Unproven",
        message: "You don't know enough yet. Here's your next step.",
      },
      underbuiltUnproven: {
        name: "Underbuilt but unproven",
        message: "The market exists. Now you need to talk to people.",
      },
      demandConfirmed: {
        name: "Demand confirmed",
        message: "You have evidence. Build the smallest thing that tests the rest.",
      },
      builtAndLaunched: {
        name: "Built and launched",
        message: "It exists. Now someone needs to start using it.",
      },
      provenBusiness: {
        name: "Proven business",
        message: "Go.",
      },
    },
  },
  lockedState: {
    title: "Locked",
  },
  designsystem: {
    title: "Design system",
    intro:
      "Tokens and base components for Spark. This page is here so the founders can keep evolving the design.",
    sections: {
      colors: "Colors",
      typography: "Typography",
      spacing: "Spacing and radii",
      motion: "Motion",
      components: "Components",
    },
    typographySample: {
      headingBefore: "A",
      headingEmphasisOne: "journey",
      headingMiddle: ". Twelve",
      headingEmphasisTwo: "steps",
      headingAfter: ".",
      body: "Tabular figures are used for every number, for example SEK 4.2M or 312 companies.",
    },
    components: {
      eyebrow: "Eyebrow",
      editorialHeading: "EditorialHeading",
      sourceTag: "SourceTag",
      dataFact: "DataFact",
      conceptBadge: "ConceptBadge",
      demoDataBadge: "DemoDataBadge",
      scoreBadge: "ScoreBadge",
      lockedState: "LockedState",
      nextStepCard: "NextStepCard",
      pulseCard: "PulseCard",
      verdictCard: "VerdictCard",
    },
  },
  appShell: {
    nav: {
      home: "Home",
      cofounder: "Co-founder",
      journey: "Journey",
      score: "Score",
      market: "Market",
      customers: "Customers",
      pulse: "Pulse",
      memory: "Memory",
      legal: "Legal",
      build: "Build",
    },
    profileMenuLabel: "Profile",
  },
  homePage: {
    sinceLastTimeTitle: "What's happened since last time",
    emailSentLabel: "Outreach sent",
    openRateLabel: "Open rate",
    reminderSentLabel: "Reminder sent",
    responsesReceivedLabel: "Responses received",
    todaysPulseTitle: "Today's signal",
    scoreMovementTitle: "Score movement",
    breakdownTitle: "Score breakdown",
    unlocksAfterStepBefore: "Unlocks after step",
    recipientsUnit: "recipients",
    responsesUnit: "responses",
    todayLabel: "Today",
    heroHeadingBefore: "Your",
    heroHeadingEmphasis: "next",
    heroHeadingAfter: "step.",
  },
  comingSoon: {
    eyebrow: "THE PLATFORM",
    title: "Coming soon",
    body: "This part connects to real data once the live adapter is built. Explore the fictional demo in the meantime.",
  },
  demoContent: {
    nextStep: {
      eyebrow: "STEP 05 · THE CALLS",
      title: "Book three customer calls this week",
      why: "You haven't talked to a single customer yet — your score can't pass 30 until you do.",
      maxPoints: 18,
      estimatedTime: "~15 min",
      doneItems: ["Idea written down", "Target audience defined"],
      action: "Open step 05",
    },
    pulse: {
      category: "Market",
      headline: "18% of accounting firms grew more than 10% last year",
      whyItMatters:
        "Your target segment is growing faster than the industry average — that strengthens the Market part of your score.",
      timestamp: "Updated 06:00",
    },
    verdict: {
      headline: "Refine · narrow the segment",
      reasoning:
        "You haven't confirmed willingness to pay with a single customer. Talk to five more before you build further.",
    },
    locked: {
      title: "Traction",
      unlocksAfter: "Unlocks after step 10",
    },
    marketFact: {
      label: "Swedish accounting firms with 5–20 employees",
      unit: "companies",
    },
  },
} satisfies Dictionary;
