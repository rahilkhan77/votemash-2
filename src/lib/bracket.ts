import type { Product } from "@/db/schema";
import {
  getCurrentChampion,
  getLatestClosedSprint,
  getLeaderboard,
  getOpenSprint,
  type RankedRow,
} from "@/lib/leagues";
import { resolveLogoUrl } from "@/lib/logos";

export type BracketLogo = {
  id: string;
  name: string;
  logoSrc: string | null;
};

export type BracketTree = {
  leftOuter: Array<BracketLogo | null>;
  leftInner: Array<BracketLogo | null>;
  leftFinal: BracketLogo | null;
  rightFinal: BracketLogo | null;
  rightInner: Array<BracketLogo | null>;
  rightOuter: Array<BracketLogo | null>;
  projectedWinner: BracketLogo | null;
};

export type FooterBracketData = {
  status: "live" | "crowned";
  endsAt: string | null;
  tree: BracketTree;
  winner: BracketLogo | null;
};

function toLogo(row?: RankedRow | null): BracketLogo | null {
  if (!row) return null;
  return {
    id: row.product.id,
    name: row.product.name,
    logoSrc: resolveLogoUrl(row.product.name, row.product.logoUrl),
  };
}

function productToLogo(product: Product): BracketLogo {
  return {
    id: product.id,
    name: product.name,
    logoSrc: resolveLogoUrl(product.name, product.logoUrl),
  };
}

function pick(a?: RankedRow, b?: RankedRow): RankedRow | undefined {
  if (!a) return b;
  if (!b) return a;
  if (a.rating !== b.rating) return a.rating > b.rating ? a : b;
  if (a.wins !== b.wins) return a.wins > b.wins ? a : b;
  return a.rank <= b.rank ? a : b;
}

export function buildBracketTree(rows: RankedRow[]): BracketTree {
  const seeds = rows.slice(0, 8);
  const s = (index: number) => seeds[index];

  const leftA = pick(s(0), s(7));
  const leftB = pick(s(3), s(4));
  const rightA = pick(s(1), s(6));
  const rightB = pick(s(2), s(5));
  const leftFinal = pick(leftA, leftB);
  const rightFinal = pick(rightA, rightB);
  const projectedWinner = pick(leftFinal, rightFinal);

  return {
    leftOuter: [s(0), s(7), s(3), s(4)].map(toLogo),
    leftInner: [leftA, leftB].map(toLogo),
    leftFinal: toLogo(leftFinal),
    rightFinal: toLogo(rightFinal),
    rightInner: [rightA, rightB].map(toLogo),
    rightOuter: [s(1), s(6), s(2), s(5)].map(toLogo),
    projectedWinner: toLogo(projectedWinner),
  };
}

export async function loadFooterBracket(): Promise<FooterBracketData | null> {
  const open = await getOpenSprint();
  if (open) {
    const rows = await getLeaderboard(open.id);
    if (rows.length >= 2) {
      return {
        status: "live",
        endsAt: open.endsAt?.toISOString() ?? null,
        tree: buildBracketTree(rows),
        winner: null,
      };
    }
  }

  const champion = await getCurrentChampion();
  if (champion) {
    const rows = await getLeaderboard(champion.leagueId);
    return {
      status: "crowned",
      endsAt: null,
      tree: buildBracketTree(rows),
      winner: productToLogo(champion.product),
    };
  }

  const closed = await getLatestClosedSprint();
  if (!closed) return null;
  const rows = await getLeaderboard(closed.id);
  if (rows.length < 2) return null;
  const tree = buildBracketTree(rows);
  return {
    status: "crowned",
    endsAt: null,
    tree,
    winner: tree.projectedWinner,
  };
}
