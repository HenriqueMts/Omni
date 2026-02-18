// Arquivo: listar-modelos.js
import { GoogleGenerativeAI } from "@google/generative-ai";
import { config } from "dotenv";

config({ path: ".env.local" });

async function main() {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    console.error("ERRO: Nenhuma API Key encontrada no .env.local");
    return;
  }

  // Truque: usaremos fetch direto, pois o SDK às vezes abstrai a listagem
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.models) {
      console.log("\n=== MODELOS DISPONÍVEIS PARA SUA CHAVE ===");
      data.models.forEach((m) => {
        // Filtramos apenas os que servem para gerar conteúdo (generateContent)
        if (
          m.supportedGenerationMethods &&
          m.supportedGenerationMethods.includes("generateContent")
        ) {
          console.log(`Nome: ${m.name.replace("models/", "")}`); // Remove o prefixo 'models/'
        }
      });
      console.log("==========================================\n");
    } else {
      console.log("Erro ao listar:", data);
    }
  } catch (error) {
    console.error("Erro na requisição:", error);
  }
}

main();
