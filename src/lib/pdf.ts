export async function extractTextFromPdf(
  data: Uint8Array,
  password?: string | null,
): Promise<string> {
  const pdfParse = await import("pdf-parse");
  const buffer = Buffer.from(data);
  
  // Se não há senha informada, tenta primeiro sem senha
  if (!password || !password.trim()) {
    try {
      const pdfData = await pdfParse.default(buffer);
      return pdfData.text || "";
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      // Se o erro indica que precisa de senha, relança erro específico
      if (
        errorMsg.toLowerCase().includes("password") ||
        errorMsg.toLowerCase().includes("encrypted") ||
        errorMsg.toLowerCase().includes("needs password")
      ) {
        const error = new Error("PDF_PASSWORD_REQUIRED");
        (error as any).isPasswordError = true;
        (error as any).needsPassword = true;
        throw error;
      }
      throw err;
    }
  }
  
  // Se há senha informada, tenta primeiro com pdf-parse
  const trimmedPassword = password.trim();
  try {
    // pdf-parse aceita password em runtime; @types/pdf-parse não declara a propriedade
    const opts = { password: trimmedPassword };
    const pdfData = await pdfParse.default(buffer, opts as Parameters<typeof pdfParse.default>[1]);
    return pdfData.text || "";
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    
    // Se pdf-parse falhou com erro de senha, tenta com pdfjs-dist como fallback
    // (pdfjs-dist pode suportar melhor alguns tipos de criptografia)
    const isPasswordError =
      errorMsg.toLowerCase().includes("password") ||
      errorMsg.toLowerCase().includes("encrypted") ||
      errorMsg.toLowerCase().includes("invalid password") ||
      errorMsg.toLowerCase().includes("incorrect password") ||
      errorMsg.toLowerCase().includes("authentication failed");
    
    if (isPasswordError) {
      // Tenta com pdfjs-dist como fallback
      try {
        return await extractTextFromPdfWithPdfjs(data, trimmedPassword);
      } catch (pdfjsErr) {
        // Se pdfjs-dist também falhar, retorna erro de senha
        const error = new Error("PDF_PASSWORD_REQUIRED");
        (error as any).isPasswordError = true;
        (error as any).needsPassword = false;
        (error as any).originalMessage = errorMsg;
        throw error;
      }
    }
    
    // Outros erros são relançados normalmente
    throw err;
  }
}

async function extractTextFromPdfWithPdfjs(
  data: Uint8Array,
  password: string,
): Promise<string> {
  const path = await import("node:path");
  const { pathToFileURL } = await import("node:url");
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  
  const workerPath = path.join(
    process.cwd(),
    "node_modules",
    "pdfjs-dist",
    "legacy",
    "build",
    "pdf.worker.mjs",
  );
  pdfjs.GlobalWorkerOptions.workerSrc = pathToFileURL(workerPath).href;
  
  const loadingTask = pdfjs.getDocument({
    data,
    password: password.trim(),
    useWorkerFetch: false,
    isEvalSupported: false,
    verbosity: 0,
  });
  
  const pdf = await loadingTask.promise;
  const numPages = pdf.numPages;
  const texts: string[] = [];
  
  for (let i = 1; i <= numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item) => ("str" in item ? item.str : ""))
      .join("");
    texts.push(pageText);
  }
  
  pdf.destroy();
  return texts.join("\n\n");
}

export async function extractTextFromFile(
  file: File,
  password?: string | null,
): Promise<string> {
  if (file.type === "application/pdf") {
    const arrayBuffer = await file.arrayBuffer();
    const data = new Uint8Array(arrayBuffer);
    return extractTextFromPdf(data, password);
  }
  return file.text();
}
