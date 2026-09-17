// Next.js använder den här filen som Suspense-gräns för /demo/app-segmentet,
// vilket layout.tsx och page.tsx behöver eftersom de läser demoadaptrarnas
// promises med `use()`. Demot har ingen backend, så det här syns i praktiken
// bara som en enda animationsframe.
export default function DemoAppLoading() {
  return <div className="min-h-screen bg-paper-50" aria-hidden="true" />;
}
