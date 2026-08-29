export const LOGO_BY_NAME: Record<string, string> = {
  ChatGPT: "/logos/openai.svg",
  Claude: "/logos/anthropic.svg",
  Gemini: "/logos/googlegemini.svg",
  Perplexity: "/logos/perplexity.svg",
  Cursor: "/logos/cursor.svg",
  Apple: "/logos/apple.svg",
  Nike: "/logos/nike.svg",
  Tesla: "/logos/tesla.svg",
  Adidas: "/logos/adidas.svg",
  "Coca-Cola": "/logos/cocacola.svg",
  "VS Code": "/logos/visualstudiocode.svg",
  GitHub: "/logos/github.svg",
  Vercel: "/logos/vercel.svg",
  Docker: "/logos/docker.svg",
  GitLab: "/logos/gitlab.svg",
  Stripe: "/logos/stripe.svg",
  Shopify: "/logos/shopify.svg",
  Airbnb: "/logos/airbnb.svg",
  Uber: "/logos/uber.svg",
  Dropbox: "/logos/dropbox.svg",
  Figma: "/logos/figma.svg",
  Canva: "/logos/canva.svg",
  Adobe: "/logos/adobe.svg",
  Framer: "/logos/framer.svg",
  Sketch: "/logos/sketch.svg",
  Notion: "/logos/notion.svg",
  Linear: "/logos/linear.svg",
  Slack: "/logos/slack.svg",
  Asana: "/logos/asana.svg",
  Todoist: "/logos/todoist.svg",
  Steam: "/logos/steam.svg",
  Roblox: "/logos/roblox.svg",
  "Epic Games": "/logos/epicgames.svg",
  Nintendo: "/logos/nintendo.svg",
  "Riot Games": "/logos/riotgames.svg",
};

export function resolveLogoUrl(
  name: string,
  logoUrl?: string | null,
): string | null {
  const mapped = LOGO_BY_NAME[name];
  if (mapped) return mapped;
  if (logoUrl?.startsWith("/logos/")) return logoUrl;
  return logoUrl?.trim() || null;
}
