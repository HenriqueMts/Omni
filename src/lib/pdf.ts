export async function extractTextFromPdf(
  data: Uint8Array,
  password?: string | null,
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
    password: password && password.trim() ? password : undefined,
    useWorkerFetch: false,
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
