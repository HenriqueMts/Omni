# Omni — Roadmap do Produto

App de finanças que centraliza todas as finanças, com Open Finance, IA para relatórios e análises, e upload de extratos para preenchimento automático.

---

## Base atual (onde estamos)

- **Stack:** Next.js 16, Supabase (auth + DB), Tailwind, shadcn/ui.
- **Dashboard:** Cards de Saldo Total, Entradas, Saídas; placeholder de Fluxo de Caixa; lista de transações recentes (dados do Supabase).
- **Navegação:** Sidebar com Visão Geral, Transações, Contas, Relatórios, Configurações, Ajuda.
- **Auth:** Login com Supabase.

---

## Fase 1 — Layout e experiência (clone do vídeo)

**Objetivo:** Deixar o layout e fluxos parecidos com o app do vídeo.

| #   | Passo                                 | Detalhes                                                                                                            |
| --- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| 1.1 | Documentar o vídeo                    | Anotar: estrutura da home (cards, gráficos, listas), menu, cores, tipografia, se há abas, filtros por período, etc. |
| 1.2 | Ajustar estrutura da home             | Reorganizar dashboard (ordem dos cards, tamanhos, grid) conforme referência; manter dados atuais (Supabase).        |
| 1.3 | Implementar gráfico de Fluxo de Caixa | Escolher lib (ex.: Recharts, Tremor) e exibir evolução de entradas/saídas/saldo no tempo (dados reais do Supabase). |
| 1.4 | Páginas vazias → esqueletos           | Transações, Contas, Relatórios: páginas com layout e navegação certas, conteúdo “em breve” ou listas vazias.        |
| 1.5 | Header e navegação                    | Título dinâmico por rota, breadcrumb se o vídeo tiver, botões de ação (ex.: “Nova transação”) onde fizer sentido.   |

**Entregável:** Layout “clone” do vídeo com dados reais na home e rotas prontas para as próximas fases.

---

## Fase 2 — Dados e transações (base para IA e Open Finance)

**Objetivo:** Modelo de dados sólido e CRUD de transações/contas.

| #   | Passo                       | Detalhes                                                                                                                                                 |
| --- | --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2.1 | Revisar schema no Supabase  | Tabelas: `accounts` (contas bancárias/carteiras), `transactions` (já existe?), `categories`, `banks`, `users`/perfil. Relacionamentos e RLS por usuário. |
| 2.2 | Contas (accounts)           | CRUD de contas: nome, tipo (conta corrente, cartão, investimento), instituição (texto ou FK para `banks`), saldo inicial. Listagem na página Contas.     |
| 2.3 | Categorização               | Tabela `categories` (nome, tipo income/expense, ícone/cor). Ao criar/editar transação, seleção de categoria.                                             |
| 2.4 | Transações completas        | Página Transações: listagem com filtros (período, conta, categoria, tipo), criação/edição manual, vínculo com `account_id` e `category_id`.              |
| 2.5 | Sincronizar KPIs e recentes | Garantir que Saldo Total, Entradas, Saídas e “Recentes” usem as mesmas tabelas e regras (por conta ou consolidado).                                      |

**Entregável:** Usuário consegue cadastrar contas, categorias e transações manualmente; dashboard e transações refletem esses dados.

---

## Fase 3 — Upload de extratos e IA para preenchimento

**Objetivo:** Upload de extrato (PDF/OFX/CSV) e IA preenchendo gastos, entradas, cartões, etc.

| #   | Passo                        | Detalhes                                                                                                                                                                                                          |
| --- | ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 3.1 | Upload e armazenamento       | Endpoint/Server Action para upload; salvar arquivo no Supabase Storage (bucket privado por usuário).                                                                                                              |
| 3.2 | Extração de texto            | PDF → texto (lib ou serviço; ex.: pdf-parse, ou API). OFX/CSV: parsing direto.                                                                                                                                    |
| 3.3 | IA para extração estruturada | Enviar texto (ou linhas do OFX/CSV) para um LLM (OpenAI, Claude, ou modelo local) com prompt estruturado: “liste transações: data, descrição, valor, tipo (entrada/saída), categoria sugerida”. Resposta em JSON. |
| 3.4 | Tela de revisão              | Após processamento: tabela com transações extraídas; usuário pode editar categoria, valor, conta; checkboxes para “importar” ou “ignorar”.                                                                        |
| 3.5 | Persistência e deduplicação  | Inserir em `transactions` só as aprovadas; evitar duplicata por (data, valor, descrição, conta) na mesma importação ou em imports anteriores.                                                                     |
| 3.6 | Tipos de extrato             | Priorizar 1 formato (ex.: PDF de um banco específico ou OFX); depois generalizar para outros bancos/formatos.                                                                                                     |

**Entregável:** Upload de extrato → IA extrai transações → usuário revisa e confirma → transações aparecem em Transações e no dashboard.

---

## Fase 4 — Open Finance

**Objetivo:** Conectar contas bancárias reais (quando possível) para trazer saldos e movimentações.

