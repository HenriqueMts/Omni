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
  CardFooter,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function LoginPage() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-zinc-950 px-4">
      <Card className="w-full max-w-md border-zinc-800 bg-zinc-900/50 text-zinc-50">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Finance AI</CardTitle>
          <CardDescription className="text-zinc-400">
            Entre para gerenciar suas finanças com inteligência.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-zinc-800">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Cadastro</TabsTrigger>
            </TabsList>

            {/* TAB LOGIN */}
            <TabsContent value="login">
              <form action={login} className="space-y-4 pt-4">
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

            {/* TAB CADASTRO */}
            <TabsContent value="register">
              <form action={signup} className="space-y-4 pt-4">
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
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
