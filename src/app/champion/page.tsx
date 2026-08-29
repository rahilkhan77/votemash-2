import { ChampionSpotlight } from "@/components/champion-spotlight";
import { ProductCard } from "@/components/product-card";
import { SetupNotice } from "@/components/setup-notice";
import { getCurrentChampion } from "@/lib/leagues";
import { setupError } from "@/lib/setup";

export const dynamic = "force-dynamic";

export default async function ChampionPage() {
  const missing = setupError();
  if (missing) return <SetupNotice message={missing} />;

  const champion = await getCurrentChampion();

  return (
    <div className="grid gap-8">
      <ChampionSpotlight champion={champion} />

      {champion ? (
        <div className="mx-auto w-full max-w-xl">
          <ProductCard product={champion.product} />
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Featured until {champion.featuredUntil.toUTCString()}
          </p>
        </div>
      ) : (
        <p className="text-center text-sm text-muted-foreground">
          Finish a 48-hour league to crown a champion.
        </p>
      )}
    </div>
  );
}
