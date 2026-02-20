"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty";
import { Badge } from "@/components/ui/badge";
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxCollection,
  ComboboxEmpty,
} from "@/components/ui/combobox";
import { DateRangePicker, type DateRange } from "@/components/ui/date-picker";
import { TransactionCreateModal } from "./transaction-create-modal";
import type { TransactionWithDetails } from "@/services/transactions";
import { uniqueCategoriesByName } from "@/lib/categories";
import type { Account, Category } from "@/db/schema";
import {
  ArrowUpCircle,
  ArrowDownCircle,
  Plus,
  Search,
  Filter,
  Sparkles,
  Calendar,
} from "lucide-react";

type Filters = {
  dateFrom?: string;
  dateTo?: string;
  type?: string;
  categoryId?: string;
  accountId?: string;
  search?: string;
};

const TYPE_LABELS: Record<string, string> = {
  income: "Entrada",
  expense: "Saída",
  transfer: "Transferência",
};

const TYPE_ITEMS: { value: string; label: string }[] = [
  { value: "", label: "Todos" },
  { value: "income", label: "Entrada" },
  { value: "expense", label: "Saída" },
  { value: "transfer", label: "Transferência" },
];

function toDateRange(dateFrom?: string, dateTo?: string): DateRange {
  const from = dateFrom ? new Date(dateFrom + "T12:00:00") : undefined;
  const to = dateTo ? new Date(dateTo + "T12:00:00") : undefined;
  return { from, to };
}

