"""Preprocess raw SBI bank exports and MARG ledger exports."""

from __future__ import annotations

import os
from typing import Literal

import pandas as pd

SBI_COLUMNS = [
    "Txn Date",
    "Value Date",
    "Description",
    "Ref No./Cheque No.",
    "Branch Code",
    "Debit",
    "Credit",
    "Balance",
]

MARG_HEADER_MARKERS = ("Date", "Type", "Particulars", "Debit", "Credit", "Balance")


def _is_sbi_tab_delimited(path: str) -> bool:
    with open(path, "rb") as handle:
        head = handle.read(64)
    if head.startswith(b"\xd0\xcf\x11\xe0") or head.startswith(b"PK"):
        return False
    try:
        text = head.decode("utf-8", errors="replace")
    except UnicodeError:
        return False
    return text.startswith("Account Number") or "Txn Date" in text


def _read_text_lines(path: str) -> list[str]:
    with open(path, "r", encoding="utf-8", errors="replace") as handle:
        return [line.rstrip("\r\n") for line in handle]


def _find_sbi_header_index(lines: list[str]) -> int:
    for index, line in enumerate(lines):
        if line.startswith("Txn Date") or line.split("\t", 1)[0].strip() == "Txn Date":
            return index
    raise ValueError("Could not find SBI header row containing 'Txn Date'")


def _parse_sbi_lines(lines: list[str]) -> pd.DataFrame:
    header_index = _find_sbi_header_index(lines)
    header = [part.strip() for part in lines[header_index].split("\t")]
    if len(header) < len(SBI_COLUMNS):
        header = SBI_COLUMNS

    rows: list[list[str]] = []
    for line in lines[header_index + 1 :]:
        if not line.strip():
            continue
        if line.startswith("**"):
            break
        parts = line.split("\t")
        if len(parts) < len(SBI_COLUMNS):
            parts.extend([""] * (len(SBI_COLUMNS) - len(parts)))
        rows.append(parts[: len(SBI_COLUMNS)])

    df = pd.DataFrame(rows, columns=SBI_COLUMNS)
    for col in ("Debit", "Credit", "Balance"):
        df[col] = pd.to_numeric(df[col].astype(str).str.replace(",", "", regex=False).str.strip(), errors="coerce")
    df["Debit"] = df["Debit"].fillna(0)
    df["Credit"] = df["Credit"].fillna(0)
    return df


def preprocess_sbi(path: str) -> pd.DataFrame:
    """Clean a raw SBI export (tab-delimited text or Excel)."""
    if _is_sbi_tab_delimited(path):
        return _parse_sbi_lines(_read_text_lines(path))

    raw = pd.read_excel(path, header=None)
    header_row = None
    for index, row in raw.iterrows():
        first = str(row.iloc[0]).strip() if pd.notna(row.iloc[0]) else ""
        if first == "Txn Date":
            header_row = index
            break
    if header_row is None:
        raise ValueError("Could not find SBI header row in Excel file")

    df = raw.iloc[header_row + 1 :].copy()
    df.columns = raw.iloc[header_row].tolist()
    df = df.loc[:, ~pd.Series(df.columns).astype(str).str.startswith("Unnamed")]
    df = df.dropna(how="all")
    df = df[~df.iloc[:, 0].astype(str).str.startswith("**", na=False)]

    rename_map = {}
    for col in df.columns:
        normalized = str(col).strip()
        if normalized.startswith("Debit"):
            rename_map[col] = "Debit"
        elif normalized == "Credit":
            rename_map[col] = "Credit"
    df = df.rename(columns=rename_map)

    for col in ("Debit", "Credit"):
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0)
    return df.reset_index(drop=True)


def _find_marg_header_row(raw: pd.DataFrame) -> int:
    for index, row in raw.iterrows():
        values = [str(row.iloc[i]).strip() if i < len(row) and pd.notna(row.iloc[i]) else "" for i in range(6)]
        if values[:3] == ["Date", "Type", "Particulars"]:
            return index
    raise ValueError("Could not find MARG header row")


def _is_marg_footer_row(row: pd.Series) -> bool:
    particulars = str(row.get("Particulars", "")).strip()
    type_value = str(row.get("Type", "")).strip()
    date_value = row.get("Date")

    if particulars in {"Opening Balance", "Closing Balance"}:
        return True
    if "MARG ERP" in particulars:
        return True
    if pd.isna(date_value) and not type_value and not particulars:
        return True
    if pd.isna(date_value) and particulars and type_value == "nan":
        return True
    return False


def preprocess_marg(path: str) -> pd.DataFrame:
    """Clean a raw MARG ledger export."""
    raw = pd.read_excel(path, header=None)
    header_row = _find_marg_header_row(raw)
    columns = [str(value).strip() if pd.notna(value) else f"col_{idx}" for idx, value in enumerate(raw.iloc[header_row])]

    df = raw.iloc[header_row + 1 :].copy()
    df.columns = columns[: len(df.columns)]
    df = df.dropna(how="all")

    for col in ("Debit", "Credit"):
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0)

    mask = df.apply(_is_marg_footer_row, axis=1)
    df = df[~mask].reset_index(drop=True)
    return df


def _detect_format(path: str) -> Literal["sbi", "marg"]:
    name = os.path.basename(path).lower()
    if "marg" in name or "ledger" in name or "party" in name:
        return "marg"

    if _is_sbi_tab_delimited(path):
        return "sbi"

    with open(path, "rb") as handle:
        head = handle.read(256).decode("utf-8", errors="replace")
    if "Txn Date" in head or "Account Number" in head:
        return "sbi"

    try:
        preview = pd.read_excel(path, header=None, nrows=8)
        for _, row in preview.iterrows():
            values = [str(row.iloc[i]).strip() if i < len(row) and pd.notna(row.iloc[i]) else "" for i in range(6)]
            if values[:3] == ["Date", "Type", "Particulars"]:
                return "marg"
            if str(row.iloc[0]).strip() == "Txn Date":
                return "sbi"
    except Exception:
        pass

    return "marg"


def detect_and_preprocess(path: str, file_type: str | None = None) -> pd.DataFrame:
    """Auto-detect file type and preprocess it."""
    chosen = file_type or _detect_format(path)
    if chosen == "sbi":
        return preprocess_sbi(path)
    if chosen == "marg":
        return preprocess_marg(path)
    raise ValueError(f"Unsupported file type: {chosen}")
