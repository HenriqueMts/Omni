"use client";

import { useState } from "react";
import { login, signup } from "./actions";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");

  return (
    <div className="flex min-h-svh w-full items-center justify-center bg-zinc-950 px-4 py-8">
      <Card className="w-full max-w-[420px] min-w-0 shrink-0 border-zinc-800 bg-zinc-900/50 text-zinc-50 shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Finance AI</CardTitle>
          <CardDescription className="text-zinc-400">
            Entre para gerenciar suas finanças com inteligência.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as "login" | "register")}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 bg-zinc-800/80 p-1 transition-colors duration-200">
              <TabsTrigger value="login" className="transition-all duration-200 ease-out">
                Login
              </TabsTrigger>
              <TabsTrigger value="register" className="transition-all duration-200 ease-out">
                Cadastro
              </TabsTrigger>
            </TabsList>

            <div className="relative min-h-[280px] w-full overflow-hidden pt-4">
              <TabsContent
                value="login"
                forceMount
                className={cn(
                  "absolute inset-x-0 top-4 m-0 transition-all duration-300 ease-out",
                  "data-[state=active]:translate-y-0 data-[state=active]:opacity-100",
                  "data-[state=inactive]:pointer-events-none data-[state=inactive]:-translate-y-2 data-[state=inactive]:opacity-0"
                )}
              >
                <form action={login} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="seu@email.com"
                      required
                      className="bg-zinc-950 border-zinc-700"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Senha</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      required
                      className="bg-zinc-950 border-zinc-700"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-white text-black hover:bg-zinc-200"
                  >
                    Entrar
                  </Button>
                </form>
              </TabsContent>

              <TabsContent
                value="register"
                forceMount
                className={cn(
                  "absolute inset-x-0 top-4 m-0 transition-all duration-300 ease-out",
                  "data-[state=active]:translate-y-0 data-[state=active]:opacity-100",
                  "data-[state=inactive]:pointer-events-none data-[state=inactive]:translate-y-2 data-[state=inactive]:opacity-0"
                )}
              >
                <form action={signup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Nome Completo</Label>
                    <Input
                      id="fullName"
                      name="fullName"
                      type="text"
                      placeholder="João Silva"
                      required
                      className="bg-zinc-950 border-zinc-700"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email-register">Email</Label>
                    <Input
                      id="email-register"
                      name="email"
                      type="email"
                      placeholder="seu@email.com"
                      required
                      className="bg-zinc-950 border-zinc-700"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password-register">Senha</Label>
                    <Input
                      id="password-register"
                      name="password"
                      type="password"
                      required
                      className="bg-zinc-950 border-zinc-700"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-white text-black hover:bg-zinc-200"
                  >
                    Criar Conta
                  </Button>
                </form>
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
