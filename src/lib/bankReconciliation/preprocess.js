import * as XLSX from "xlsx";

const SBI_HEADERS = [
  "Txn Date",
  "Value Date",
  "Description",
  "Ref No./Cheque No.",
  "Branch Code",
  "Debit",
  "Credit",
  "Balance",
];

function isSbiTabDelimitedText(text) {
  return text.startsWith("Account Number") || text.includes("Txn Date");
}

function parseNumber(value) {
  if (value === null || value === undefined || value === "") return 0;
  const parsed = Number(String(value).replace(/,/g, "").trim());
  return Number.isFinite(parsed) ? parsed : 0;
}

function rowsToObjects(rows, headers) {
  return rows.map((row) => {
    const entry = {};
    headers.forEach((header, index) => {
      entry[header] = row[index] ?? "";
    });
    return entry;
  });
}

function findSbiHeaderIndex(lines) {
  return lines.findIndex(
    (line) => line.startsWith("Txn Date") || line.split("\t")[0]?.trim() === "Txn Date"
  );
}

export function preprocessSbiText(text) {
  const lines = text.split(/\r?\n/);
  const headerIndex = findSbiHeaderIndex(lines);
  if (headerIndex < 0) {
    throw new Error("Could not find SBI header row containing 'Txn Date'");
  }

  const rows = [];
  for (const line of lines.slice(headerIndex + 1)) {
    if (!line.trim()) continue;
    if (line.startsWith("**")) break;
    const parts = line.split("\t");
    while (parts.length < SBI_HEADERS.length) parts.push("");
    rows.push(parts.slice(0, SBI_HEADERS.length));
  }

  return rowsToObjects(rows, SBI_HEADERS).map((row) => ({
    ...row,
    Debit: parseNumber(row.Debit),
    Credit: parseNumber(row.Credit),
    Balance: parseNumber(row.Balance),
  }));
}

function sheetToMatrix(workbook) {
  const sheetName = workbook.SheetNames[0];
  return XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
    header: 1,
    raw: false,
    defval: "",
  });
}

function preprocessSbiSheet(matrix) {
  const headerRowIndex = matrix.findIndex((row) => String(row[0]).trim() === "Txn Date");
  if (headerRowIndex < 0) {
    throw new Error("Could not find SBI header row in Excel file");
  }

  const headers = matrix[headerRowIndex].map((value) => String(value).trim());
  const rows = matrix
    .slice(headerRowIndex + 1)
    .filter((row) => row.some((cell) => String(cell).trim() !== ""))
    .filter((row) => !String(row[0]).startsWith("**"));

  return rows.map((row) => {
    const entry = {};
    headers.forEach((header, index) => {
      const normalized = header.startsWith("Debit") ? "Debit" : header;
      entry[normalized] = row[index] ?? "";
    });
    entry.Debit = parseNumber(entry.Debit);
    entry.Credit = parseNumber(entry.Credit);
    return entry;
  });
}

function findMargHeaderRow(matrix) {
  return matrix.findIndex((row) => {
    const values = row.slice(0, 3).map((cell) => String(cell).trim());
    return values[0] === "Date" && values[1] === "Type" && values[2] === "Particulars";
  });
}

function isMargFooterRow(row) {
  const date = row.Date;
  const type = String(row.Type ?? "").trim();
  const particulars = String(row.Particulars ?? "").trim();

  if (particulars === "Opening Balance" || particulars === "Closing Balance") return true;
  if (particulars.includes("MARG ERP")) return true;
  if (!date && !type && !particulars) return true;
  return false;
}

function preprocessMargSheet(matrix) {
  const headerRowIndex = findMargHeaderRow(matrix);
  if (headerRowIndex < 0) {
    throw new Error("Could not find MARG header row");
  }

  const headers = matrix[headerRowIndex].map((value, index) =>
    String(value).trim() || `col_${index}`
  );

  return matrix
    .slice(headerRowIndex + 1)
    .filter((row) => row.some((cell) => String(cell).trim() !== ""))
    .map((row) => {
      const entry = {};
      headers.forEach((header, index) => {
        entry[header] = row[index] ?? "";
      });
      entry.Debit = parseNumber(entry.Debit);
      entry.Credit = parseNumber(entry.Credit);
      return entry;
    })
    .filter((row) => !isMargFooterRow(row));
}

export async function readWorkbookFromFile(file) {
  const buffer = await file.arrayBuffer();
  return XLSX.read(buffer, { type: "array", cellDates: true });
}

export async function preprocessSbiFile(file) {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer.slice(0, 64));
  const isExcel =
    (bytes[0] === 0xd0 && bytes[1] === 0xcf) || (bytes[0] === 0x50 && bytes[1] === 0x4b);

  if (!isExcel) {
    const text = new TextDecoder("utf-8").decode(buffer);
    if (isSbiTabDelimitedText(text)) {
      return preprocessSbiText(text);
    }
  }

  const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
  return preprocessSbiSheet(sheetToMatrix(workbook));
}

export async function preprocessMargFile(file) {
  const workbook = await readWorkbookFromFile(file);
  return preprocessMargSheet(sheetToMatrix(workbook));
}

export async function loadProcessedFile(file) {
  const workbook = await readWorkbookFromFile(file);
  const sheetName = workbook.SheetNames[0];
  return XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
    raw: false,
    defval: "",
  });
}

export async function loadInputFile(file, fileType, skipPreprocess) {
  if (!skipPreprocess) {
    return fileType === "sbi" ? preprocessSbiFile(file) : preprocessMargFile(file);
  }

  const buffer = await file.arrayBuffer();
  const preview = new TextDecoder("utf-8").decode(buffer.slice(0, 64));
  if (preview.startsWith("Account Number") || preview.includes("Txn Date")) {
    return preprocessSbiText(new TextDecoder("utf-8").decode(buffer));
  }
  return loadProcessedFile(file);
}

export const MARG_HEADERS = ["Date", "Type", "Particulars", "Debit", "Credit", "Balance"];
export { SBI_HEADERS };
