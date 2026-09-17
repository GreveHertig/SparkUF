/** Typad form för översättningarna. sv.ts och en.ts måste båda uppfylla den
 * här — saknas en nyckel i endera filen larmar TypeScript. */
export type Dictionary = {
  common: {
    languageSwitch: {
      sv: string;
      en: string;
      label: string;
    };
    conceptBadge: string;
    demoDataBadge: string;
    sourceTag: {
      openDetails: string;
      quoteLabel: string;
      linkLabel: string;
    };
    pulseWhyItMattersPrefix: string;
    doneItemsLabel: string;
    /** Uppdrag 2.2: simuleringar ska alltid bära den här etiketten, oavsett källa. */
    simulationLabel: string;
    upToPointsBefore: string;
    upToPointsAfter: string;
  };
  score: {
    levels: {
      unproven: { name: string; message: string };
      underbuiltUnproven: { name: string; message: string };
      demandConfirmed: { name: string; message: string };
      builtAndLaunched: { name: string; message: string };
      provenBusiness: { name: string; message: string };
    };
    /** De åtta delarna (avsnitt 7.2) — en enda källa för namnen, återanvänds
     * av alla scenarier (adapters/demo/testScenario.ts idag, Sara/Jonas i
     * Session 3/4) i stället för att varje scenario hårdkodar egna strängar. */
    parts: {
      market: string;
      competition: string;
      fit: string;
      problem: string;
      willingnessToPay: string;
      product: string;
      traction: string;
      feasibility: string;
    };
  };
  lockedState: {
    /** Etikett på själva låset, t.ex. i en pill ovanpå kortet. Villkoret för
     * upplåsning ("Låses upp efter steg 10") är alltid produktspecifikt och
     * skrivs av anroparen — se demoContent.locked för ett exempel. */
    title: string;
  };
  designsystem: {
    title: string;
    intro: string;
    sections: {
      colors: string;
      typography: string;
      spacing: string;
      motion: string;
      components: string;
    };
    typographySample: {
      headingBefore: string;
      headingEmphasisOne: string;
      headingMiddle: string;
      headingEmphasisTwo: string;
      headingAfter: string;
      body: string;
    };
    components: {
      eyebrow: string;
      editorialHeading: string;
      sourceTag: string;
      dataFact: string;
      conceptBadge: string;
      demoDataBadge: string;
      scoreBadge: string;
      lockedState: string;
      nextStepCard: string;
      pulseCard: string;
      verdictCard: string;
    };
  };
  appShell: {
    nav: {
      home: string;
      cofounder: string;
      journey: string;
      score: string;
      market: string;
      customers: string;
      pulse: string;
      memory: string;
      legal: string;
      build: string;
    };
    profileMenuLabel: string;
  };
  homePage: {
    sinceLastTimeTitle: string;
    emailSentLabel: string;
    openRateLabel: string;
    reminderSentLabel: string;
    responsesReceivedLabel: string;
    todaysPulseTitle: string;
    scoreMovementTitle: string;
    breakdownTitle: string;
    unlocksAfterStepBefore: string;
    recipientsUnit: string;
    responsesUnit: string;
    todayLabel: string;
    heroHeadingBefore: string;
    heroHeadingEmphasis: string;
    heroHeadingAfter: string;
  };
  comingSoon: {
    eyebrow: string;
    title: string;
    body: string;
  };
  demoContent: {
    nextStep: {
      eyebrow: string;
      title: string;
      why: string;
      maxPoints: number;
      estimatedTime: string;
      doneItems: string[];
      action: string;
    };
    pulse: {
      category: string;
      headline: string;
      whyItMatters: string;
      timestamp: string;
    };
    verdict: {
      headline: string;
      reasoning: string;
    };
    locked: {
      title: string;
      unlocksAfter: string;
    };
    marketFact: {
      label: string;
      unit: string;
    };
  };
  /** Demoraden (avsnitt 9.1) — fast rad nederst i /demo/app. */
  demoBar: {
    personaLabel: string;
    stepLabel: string;
    stepOf: string;
    phaseLabel: string;
    phases: {
      discover: string;
      tryBeforeCalls: string;
      tryAfterCalls: string;
      launch: string;
      grow: string;
    };
    momentLabel: string;
    back: string;
    next: string;
    jumpToStep: string;
    tourOn: string;
    tourOff: string;
    entryNoIdea: string;
    entryHasIdea: string;
    switchEntry: string;
    reset: string;
    resetConfirm: string;
    collapse: string;
    expand: string;
  };
};
