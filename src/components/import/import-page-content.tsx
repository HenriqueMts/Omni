"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty";
import { Button } from "@/components/ui/button";
import { StatementUploadCard } from "./statement-upload-card";
import type { Account } from "@/db/schema";
import { Wallet } from "lucide-react";

type Props = Readonly<{ accounts: Account[] }>;

export function ImportPageContent({ accounts }: Props) {
  const hasAccounts = accounts.length > 0;

  if (!hasAccounts) {
    return (
      <Card className="bg-zinc-900 border-zinc-800 animate-fade-in-up animate-opacity-0 animate-delay-2">
        <CardContent className="p-0">
          <Empty className="border-0 border-zinc-800 border-dashed rounded-lg py-12">
            <EmptyHeader>
              <EmptyMedia variant="icon" className="bg-amber-500/10 text-amber-500">
                <Wallet className="size-6" />
              </EmptyMedia>
              <EmptyTitle className="text-zinc-200">
                Nenhuma conta cadastrada
              </EmptyTitle>
              <EmptyDescription className="text-zinc-500">
                Cadastre pelo menos uma conta para poder importar extratos.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
                <Link href="/dashboard/accounts">Cadastrar conta</Link>
              </Button>
            </EmptyContent>
          </Empty>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="animate-fade-in-up animate-opacity-0 animate-delay-2">
      <StatementUploadCard accounts={accounts} />
    </div>
  );
}
