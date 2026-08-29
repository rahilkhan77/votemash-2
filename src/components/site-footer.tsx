import { LeagueBracket } from "@/components/league-bracket";
import { loadFooterBracket } from "@/lib/bracket";
import { setupError } from "@/lib/setup";

export async function SiteFooter() {
  if (setupError()) return null;

  let data = null;
  try {
    data = await loadFooterBracket();
  } catch {
    return null;
  }

  if (!data) return null;

  return (
    <footer className="mt-auto border-t border-white/30 bg-white/15 backdrop-blur-2xl dark:border-white/10 dark:bg-black/20">
      <LeagueBracket data={data} />
    </footer>
  );
}
