-- Tabelas de faturas de cartão de crédito para Supabase
-- Execute após supabase-credit_cards.sql (depende de credit_cards e profiles).
-- Cole no SQL Editor do Supabase e execute.

-- Faturas (uma por período por cartão)
CREATE TABLE IF NOT EXISTS "public"."credit_card_invoices" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "credit_card_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "period_start" date NOT NULL,
  "period_end" date NOT NULL,
  "due_date" date,
  "total_amount" decimal(12,2) NOT NULL,
  "ai_summary" text,
  "ai_suggestions" text,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "credit_card_invoices_credit_card_id_fk"
    FOREIGN KEY ("credit_card_id") REFERENCES "public"."credit_cards"("id") ON DELETE CASCADE,
  CONSTRAINT "credit_card_invoices_user_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "credit_card_invoices_credit_card_id_idx" ON "public"."credit_card_invoices" ("credit_card_id");
CREATE INDEX IF NOT EXISTS "credit_card_invoices_user_id_idx" ON "public"."credit_card_invoices" ("user_id");
CREATE INDEX IF NOT EXISTS "credit_card_invoices_period_end_idx" ON "public"."credit_card_invoices" ("period_end");

-- Itens da fatura (lançamentos)
CREATE TABLE IF NOT EXISTS "public"."credit_card_invoice_items" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "invoice_id" uuid NOT NULL,
  "description" text,
  "amount" decimal(12,2) NOT NULL,
  "date" date,
  "installments_current" text,
  "installments_total" text,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "credit_card_invoice_items_invoice_id_fk"
    FOREIGN KEY ("invoice_id") REFERENCES "public"."credit_card_invoices"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "credit_card_invoice_items_invoice_id_idx" ON "public"."credit_card_invoice_items" ("invoice_id");

-- RLS (opcional; descomente se usar RLS nas outras tabelas)
-- ALTER TABLE "public"."credit_card_invoices" ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "credit_card_invoices_select_own" ON "public"."credit_card_invoices"
--   FOR SELECT USING (auth.uid() = user_id);
-- CREATE POLICY "credit_card_invoices_insert_own" ON "public"."credit_card_invoices"
--   FOR INSERT WITH CHECK (auth.uid() = user_id);
-- CREATE POLICY "credit_card_invoices_delete_own" ON "public"."credit_card_invoices"
--   FOR DELETE USING (auth.uid() = user_id);

-- ALTER TABLE "public"."credit_card_invoice_items" ENABLE ROW LEVEL SECURITY;
-- (Políticas para invoice_items podem ser via JOIN com credit_card_invoices.user_id ou deixar acesso via service role.)
