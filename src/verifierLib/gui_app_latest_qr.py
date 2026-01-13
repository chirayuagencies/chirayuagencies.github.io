import tkinter as tk
from tkinter import filedialog, messagebox
from tkinter import ttk
from PIL import Image, ImageTk
import os
import shutil
import subprocess
import io
import carton_generator

# Constants
DATA_FILE = "../../public/sha_lookup.json"
PVTDATA_FILE = "../../pvtdata/sha_lookup.json"
QR_DIR = "../../pvtdata/qrcodes"
REPO_PATH = "../../"  # Adjust if your script is deeper

class CartonApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Carton QR Generator")

        self.uuid_prefix = tk.StringVar(value="batch-")
        self.count = tk.IntVar(value=5)
        self.recipient = tk.StringVar(value="Default Recipient")
        self.contents = tk.StringVar(value="Default Contents")

        self._build_layout()

    def _build_layout(self):
        frame = ttk.Frame(self.root, padding=10)
        frame.pack(fill=tk.BOTH, expand=True)

        # Inputs
        ttk.Label(frame, text="UUID Prefix").grid(row=0, column=0, sticky=tk.W)
        ttk.Entry(frame, textvariable=self.uuid_prefix).grid(row=0, column=1)

        ttk.Label(frame, text="Count").grid(row=1, column=0, sticky=tk.W)
        ttk.Entry(frame, textvariable=self.count).grid(row=1, column=1)

        ttk.Label(frame, text="Recipient").grid(row=2, column=0, sticky=tk.W)
        ttk.Entry(frame, textvariable=self.recipient).grid(row=2, column=1)

        ttk.Label(frame, text="Contents").grid(row=3, column=0, sticky=tk.W)
        ttk.Entry(frame, textvariable=self.contents).grid(row=3, column=1)

        ttk.Button(frame, text="Generate Batch", command=self.generate_batch).grid(row=4, column=0, columnspan=2, pady=10)
        ttk.Button(frame, text="Deploy to GitHub", command=self.deploy_to_github).grid(row=5, column=0, columnspan=2, pady=5)

        # QR Preview
        self.qr_canvas = tk.Canvas(frame, width=300, height=300)
        self.qr_canvas.grid(row=0, column=2, rowspan=6, padx=10)

        self.copy_button = ttk.Button(frame, text="Copy QR to Clipboard", command=self.copy_qr_to_clipboard)
        self.copy_button.grid(row=6, column=2, pady=5)
        self.copy_button.config(state=tk.DISABLED)

    def generate_batch(self):
        try:
            results = carton_generator.generate_batch(
                recipient=self.recipient.get(),
                contents=self.contents.get(),
                num_cartons=self.count.get(),
                data_file=DATA_FILE,
                pvtdata_file=PVTDATA_FILE,
                qr_dir=QR_DIR,
                prefix=self.uuid_prefix.get()
            )
            print(results)
            self.latest_qr_path = os.path.join(QR_DIR,str(results['Box Number'].to_list()[-1])+'_'+results['UUID'].to_list()[-1]+'.png')
            print(self.latest_qr_path)
            self.show_qr_image(self.latest_qr_path)
            self.copy_button.config(state=tk.NORMAL)
            
        except Exception as e:
            messagebox.showerror("Error", str(e))

        

    def show_qr_image(self, path):
        img = Image.open(path)
        img = img.resize((300, 300), Image.LANCZOS)
        self.tk_img = ImageTk.PhotoImage(img)
        self.qr_canvas.delete("all")
        self.qr_canvas.create_image(150, 150, image=self.tk_img)

    def copy_qr_to_clipboard(self):
        if hasattr(self, 'latest_qr_path'):
            try:
                from PIL import ImageWin
                import win32clipboard

                img = Image.open(self.latest_qr_path)
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

    def deploy_to_github(self):
        try:
            subprocess.run(["git", "checkout", "gh-pages"], cwd=REPO_PATH, check=True)
            subprocess.run(["git", "add", "public/sha_lookup.json"], cwd=REPO_PATH, check=True)
            subprocess.run(["git", "commit", "-m", "Update sha_lookup.json"], cwd=REPO_PATH, check=True)
            subprocess.run(["git", "push"], cwd=REPO_PATH, check=True)
            messagebox.showinfo("Success", "Deployed sha_lookup.json to GitHub gh-pages branch.")
        except subprocess.CalledProcessError as e:
            messagebox.showerror("Git Error", str(e))

if __name__ == '__main__':
    root = tk.Tk()
    app = CartonApp(root)
    root.mainloop()
