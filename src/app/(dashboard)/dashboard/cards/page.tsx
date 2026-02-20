import { createClient } from "@/lib/supabase/server";
import { getCreditCardsByUserId } from "@/services/credit-cards";
import { CardsContent } from "@/components/cards/cards-content";

export default async function CardsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const cards = user ? await getCreditCardsByUserId(user.id) : [];

  return (
    <div className="w-full min-w-0 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-zinc-500">Dashboard &gt; Cartão de crédito</p>
      </div>
      <div>
        <h2 className="text-xl font-bold text-zinc-100 sm:text-2xl">
          Cartões de crédito
        </h2>
        <p className="mt-0.5 text-sm text-zinc-500 sm:text-base">
          Gerencie seus cartões e importe faturas para análise com IA.
        </p>
      </div>
      <CardsContent initialCards={cards} />
    </div>
  );
}
