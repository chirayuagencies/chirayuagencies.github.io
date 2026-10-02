export const COLUMN_KEYS = [
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
];

export const SBI_COLUMNS = ["A", "D", "C", "G", "F", null, null, "D", "H", null];
export const MARG_COLUMNS = ["A", "B", "C", "D", "E", null, null, null, "F", "G"];

export const FORMAT_PRESETS = {
  sbi: SBI_COLUMNS,
  marg: MARG_COLUMNS,
};
