import { mockPoäng } from "@/lib/demo-data/mock";

export default function DemoPage() {
  return (
    <main>
      <h1>Spark — förhandstitt</h1>
      <p>Poäng (exempel, inte skarp data): {mockPoäng.totalt} / 100</p>
    </main>
  );
}