| #   | Passo                      | Detalhes                                                                                                                                                                                     |
| --- | -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 4.1 | Escolher provedor          | Usar uma API de Open Finance no Brasil (ex.: Pluggy, Belvo, Quanto, etc.) para conexão com bancos e leitura de transações/saldos.                                                            |
| 4.2 | Fluxo de conexão           | Tela “Conectar conta”: redirect ou widget do provedor → usuário autoriza no banco → callback com `account_id` e tokens; salvar em `accounts` + tabela de tokens/credentials (criptografado). |
| 4.3 | Sincronização periódica    | Job (cron ou queue) que, para cada conta conectada, chama a API do provedor, busca transações novas e insere/atualiza em `transactions` (com flag `source: 'open_finance'`).                 |
| 4.4 | Unificar com dados manuais | Dashboard e Transações mostram tudo junto (manual + Open Finance); filtro por “fonte” (manual, extrato, open finance) opcional.                                                              |
| 4.5 | Consentimento e LGPD       | Telas de consentimento, aviso de dados sensíveis e opção de revogar conexão; documentação de uso dos dados.                                                                                  |

**Entregável:** Usuário pode conectar uma ou mais contas via Open Finance; transações e saldos são atualizados periodicamente.

---

## Fase 5 — IA: relatórios, apontamentos e análise crítica

**Objetivo:** Relatórios e análises gerados por IA a partir dos dados do usuário.

| #   | Passo                                  | Detalhes                                                                                                                                                                                 |
| --- | -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 5.1 | Dados para a IA                        | Agregar por período (mês/ano): totais por categoria, entradas/saídas, contas. Enviar resumo estruturado (JSON ou texto) no contexto do LLM.                                              |
| 5.2 | Relatórios automáticos                 | Geração de “Relatório do mês”: texto com resumo, principais gastos, comparação com mês anterior; opção de download (PDF) ou apenas exibição na tela.                                     |
| 5.3 | Apontamentos de melhoria               | Prompt focado em “sugestões de melhoria”: gastos altos em categoria X, oportunidade de poupar, alertas de assinaturas, etc. Exibir como lista ou cards na área de Relatórios ou na home. |
| 5.4 | Análise crítica de controle financeiro | Seção “Análise crítica”: texto da IA avaliando disciplina, tendências, risco de endividamento, comparação com metas (quando houver).                                                     |
| 5.5 | Interface de Relatórios                | Página Relatórios com abas ou seções: “Resumo”, “Sugestões”, “Análise crítica”, “Relatório mensal”; botão “Gerar” ou geração sob demanda com cache (ex.: 24h).                           |
| 5.6 | Segurança e custo                      | Não enviar dados sensíveis desnecessários; resumos anonimizados quando possível; controlar tokens (resumo fixo) e cache para reduzir chamadas ao LLM.                                    |

**Entregável:** Relatórios, sugestões e análise crítica gerados por IA a partir dos dados reais do usuário.

---

## Fase 6 — Refino e escala

| #   | Passo               | Detalhes                                                                                                                         |
| --- | ------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| 6.1 | Metas e orçamento   | Tabela `goals` ou `budgets` (ex.: limite por categoria/mês); dashboard ou Relatórios mostrando “dentro do orçamento” ou alertas. |
| 6.2 | Notificações        | Alertas (email ou in-app): gasto alto, conta conectada com falha, relatório pronto.                                              |
| 6.3 | Performance e cache | Cache de agregados (por período) para dashboard e relatórios; invalidação ao importar transações ou ao sincronizar Open Finance. |
| 6.4 | Testes e deploy     | Testes críticos (auth, importação, sincronização); CI/CD; ambiente de staging; documentação mínima para rodar o projeto.         |

---

## Ordem sugerida de execução

1. **Fase 1** — Layout (clone do vídeo) para alinhar visual e fluxos.
2. **Fase 2** — Dados e transações para ter base real para IA e Open Finance.
3. **Fase 3** — Upload de extratos + IA para preenchimento automático (alto valor e independente de Open Finance).
4. **Fase 5** — IA para relatórios e análise (usa os dados já existentes).
5. **Fase 4** — Open Finance (depende de contrato com provedor e fluxo de consentimento).
6. **Fase 6** — Refino (metas, notificações, performance).

---

## Próximo passo imediato

- **Se quiser priorizar o layout:** descreva (ou envie prints) das telas do vídeo (home, menu, transações, relatórios) para detalharmos os ajustes na estrutura atual (dashboard, sidebar, header).
- **Se quiser priorizar funcionalidade:** podemos começar pela Fase 2 (schema Supabase + CRUD de contas e transações) ou pela Fase 3 (upload de extrato + prompt de IA para extração).

Quando você disser qual prioridade prefere (layout vs. upload vs. Open Finance vs. relatórios IA), dá para quebrar a fase escolhida em tarefas técnicas diretas (arquivos, componentes e endpoints) e implementar em cima da base que você já tem.
