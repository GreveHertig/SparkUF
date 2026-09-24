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
    /** SimulationCard (uppdrag 2.2, 8): populationens storlek ska alltid synas. */
    simulationPopulationLabel: string;
    upToPointsBefore: string;
    upToPointsAfter: string;
    /** NextStepCard (sidornas komposition mot artefakten, uppgift 3): tre
     * val i stället för ett — huvudhandlingen, "Senare" (rent kosmetisk
     * UI-state, ingen egen data) och togglen för underlaget. */
    laterLabel: string;
    deferredLabel: string;
    showEvidenceLabel: string;
    hideEvidenceLabel: string;
    /** Generiska bolagsformsnamn (uppgift 2: Juridik-sidans innehållsburna
     * rubrik) — inte scenarioinnehåll, samma fyra värden som `Bolagsform`
     * i core/domain.ts. */
    bolagsformLabels: {
      enskild_firma: string;
      aktiebolag: string;
      handelsbolag: string;
      ekonomisk_forening: string;
    };
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
      validation: string;
      pulse: string;
      memory: string;
      legal: string;
      build: string;
      businessPlan: string;
    };
    profileMenuLabel: string;
    /** Undertext under ordmärket i sidomenyn (artefaktens `.brand small`). */
    tagline: string;
    /** Sidomenyns sidfot (artefaktens `.side-foot .restart`) — bara i demot,
     * se `components/spark/SidebarRestart.tsx`. Skild från `demoBar.reset`/
     * `resetConfirm`, som är kortare ord för samma knapp i demoraden. */
    restartDemo: string;
  };
  homePage: {
    /** Pillen ovanpå handlingskortet (artefaktens `actHTML`: "Gör det här nu"). */
    actNowLabel: string;
    sinceLastTimeTitle: string;
    emailSentLabel: string;
    openRateLabel: string;
    reminderSentLabel: string;
    responsesReceivedLabel: string;
    todaysPulseTitle: string;
    scoreMovementTitle: string;
    breakdownTitle: string;
    unlocksAfterStepBefore: string;
    /** Ärligt tomt läge när ett steg saknar data för den aktiva personan i
     * demot — skild från unlocksAfterStepBefore, som antyder att det kommer
     * senare (avsnitt: flera demomoduler är fortfarande bara byggda för
     * Sara). */
    notInThisScenario: string;
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
    /** Uppdrag 9.1: de tre klickbara momenten (före/körning/efter) — en liten
     * pill ovanpå stegets arbetsyta som visar var i steget man är. */
    momentPill: {
      before: string;
      running: string;
      after: string;
    };
    /** Visas under körning-momentet — pekar mot Medgrundaren, där verktyget faktiskt visas. */
    runningHint: string;
    /** "Efter"-momentets poängändring med förklaring (uppdrag 9.1). */
    scoreChangeTitle: string;
    /** "Efter"-momentets "vad som låstes upp" (uppdrag 9.1), kod-härlett. */
    unlockedTitle: string;
    /** Simuleringsytan på stegets arbetsyta (uppdrag 2.2, steg 03/04/06). */
    simulationTitle: string;
  };
  cofounderPage: {
    title: string;
    subtitle: string;
    /** "Sedan tidigare" (avsnitt 10) — kort rad med redan kända beslut,
     * inte scrollbar historik. Se screens/Cofounder.tsx. */
    contextTitle: string;
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
    /** Card-head-noten bredvid "Höj din poäng" (artefaktens `chead`-höger). */
    suggestionsSortNote: string;
    gapType: {
      insufficient: string;
      contradicting: string;
      structural: string;
    };
    pointsPerMinuteUnit: string;
    historyTitle: string;
    /** Tidsuppskattningens enhet i förslagskortens fot (artefaktens `pill(s.tid)`),
     * t.ex. "min" i "~15 min". */
    estimatedMinutesUnit: string;
  };
  marketPage: {
    title: string;
    subtitle: string;
    kpiTitle: string;
    competitorsTitle: string;
    simulationTitle: string;
    companyCountLabel: string;
    companyCountUnit: string;
    companyCountDescription: string;
    medianRevenueLabel: string;
    growthShareLabel: string;
    regionShareLabel: string;
    /** "Baserat på" — kombineras i kod med N/M/enhet till "Baserat på 194 av 312 bolag." */
    basedOnLabel: string;
    ofLabel: string;
    companiesUnit: string;
    dataLayers: {
      title: string;
      registerName: string;
      registerNote: string;
      annualReportName: string;
      annualReportNote: string;
      simulationName: string;
      simulationNote: string;
    };
    distribution: {
      title: string;
      sniLabel: string;
      mostCommonLabel: string;
      employeesUnit: string;
      sizeBuckets: {
        oneToFour: string;
        fiveToNine: string;
        tenToNineteen: string;
        twentyToFortyNine: string;
        fiftyPlus: string;
      };
    };
    outreach: {
      title: string;
      contactedLabel: string;
      respondedLabel: string;
      responseRateLabel: string;
      notBuiltYet: string;
      notSentYet: string;
    };
  };
  /** Valideringen (uppgift 3): Kunder + valideringsinnehållet ur steg 04–06
   * slagna ihop till en sida — allt som prövats mot verkliga kunder. */
  validationPage: {
    title: string;
    subtitle: string;
    kpiTitle: string;
    contactedLabel: string;
    respondedLabel: string;
    responseRateLabel: string;
    openRateLabel: string;
    confidencePrefix: string;
    confidenceContactedUnit: string;
    confidenceRateSuffix: string;
    tableTitle: string;
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
    assumptionsTitle: string;
    assumptionVerdict: {
      confirmed: string;
      contradicted: string;
    };
    responsesTitle: string;
    responseQuoteLabel: string;
    responseVerdict: {
      confirms: string;
      partial: string;
    };
    priceTestedLabel: string;
    verdictTitle: string;
    /** Simulering av betalningstolerans per byråstorlek (uppdrag 2.2, steg 04). */
    simulationTitle: string;
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
    /** Card-head-noten bredvid "Omfånget" (artefaktens `chead("Omfånget", "steg 08")`). */
    scopeStepNote: string;
    previewTitle: string;
    publishedUrlLabel: string;
    /** Avsnitt 2.3: "Visa att bygget kostar credits." */
    creditsUsedLabel: string;
  };
  /** Demoraden (avsnitt 9.1) — fast rad nederst i /demo/app och /demo/start. */
  demoBar: {
    /** Egennamnet (Sara/Jonas) hör hemma i källdata (adapters/demo/sara.ts
     * respektive jonas.ts), inte här — de här är bara etiketten för vilken
     * persona, komponerad tillsammans med profilens namn i DemoBar.tsx. */
    personaALabel: string;
    personaBLabel: string;
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
    /** Rundturens etikett när den är låst (uppgift 2: rundturen finns bara
     * för Sara-scenariot). Visas på en riktig `disabled`-knapp, inte en
     * klickbar som gör ingenting. */
    tourLocked: string;
    /** Förklaringen bakom den låsta knappen (title-attribut). */
    tourLockedHint: string;
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
  /** Den guidade rundturen (avsnitt 9.2) — bara gränssnittstexten (knappar,
   * stoppräknare). Själva de 20 stoppens titel/text ligger i
   * `adapters/demo/tourSteps.ts`, samma mönster som `cofounderScript.ts`. */
  tour: {
    nextCta: string;
    skipCta: string;
    finishCta: string;
    stopLabel: string;
    ofLabel: string;
  };
  /** Delad header/footer för de publika sidorna (avsnitt 6: /, /priser).
   * `/logga-in`/`/skapa-konto` har sin egen minimala AuthLayout-header sedan
   * P1 och återanvänder inte den här — de är fejkade/riktiga formulär, inte
   * marknadsföringsytor. */
  publicNav: {
    pricingLink: string;
    logInLink: string;
    startDemoCta: string;
    createAccountCta: string;
  };
  publicFooter: {
    tagline: string;
    fictionalNote: string;
    rightsNote: string;
    columns: {
      product: string;
      account: string;
    };
  };
  /** Landningssidan (avsnitt 5.1, 6). Sektionsordningen i `app/(marketing)/page.tsx`
   * matchar uppdragets numrerade lista rakt av. */
  landingPage: {
    hero: {
      eyebrow: string;
      headingBefore: string;
      headingEmphasis: string;
      headingAfter: string;
      subtitle: string;
      startDemoCta: string;
      createAccountCta: string;
      /** Levande produktkort i hero (5.1: "produkten syns i marknadsföringen") —
       * samma NextStepCard som /demo/app, egen text, inte kopplad till en adapter. */
      productCard: {
        eyebrow: string;
        title: string;
        why: string;
        maxPoints: number;
        estimatedTime: string;
        doneItems: string[];
        action: string;
      };
    };
    problem: {
      eyebrow: string;
      title: string;
      body: string;
    };
    dataPromise: {
      eyebrow: string;
      title: string;
      body: string;
      companyCountLabel: string;
      medianRevenueLabel: string;
      growthShareLabel: string;
    };
    journey: {
      eyebrow: string;
      title: string;
      subtitle: string;
      /** Ett kort citat per fas (5.1: "ett kort citat per fas") — själva
       * stegen återanvänds ur `journeySteps` och `journeyPage.phaseNames`. */
      phaseQuotes: {
        discover: string;
        tryPhase: string;
        launch: string;
        grow: string;
      };
    };
    /** "Fyra saker Medgrundaren gör" (avsnitt 6) — fyra kort, vart och ett med
     * en riktig gränssnittskomponent (NextStepCard/ToolRunCard/ChatMessage/PulseCard). */
    cofounder: {
      eyebrow: string;
      title: string;
      subtitle: string;
      nextStep: { title: string; body: string };
      toolRun: { label: string; steps: string[]; title: string; body: string };
      honesty: { title: string; body: string; founderLine: string; cofounderLine: string };
      pulse: {
        title: string;
        body: string;
        category: string;
        headline: string;
        whyItMatters: string;
        timestamp: string;
      };
    };
    score: {
      eyebrow: string;
      title: string;
      body: string;
      verdictHeadline: string;
      verdictReasoning: string;
    };
    legal: {
      eyebrow: string;
      title: string;
      body: string;
      sampleItems: {
        item1: { rubrik: string; beskrivning: string };
        item2: { rubrik: string; beskrivning: string };
      };
    };
    /** "Minnet som chattutdrag" (avsnitt 5.1, 6) — separat sektion från
     * cofounder.honesty ovan: den här refererar uttryckligen ett tidigare beslut. */
    memory: {
      eyebrow: string;
      title: string;
      body: string;
      founderLine: string;
      cofounderLine: string;
    };
    concepts: {
      eyebrow: string;
      title: string;
      body: string;
      hiasynth: {
        title: string;
        body: string;
        question: string;
        result: string;
        uncertaintyRangeLabel: string;
      };
      lovable: { title: string; body: string; buildSteps: string[]; creditsLabel: string };
    };
    pricingTeaser: {
      eyebrow: string;
      title: string;
      body: string;
      cta: string;
    };
    faq: {
      eyebrow: string;
      title: string;
      q1: { question: string; answer: string };
      q2: { question: string; answer: string };
      q3: { question: string; answer: string };
      q4: { question: string; answer: string };
      q5: { question: string; answer: string };
    };
    finalCta: {
      title: string;
      body: string;
      startDemoCta: string;
      createAccountCta: string;
    };
  };
  /** `/priser` (avsnitt 6): tre nivåer, uttryckligen märkta som förslag. */
  pricingPage: {
    eyebrow: string;
    title: string;
    subtitle: string;
    proposalNote: string;
    free: { name: string; price: string; priceUnit: string; description: string; features: string[]; cta: string };
    founder: {
      name: string;
      price: string;
      priceUnit: string;
      description: string;
      features: string[];
      cta: string;
      badge: string;
    };
    build: { name: string; price: string; priceUnit: string; description: string; features: string[]; cta: string };
    faqLinkLabel: string;
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
  /** Mall för outreach-utkast (steg 05). Platshållare: {companyName} {problem} {price} {senderName} {senderCompany} {sourceUrl}. */
  outreachDraft: {
    subject: string;
    greeting: string;
    intro: string;
    ask: string;
    priceLine: string;
    sourceLine: string;
    gdprNotice: string;
    optOut: string;
    signature: string;
  };
  /** Domen (steg 06, docs/moduler/domen.md). Platshållare: {responded} {contacted} {confirming} {priceDeclined} {median} {count} {minEmployees}. */
  verdict: {
    decision: { run: string; refine: string; pivot: string; insufficient: string };
    reasoning: {
      run: string;
      refine: string;
      pivot: string;
      insufficient: string;
    };
    reason: {
      smallSample: string;
      problemRejected: string;
      problemWeak: string;
      priceTooHigh: string;
      priceUnproven: string;
      segmentSkew: string;
    };
    medianCounterOffer: string;
    pivotTraceEvent: string;
  };
  /** Affärsplanen (docs/uppdrag.md avsnitt 15). Platshållare i
   * `requiresStepTemplate`: {step}. */
  businessPlanPage: {
    title: string;
    subtitle: string;
    maturityLabel: string;
    status: { solid: string; thin: string; missing: string };
    requiresStepTemplate: string;
    contradictionLabel: string;
    lockedPartsTitle: string;
    sections: Record<
      "idea" | "customerAndProblem" | "market" | "competition" | "offerAndPrice" | "evidence" | "execution" | "economy" | "risks",
      { title: string; description: string }
    >;
  };
  /** Designexperimentet /experiment/landning (gren experiment/landning-erik,
   * mergas aldrig). Rubriker delas i before/em/after så att anropande kod kan
   * sätta betoningsordet i serif-kursiv utan markup i strängen. Platshållare:
   * `{count}` i `lockedTemplate`, `{points}`/`{weight}` i `partPoints`,
   * `{amount}` i `close.priceTemplate`. */
  experimentLanding: {
    nav: { home: string };
    hero: {
      titleBefore: string;
      titleEm: string;
      titleAfter: string;
      lead: string;
      demoCta: string;
      demoNote: string;
      signupCta: string;
    };
    proof: {
      label: string;
      idea: string;
      scoreLabel: string;
      toggleLabel: string;
      toggleHint: string;
      deltaReason: string;
      lockedTemplate: string;
      partPoints: string;
      sources: { profile: string; calls: string };
    };
    register: {
      title: string;
      question: string;
      guess: { label: string; quote: string; verdict: string };
      sourced: { label: string; quote: string };
      unknown: { label: string; quote: string };
    };
    score: {
      titleBefore: string;
      titleEm: string;
      titleAfter: string;
      lead: string;
      rules: Record<"counts" | "simulations" | "contradictions", { title: string; body: string }>;
      backToExample: string;
    };
    audience: { title: string; body: string };
    close: {
      title: string;
      priceLabel: string;
      priceTemplate: string;
      priceUnit: string;
      tbd: string;
      tbdNote: string;
      priceNote: string;
      emailLabel: string;
      emailHelp: string;
      submit: string;
      invalid: string;
      sentNotConnected: string;
    };
    footer: { experiment: string; fiction: string };
  };
  /** Designexperimentet /experiment/fri (gren experiment/landning-fri,
   * mergas aldrig). Egen visuell identitet, samma sanningskrav på innehållet.
   * Priset läses från `pricingPage.founder`; stegtitlar från `journeySteps`. */
  experimentFree: {
    nav: { home: string; journey: string; sources: string; price: string; demo: string; demoTag: string; language: string };
    hero: { titleA: string; titleB: string; lead: string; demoCta: string; demoNote: string; signupCta: string };
    example: { label: string; you: string; question: string; answer: string; next: string };
    journey: {
      title: string;
      lead: string;
      stepLabel: string;
      phases: Record<"discover" | "tryPhase" | "launch" | "grow", string>;
    };
    sources: { title: string; lead: string; bolagsverket: string; scb: string; stampNote: string };
    cofounder: {
      title: string;
      items: Record<"straight" | "memory" | "score", { title: string; body: string }>;
    };
    price: { lead: string; allPlans: string };
    signup: {
      title: string;
      emailLabel: string;
      submit: string;
      help: string;
      invalid: string;
      sent: string;
    };
    footer: { experiment: string; fiction: string };
  };
  /** Kopian av demot på /experiment/fri/demo (samma gren). Övriga texter
   * återanvänds ur appShell, demoBar, homePage, scorePage, kpi och score. */
  experimentFreeDemo: {
    backToSite: string;
    navLabel: string;
    historyTitle: string;
    historyNote: string;
  };
};
