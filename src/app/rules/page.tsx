import { LegalPage } from "@/components/legal-page";

export default function RulesPage() {
  return (
    <LegalPage title="Rules">
      <p>Enter a real product URL. The logo and name are fetched from that site.</p>
      <p>
        For most of the 48-hour league, battles stay inside one category. Thirty
        minutes before the end, the top 3 in every category lock and fight in
        the finals. The finals #1 is the champion.
      </p>
      <p>One vote per visitor per matchup. No multi-accounting to farm Elo.</p>
      <p>
        Paid entry prices are platform-wide: the first 10 listings are free,
        then $5, then $9. The charged amount is always computed on the server.
      </p>
    </LegalPage>
  );
}