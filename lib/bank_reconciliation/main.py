"""CLI for bank reconciliation.

Install deps:
    python -m pip install -r requirements-bank-reconciliation.txt

Example:
    python -m lib.bank_reconciliation.main \
      --bank "statement samples/bank/unprocessed.xls" \
      --ledger "statement samples/marg/unprocessed.XLS"
"""

from __future__ import annotations

import argparse
import os
import sys

import pandas as pd

from .formats import FORMAT_PRESETS
from .preprocess import detect_and_preprocess
from .reconcile import build_mapped_frames, reconcile


def _load_input(path: str, file_type: str, skip_preprocess: bool) -> pd.DataFrame:
    if not skip_preprocess:
        return detect_and_preprocess(path, file_type=file_type)

    with open(path, "rb") as handle:
        head = handle.read(64)
    if head.startswith(b"Account Number") or b"Txn Date" in head:
        return detect_and_preprocess(path, file_type="sbi")
    return pd.read_excel(path)


def run_reconciliation(
    bank_path: str,
    ledger_path: str,
    output_path: str = "reconciled_transactions.xlsx",
    skip_preprocess: bool = False,
    bank_format: str = "sbi",
    ledger_format: str = "marg",
) -> pd.DataFrame:
    bank_df = _load_input(bank_path, bank_format, skip_preprocess)
    ledger_df = _load_input(ledger_path, ledger_format, skip_preprocess)

    bank_columns = FORMAT_PRESETS[bank_format]
    ledger_columns = FORMAT_PRESETS[ledger_format]
    mapped_bank, mapped_ledger = build_mapped_frames(bank_df, ledger_df, bank_columns, ledger_columns)
    result = reconcile(mapped_bank, mapped_ledger)
    result.to_excel(output_path, index=False)
    return result


def _print_summary(result: pd.DataFrame) -> None:
    if result.empty or "Remarks" not in result.columns:
        print("No reconciliation rows produced.")
        return
    counts = result["Remarks"].value_counts()
    print("Reconciliation summary:")
    for remark, count in counts.items():
        print(f"  {remark}: {count}")


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Reconcile SBI bank statements with MARG ledgers.")
    parser.add_argument("--bank", required=True, help="Path to bank statement file")
    parser.add_argument("--ledger", required=True, help="Path to MARG ledger file")
    parser.add_argument("--output", default="reconciled_transactions.xlsx", help="Output Excel path")
    parser.add_argument("--skip-preprocess", action="store_true", help="Skip raw-file cleanup")
    parser.add_argument("--bank-format", choices=sorted(FORMAT_PRESETS), default="sbi")
    parser.add_argument("--ledger-format", choices=sorted(FORMAT_PRESETS), default="marg")
    args = parser.parse_args(argv)

    for path in (args.bank, args.ledger):
        if not os.path.exists(path):
            print(f"File not found: {path}", file=sys.stderr)
            return 1

    result = run_reconciliation(
        bank_path=args.bank,
        ledger_path=args.ledger,
        output_path=args.output,
        skip_preprocess=args.skip_preprocess,
        bank_format=args.bank_format,
        ledger_format=args.ledger_format,
    )
    print(f"Reconciliation completed and saved to '{args.output}'")
    _print_summary(result)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