export function TransactionsContent({
  transactions,
  accounts,
  categories,
  filters,
}: {
  transactions: TransactionWithDetails[];
  accounts: Account[];
  categories: Category[];
  filters: Filters;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const isFirstRenderRef = useRef(true);
  const syncingFromUrlRef = useRef(false);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>(() =>
    toDateRange(filters.dateFrom, filters.dateTo)
  );
  const [filterType, setFilterType] = useState(filters.type ?? "");
  const [filterCategoryId, setFilterCategoryId] = useState(filters.categoryId ?? "");
  const [filterAccountId, setFilterAccountId] = useState(filters.accountId ?? "");
  const [filterSearch, setFilterSearch] = useState(filters.search ?? "");
  const [appliedSearch, setAppliedSearch] = useState(filters.search ?? "");

  useEffect(() => {
    syncingFromUrlRef.current = true;
    setDateRange(toDateRange(filters.dateFrom, filters.dateTo));
    setFilterType(filters.type ?? "");
    setFilterCategoryId(filters.categoryId ?? "");
    setFilterAccountId(filters.accountId ?? "");
    setFilterSearch(filters.search ?? "");
    setAppliedSearch(filters.search ?? "");
  }, [filters.dateFrom, filters.dateTo, filters.type, filters.categoryId, filters.accountId, filters.search]);

  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => setAppliedSearch(filterSearch), 400);
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [filterSearch]);

  function applyFiltersToUrl() {
    const params = new URLSearchParams();
    if (dateRange.from) params.set("dateFrom", dateRange.from.toISOString().slice(0, 10));
    if (dateRange.to) params.set("dateTo", dateRange.to.toISOString().slice(0, 10));
    if (filterType) params.set("type", filterType);
    if (filterCategoryId) params.set("categoryId", filterCategoryId);
    if (filterAccountId) params.set("accountId", filterAccountId);
    if (appliedSearch.trim()) params.set("search", appliedSearch.trim());
    router.push(`/dashboard/transactions?${params.toString()}`);
  }

  useEffect(() => {
    if (syncingFromUrlRef.current) {
      syncingFromUrlRef.current = false;
      return;
    }
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      return;
    }
    applyFiltersToUrl();
  }, [dateRange, filterType, filterCategoryId, filterAccountId, appliedSearch]);

  const incomeTotal = transactions
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + Number(t.amount), 0);
  const expenseTotal = transactions
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + Number(t.amount), 0);
  const today = new Date().toISOString().slice(0, 10);
  const futureCount = transactions.filter((t) => t.date > today).length;

  const categoryItems = [
    { value: "", label: "Todas" },
    ...uniqueCategoriesByName(categories).map((c) => ({ value: c.id, label: c.name })),
  ];
  const accountItems = [
    { value: "", label: "Todas" },
    ...accounts.map((a) => ({ value: a.id, label: a.name })),
  ];

  function handleFilterSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    setAppliedSearch(filterSearch);
  }

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between animate-fade-in-up animate-opacity-0 animate-delay-2">
        <Button onClick={() => setCreateOpen(true)} className="gap-2 border border-zinc-600">
          <Plus className="h-4 w-4" />
          Nova transação
        </Button>
        <Link href="/dashboard/transactions">
          <Button variant="outline" size="sm" className="border-zinc-700 text-zinc-400">
            Limpar filtros
          </Button>
        </Link>
      </div>

      <Card className="bg-zinc-900 border-zinc-800 animate-fade-in-up animate-opacity-0 animate-delay-3">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-zinc-400 flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filtros
          </CardTitle>
          <CardDescription className="text-zinc-500">
            Filtre por período, tipo, categoria, conta ou descrição
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form ref={formRef} onSubmit={handleFilterSubmit} className="flex flex-wrap items-end gap-4">
            <div className="grid gap-1.5 min-w-[200px]">
              <Label className="text-zinc-400 text-xs">Período</Label>
              <DateRangePicker
                value={dateRange}
                onChange={(range) => setDateRange(range ?? { from: undefined })}
                placeholder="Selecione o período"
                className="h-9 w-full min-w-[200px]"
              />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-zinc-400 text-xs">Tipo</Label>
              <Combobox
                items={TYPE_ITEMS}
                value={TYPE_ITEMS.find((t) => t.value === filterType) ?? TYPE_ITEMS[0]}
                onValueChange={(v) => v && setFilterType(v.value)}
                itemToStringValue={(item) => item.label}
              >
                <ComboboxInput
                  showTrigger
                  showClear={false}
                  placeholder="Todos"
                  className="h-9 w-[130px] border-zinc-700 bg-zinc-800 text-zinc-200 placeholder:text-zinc-500"
                />
                <ComboboxContent className="z-[200] border-zinc-800 bg-zinc-900">
                  <ComboboxList className="scrollbar-dark-translucent">
                    <ComboboxEmpty>Nenhum tipo</ComboboxEmpty>
                    <ComboboxCollection>
                      {(item) => (
                        <ComboboxItem
                          key={item.value}
                          value={item}
                          className="text-zinc-200 data-highlighted:bg-zinc-800 data-highlighted:text-zinc-100"
                        >
                          {item.label}
                        </ComboboxItem>
                      )}
                    </ComboboxCollection>
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>
            </div>
            <div className="grid gap-1.5">
              <Label className="text-zinc-400 text-xs">Categoria</Label>
              <Combobox
                items={categoryItems}
                value={categoryItems.find((c) => c.value === filterCategoryId) ?? categoryItems[0]}
                onValueChange={(v) => v && setFilterCategoryId(v.value)}
                itemToStringValue={(item) => item.label}
              >
                <ComboboxInput
                  showTrigger
                  showClear={false}
                  placeholder="Todas"
                  className="h-9 min-w-[140px] border-zinc-700 bg-zinc-800 text-zinc-200 placeholder:text-zinc-500"
                />
                <ComboboxContent className="z-[200] border-zinc-800 bg-zinc-900">
                  <ComboboxList className="scrollbar-dark-translucent">
                    <ComboboxEmpty>Nenhuma categoria</ComboboxEmpty>
                    <ComboboxCollection>
                      {(item) => (
                        <ComboboxItem
                          key={item.value}
                          value={item}
                          className="text-zinc-200 data-highlighted:bg-zinc-800 data-highlighted:text-zinc-100"
                        >
                          {item.label}
                        </ComboboxItem>
                      )}
                    </ComboboxCollection>
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>
            </div>
            <div className="grid gap-1.5">
              <Label className="text-zinc-400 text-xs">Conta</Label>
              <Combobox
                items={accountItems}
                value={accountItems.find((a) => a.value === filterAccountId) ?? accountItems[0]}
                onValueChange={(v) => v && setFilterAccountId(v.value)}
                itemToStringValue={(item) => item.label}
              >
                <ComboboxInput
                  showTrigger
                  showClear={false}
                  placeholder="Todas"
                  className="h-9 min-w-[140px] border-zinc-700 bg-zinc-800 text-zinc-200 placeholder:text-zinc-500"
                />
                <ComboboxContent className="z-[200] border-zinc-800 bg-zinc-900">
                  <ComboboxList className="scrollbar-dark-translucent">
                    <ComboboxEmpty>Nenhuma conta</ComboboxEmpty>
                    <ComboboxCollection>
                      {(item) => (
                        <ComboboxItem
                          key={item.value}
                          value={item}
                          className="text-zinc-200 data-highlighted:bg-zinc-800 data-highlighted:text-zinc-100"
                        >
                          {item.label}
                        </ComboboxItem>
                      )}
                    </ComboboxCollection>
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>
            </div>
            <div className="grid gap-1.5 flex-1 min-w-[180px]">
              <Label className="text-zinc-400 text-xs">Buscar descrição</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <Input
                  name="search"
                  placeholder="Ex: mercado, salário..."
                  value={filterSearch}
                  onChange={(e) => setFilterSearch(e.target.value)}
                  className="pl-8 h-9 bg-zinc-800 border-zinc-700"
                />
              </div>
            </div>
            <Button type="submit" variant="secondary" size="sm" className="bg-zinc-800 hover:bg-zinc-700">
              Filtrar
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3 animate-fade-in-up animate-opacity-0 animate-delay-4">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Entradas (período)</CardTitle>
            <ArrowUpCircle className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold text-emerald-500">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(incomeTotal)}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Saídas (período)</CardTitle>
            <ArrowDownCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold text-red-500">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(expenseTotal)}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400 flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Gastos futuros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold text-zinc-100">{futureCount} agendada(s)</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-zinc-900 border-zinc-800 animate-fade-in-up animate-opacity-0 animate-delay-5">
        <CardHeader>
          <CardTitle className="text-zinc-100">Lista de transações</CardTitle>
          <CardDescription className="text-zinc-500">
            {transactions.length} transação(ões) no período
          </CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon" className="bg-zinc-800 text-zinc-500">
                <ArrowDownCircle className="size-6" />
              </EmptyMedia>
                <EmptyTitle>Nenhuma transação encontrada</EmptyTitle>
                <EmptyDescription>
                  Ajuste os filtros ou importe extratos pela IA para ver transações aqui.
                  Você também pode adicionar gastos futuros manualmente.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button onClick={() => setCreateOpen(true)} className="gap-2 border border-zinc-600">
                  <Plus className="h-4 w-4" />
                  Nova transação
                </Button>
              </EmptyContent>
            </Empty>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800 hover:bg-transparent">
                  <TableHead className="text-zinc-400">Data</TableHead>
                  <TableHead className="text-zinc-400">Descrição</TableHead>
                  <TableHead className="text-zinc-400">Categoria</TableHead>
                  <TableHead className="text-zinc-400">Conta</TableHead>
                  <TableHead className="text-zinc-400">Tipo</TableHead>
                  <TableHead className="text-zinc-400 text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((t) => {
                  const isFuture = t.date > today;
                  return (
                    <TableRow
                      key={t.id}
                      className="border-zinc-800 hover:bg-zinc-800/50"
                    >
                      <TableCell className="text-zinc-300 font-medium">
                        <span className={isFuture ? "text-amber-400/90" : ""}>
                          {new Date(t.date + "T12:00:00").toLocaleDateString("pt-BR")}
                        </span>
                        {isFuture && (
                          <Badge variant="outline" className="ml-1.5 border-amber-500/50 text-amber-400 text-[10px]">
                            Futuro
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="max-w-[200px]">
                        <span className="truncate block text-zinc-200">
                          {t.description || "—"}
                        </span>
                      </TableCell>
                      <TableCell className="text-zinc-400">
                        {t.categoryName ?? "—"}
                      </TableCell>
                      <TableCell className="text-zinc-400">
                        {t.accountName ?? "—"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            t.type === "income"
                              ? "border-emerald-500/50 text-emerald-400"
                              : t.type === "expense"
                                ? "border-red-500/50 text-red-400"
                                : "border-zinc-500 text-zinc-400"
                          }
                        >
                          {t.aiGenerated && (
                            <Sparkles className="h-3 w-3 mr-1 opacity-80" />
                          )}
                          {TYPE_LABELS[t.type] ?? t.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        <span
                          className={
                            t.type === "income"
                              ? "text-emerald-500"
                              : t.type === "expense"
                                ? "text-red-500"
                                : "text-zinc-400"
                          }
                        >
                          {t.type === "income" ? "+" : t.type === "expense" ? "−" : ""}
                          {new Intl.NumberFormat("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          }).format(Number(t.amount))}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <TransactionCreateModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        accounts={accounts}
        categories={categories}
      />
    </>
  );
}
