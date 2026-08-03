import * as pdfjsLib from "pdfjs-dist";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

// Renders a PDF's first page to a PNG File, for using a PDF flyer as an image banner
// without asking the admin to separately export/upload an image version themselves.
export async function pdfFirstPageToPngFile(file) {
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  const page = await pdf.getPage(1);
  const viewport = page.getViewport({ scale: 2 });
  const canvas = document.createElement("canvas");
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  await page.render({ canvasContext: canvas.getContext("2d"), viewport }).promise;
  const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/png"));
  if (!blob) return null;
  const baseName = file.name.replace(/\.pdf$/i, "");
  return new File([blob], `${baseName}-preview.png`, { type: "image/png" });
}
