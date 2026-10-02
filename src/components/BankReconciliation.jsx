import React, { useMemo, useState } from "react";
import * as XLSX from "xlsx";
import Navbar from "./Navbar.jsx";
import Footer from "./Footer";
import { FORMAT_PRESETS } from "../lib/bankReconciliation/formats.js";
import { loadInputFile, MARG_HEADERS, SBI_HEADERS } from "../lib/bankReconciliation/preprocess.js";
import { buildMappedFrames, reconcile, summarizeRemarks } from "../lib/bankReconciliation/reconcile.js";

function downloadResults(rows) {
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Reconciliation");
  XLSX.writeFile(workbook, "reconciled_transactions.xlsx");
}

function formatCell(value) {
  if (value instanceof Date) {
    return value.toLocaleDateString("en-IN");
  }
  if (value === null || value === undefined) {
    return "";
  }
  return String(value);
}

const PREVIEW_COLUMNS = [
  "transaction_date_df1",
  "transaction_amount_df1",
  "description_df1",
  "transaction_date_df2",
  "transaction_amount_df2",
  "description_df2",
  "Remarks",
];

const BankReconciliation = () => {
  const [bankFile, setBankFile] = useState(null);
  const [ledgerFile, setLedgerFile] = useState(null);
  const [skipPreprocess, setSkipPreprocess] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [results, setResults] = useState([]);
  const [summary, setSummary] = useState({});
  const [isRunning, setIsRunning] = useState(false);

  const previewRows = useMemo(() => results.slice(0, 50), [results]);

  const handleRun = async () => {
    if (!bankFile || !ledgerFile) {
      setError("Please upload both a bank statement and a MARG ledger file.");
      return;
    }

    setIsRunning(true);
    setError("");
    setStatus("Loading and preprocessing files...");
    setResults([]);
    setSummary({});

    try {
      const [bankRows, ledgerRows] = await Promise.all([
        loadInputFile(bankFile, "sbi", skipPreprocess),
        loadInputFile(ledgerFile, "marg", skipPreprocess),
      ]);

      setStatus("Running reconciliation...");
      const { bank, ledger } = buildMappedFrames(
        bankRows,
        ledgerRows,
        FORMAT_PRESETS.sbi,
        FORMAT_PRESETS.marg,
        SBI_HEADERS,
        MARG_HEADERS
      );
      const reconciled = reconcile(bank, ledger);
      setResults(reconciled);
      setSummary(summarizeRemarks(reconciled));
      setStatus(`Done. ${reconciled.length} rows analyzed.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setStatus("");
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="text-gray-800 min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-5xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-2">Bank Reconciliation</h1>
        <p className="text-gray-600 mb-6">
          Upload an SBI bank statement and a MARG ledger export. Raw files are cleaned automatically by
          removing header/footer rows and filling empty debit/credit values with zero.
        </p>

        <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Bank statement</label>
            <input
              type="file"
              accept=".xls,.xlsx,.XLS,.XLSX"
              onChange={(event) => setBankFile(event.target.files?.[0] ?? null)}
              className="block w-full text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">MARG ledger</label>
            <input
              type="file"
              accept=".xls,.xlsx,.XLS,.XLSX"
              onChange={(event) => setLedgerFile(event.target.files?.[0] ?? null)}
              className="block w-full text-sm"
            />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={skipPreprocess}
              onChange={(event) => setSkipPreprocess(event.target.checked)}
            />
            Files are already processed (skip cleanup)
          </label>

          <button
            onClick={handleRun}
            disabled={isRunning}
            className="bg-black text-white px-4 py-2 rounded disabled:opacity-60"
          >
            {isRunning ? "Running..." : "Run Reconciliation"}
          </button>

          {status && <p className="text-sm text-green-700">{status}</p>}
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        {Object.keys(summary).length > 0 && (
          <div className="mt-6 bg-white border border-gray-200 rounded-lg p-5">
            <h2 className="text-lg font-semibold mb-3">Summary</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {Object.entries(summary).map(([remark, count]) => (
                <div key={remark} className="border rounded p-3">
                  <div className="text-sm text-gray-500">{remark}</div>
                  <div className="text-xl font-bold">{count}</div>
                </div>
              ))}
            </div>
            <button
              onClick={() => downloadResults(results)}
              className="mt-4 bg-black text-white px-4 py-2 rounded"
            >
              Download reconciled_transactions.xlsx
            </button>
          </div>
        )}

        {previewRows.length > 0 && (
          <div className="mt-6 bg-white border border-gray-200 rounded-lg p-5 overflow-x-auto">
            <h2 className="text-lg font-semibold mb-3">Preview (first 50 rows)</h2>
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b">
                  {PREVIEW_COLUMNS.map((column) => (
                    <th key={column} className="text-left py-2 pr-4 whitespace-nowrap">
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {previewRows.map((row, index) => (
                  <tr key={index} className="border-b align-top">
                    {PREVIEW_COLUMNS.map((column) => (
                      <td key={column} className="py-2 pr-4 whitespace-nowrap">
                        {formatCell(row[column])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default BankReconciliation;
