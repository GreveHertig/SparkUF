// Next.js visar den här filen medan /demo/app-segmentet laddas in vid
// navigering. layout.tsx och page.tsx hämtar sin data i en useEffect efter
// första renderingen (se kommentarerna där), så det här syns i praktiken
// bara som en enda animationsframe.
export default function DemoAppLoading() {
  return <div className="min-h-screen bg-paper-50" aria-hidden="true" />;
}
