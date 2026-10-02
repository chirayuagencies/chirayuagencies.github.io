"""Desktop GUI for bank reconciliation."""

from __future__ import annotations

import os
import tkinter as tk
from tkinter import filedialog, messagebox, ttk

from .main import run_reconciliation


class BankReconciliationApp:
    def __init__(self, root: tk.Tk) -> None:
        self.root = root
        self.root.title("Bank Reconciliation")

        self.bank_path = tk.StringVar()
        self.ledger_path = tk.StringVar()
        self.output_path = tk.StringVar(value="reconciled_transactions.xlsx")
        self.skip_preprocess = tk.BooleanVar(value=False)

        self._build_layout()

    def _build_layout(self) -> None:
        frame = ttk.Frame(self.root, padding=10)
        frame.pack(fill=tk.BOTH, expand=True)

        ttk.Label(frame, text="Bank statement").grid(row=0, column=0, sticky=tk.W)
        ttk.Entry(frame, textvariable=self.bank_path, width=60).grid(row=0, column=1, padx=5)
        ttk.Button(frame, text="Browse", command=self._pick_bank).grid(row=0, column=2)

        ttk.Label(frame, text="MARG ledger").grid(row=1, column=0, sticky=tk.W)
        ttk.Entry(frame, textvariable=self.ledger_path, width=60).grid(row=1, column=1, padx=5)
        ttk.Button(frame, text="Browse", command=self._pick_ledger).grid(row=1, column=2)

        ttk.Label(frame, text="Output file").grid(row=2, column=0, sticky=tk.W)
        ttk.Entry(frame, textvariable=self.output_path, width=60).grid(row=2, column=1, padx=5)
        ttk.Button(frame, text="Browse", command=self._pick_output).grid(row=2, column=2)

        ttk.Checkbutton(
            frame,
            text="Files are already processed (skip cleanup)",
            variable=self.skip_preprocess,
        ).grid(row=3, column=0, columnspan=3, sticky=tk.W, pady=8)

        ttk.Button(frame, text="Run Reconciliation", command=self._run).grid(row=4, column=0, columnspan=3, pady=10)

        self.summary = tk.Text(frame, height=12, width=80)
        self.summary.grid(row=5, column=0, columnspan=3, pady=8)

    def _pick_bank(self) -> None:
        path = filedialog.askopenfilename(
            title="Select bank statement",
            filetypes=[("Excel / SBI export", "*.xls *.xlsx *.XLS *.XLSX"), ("All files", "*.*")],
        )
        if path:
            self.bank_path.set(path)

    def _pick_ledger(self) -> None:
        path = filedialog.askopenfilename(
            title="Select MARG ledger",
            filetypes=[("Excel files", "*.xls *.xlsx *.XLS *.XLSX"), ("All files", "*.*")],
        )
        if path:
            self.ledger_path.set(path)

    def _pick_output(self) -> None:
        path = filedialog.asksaveasfilename(
            title="Save reconciliation output",
            defaultextension=".xlsx",
            filetypes=[("Excel files", "*.xlsx")],
        )
        if path:
            self.output_path.set(path)

    def _run(self) -> None:
        bank = self.bank_path.get().strip()
        ledger = self.ledger_path.get().strip()
        output = self.output_path.get().strip() or "reconciled_transactions.xlsx"

        if not bank or not ledger:
            messagebox.showerror("Missing files", "Please select both bank and ledger files.")
            return
        if not os.path.exists(bank) or not os.path.exists(ledger):
            messagebox.showerror("Missing files", "One or both selected files do not exist.")
            return

        try:
            result = run_reconciliation(
                bank_path=bank,
                ledger_path=ledger,
                output_path=output,
                skip_preprocess=self.skip_preprocess.get(),
            )
        except Exception as exc:
            messagebox.showerror("Reconciliation failed", str(exc))
            return

        self.summary.delete("1.0", tk.END)
        self.summary.insert(tk.END, f"Saved to: {output}\n\n")
        if not result.empty and "Remarks" in result.columns:
            counts = result["Remarks"].value_counts()
            for remark, count in counts.items():
                self.summary.insert(tk.END, f"{remark}: {count}\n")
        messagebox.showinfo("Done", f"Reconciliation saved to {output}")


def main() -> None:
    root = tk.Tk()
    BankReconciliationApp(root)
    root.mainloop()


if __name__ == "__main__":
    main()
