import { ComingSoon } from "@/components/ui/ComingSoon";
import { livePulseProvider } from "@/adapters/live/PulseProvider";
import { isPlaceholderError } from "@/core/errors";
import type { PulseSignal } from "@/core/domain";
import { PulseFeed } from "@/screens/PulseFeed";

// Pulsen i plattformen: liveadapterns signaler (Tavily + dagscachen,
// docs/moduler/webbresearch-och-pulsen.md), visade med samma skärm som
// demot. Inget aktivt projekt ger en tom lista → skärmens tomläge. En
// stubbe eller ett tomt konto (isPlaceholderError) ger "Kommer snart",
// samma mönster som Hem. `locale` hårdkodas till "sv" som i resten av
// /app. JSX konstrueras aldrig inuti try/catch (react-hooks/error-boundaries).
export default async function LiveAppPulsePage() {
  let signals: PulseSignal[] | null = null;

  try {
    signals = await livePulseProvider.getSignals("sv");
  } catch (error) {
    if (!isPlaceholderError(error)) throw error;
  }

  if (!signals) {
    return <ComingSoon />;
  }

  return <PulseFeed signals={signals} />;
}
