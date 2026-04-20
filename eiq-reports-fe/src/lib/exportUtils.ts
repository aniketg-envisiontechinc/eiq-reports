/**
 * Shared export helpers — CSV and XLSX (ExcelJS for cell styling).
 */

export function downloadCsv(rows: string[][], filename: string): void {
  const csv = rows
    .map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export interface PollSummary {
  questionTitle: string;
  totalVotes: number;
  options: { label: string; count: number }[];
}

export interface RespondentRow {
  email: string;
  firstName: string;
  lastName: string;
  company: string;
  answers: Record<string, string>; // pollId → answer text
}

export interface PollQuestion {
  id: string;
  question: string;
}

type LeftRowKind = 'title' | 'question' | 'option' | 'blank';

const COL_LEFT = 2;       // A (label), B (votes/%)
const COL_PROFILE = 4;    // C Email, D First, E Last, F Company

/**
 * Downloads a polls XLSX with two side-by-side sections:
 *   Left  (cols A–B): Poll Results summary — question (bold), % right-aligned
 *   Right (cols C+):  Respondent list — Email, First/Last Name, Company, then one column per question
 */
export async function downloadPollsXlsx(
  polls: PollSummary[],
  questions: PollQuestion[],
  respondents: RespondentRow[],
  filename: string,
): Promise<void> {
  const ExcelJS = (await import('exceljs')).default ?? (await import('exceljs'));

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Poll Results');

  // ---------- Build the left section (poll summary) ----------
  const leftRows: { a: string; b: string; kind: LeftRowKind }[] = [];
  leftRows.push({ a: 'Poll Results', b: '', kind: 'title' });

  for (const poll of polls) {
    leftRows.push({
      a: poll.questionTitle,
      b: `${poll.totalVotes} Total Votes`,
      kind: 'question',
    });
    for (const opt of poll.options) {
      const pct = poll.totalVotes > 0 ? Math.round((opt.count / poll.totalVotes) * 100) : 0;
      leftRows.push({ a: opt.label, b: `${pct}%`, kind: 'option' });
    }
    leftRows.push({ a: '', b: '', kind: 'blank' });
  }

  // ---------- Right section (respondents) ----------
  const rightHeader = ['Email', 'First Name', 'Last Name', 'Company', ...questions.map((q) => q.question)];
  const rightData = respondents.map((r) => [
    r.email,
    r.firstName,
    r.lastName,
    r.company,
    ...questions.map((q) => r.answers[q.id] ?? ''),
  ]);

  const rightColCount = rightHeader.length;
  const totalCols = COL_LEFT + rightColCount;
  const totalRows = Math.max(leftRows.length, rightData.length + 1);

  // ---------- Styles ----------
  const FONT = { name: 'Calibri', size: 11, color: { argb: 'FF111827' } } as const;
  const fontBase   = { ...FONT };
  const fontBold   = { ...FONT, bold: true };
  const fontTitle  = { ...FONT, bold: true, size: 13 };
  const fontHeader = { ...FONT, bold: true, color: { argb: 'FF374151' } };

  const fillTitle    = { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FFFCE7F3' } };
  const fillQuestion = { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FFF3F4F6' } };
  const fillHeader   = { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FFF3F4F6' } };

  const thinBorder = {
    top:    { style: 'thin' as const, color: { argb: 'FFE5E7EB' } },
    bottom: { style: 'thin' as const, color: { argb: 'FFE5E7EB' } },
    left:   { style: 'thin' as const, color: { argb: 'FFE5E7EB' } },
    right:  { style: 'thin' as const, color: { argb: 'FFE5E7EB' } },
  };

  const alignLeft   = { horizontal: 'left'   as const, vertical: 'middle' as const, wrapText: true };
  const alignRight  = { horizontal: 'right'  as const, vertical: 'middle' as const };
  const alignCenter = { horizontal: 'center' as const, vertical: 'middle' as const, wrapText: true };

  // ---------- Row 1: slim spacer ----------
  ws.addRow([]);

  // ---------- Row 2: title (A) + header (C..) ----------
  const titleRow = ws.addRow([
    'Poll Results', '',
    ...rightHeader,
  ]);
  titleRow.height = 26;

  titleRow.getCell(1).font = fontTitle;
  titleRow.getCell(1).fill = fillTitle as any;
  titleRow.getCell(1).alignment = alignLeft;
  titleRow.getCell(1).border = thinBorder;
  titleRow.getCell(2).fill = fillTitle as any;
  titleRow.getCell(2).border = thinBorder;

  for (let c = COL_LEFT + 1; c <= totalCols; c++) {
    const cell = titleRow.getCell(c);
    cell.font = fontHeader;
    cell.fill = fillHeader as any;
    cell.alignment = alignLeft;
    cell.border = thinBorder;
  }

  // ---------- Remaining rows ----------
  for (let i = 1; i < totalRows; i++) {
    const left = leftRows[i] ?? { a: '', b: '', kind: 'blank' as LeftRowKind };
    const right = rightData[i - 1] ?? Array(rightColCount).fill('');
    const row = ws.addRow([left.a, left.b, ...right]);

    // Left section styling
    if (left.kind === 'question') {
      const a = row.getCell(1);
      a.font = fontBold;
      a.fill = fillQuestion as any;
      a.alignment = alignLeft;
      a.border = thinBorder;
      const b = row.getCell(2);
      b.font = fontBold;
      b.fill = fillQuestion as any;
      b.alignment = alignRight;
      b.border = thinBorder;
    } else if (left.kind === 'option') {
      const a = row.getCell(1);
      a.font = fontBase;
      a.alignment = alignLeft;
      a.border = thinBorder;
      const b = row.getCell(2);
      b.font = fontBase;
      b.alignment = alignRight;
      b.border = thinBorder;
    }
    // 'blank' rows stay unstyled as visual separators

    // Right section styling — only for rows with respondent data
    if (i - 1 < respondents.length) {
      for (let c = COL_LEFT + 1; c <= totalCols; c++) {
        const cell = row.getCell(c);
        cell.font = fontBase;
        cell.alignment = c <= COL_PROFILE + COL_LEFT ? alignLeft : alignCenter;
        cell.border = thinBorder;
      }
    }
  }

  // ---------- Column widths ----------
  ws.columns = [
    { width: 55 }, // A — question / option labels
    { width: 18 }, // B — Total Votes / %
    { width: 34 }, // C — email
    { width: 16 }, // D — first name
    { width: 16 }, // E — last name
    { width: 24 }, // F — company
    ...questions.map(() => ({ width: 38 })), // G+ — one col per question
  ];

  // Slim top spacer row
  ws.getRow(1).height = 6;

  // ---------- Download ----------
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
