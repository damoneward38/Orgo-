#!/usr/bin/env python3
# brain.py
import sys
import json
import zmq
import threading
from datetime import datetime

try:
    import tkinter as tk
    from tkinter.scrolledtext import ScrolledText
    HAS_TK = True
except Exception:
    HAS_TK = False

class BrainTk:
    def __init__(self, worker_ip="127.0.0.1", port=5555):
        if not HAS_TK:
            raise RuntimeError("Tkinter is not available in this environment.")
        self.root = tk.Tk()
        self.root.title("Orgo Brain v4.0")
        self.root.geometry("700x450")

        # -------- Connection status ----------
        self.status_var = tk.StringVar(value="CONNECTING…")
        self.stat_lbl = tk.Label(self.root, textvariable=self.status_var,
                                 fg="#ff5555", bg="#181825",
                                 anchor="w", padx=10)
        self.stat_lbl.pack(fill="x")

        # -------- Output console ------------
        self.console = ScrolledText(self.root, font=("Consolas", 10),
                                    bg="#1e1e2e", fg="#cdd6f4",
                                    state="disabled")
        self.console.pack(fill="both", expand=True,
                          padx=10, pady=5)

        # -------- Input field ---------------
        inp_frame = tk.Frame(self.root)
        inp_frame.pack(fill="x")
        self.inp = tk.Entry(inp_frame, font=("Consolas", 10))
        self.inp.pack(side="left", fill="x", expand=True, padx=5)
        self.inp.bind("<Return>", lambda e: self.send())

        send_btn = tk.Button(inp_frame, text="Send", command=self.send)
        send_btn.pack(side="right", padx=5)

        # -------- ZeroMQ Socket -------------
        self.zmq_ctx = zmq.Context()
        self.sock = self.zmq_ctx.socket(zmq.REQ)
        self.sock.connect(f"tcp://{worker_ip}:{port}")
        self.sock.setsockopt(zmq.RCVTIMEO, 5000)

        # ---------- Periodic ping ----------
        self.root.after(2000, self.ping_worker)

    def ping_worker(self):
        try:
            self.sock.send(json.dumps({"command":"ping"}).encode())
            reply = self.sock.recv()
            resp = json.loads(reply.decode())
            if resp.get("status") in ("alive", "ok"):
                self.status_var.set("CONNECTED")
                self.label_color("#8caa39")   # green
        except Exception:
            self.status_var.set("DISCONNECTED")
            self.label_color("#ff5555")   # red
        finally:
            self.root.after(2000, self.ping_worker)

    def label_color(self, color):
        try:
            self.stat_lbl.config(fg=color)
        except Exception:
            pass

    def _write(self, msg):
        self.console.configure(state="normal")
        self.console.insert(tk.END, msg + "\n")
        self.console.configure(state="disabled")
        self.console.see(tk.END)

    def send(self, cmd_text=None):
        cmd = (cmd_text if cmd_text is not None else self.inp.get()).strip()
        if not cmd:
            return
        self._write(f"> {cmd}")
        try:
            # Handle plain app name or full JSON
            if cmd.startswith("{"):
                payload = json.loads(cmd)
            else:
                payload = {
                    "command": "handle_intent",
                    "payload": {
                        "intent": "OPEN_APPLICATION",
                        "payload": {"name": cmd}
                    }
                }
            self.sock.send(json.dumps(payload).encode())
            reply = self.sock.recv()
            resp = json.loads(reply.decode())
            self._write(f"< {json.dumps(resp, indent=2)}")
        except zmq.Again:
            self._write("[ERR] Timeout: ZeroMQ worker did not respond within 5000ms")
        except Exception as e:
            self._write(f"[ERR] {e}")
        finally:
            if cmd_text is None:
                self.inp.delete(0, tk.END)

    def mainloop(self):
        self.root.mainloop()

def run_cli_client(ip="127.0.0.1", port=5555, raw_input=None):
    ctx = zmq.Context()
    sock = ctx.socket(zmq.REQ)
    sock.connect(f"tcp://{ip}:{port}")
    sock.setsockopt(zmq.RCVTIMEO, 5000)

    if raw_input:
        cmd_str = raw_input.strip()
        if cmd_str.startswith("{"):
            payload = json.loads(cmd_str)
        else:
            payload = {
                "command": "handle_intent",
                "payload": {"intent": "OPEN_APPLICATION", "payload": {"name": cmd_str}}
            }
    else:
        payload = {
            "command": "handle_intent",
            "payload": {"intent": "OPEN_APPLICATION", "payload": {"name": "Google Chrome"}}
        }

    print(f"> {json.dumps(payload)}")
    try:
        sock.send(json.dumps(payload).encode())
        reply = sock.recv()
        resp = json.loads(reply.decode())
        print(f"< {json.dumps(resp, indent=2)}")
    except zmq.Again:
        print("[ERR] Timeout: ZeroMQ worker did not respond within 5000ms")
    except Exception as e:
        print(f"[ERR] {e}")

if __name__ == "__main__":
    # typical launch: python brain.py --ip 127.0.0.1 --port 5555
    argv = sys.argv[1:] or ["--ip", "127.0.0.1", "--port", "5555"]
    ip = "127.0.0.1"
    port = 5555
    custom_cmd = None

    i = 0
    while i < len(argv):
        arg = argv[i]
        if arg == "--ip" and i + 1 < len(argv):
            ip = argv[i+1]
            i += 2
        elif arg == "--port" and i + 1 < len(argv):
            port = int(argv[i+1])
            i += 2
        elif not arg.startswith("--"):
            custom_cmd = arg
            i += 1
        else:
            i += 1

    if HAS_TK and custom_cmd is None:
        try:
            app = BrainTk(ip, port)
            app.mainloop()
        except Exception:
            run_cli_client(ip, port, custom_cmd)
    else:
        run_cli_client(ip, port, custom_cmd)
