// Overlays real values onto the WH/ASMIRT "Certificate of Attendance" template PDF.
// Coordinates below were measured directly against the supplied template
// (Certificate of Attendance Template1.pdf, 841.92 x 595.2pt landscape) using
// pdfplumber word bounding boxes for the four placeholder lines: Name,
// "CPD Session Name", "On Date", and "WSTRNH-003856 / 1 Hour". Adjust here if
// the template artwork ever changes.
import { PDFDocument, PDFFont, StandardFonts, rgb } from "npm:pdf-lib@1.17.1";

const WHITE = rgb(1, 1, 1);
const BLUE = rgb(0.14, 0.42, 0.68);
const BLACK = rgb(0.12, 0.12, 0.12);

function fitFontSize(text: string, font: PDFFont, maxSize: number, minSize: number, maxWidth: number) {
  let size = maxSize;
  while (size > minSize && font.widthOfTextAtSize(text, size) > maxWidth) size -= 1;
  return size;
}

// Guarantees the drawn text never exceeds maxWidth (and so never bleeds into the
// template's side decoration), even for pathologically long event titles.
function truncateToFit(text: string, font: PDFFont, size: number, maxWidth: number) {
  if (font.widthOfTextAtSize(text, size) <= maxWidth) return text;
  let t = text;
  while (t.length > 1 && font.widthOfTextAtSize(t + "…", size) > maxWidth) t = t.slice(0, -1);
  return t + "…";
}

// Measured against the template at several y-bands: the decorative side art starts
// around x=47-70 on the left and x=648-695 on the right within the text region
// (y top=10..355). This keeps generated text comfortably clear of both sides.
const SAFE_HALF_WIDTH = 220;
const TEXT_MAX_WIDTH = SAFE_HALF_WIDTH * 2;
const ERASE_WIDTH = TEXT_MAX_WIDTH + 20;

export type CertificateFields = {
  name: string;
  sessionName: string;
  dateLabel: string; // e.g. "On Tuesday, 4 August 2026"
  code: string | null; // ASMIRT endorsement code, omitted when blank
  hoursLabel: string; // e.g. "3.5 Hours"
};

export async function buildCertificatePdf(templateBytes: Uint8Array, fields: CertificateFields): Promise<Uint8Array> {
  const doc = await PDFDocument.load(templateBytes);
  const page = doc.getPages()[0];
  const { width: PW, height: PH } = page.getSize();
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const centerX = PW / 2;

  const drawCentered = (text: string, top: number, bottom: number, maxSize: number, font: PDFFont, color: ReturnType<typeof rgb>) => {
    page.drawRectangle({ x: centerX - ERASE_WIDTH / 2, y: PH - bottom - 4, width: ERASE_WIDTH, height: (bottom - top) + 8, color: WHITE });
    const size = fitFontSize(text, font, maxSize, 12, TEXT_MAX_WIDTH);
    const display = truncateToFit(text, font, size, TEXT_MAX_WIDTH);
    const w = font.widthOfTextAtSize(display, size);
    page.drawText(display, { x: centerX - w / 2, y: PH - bottom + 4, size, font, color });
  };
  const drawLeft = (text: string | null, x: number, top: number, bottom: number, size: number, font: PDFFont, color: ReturnType<typeof rgb>) => {
    // Always erase the placeholder here (it's baked into the template), even when there's no replacement text to draw.
    page.drawRectangle({ x: x - 4, y: PH - bottom - 3, width: 160, height: (bottom - top) + 6, color: WHITE });
    if (text) page.drawText(text, { x, y: PH - bottom + 3, size, font, color });
  };

  drawCentered(fields.name, 200, 248, 30, bold, BLUE);
  drawCentered(fields.sessionName, 288, 320, 17, bold, BLUE);
  drawCentered(fields.dateLabel, 322, 354, 14, regular, BLACK);
  drawLeft(fields.code, 487, 420, 444, 11, regular, BLACK);
  drawLeft(fields.hoursLabel, 488, 443, 467, 11, regular, BLACK);

  return doc.save();
}

export function hoursLabel(hours: number) {
  const trimmed = Math.round(hours * 100) / 100;
  return `${trimmed} Hour${trimmed === 1 ? "" : "s"}`;
}
