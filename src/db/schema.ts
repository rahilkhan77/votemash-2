import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const leagueKindEnum = pgEnum("league_kind", ["sprint", "global"]);
export const leagueStatusEnum = pgEnum("league_status", ["open", "closed"]);
export const intentStatusEnum = pgEnum("intent_status", [
  "pending",
  "paid",
  "fulfilled",
  "cancelled",
]);
export const productCategoryEnum = pgEnum("product_category", [
  "ai-tool",
  "brand",
  "developer-tools",
  "products",
  "design-tool",
  "productivity",
  "games",
]);

export const products = pgTable(
  "products",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    url: text("url").notNull(),
    name: text("name").notNull(),
    description: text("description").notNull().default(""),
    logoUrl: text("logo_url"),
    ogImageUrl: text("og_image_url"),
    category: productCategoryEnum("category").notNull().default("products"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("products_url_idx").on(table.url),
    index("products_category_idx").on(table.category),
  ],
);

export const leagues = pgTable(
  "leagues",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    kind: leagueKindEnum("kind").notNull(),
    status: leagueStatusEnum("status").notNull().default("open"),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }),
    finalsLockedAt: timestamp("finals_locked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("leagues_kind_status_idx").on(table.kind, table.status)],
);

export const leagueEntries = pgTable(
  "league_entries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    leagueId: uuid("league_id")
      .notNull()
      .references(() => leagues.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    rating: integer("rating").notNull().default(1500),
    wins: integer("wins").notNull().default(0),
    losses: integer("losses").notNull().default(0),
    isFinalist: boolean("is_finalist").notNull().default(false),
    finalsRating: integer("finals_rating").notNull().default(1500),
    finalsWins: integer("finals_wins").notNull().default(0),
    finalsLosses: integer("finals_losses").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("league_entries_league_product_idx").on(
      table.leagueId,
      table.productId,
    ),
    index("league_entries_league_rating_idx").on(table.leagueId, table.rating),
    index("league_entries_league_finalist_idx").on(
      table.leagueId,
      table.isFinalist,
    ),
  ],
);

export const votes = pgTable(
  "votes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    voterId: uuid("voter_id").notNull(),
    leagueId: uuid("league_id")
      .notNull()
      .references(() => leagues.id, { onDelete: "cascade" }),
    winnerEntryId: uuid("winner_entry_id")
      .notNull()
      .references(() => leagueEntries.id, { onDelete: "cascade" }),
    loserEntryId: uuid("loser_entry_id")
      .notNull()
      .references(() => leagueEntries.id, { onDelete: "cascade" }),
    pairKey: text("pair_key").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("votes_voter_league_pair_idx").on(
      table.voterId,
      table.leagueId,
      table.pairKey,
    ),
  ],
);

export const entryIntents = pgTable("entry_intents", {
  id: uuid("id").defaultRandom().primaryKey(),
  url: text("url").notNull(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  logoUrl: text("logo_url"),
  ogImageUrl: text("og_image_url"),
  category: productCategoryEnum("category").notNull().default("products"),
  amountCents: integer("amount_cents").notNull(),
  status: intentStatusEnum("status").notNull().default("pending"),
  dodoSessionId: text("dodo_session_id"),
  dodoPaymentId: text("dodo_payment_id"),
  productId: uuid("product_id").references(() => products.id),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const webhookEvents = pgTable("webhook_events", {
  id: text("id").primaryKey(),
  eventType: text("event_type").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const champions = pgTable(
  "champions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    leagueId: uuid("league_id")
      .notNull()
      .references(() => leagues.id, { onDelete: "cascade" }),
    featuredUntil: timestamp("featured_until", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("champions_featured_until_idx").on(table.featuredUntil)],
);

export type Product = typeof products.$inferSelect;
export type League = typeof leagues.$inferSelect;
export type LeagueEntry = typeof leagueEntries.$inferSelect;
