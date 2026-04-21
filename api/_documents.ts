import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export interface MariaDocumentSection {
  heading?: string;
  body: string;
}

export interface MariaPdfInput {
  title: string;
  subtitle?: string;
  sections: MariaDocumentSection[];
  footerNote?: string;
}

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const MARGIN_X = 56;
const TOP_Y = 736;
const BOTTOM_Y = 64;
const BODY_FONT_SIZE = 11;
const HEADING_FONT_SIZE = 13;
const TITLE_FONT_SIZE = 20;
const SUBTITLE_FONT_SIZE = 10;
const LINE_HEIGHT = 16;

function wrapText(text: string, maxWidth: number, measure: (value: string, size: number) => number, size: number) {
  const paragraphs = text.split(/\n+/);
  const lines: string[] = [];

  paragraphs.forEach((paragraph, paragraphIndex) => {
    const words = paragraph.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      lines.push('');
      return;
    }

    let currentLine = words[0];
    for (let i = 1; i < words.length; i += 1) {
      const candidate = `${currentLine} ${words[i]}`;
      if (measure(candidate, size) <= maxWidth) {
        currentLine = candidate;
      } else {
        lines.push(currentLine);
        currentLine = words[i];
      }
    }
    lines.push(currentLine);

    if (paragraphIndex < paragraphs.length - 1) {
      lines.push('');
    }
  });

  return lines;
}

export async function generateMariaPdf(input: MariaPdfInput): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const page = () => pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  const fontRegular = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const pages = [page()];
  let currentPage = pages[0];
  let cursorY = TOP_Y;

  const ensureSpace = (neededHeight: number) => {
    if (cursorY - neededHeight < BOTTOM_Y) {
      currentPage = page();
      pages.push(currentPage);
      cursorY = TOP_Y;
    }
  };

  currentPage.drawText(input.title, {
    x: MARGIN_X,
    y: cursorY,
    size: TITLE_FONT_SIZE,
    font: fontBold,
    color: rgb(0.07, 0.15, 0.24),
  });
  cursorY -= 28;

  if (input.subtitle) {
    currentPage.drawText(input.subtitle, {
      x: MARGIN_X,
      y: cursorY,
      size: SUBTITLE_FONT_SIZE,
      font: fontRegular,
      color: rgb(0.37, 0.43, 0.5),
    });
    cursorY -= 24;
  }

  for (const section of input.sections) {
    if (section.heading) {
      ensureSpace(24);
      currentPage.drawText(section.heading, {
        x: MARGIN_X,
        y: cursorY,
        size: HEADING_FONT_SIZE,
        font: fontBold,
        color: rgb(0.1, 0.35, 0.28),
      });
      cursorY -= 20;
    }

    const lines = wrapText(
      section.body,
      PAGE_WIDTH - MARGIN_X * 2,
      (value, size) => fontRegular.widthOfTextAtSize(value, size),
      BODY_FONT_SIZE
    );

    for (const line of lines) {
      ensureSpace(LINE_HEIGHT);
      if (line) {
        currentPage.drawText(line, {
          x: MARGIN_X,
          y: cursorY,
          size: BODY_FONT_SIZE,
          font: fontRegular,
          color: rgb(0.15, 0.2, 0.27),
        });
      }
      cursorY -= LINE_HEIGHT;
    }

    cursorY -= 8;
  }

  if (input.footerNote) {
    ensureSpace(24);
    currentPage.drawText(input.footerNote, {
      x: MARGIN_X,
      y: Math.max(cursorY, BOTTOM_Y - 4),
      size: 9,
      font: fontRegular,
      color: rgb(0.45, 0.5, 0.56),
    });
  }

  return pdf.save();
}
