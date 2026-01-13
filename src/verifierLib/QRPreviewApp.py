import tkinter as tk
from tkinter import messagebox
from PIL import Image, ImageTk
import os
import traceback

import win32clipboard
import io

import pyperclip


class QRPreviewApp:
    def __init__(self, root, qr_paths):
        self.root = root
        self.root.title("QR Preview")

        self.qr_paths = qr_paths
        self.current_index = 0

        # Canvas for QR Image
        self.qr_canvas = tk.Canvas(root, width=300, height=300, bg='white', highlightthickness=0)
        self.qr_canvas.grid(row=0, column=1, padx=10, pady=10)
        self.qr_canvas.bind("<Button-1>", self.copy_image_to_clipboard)

        # Navigation Buttons
        tk.Button(root, text="◀️ Prev", command=self.show_prev).grid(row=0, column=0)
        tk.Button(root, text="Next ▶️", command=self.show_next).grid(row=0, column=2)

        # Show first image
        self.tk_img = None
        self.show_qr_image(self.qr_paths[self.current_index])

    def show_qr_image(self, path):
        try:
            print(path)
            img = Image.open(path)
            img = img.resize((300, 300), Image.LANCZOS)
            self.tk_img = ImageTk.PhotoImage(img)  # must be self.tk_img, not local variable
            self.qr_canvas.delete("all")
            self.qr_canvas.create_image(150, 150, image=self.tk_img)
        except Exception as e:
            print(traceback.format_exc())
            messagebox.showerror("Image Error", f"Could not load image:\n{e}")

    def show_prev(self):
        if self.current_index > 0:
            self.current_index -= 1
            self.show_qr_image(self.qr_paths[self.current_index])

    def show_next(self):
        if self.current_index < len(self.qr_paths) - 1:
            self.current_index += 1
            self.show_qr_image(self.qr_paths[self.current_index])

    def copy_to_clipboard(self, event=None):
        qr_path = self.qr_paths[self.current_index]
        pyperclip.copy(qr_path)
        # uuid = os.path.splitext(os.path.basename(qr_path))[0].split("_")[-1]
        # self.root.clipboard_clear()
        # self.root.clipboard_append(uuid)
        # self.root.update()  # now it stays on the clipboard after the window is closed
        messagebox.showinfo("Copied", f"QR path copied to clipboard:\n{qr_path}")


    def copy_image_to_clipboard(self, event=None):
        qr_path = self.qr_paths[self.current_index]
        try:
            from PIL import ImageWin
            import win32clipboard

            img = Image.open(qr_path)
            output = io.BytesIO()
            img.convert("RGB").save(output, "BMP")
            data = output.getvalue()[14:]  # skip BMP header
            output.close()

            win32clipboard.OpenClipboard()
            win32clipboard.EmptyClipboard()
            win32clipboard.SetClipboardData(win32clipboard.CF_DIB, data)
            win32clipboard.CloseClipboard()
            messagebox.showinfo("Copied", "QR code copied to clipboard.")
        except ImportError:
            messagebox.showerror("Error", "Copy to clipboard requires Windows and pywin32.")
        except Exception as e:
            messagebox.showerror("Clipboard Error", str(e))

