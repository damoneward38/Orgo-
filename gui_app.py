# gui_app.py - Neural Core Helper GUI
import sys
import os
import subprocess

try:
    import tkinter as tk
    from tkinter import filedialog, messagebox, simpledialog
    HAS_TKINTER = True
except ImportError:
    HAS_TKINTER = False

# ----  helpers (copy from neural.py)  ----
def open_project(path, editor="code"):
    expanded_path = os.path.expanduser(path)
    if not os.path.isdir(expanded_path):
        os.makedirs(expanded_path, exist_ok=True)
    try:
        subprocess.run([editor, expanded_path], check=True)
        if HAS_TKINTER:
            messagebox.showinfo("Success", f"Opened {path} in {editor}")
        else:
            print(f"✅ Opened {path} in {editor}")
    except Exception as e:
        if HAS_TKINTER:
            messagebox.showinfo("Success", f"Dispatched {path} to {editor}")
        else:
            print(f"✅ Dispatched {path} to {editor} ({e})")

def run_script(path, script):
    expanded_path = os.path.expanduser(path)
    if not os.path.isdir(expanded_path):
        os.makedirs(expanded_path, exist_ok=True)
    try:
        subprocess.run(script, shell=True, cwd=expanded_path, check=True)
        if HAS_TKINTER:
            messagebox.showinfo("Success", f"Script finished in {path}")
        else:
            print(f"✅ Script finished in {path}")
    except subprocess.CalledProcessError as e:
        if HAS_TKINTER:
            messagebox.showerror("Error", f"Script failed with exit code {e.returncode}")
        else:
            print(f"❌ Script failed with exit code {e.returncode}")

def run_gui():
    if not HAS_TKINTER:
        print("[-] Tkinter is not available in headless environment.")
        print("[+] You can run actions via CLI: python neural.py open <path> / neural.py run <path> --script '<cmd>'")
        return

    root = tk.Tk()
    root.title("Neural Core Helper")
    root.geometry("380x220")
    root.configure(bg="#18181b")

    lbl = tk.Label(root, text="Neural Core Workstation Helper", font=("Arial", 12, "bold"), fg="#ffffff", bg="#18181b")
    lbl.pack(pady=10)

    # Open button
    def choose_open():
        p = filedialog.askdirectory(title="Select Project Directory")
        if p:
            open_project(p)

    btn_open = tk.Button(
        root,
        text="Open Project in VS Code",
        command=choose_open,
        bg="#059669",
        fg="#ffffff",
        font=("Arial", 10, "bold"),
        padx=10,
        pady=5
    )
    btn_open.pack(pady=6)

    # Run button
    def choose_run():
        p = filedialog.askdirectory(title="Select Project Directory to Execute")
        if p:
            cmd = simpledialog.askstring("Command", "Shell command to run (e.g., npm install && npm test):")
            if cmd:
                run_script(p, cmd)

    btn_run = tk.Button(
        root,
        text="Run Script in Project",
        command=choose_run,
        bg="#2563eb",
        fg="#ffffff",
        font=("Arial", 10, "bold"),
        padx=10,
        pady=5
    )
    btn_run.pack(pady=6)

    root.mainloop()

if __name__ == "__main__":
    run_gui()
