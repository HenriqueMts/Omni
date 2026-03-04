"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { createTransaction } from "@/app/actions/transactions";
import { createCategoryIfNotExists } from "@/app/actions/categories";
import { uniqueCategoriesByName } from "@/lib/categories";
import type { Account, Category } from "@/db/schema";
import { Plus } from "lucide-react";

const NONE_VALUE = "__none__"; // Radix Select não permite value=""

const TYPE_ITEMS: { value: string; label: string }[] = [
  { value: "expense", label: "Saída (gasto)" },
  { value: "income", label: "Entrada" },
  { value: "transfer", label: "Transferência" },
];

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accounts: Account[];
  categories: Category[];
};

function getDefaultDate() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d;
}

export function TransactionCreateModal({
  open,
  onOpenChange,
  accounts,
  categories,
}: Props) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState<Date>(getDefaultDate);
  const [type, setType] = useState("expense");
  const [categoryId, setCategoryId] = useState("");
  const [accountId, setAccountId] = useState("");
  const [localCategories, setLocalCategories] = useState<Pick<Category, "id" | "name" | "type">[]>([]);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [addCategoryLoading, setAddCategoryLoading] = useState(false);
  const [addCategoryError, setAddCategoryError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setDate(getDefaultDate());
      setType("expense");
      setCategoryId("");
      setAccountId("");
      setLocalCategories([]);
      setShowAddCategory(false);
      setNewCategoryName("");
      setAddCategoryError(null);
    }
  }, [open]);

  const allCategories = [...categories, ...localCategories];
  const categoryItems: { value: string; label: string }[] = [
    { value: NONE_VALUE, label: "Selecione (opcional)" },
    ...uniqueCategoriesByName(allCategories).map((c) => ({ value: c.id, label: c.name })),
  ];

  const categoryType = type === "transfer" ? "expense" : type;
  const canAddCategory = categoryType === "income" || categoryType === "expense";

  async function handleAddCategory() {
    const name = newCategoryName.trim();
    if (!name) return;
    setAddCategoryError(null);
    setAddCategoryLoading(true);
    const result = await createCategoryIfNotExists(name, categoryType as "income" | "expense");
    setAddCategoryLoading(false);
    if (result.ok) {
      setLocalCategories((prev) => [...prev, result.category]);
      setCategoryId(result.category.id);
      setNewCategoryName("");
      setShowAddCategory(false);
      router.refresh();
    } else {
      setAddCategoryError(result.error);
    }
  }
  const accountItems: { value: string; label: string }[] = [
    { value: NONE_VALUE, label: "Selecione a conta" },
    ...accounts.map((a) => ({ value: a.id, label: a.name })),
  ];

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (!accountId) {
      setError("Selecione uma conta");
      return;
    }
    setLoading(true);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const accountIdVal = formData.get("accountId") as string;
    const categoryIdVal = (formData.get("categoryId") as string) || null;
    const amount = formData.get("amount") as string;
    const typeVal = formData.get("type") as "income" | "expense" | "transfer";
    const description = (formData.get("description") as string) || null;
    const dateVal = formData.get("date") as string;
    const isRecurring = formData.get("isRecurring") === "on";

    const result = await createTransaction({
      accountId: accountIdVal,
      categoryId: categoryIdVal?.trim() || null,
      amount: Number(amount.replaceAll(",", ".")),
      type: typeVal,
      description: description?.trim() || null,
      date: dateVal,
      isRecurring,
    });
    setLoading(false);

    if (result.ok) {
      router.refresh();
      onOpenChange(false);
      form.reset();
      setDate(getDefaultDate());
      setType("expense");
      setCategoryId("");
      setAccountId("");
    } else {
      setError(result.error ?? "Erro ao criar transação");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100 sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nova transação</DialogTitle>
          <DialogDescription className="text-zinc-500">
            Adicione uma entrada, saída ou gasto futuro. A data pode ser hoje ou qualquer dia no futuro.
          </DialogDescription>
        </DialogHeader>
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p className="text-sm text-red-500 bg-red-500/10 rounded-md px-3 py-2">
              {error}
            </p>
          )}
          <input type="hidden" name="date" value={date ? date.toISOString().slice(0, 10) : ""} />
          <input type="hidden" name="type" value={type} />
          <input type="hidden" name="categoryId" value={categoryId} />
          <input type="hidden" name="accountId" value={accountId} />
          <div className="grid gap-2">
            <Label className="text-zinc-400">Data</Label>
            <DatePicker
              value={date}
              onChange={(d) => d && setDate(d)}
              placeholder="Selecione a data"
              className="h-10"
            />
          </div>
          <div className="grid gap-2">
            <Label className="text-zinc-400">Tipo</Label>
            <Select
              value={type}
              onValueChange={(value) =>
                setType(value as "income" | "expense" | "transfer")
              }
            >
              <SelectTrigger className="h-10 w-full border-zinc-700 bg-zinc-800 text-zinc-200 placeholder:text-zinc-500">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent className="border-zinc-800 bg-zinc-900">
                <SelectGroup>
                  <SelectLabel>Tipo</SelectLabel>
                  {TYPE_ITEMS.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="amount" className="text-zinc-400">
              Valor (R$)
            </Label>
            <Input
              id="amount"
              name="amount"
              type="text"
              inputMode="decimal"
              placeholder="0,00"
              required
              className="bg-zinc-800 border-zinc-700"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description" className="text-zinc-400">
              Descrição
            </Label>
            <Input
              id="description"
              name="description"
              placeholder="Ex: Supermercado, Conta de luz..."
              className="bg-zinc-800 border-zinc-700"
            />
          </div>
          <div className="grid gap-2">
            <div className="flex items-center justify-between gap-2">
              <Label className="text-zinc-400">Categoria</Label>
              {canAddCategory && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1.5 text-zinc-400 hover:text-zinc-200"
                  onClick={() => {
                    setShowAddCategory((v) => !v);
                    setAddCategoryError(null);
                    if (!showAddCategory) setNewCategoryName("");
                  }}
                >
                  <Plus className="h-4 w-4" />
                  Adicionar categoria
                </Button>
              )}
            </div>
            {showAddCategory ? (
              <div className="flex flex-col gap-2 rounded-lg border border-zinc-700 bg-zinc-800/50 p-3">
                <Input
                  placeholder="Nome da nova categoria"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddCategory();
                    }
                  }}
                  className="h-9 bg-zinc-800 border-zinc-700"
                />
                {addCategoryError && (
                  <p className="text-xs text-red-500">{addCategoryError}</p>
                )}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-zinc-600"
                    onClick={() => {
                      setShowAddCategory(false);
                      setNewCategoryName("");
                      setAddCategoryError(null);
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700"
                    disabled={!newCategoryName.trim() || addCategoryLoading}
                    onClick={handleAddCategory}
                  >
                    {addCategoryLoading ? "Adicionando..." : "Adicionar"}
                  </Button>
                </div>
              </div>
            ) : (
              <Select
                value={categoryId || NONE_VALUE}
                onValueChange={(value) => setCategoryId(value === NONE_VALUE ? "" : value)}
              >
                <SelectTrigger className="h-10 w-full border-zinc-700 bg-zinc-800 text-zinc-200 placeholder:text-zinc-500">
                  <SelectValue placeholder="Selecione (opcional)" />
                </SelectTrigger>
                <SelectContent className="border-zinc-800 bg-zinc-900">
                  <SelectGroup>
                    <SelectLabel>Categorias</SelectLabel>
                    {categoryItems.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            )}
          </div>
          <div className="grid gap-2">
            <Label className="text-zinc-400">Conta</Label>
            <Select
              value={accountId || NONE_VALUE}
              onValueChange={(value) => setAccountId(value === NONE_VALUE ? "" : value)}
            >
              <SelectTrigger className="h-10 w-full border-zinc-700 bg-zinc-800 text-zinc-200 placeholder:text-zinc-500">
                <SelectValue placeholder="Selecione a conta" />
              </SelectTrigger>
              <SelectContent className="border-zinc-800 bg-zinc-900">
                <SelectGroup>
                  <SelectLabel>Contas</SelectLabel>
                  {accountItems.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="isRecurring" name="isRecurring" className="border-zinc-600" />
            <Label htmlFor="isRecurring" className="text-sm text-zinc-400 cursor-pointer">
              Transação recorrente
            </Label>
          </div>
          <DialogFooter className="gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-zinc-700"
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-700">
              {loading ? "Salvando..." : "Criar transação"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
