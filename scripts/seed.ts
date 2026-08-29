import { eq } from "drizzle-orm";
import { getDb } from "../src/db";
import { leagueEntries, leagues, products } from "../src/db/schema";
import type { ProductCategory } from "../src/lib/categories";

function logo(slug: string) {
  return `/logos/${slug}.svg`;
}

const samples: {
  url: string;
  name: string;
  description: string;
  slug: string;
  category: ProductCategory;
}[] = [
  {
    url: "https://chatgpt.com/",
    name: "ChatGPT",
    description: "OpenAI conversational assistant for writing, coding, and research.",
    slug: "openai",
    category: "ai-tool",
  },
  {
    url: "https://claude.ai/",
    name: "Claude",
    description: "Anthropic AI assistant for analysis, writing, and coding.",
    slug: "anthropic",
    category: "ai-tool",
  },
  {
    url: "https://gemini.google.com/",
    name: "Gemini",
    description: "Google's multimodal AI assistant.",
    slug: "googlegemini",
    category: "ai-tool",
  },
  {
    url: "https://www.perplexity.ai/",
    name: "Perplexity",
    description: "AI answer engine that cites the web.",
    slug: "perplexity",
    category: "ai-tool",
  },
  {
    url: "https://cursor.com/",
    name: "Cursor",
    description: "AI-first code editor built for shipping software faster.",
    slug: "cursor",
    category: "ai-tool",
  },
  {
    url: "https://www.apple.com/",
    name: "Apple",
    description: "Consumer electronics, software, and services brand.",
    slug: "apple",
    category: "brand",
  },
  {
    url: "https://www.nike.com/",
    name: "Nike",
    description: "Global sportswear and athletics brand.",
    slug: "nike",
    category: "brand",
  },
  {
    url: "https://www.tesla.com/",
    name: "Tesla",
    description: "Electric vehicles and clean energy brand.",
    slug: "tesla",
    category: "brand",
  },
  {
    url: "https://www.adidas.com/",
    name: "Adidas",
    description: "Sportswear and lifestyle brand.",
    slug: "adidas",
    category: "brand",
  },
  {
    url: "https://www.coca-cola.com/",
    name: "Coca-Cola",
    description: "Global beverage brand.",
    slug: "cocacola",
    category: "brand",
  },
  {
    url: "https://code.visualstudio.com/",
    name: "VS Code",
    description: "Free, open-source code editor from Microsoft.",
    slug: "visualstudiocode",
    category: "developer-tools",
  },
  {
    url: "https://github.com/",
    name: "GitHub",
    description: "Code hosting, review, and collaboration platform.",
    slug: "github",
    category: "developer-tools",
  },
  {
    url: "https://vercel.com/",
    name: "Vercel",
    description: "Frontend cloud for deploying web applications.",
    slug: "vercel",
    category: "developer-tools",
  },
  {
    url: "https://www.docker.com/",
    name: "Docker",
    description: "Container platform for building and shipping software.",
    slug: "docker",
    category: "developer-tools",
  },
  {
    url: "https://gitlab.com/",
    name: "GitLab",
    description: "DevSecOps platform for the software lifecycle.",
    slug: "gitlab",
    category: "developer-tools",
  },
  {
    url: "https://stripe.com/",
    name: "Stripe",
    description: "Payments infrastructure for the internet.",
    slug: "stripe",
    category: "products",
  },
  {
    url: "https://www.shopify.com/",
    name: "Shopify",
    description: "Commerce platform for online and retail stores.",
    slug: "shopify",
    category: "products",
  },
  {
    url: "https://www.airbnb.com/",
    name: "Airbnb",
    description: "Marketplace for stays and experiences.",
    slug: "airbnb",
    category: "products",
  },
  {
    url: "https://www.uber.com/",
    name: "Uber",
    description: "Rides, delivery, and mobility product.",
    slug: "uber",
    category: "products",
  },
  {
    url: "https://www.dropbox.com/",
    name: "Dropbox",
    description: "Cloud storage and file collaboration product.",
    slug: "dropbox",
    category: "products",
  },
  {
    url: "https://www.figma.com/",
    name: "Figma",
    description: "Collaborative interface design tool.",
    slug: "figma",
    category: "design-tool",
  },
  {
    url: "https://www.canva.com/",
    name: "Canva",
    description: "Design tool for presentations, social, and marketing.",
    slug: "canva",
    category: "design-tool",
  },
  {
    url: "https://www.adobe.com/",
    name: "Adobe",
    description: "Creative tools for design, photo, and video.",
    slug: "adobe",
    category: "design-tool",
  },
  {
    url: "https://www.framer.com/",
    name: "Framer",
    description: "Design and publish production websites.",
    slug: "framer",
    category: "design-tool",
  },
  {
    url: "https://www.sketch.com/",
    name: "Sketch",
    description: "Mac-native digital design toolkit.",
    slug: "sketch",
    category: "design-tool",
  },
  {
    url: "https://www.notion.so/",
    name: "Notion",
    description: "Workspace for notes, docs, and project planning.",
    slug: "notion",
    category: "productivity",
  },
  {
    url: "https://linear.app/",
    name: "Linear",
    description: "Issue tracking built for high-performance teams.",
    slug: "linear",
    category: "productivity",
  },
  {
    url: "https://slack.com/",
    name: "Slack",
    description: "Channel-based messaging for work.",
    slug: "slack",
    category: "productivity",
  },
  {
    url: "https://asana.com/",
    name: "Asana",
    description: "Work management for teams and projects.",
    slug: "asana",
    category: "productivity",
  },
  {
    url: "https://todoist.com/",
    name: "Todoist",
    description: "Task manager for personal and team to-dos.",
    slug: "todoist",
    category: "productivity",
  },
  {
    url: "https://store.steampowered.com/",
    name: "Steam",
    description: "Valve's PC game store and launcher.",
    slug: "steam",
    category: "games",
  },
  {
    url: "https://www.roblox.com/",
    name: "Roblox",
    description: "User-generated games platform.",
    slug: "roblox",
    category: "games",
  },
  {
    url: "https://store.epicgames.com/",
    name: "Epic Games",
    description: "Fortnite, Unreal Engine, and the Epic Games Store.",
    slug: "epicgames",
    category: "games",
  },
  {
    url: "https://www.nintendo.com/",
    name: "Nintendo",
    description: "Mario, Zelda, and Nintendo Switch games.",
    slug: "nintendo",
    category: "games",
  },
  {
    url: "https://www.riotgames.com/",
    name: "Riot Games",
    description: "League of Legends, Valorant, and more.",
    slug: "riotgames",
    category: "games",
  },
];

