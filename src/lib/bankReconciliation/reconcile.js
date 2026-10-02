import { COLUMN_KEYS } from "./formats.js";

function columnLetterToIndex(letter) {
  if (!letter) return null;
  return letter.toUpperCase().charCodeAt(0) - "A".charCodeAt(0);
}

export function getColumns(rows, columnsInfo) {
  return rows.map((row) => {
    const values = Array.isArray(row) ? row : Object.values(row);
    const mapped = {};

    COLUMN_KEYS.forEach((key) => {
      const colPos = columnsInfo[key];
      const colIndex = columnLetterToIndex(colPos);
      if (colIndex !== null && colIndex >= 0 && colIndex < values.length) {
        mapped[key] = Array.isArray(row) ? values[colIndex] : row[Object.keys(row)[colIndex]];
      } else if (!Array.isArray(row) && colIndex !== null && colIndex >= 0) {
        const keys = Object.keys(row);
        mapped[key] = row[keys[colIndex]] ?? null;
      } else {
        mapped[key] = null;
      }
    });

    return mapped;
  });
}

function getColumnsFromObjects(rows, columnLetters, headerOrder) {
  const columnsInfo = Object.fromEntries(COLUMN_KEYS.map((key, index) => [key, columnLetters[index]]));
  const asArrays = rows.map((row) =>
    Array.isArray(row) ? row : headerOrder.map((header) => row[header] ?? "")
  );
  return getColumns(asArrays, columnsInfo);
}

function parseNumber(value) {
  if (value === null || value === undefined || value === "") return 0;
  const parsed = Number(String(value).replace(/,/g, "").trim());
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;

  const text = String(value).trim();
  const ddmmyyyy = text.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (ddmmyyyy) {
    const day = Number(ddmmyyyy[1]);
    const month = Number(ddmmyyyy[2]) - 1;
    const year = Number(ddmmyyyy[3].length === 2 ? `20${ddmmyyyy[3]}` : ddmmyyyy[3]);
    return new Date(year, month, day);
  }

  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function ensureTransactionAmount(rows) {
  return rows.map((row) => {
    const deposit = parseNumber(row.deposit);
    const withdrawal = parseNumber(row.withdrawal);
    const transactionAmount =
      row.transaction_amount === null || row.transaction_amount === undefined || row.transaction_amount === ""
        ? deposit - withdrawal
        : parseNumber(row.transaction_amount);

    return {
      ...row,
      deposit,
      withdrawal,
      transaction_amount: transactionAmount,
      transaction_date: parseDate(row.transaction_date),
    };
  });
}

function concatKey(row, suffix) {
  const result = {};
  Object.entries(row).forEach(([key, value]) => {
    result[`${key}_${suffix}`] = value;
  });
  return result;
}

function compareRows(row1, row2, matchDate) {
  if (matchDate) {
    const date1 = row1.transaction_date?.getTime?.() ?? 0;
    const date2 = row2.transaction_date?.getTime?.() ?? 0;
    if (date1 !== date2) return date1 - date2;
  }
  return row1.transaction_amount - row2.transaction_amount;
}

export function match(df1, df2, matchDate = true, appendUnmatched = true) {
  const df1Sorted = [...df1].sort((a, b) => compareRows(a, b, matchDate));
  const df2Sorted = [...df2].sort((a, b) => compareRows(a, b, matchDate));

  const matches = [];
  const unmatchedDf1 = [];
  const unmatchedDf2 = [];

  let i = 0;
  let j = 0;

  while (i < df1Sorted.length && j < df2Sorted.length) {
    const row1 = df1Sorted[i];
    const row2 = df2Sorted[j];
    const sameDate =
      !matchDate ||
      (row1.transaction_date?.getTime?.() ?? null) === (row2.transaction_date?.getTime?.() ?? null);
    const sameAmount = row1.transaction_amount === row2.transaction_amount;

    if (sameDate && sameAmount) {
      matches.push({ ...concatKey(row1, "df1"), ...concatKey(row2, "df2") });
      i += 1;
      j += 1;
    } else if (compareRows(row1, row2, matchDate) < 0) {
      unmatchedDf1.push(appendUnmatched ? concatKey(row1, "df1") : { ...row1 });
      i += 1;
    } else {
      unmatchedDf2.push(appendUnmatched ? concatKey(row2, "df2") : { ...row2 });
      j += 1;
    }
  }

  while (i < df1Sorted.length) {
    unmatchedDf1.push(appendUnmatched ? concatKey(df1Sorted[i], "df1") : { ...df1Sorted[i] });
    i += 1;
  }

  while (j < df2Sorted.length) {
    unmatchedDf2.push(appendUnmatched ? concatKey(df2Sorted[j], "df2") : { ...df2Sorted[j] });
    j += 1;
  }

  return { matches, unmatchedDf1, unmatchedDf2 };
}

export function buildMappedFrames(bankRows, ledgerRows, bankColumns, ledgerColumns, bankHeaders, ledgerHeaders) {
  return {
    bank: ensureTransactionAmount(getColumnsFromObjects(bankRows, bankColumns, bankHeaders)),
    ledger: ensureTransactionAmount(getColumnsFromObjects(ledgerRows, ledgerColumns, ledgerHeaders)),
  };
}

export function reconcile(mappedBank, mappedLedger) {
  const { matches, unmatchedDf1, unmatchedDf2 } = match(mappedBank, mappedLedger, true, false);
  const matchedRows = matches.map((row) => ({ ...row, Remarks: "Matched" }));

  const {
    matches: amountMatches,
    unmatchedDf1: compUnmatchedDf1,
    unmatchedDf2: compUnmatchedDf2,
  } = match(unmatchedDf1, unmatchedDf2, false, false);

  const amountRows = amountMatches.map((row) => ({ ...row, Remarks: "Probable Date Mismatch" }));
  const unmatchedRows = [
    ...compUnmatchedDf1.map((row) => ({ ...row, Remarks: "Unmatched" })),
    ...compUnmatchedDf2.map((row) => ({ ...row, Remarks: "Unmatched" })),
  ];

  return [...matchedRows, ...amountRows, ...unmatchedRows];
}

export function summarizeRemarks(rows) {
  return rows.reduce((acc, row) => {
    const remark = row.Remarks || "Unknown";
    acc[remark] = (acc[remark] || 0) + 1;
    return acc;
  }, {});
}
