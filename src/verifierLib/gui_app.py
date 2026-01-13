import tkinter as tk
from tkinter import filedialog, messagebox
from tkinter import ttk
from PIL import Image, ImageTk
import os
import shutil
import subprocess
import io
import carton_generator
import pyperclip

from QRPreviewApp import QRPreviewApp


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
        self.results = None

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

        self.show_button = ttk.Button(frame, text="Show QRs", command=self.show_qr_codes)
        self.show_button.grid(row=6, column=0, pady=5)
        self.show_button.config(state=tk.DISABLED)

    def copy_to_clipboard(self, image_path):
        pyperclip.copy(image_path)

    def show_qr_codes(self):
        root2 = tk.Toplevel()
        app = QRPreviewApp(root2, self.qr_paths)
        root2.mainloop()



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
            self.results = results
            self.latest_qr_path = os.path.join(QR_DIR,str(results['Box Number'].to_list()[-1])+'_'+results['UUID'].to_list()[-1]+'.png')
            self.show_button.config(state=tk.NORMAL)

            self.qr_paths = [
                os.path.join(QR_DIR, str(results['Box Number'].to_list()[idx]) + '_' + results['UUID'].to_list()[idx] + '.png')
                for idx in range(len(results))
            ]
            
        except Exception as e:
            messagebox.showerror("Error", str(e))
        

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
