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
  /** KPI-raden (designuppdatering: high-tech dashboard) — täta nyckeltal högst
   * upp på Hem och Poäng, se screens/AppHome.tsx och screens/Score.tsx. */
  kpi: {
    scoreLabel: string;
    scoreDeltaLabel: string;
    unlockedPartsLabel: string;
    bestSuggestionLabel: string;
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
      /** Session P1: /logga-in, /skapa-konto — se DESIGN.md. */
      textField: string;
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
  journeyPage: {
    title: string;
    subtitle: string;
    status: {
      done: string;
      current: string;
      locked: string;
    };
    phaseNames: {
      discover: string;
      tryPhase: string;
      launch: string;
      grow: string;
    };
    stepLabel: string;
    openStep: string;
    backToJourney: string;
    whatHappened: string;
    whatsNext: string;
  };
  cofounderPage: {
    title: string;
    subtitle: string;
    toolRunningLabel: string;
    toolDoneLabel: string;
    emptyStateBody: string;
    /** Promptrutan (designuppdatering): dämpad platshållartext. Rutan är
     * inert i demot — se components/spark/PromptBox.tsx. */
    promptPlaceholder: string;
    promptSendLabel: string;
  };
  scorePage: {
    title: string;
    subtitle: string;
    breakdownTitle: string;
    suggestionsTitle: string;
    gapType: {
      insufficient: string;
      contradicting: string;
      structural: string;
    };
    pointsPerMinuteUnit: string;
    historyTitle: string;
  };
  marketPage: {
    title: string;
    subtitle: string;
    registerTitle: string;
    competitorsTitle: string;
    simulationTitle: string;
    companyCountLabel: string;
    medianRevenueLabel: string;
    growthShareLabel: string;
    regionShareLabel: string;
  };
  customersPage: {
    title: string;
    subtitle: string;
    tableCompany: string;
    tableSni: string;
    tableEmployees: string;
    tableRevenue: string;
    tableStatus: string;
    status: {
      draft: string;
      sent: string;
      opened: string;
      responded: string;
    };
    responseQuoteLabel: string;
  };
  pulsePage: {
    title: string;
    subtitle: string;
    emptyState: string;
  };
  memoryPage: {
    title: string;
    subtitle: string;
    tabs: {
      profile: string;
      brain: string;
      trace: string;
    };
    profileBackgroundLabel: string;
    profileResourcesLabel: string;
    brainHint: string;
    traceEmpty: string;
  };
  legalPage: {
    title: string;
    subtitle: string;
    disclaimer: string;
    status: {
      uppfyllt: string;
      ej_uppfyllt: string;
      ej_tillämpligt: string;
    };
  };
  buildPage: {
    title: string;
    subtitle: string;
    status: {
      not_started: string;
      building: string;
      published: string;
    };
    specTitle: string;
    previewTitle: string;
    publishedUrlLabel: string;
  };
  /** Demoraden (avsnitt 9.1) — fast rad nederst i /demo/app och /demo/start. */
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
    /** Visas i stället för steg/fas medan onboardingen inte är klar. */
    onboardingLabel: string;
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
  /** Onboardingen (avsnitt 2.1, 6): val av ingång, profilsamtalet och
   * idégenomlysningen. Delade skärmar, monterade under /demo/start och /start. */
  onboarding: {
    entry: {
      eyebrow: string;
      title: string;
      subtitle: string;
      noIdea: { title: string; body: string; cta: string };
      hasIdea: { title: string; body: string; cta: string };
    };
    profile: {
      eyebrow: string;
      title: string;
      subtitle: string;
      buildingTitle: string;
      continueCta: string;
    };
    idea: {
      eyebrow: string;
      title: string;
      founderIntroLabel: string;
      assumptionsTitle: string;
      testableLabel: string;
      notTestableYetLabel: string;
      registerTitle: string;
      weaknessTitle: string;
      sharperTitle: string;
      sharperWhyLabel: string;
      continueCta: string;
    };
  };
  /** De 12 officiella stegens titel/ingress (uppdrag 1.5) — produktkonstanter,
   * en enda källa för liveadaptern (adapters/live/JourneyRepository.ts,
   * core/journey.ts's JOURNEY_STEP_META). Nyckeln "step1".."step12" (inte ett
   * index-baserat objekt) håller den typtvingad utan en satsning på att
   * TypeScript förstår numeriska nycklar 1-12 exakt. */
  journeySteps: {
    /** "Steg"/"Step" — adapters/live/JourneyRepository.ts bygger
     * NextStep.eyebrow ur den här ("STEG 05 · SAMTALEN"), samma form som
     * adapters/demo/sara.ts's hårdkodade eyebrows. */
    eyebrowPrefix: string;
    /** Visas som handlingsknappens text för ett steg utan eget skrivet
     * actionLabel än (ingen skärm skriver till journey_steps i P1). */
    defaultActionLabel: string;
    step1: { title: string; oneLiner: string };
    step2: { title: string; oneLiner: string };
    step3: { title: string; oneLiner: string };
    step4: { title: string; oneLiner: string };
    step5: { title: string; oneLiner: string };
    step6: { title: string; oneLiner: string };
    step7: { title: string; oneLiner: string };
    step8: { title: string; oneLiner: string };
    step9: { title: string; oneLiner: string };
    step10: { title: string; oneLiner: string };
    step11: { title: string; oneLiner: string };
    step12: { title: string; oneLiner: string };
  };
  /** Inloggning (uppdrag 14.4): /logga-in, /skapa-konto. Fältfelen skickas
   * som koder från app/(auth)/actions.ts (Server Actions) — ingen text
   * lämnar servern, bara nycklar hit. */
  auth: {
    logIn: {
      eyebrow: string;
      title: string;
      subtitle: string;
      emailLabel: string;
      passwordLabel: string;
      submitCta: string;
      switchPrompt: string;
      switchCta: string;
    };
    signUp: {
      eyebrow: string;
      title: string;
      subtitle: string;
      nameLabel: string;
      emailLabel: string;
      passwordLabel: string;
      passwordHint: string;
      submitCta: string;
      switchPrompt: string;
      switchCta: string;
    };
    checkEmail: {
      title: string;
      body: string;
    };
    errors: {
      nameTooShort: string;
      emailInvalid: string;
      passwordTooShort: string;
      passwordNeedsLetter: string;
      passwordNeedsNumber: string;
      passwordRequired: string;
      invalidCredentials: string;
      unexpected: string;
    };
    signOutCta: string;
  };
};