async function seed() {
  const db = getDb();
  const now = new Date();

  const existing = await db.select().from(leagues);
  let global = existing.find((row) => row.kind === "global" && row.status === "open");
  let sprint = existing.find((row) => row.kind === "sprint" && row.status === "open");

  if (!global) {
    [global] = await db
      .insert(leagues)
      .values({
        kind: "global",
        status: "open",
        startsAt: now,
        endsAt: null,
      })
      .returning();
  }

  if (!sprint) {
    [sprint] = await db
      .insert(leagues)
      .values({
        kind: "sprint",
        status: "open",
        startsAt: now,
        endsAt: new Date(now.getTime() + 48 * 60 * 60 * 1000),
      })
      .returning();
  }

  for (const sample of samples) {
    const values = {
      url: sample.url,
      name: sample.name,
      description: sample.description,
      logoUrl: logo(sample.slug),
      category: sample.category,
    };

    let [product] = await db
      .select()
      .from(products)
      .where(eq(products.url, sample.url))
      .limit(1);

    if (!product) {
      [product] = await db.insert(products).values(values).returning();
    } else {
      [product] = await db
        .update(products)
        .set({
          name: values.name,
          description: values.description,
          logoUrl: values.logoUrl,
          category: values.category,
        })
        .where(eq(products.id, product.id))
        .returning();
    }

    await db
      .insert(leagueEntries)
      .values({
        leagueId: sprint.id,
        productId: product.id,
      })
      .onConflictDoNothing({
        target: [leagueEntries.leagueId, leagueEntries.productId],
      });
  }

  console.log(`Seeded ${samples.length} companies across 7 categories`);
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
