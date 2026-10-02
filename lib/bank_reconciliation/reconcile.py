"""Reconcile bank and ledger transactions."""

from __future__ import annotations

import pandas as pd

from .formats import COLUMN_KEYS


def load_excel_files(filepaths: list[str]) -> dict[str, pd.DataFrame]:
    """Load Excel files into a dictionary of DataFrames."""
    return {filepath: pd.read_excel(filepath) for filepath in filepaths}


def get_columns(df: pd.DataFrame, columns_info: dict[str, str | None]) -> pd.DataFrame:
    """Map user-provided column positions to internal column names."""
    mapped_df = pd.DataFrame()
    for internal_col, col_pos in columns_info.items():
        col_index = None
        if col_pos is not None:
            try:
                col_index = ord(str(col_pos).upper()) - ord("A")
            except TypeError:
                col_index = None

        if col_index is not None and 0 <= col_index < len(df.columns):
            mapped_df[internal_col] = df.iloc[:, col_index]
        else:
            mapped_df[internal_col] = None
    return mapped_df


def _concat_key(row_dict: dict, suffix: str) -> dict:
    return {f"{key}_{suffix}": value for key, value in row_dict.items()}


def match(
    df1: pd.DataFrame,
    df2: pd.DataFrame,
    match_date: bool = True,
    append_unmatched: bool = True,
) -> tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """Match rows from two DataFrames using a sorted two-pointer merge."""
    if match_date:
        df1_sorted = df1.sort_values(by=["transaction_date", "transaction_amount"]).reset_index(drop=True)
        df2_sorted = df2.sort_values(by=["transaction_date", "transaction_amount"]).reset_index(drop=True)
    else:
        df1_sorted = df1.sort_values(by=["transaction_amount"]).reset_index(drop=True)
        df2_sorted = df2.sort_values(by=["transaction_amount"]).reset_index(drop=True)

    matches: list[dict] = []
    unmatched_df1: list[dict] = []
    unmatched_df2: list[dict] = []

    i = 0
    j = 0
    while i < len(df1_sorted) and j < len(df2_sorted):
        row1 = df1_sorted.iloc[i]
        row2 = df2_sorted.iloc[j]

        same_date = not match_date or row1["transaction_date"] == row2["transaction_date"]
        same_amount = row1["transaction_amount"] == row2["transaction_amount"]

        if same_date and same_amount:
            matches.append({**_concat_key(row1.to_dict(), "df1"), **_concat_key(row2.to_dict(), "df2")})
            i += 1
            j += 1
        elif match_date and (row1["transaction_date"], row1["transaction_amount"]) < (
            row2["transaction_date"],
            row2["transaction_amount"],
        ):
            unmatched_df1.append(_concat_key(row1.to_dict(), "df1") if append_unmatched else row1.to_dict())
            i += 1
        elif not match_date and row1["transaction_amount"] < row2["transaction_amount"]:
            unmatched_df1.append(_concat_key(row1.to_dict(), "df1") if append_unmatched else row1.to_dict())
            i += 1
        else:
            unmatched_df2.append(_concat_key(row2.to_dict(), "df2") if append_unmatched else row2.to_dict())
            j += 1

    while i < len(df1_sorted):
        row1 = df1_sorted.iloc[i]
        unmatched_df1.append(_concat_key(row1.to_dict(), "df1") if append_unmatched else row1.to_dict())
        i += 1

    while j < len(df2_sorted):
        row2 = df2_sorted.iloc[j]
        unmatched_df2.append(_concat_key(row2.to_dict(), "df2") if append_unmatched else row2.to_dict())
        j += 1

    return pd.DataFrame(matches), pd.DataFrame(unmatched_df1), pd.DataFrame(unmatched_df2)


def _ensure_transaction_amount(df: pd.DataFrame) -> pd.DataFrame:
    working = df.copy()
    if "transaction_amount" not in working.columns or working["transaction_amount"].isnull().all():
        working["transaction_amount"] = working["deposit"].fillna(0) - working["withdrawal"].fillna(0)
    working["transaction_date"] = pd.to_datetime(working["transaction_date"], dayfirst=True, errors="coerce")
    return working


def reconcile(df1: pd.DataFrame, df2: pd.DataFrame) -> pd.DataFrame:
    """Perform two-pass reconciliation between bank and ledger DataFrames."""
    left = _ensure_transaction_amount(df1)
    right = _ensure_transaction_amount(df2)

    matches_df, unmatched_df1, unmatched_df2 = match(left, right, append_unmatched=False)
    if not matches_df.empty:
        matches_df["Remarks"] = "Matched"

    amt_match, comp_unm_df1, comp_unm_df2 = match(unmatched_df1, unmatched_df2, match_date=False)
    if not amt_match.empty:
        amt_match["Remarks"] = "Probable Date Mismatch"
    if not comp_unm_df1.empty:
        comp_unm_df1["Remarks"] = "Unmatched"
    if not comp_unm_df2.empty:
        comp_unm_df2["Remarks"] = "Unmatched"

    parts = [part for part in (matches_df, amt_match, comp_unm_df1, comp_unm_df2) if not part.empty]
    if not parts:
        return pd.DataFrame(columns=[*COLUMN_KEYS, "Remarks"])
    return pd.concat(parts, ignore_index=True).fillna("")


def build_mapped_frames(
    bank_df: pd.DataFrame,
    ledger_df: pd.DataFrame,
    bank_columns: list[str | None],
    ledger_columns: list[str | None],
) -> tuple[pd.DataFrame, pd.DataFrame]:
    """Map raw/preprocessed frames to the internal schema."""
    bank_info = dict(zip(COLUMN_KEYS, bank_columns))
    ledger_info = dict(zip(COLUMN_KEYS, ledger_columns))
    return get_columns(bank_df, bank_info), get_columns(ledger_df, ledger_info)
