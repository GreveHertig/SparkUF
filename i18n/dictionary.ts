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
  };
  score: {
    levels: {
      unproven: { name: string; message: string };
      underbuiltUnproven: { name: string; message: string };
      demandConfirmed: { name: string; message: string };
      builtAndLaunched: { name: string; message: string };
      provenBusiness: { name: string; message: string };
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
  demoContent: {
    nextStep: {
      eyebrow: string;
      title: string;
      why: string;
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
};
