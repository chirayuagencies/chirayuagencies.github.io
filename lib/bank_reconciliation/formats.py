"""Column mapping presets for bank and ledger file formats."""

COLUMN_KEYS = [
    "transaction_date",
    "cheque_number",
    "description",
    "deposit",
    "withdrawal",
    "transaction_amount",
    "transaction_type",
    "reference_number",
    "balance",
    "balance_type",
]

# Letter-based column positions from the original notebook.
SBI_COLUMNS = ["A", "D", "C", "G", "F", None, None, "D", "H", None]
MARG_COLUMNS = ["A", "B", "C", "D", "E", None, None, None, "F", "G"]

FORMAT_PRESETS = {
    "sbi": SBI_COLUMNS,
    "marg": MARG_COLUMNS,
}
