import {
  pgTable,
  uuid,
  text,
  boolean,
  date,
  timestamp,
  decimal,
  pgEnum,
} from "drizzle-orm/pg-core";

// ─── 1. ENUMS (espelhando o SQL do Supabase) ─────────────────────────────────
export const transactionTypeEnum = pgEnum("transaction_type", [
  "income",
  "expense",
  "transfer",
]);
export const accountTypeEnum = pgEnum("account_type", [
  "checking",
  "savings",
  "credit_card",
  "investment",
  "cash",
]);
export const subscriptionTierEnum = pgEnum("subscription_tier", [
  "free",
  "pro",
  "enterprise",
]);

// ─── 2. PROFILES (estende auth.users) ────────────────────────────────────────
// id referencia auth.users(id) — FK criada no Supabase; aqui só tipamos.
export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(),
  email: text("email").notNull().unique(),
  fullName: text("full_name"),
  avatarUrl: text("avatar_url"),
  tier: subscriptionTierEnum("tier").default("free").notNull(),
  stripeCustomerId: text("stripe_customer_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ─── 3. ACCOUNTS (carteiras, Nubank, Inter, etc.) ───────────────────────────
export const accounts = pgTable("accounts", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: accountTypeEnum("type").notNull(),
  balance: decimal("balance", { precision: 12, scale: 2 }).default("0.00").notNull(),
  color: text("color").default("#000000"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ─── 4. CATEGORIES (categorias do usuário ou padrões do sistema) ─────────────
export const categories = pgTable("categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  icon: text("icon"),
  type: transactionTypeEnum("type").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ─── 5. CREDIT CARDS (cartões de crédito; só últimos 4 dígitos armazenados) ───
export const creditCards = pgTable("credit_cards", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  last4: text("last4").notNull(),
  holderName: text("holder_name").notNull(),
  expiryMonth: text("expiry_month").notNull(),
  expiryYear: text("expiry_year").notNull(),
  gradientKey: text("gradient_key").notNull().default("orange_red"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ─── 6. CREDIT CARD INVOICES (faturas de cartão; extraídas pela IA) ──────────
export const creditCardInvoices = pgTable("credit_card_invoices", {
  id: uuid("id").defaultRandom().primaryKey(),
  creditCardId: uuid("credit_card_id")
    .notNull()
    .references(() => creditCards.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  periodStart: date("period_start").notNull(),
  periodEnd: date("period_end").notNull(),
  dueDate: date("due_date"),
  totalAmount: decimal("total_amount", { precision: 12, scale: 2 }).notNull(),
  aiSummary: text("ai_summary"),
  aiSuggestions: text("ai_suggestions"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const creditCardInvoiceItems = pgTable("credit_card_invoice_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  invoiceId: uuid("invoice_id")
    .notNull()
    .references(() => creditCardInvoices.id, { onDelete: "cascade" }),
  description: text("description"),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  date: date("date"),
  installmentsCurrent: text("installments_current"),
  installmentsTotal: text("installments_total"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ─── 7. TRANSACTIONS (transações; a IA pode popular com ai_generated = true) ─
export const transactions = pgTable("transactions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  accountId: uuid("account_id")
    .notNull()
    .references(() => accounts.id, { onDelete: "cascade" }),
  categoryId: uuid("category_id").references(() => categories.id, {
    onDelete: "set null",
  }),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  type: transactionTypeEnum("type").notNull(),
  description: text("description"),
  date: date("date").notNull(),
  isRecurring: boolean("is_recurring").default(false),
  aiGenerated: boolean("ai_generated").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Tipos inferidos para uso em app e Server Actions
export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;
export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;
export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;
export type CreditCard = typeof creditCards.$inferSelect;
export type NewCreditCard = typeof creditCards.$inferInsert;
export type CreditCardInvoice = typeof creditCardInvoices.$inferSelect;
export type NewCreditCardInvoice = typeof creditCardInvoices.$inferInsert;
export type CreditCardInvoiceItem = typeof creditCardInvoiceItems.$inferSelect;
export type NewCreditCardInvoiceItem = typeof creditCardInvoiceItems.$inferInsert;

export type TransactionType = (typeof transactionTypeEnum.enumValues)[number];
export type AccountType = (typeof accountTypeEnum.enumValues)[number];
export type SubscriptionTier = (typeof subscriptionTierEnum.enumValues)[number];
