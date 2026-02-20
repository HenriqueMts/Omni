"use client";

import { useState } from "react";
import Link from "next/link";
import { login, signup } from "./actions";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");

  return (
    <div className="grid min-h-svh w-full grid-cols-1 lg:grid-cols-[1fr_1.1fr] bg-zinc-950">
      {/* Header: logo + link */}
      <header className="fixed top-0 left-0 right-0 z-10 flex items-center justify-between px-6 py-4 lg:px-8">
        <Link href="/login" className="flex items-center gap-2 text-zinc-100 font-semibold">
          <span className="text-lg">Omni</span>
        </Link>
        {activeTab === "login" ? (
          <Link
            href="/login"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab("register");
            }}
            className="text-sm text-zinc-400 hover:text-zinc-100 transition-colors"
          >
            Criar conta
          </Link>
        ) : (
          <Link
            href="/login"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab("login");
            }}
            className="text-sm text-zinc-400 hover:text-zinc-100 transition-colors"
          >
            Login
          </Link>
        )}
      </header>

      {/* Coluna esquerda: textos */}
      <div className="relative flex min-h-svh flex-col justify-end px-8 pb-16 pt-24 lg:px-12 lg:pb-20 lg:pt-28">
        <div className="max-w-md space-y-6">
          <h2 className="text-2xl font-semibold leading-tight text-zinc-100 lg:text-3xl">
            Controle sua vida financeira
          </h2>
          <p className="text-base leading-relaxed text-zinc-400 lg:text-lg">
            Uma visão clara das suas contas, transações, cartão de crédito e relatórios em um só lugar.
            Importe extratos, analise gastos e tome decisões com mais segurança.
          </p>
          <blockquote className="border-l-2 border-emerald-500/50 pl-4 text-sm text-zinc-500 italic lg:text-base">
            &ldquo;O Omni me ajudou a organizar minhas finanças e enxergar para onde vai cada real.&rdquo;
          </blockquote>
        </div>
      </div>

      {/* Coluna direita: formulário */}
      <div className="flex min-h-svh flex-col items-center justify-center bg-zinc-900/80 px-6 py-24 lg:px-12 lg:py-16">
        <div className="w-full max-w-[380px] space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold text-zinc-100">
              {activeTab === "login" ? "Entrar" : "Criar conta"}
            </h1>
            <p className="text-sm text-zinc-500">
              {activeTab === "login"
                ? "Use seu email e senha para acessar."
                : "Preencha abaixo para criar sua conta."}
            </p>
          </div>

          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as "login" | "register")}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 bg-zinc-800/80 p-1 rounded-lg">
              <TabsTrigger
                value="login"
                className="rounded-md transition-all data-[state=active]:bg-zinc-700 data-[state=active]:text-zinc-100"
              >
                Login
              </TabsTrigger>
              <TabsTrigger
                value="register"
                className="rounded-md transition-all data-[state=active]:bg-zinc-700 data-[state=active]:text-zinc-100"
              >
                Cadastro
              </TabsTrigger>
            </TabsList>

            <div className="relative min-h-[260px] w-full overflow-hidden pt-6">
              <TabsContent
                value="login"
                forceMount
                className={cn(
                  "absolute inset-x-0 top-6 m-0 transition-all duration-300 ease-out",
                  "data-[state=active]:translate-y-0 data-[state=active]:opacity-100",
                  "data-[state=inactive]:pointer-events-none data-[state=inactive]:-translate-y-2 data-[state=inactive]:opacity-0"
                )}
              >
                <form action={login} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-zinc-300">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="seu@email.com"
                      required
                      className="bg-zinc-950 border-zinc-700 text-zinc-100 placeholder:text-zinc-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-zinc-300">Senha</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      required
                      className="bg-zinc-950 border-zinc-700 text-zinc-100"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-zinc-100 text-zinc-900 hover:bg-zinc-200"
                  >
                    Entrar
                  </Button>
                </form>
              </TabsContent>

              <TabsContent
                value="register"
                forceMount
                className={cn(
                  "absolute inset-x-0 top-6 m-0 transition-all duration-300 ease-out",
                  "data-[state=active]:translate-y-0 data-[state=active]:opacity-100",
                  "data-[state=inactive]:pointer-events-none data-[state=inactive]:translate-y-2 data-[state=inactive]:opacity-0"
                )}
              >
                <form action={signup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-zinc-300">Nome completo</Label>
                    <Input
                      id="fullName"
                      name="fullName"
                      type="text"
                      placeholder="João Silva"
                      required
                      className="bg-zinc-950 border-zinc-700 text-zinc-100 placeholder:text-zinc-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email-register" className="text-zinc-300">Email</Label>
                    <Input
                      id="email-register"
                      name="email"
                      type="email"
                      placeholder="seu@email.com"
                      required
                      className="bg-zinc-950 border-zinc-700 text-zinc-100 placeholder:text-zinc-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password-register" className="text-zinc-300">Senha</Label>
                    <Input
                      id="password-register"
                      name="password"
                      type="password"
                      required
                      className="bg-zinc-950 border-zinc-700 text-zinc-100"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-zinc-100 text-zinc-900 hover:bg-zinc-200"
                  >
                    Criar conta
                  </Button>
                </form>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
