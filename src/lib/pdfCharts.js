/*
 * Minimal chart drawing for pdf-lib pages — bars and lines rendered from plain coordinates,
 * no image/canvas dependency. Used by Reports.jsx's PDF export to include the same charts
 * shown on-screen, at a larger, more detailed size, inside the exported document.
 */
import { rgb } from "pdf-lib";

const GREY_AXIS = rgb(0.75, 0.75, 0.75);
const GREY_LABEL = rgb(0.45, 0.45, 0.45);
const DARK_TEXT = rgb(0.1, 0.1, 0.1);

export function drawBarChart(page, { x, y, width, height }, data, { valueKey, labelKey, color, font, maxValue, valueFormat }) {
  const max = maxValue ?? Math.max(1, ...data.map(d => Number(d[valueKey]) || 0));
  const gap = 8;
  const barWidth = Math.max(2, (width - gap * Math.max(0, data.length - 1)) / Math.max(1, data.length));
  data.forEach((d, i) => {
    const val = Number(d[valueKey]) || 0;
    const barHeight = max === 0 ? 0 : (val / max) * height;
    const bx = x + i * (barWidth + gap);
    page.drawRectangle({ x: bx, y, width: barWidth, height: Math.max(0, barHeight), color });
    const label = valueFormat ? valueFormat(val) : String(val);
    page.drawText(label, { x: bx, y: y + barHeight + 3, size: 7, font, color: DARK_TEXT });
    page.drawText(String(d[labelKey] ?? ""), { x: bx, y: y - 12, size: 7, font, color: GREY_LABEL });
  });
  page.drawLine({ start: { x, y }, end: { x: x + width, y }, thickness: 0.5, color: GREY_AXIS });
}

export function drawLineChart(page, { x, y, width, height }, data, { valueKey, labelKey, color, font, maxValue, valueFormat }) {
  const withVals = data.filter(d => d[valueKey] != null);
  const max = maxValue ?? Math.max(1, ...withVals.map(d => Number(d[valueKey]) || 0));
  const stepX = data.length > 1 ? width / (data.length - 1) : 0;
  let prev = null;
  data.forEach((d, i) => {
    const val = d[valueKey];
    const px = x + i * stepX;
    if (val == null) { prev = null; page.drawText(String(d[labelKey] ?? ""), { x: px - 8, y: y - 12, size: 7, font, color: GREY_LABEL }); return; }
    const py = y + (Number(val) / max) * height;
    if (prev) page.drawLine({ start: prev, end: { x: px, y: py }, thickness: 1.5, color });
    page.drawCircle({ x: px, y: py, size: 2, color });
    const label = valueFormat ? valueFormat(val) : String(val);
    page.drawText(label, { x: px - 6, y: py + 5, size: 6.5, font, color: DARK_TEXT });
    page.drawText(String(d[labelKey] ?? ""), { x: px - 8, y: y - 12, size: 7, font, color: GREY_LABEL });
    prev = { x: px, y: py };
  });
  page.drawLine({ start: { x, y }, end: { x: x + width, y }, thickness: 0.5, color: GREY_AXIS });
}
