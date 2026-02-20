import { and, desc, eq, gte, lte } from "drizzle-orm";
import { db } from "@/db";
import { creditCardInvoices, creditCardInvoiceItems } from "@/db/schema";

export async function getInvoicesByCreditCardId(creditCardId: string) {
  return db
    .select()
    .from(creditCardInvoices)
    .where(eq(creditCardInvoices.creditCardId, creditCardId))
    .orderBy(desc(creditCardInvoices.periodEnd));
}

export async function getInvoiceItems(invoiceId: string) {
  return db
    .select()
    .from(creditCardInvoiceItems)
    .where(eq(creditCardInvoiceItems.invoiceId, invoiceId));
}

export async function getInvoicesByUserId(userId: string, dateFrom?: string, dateTo?: string) {
  const conditions = [eq(creditCardInvoices.userId, userId)];
  if (dateFrom) conditions.push(gte(creditCardInvoices.periodEnd, dateFrom));
  if (dateTo) conditions.push(lte(creditCardInvoices.periodStart, dateTo));
  return db
    .select()
    .from(creditCardInvoices)
    .where(and(...conditions))
    .orderBy(desc(creditCardInvoices.periodEnd));
}

export async function createCreditCardInvoice(
  data: {
    creditCardId: string;
    userId: string;
    periodStart: string;
    periodEnd: string;
    dueDate: string | null;
    totalAmount: string;
    aiSummary: string | null;
    aiSuggestions: string | null;
  },
  items: {
    description: string | null;
    amount: string;
    date: string | null;
    installmentsCurrent: string | null;
    installmentsTotal: string | null;
  }[],
) {
  const [invoice] = await db
    .insert(creditCardInvoices)
    .values(data)
    .returning();
  if (!invoice) throw new Error("Falha ao criar fatura");
  if (items.length > 0) {
    await db.insert(creditCardInvoiceItems).values(
      items.map((item) => ({
        invoiceId: invoice.id,
        description: item.description,
        amount: item.amount,
        date: item.date,
        installmentsCurrent: item.installmentsCurrent,
        installmentsTotal: item.installmentsTotal,
      })),
    );
  }
  return invoice;
}
