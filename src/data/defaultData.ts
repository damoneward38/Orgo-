import { CommandPattern, VirtualScript, WorkArtifact, ChatMessage, WorkTask, MemoryItem } from '../types';

export const DEFAULT_PATTERNS: CommandPattern[] = [
  {
    id: 'pat_mail',
    pattern: '^open (mail|email) client$',
    action: 'open_app',
    argsTemplate: { exe: 'mailspring' },
    description: 'Launches default desktop email client (Mailspring)',
    examplePrompt: 'open email client',
  },
  {
    id: 'pat_browser',
    pattern: '^open (browser|chrome)$',
    action: 'open_app',
    argsTemplate: { exe: 'chrome' },
    description: 'Launches web browser (Google Chrome)',
    examplePrompt: 'open browser',
  },
  {
    id: 'pat_script',
    pattern: '^run script (.+\\.py)$',
    action: 'run_script',
    argsTemplate: { script: '$1' },
    description: 'Executes specified Python script in worker subprocess',
    examplePrompt: 'run script backup.py',
  },
  {
    id: 'pat_say',
    pattern: '^say (.+)$',
    action: 'say_text',
    argsTemplate: { text: '$1' },
    description: 'Speaks speech text aloud using host system TTS',
    examplePrompt: 'say Hello, world!',
  },
  {
    id: 'pat_status',
    pattern: '^(system|worker) status$',
    action: 'system_status',
    argsTemplate: { format: 'detailed' },
    description: 'Queries remote machine telemetry and uptime',
    examplePrompt: 'system status',
  },
  {
    id: 'pat_ping',
    pattern: '^ping$',
    action: 'ping',
    argsTemplate: {},
    description: 'ZeroMQ roundtrip heartbeat probe',
    examplePrompt: 'ping',
  },
];

export const VIRTUAL_SCRIPTS: VirtualScript[] = [
  {
    filename: 'bring_chrome_front.sh',
    description: 'Brings Google Chrome window to the foreground or starts it if not running',
    code: `#!/usr/bin/env bash
# ---------------------------------------------------------------
# Bring Chrome (google‑chrome‑stable) to the foreground.
# If the browser is not running, start it.
#
# Dependencies:
#   - \`xdotool\`   (sudo apt install xdotool)
#   - \`pgrep\`
# ---------------------------------------------------------------

set -euo pipefail          # Fail fast on unset vars / errors

CHROME_CMD="google-chrome-stable"

# Find the first Chrome process by full command line, if any
CHROME_PID=$(pgrep -f "$CHROME_CMD" | head -n1 || true)

if [ -z "$CHROME_PID" ]; then
    # No Chrome running – start it.
    echo "Chrome not running – launching $CHROME_CMD"
    "$CHROME_CMD" &
else
    # Chrome is running – bring its window to the front.
    # Get the window id belonging to the first matching process.
    WIN_ID=$(xdotool search --pid "$CHROME_PID" | head -n1 || true)

    if [ -n "$WIN_ID" ]; then
        echo "Activating Chrome window (pid $CHROME_PID, win $WIN_ID)"
        xdotool windowactivate "$WIN_ID"
    else
        echo "Could not find a window for Chrome – only background process."
    fi
fi`,
    simulatedOutput: `Activating Chrome window (pid 5120, win 41943044)
[✓] Window focus shifted to Google Chrome.`,
  },
  {
    filename: 'backup.py',
    description: 'Automated directory snapshot & backup archive generator',
    code: `import time, os, zipfile
print("[backup.py] Initializing incremental backup...")
time.sleep(0.5)
print("[backup.py] Compressed 42 files into archive_2026_09.zip")
print("[backup.py] Backup finished successfully in 0.52s")`,
    simulatedOutput: `[backup.py] Initializing incremental backup...
[backup.py] Compressed 42 files into archive_2026_09.zip
[backup.py] Backup finished successfully in 0.52s`,
  },
  {
    filename: 'test.py',
    description: 'Worker diagnostic and unit test verification',
    code: `import sys, platform
print(f"[test.py] Python {sys.version.split()[0]} on {platform.system()} ({platform.machine()})")
print("[test.py] Testing ZeroMQ socket queues... OK")
print("[test.py] Testing Subprocess executor... OK")
print("[test.py] All 4 tests passed (100% success)")`,
    simulatedOutput: `[test.py] Python 3.11.4 on Linux (x86_64)
[test.py] Testing ZeroMQ socket queues... OK
[test.py] Testing Subprocess executor... OK
[test.py] All 4 tests passed (100% success)`,
  },
  {
    filename: 'hello.py',
    description: 'Standard hello world script test',
    code: `print("Hello from Orgo remote worker node!")
print("Timestamp synchronized via ZeroMQ")`,
    simulatedOutput: `Hello from Orgo remote worker node!
Timestamp synchronized via ZeroMQ`,
  },
];

export const PYTHON_NEURAL_CORE = `# neural_core.py
# Orgo Decision Engine (v4.0)
import re
from dataclasses import dataclass, field
from typing import Dict, Any

@dataclass
class CommandRegistry:
    patterns: Dict[str, Dict[str, Any]] = field(default_factory=lambda: {
        r"open (mail|email) client": {"action": "open_app", "args": {"exe": "mailspring"}},
        r"open (browser|chrome)":   {"action": "open_app", "args": {"exe": "chrome"}},
        r"run script (.+\\.py)":      {"action": "run_script", "args": {"script": r"\\1"}},
        r"say (.+)":                 {"action": "say_text",  "args": {"text": r"\\1"}},
    })

    def match(self, prompt: str) -> Dict[str, Any]:
        prompt = prompt.strip().lower()
        for pat, cmd in self.patterns.items():
            m = re.match(pat, prompt)
            if m:
                args = {}
                for k, v in cmd["args"].items():
                    if isinstance(v, str):
                        # Expand regex backreferences like \\1 or {0}
                        res = v
                        for idx, grp in enumerate(m.groups(), start=1):
                            res = res.replace(f"\\\\{idx}", grp).replace("$" + str(idx), grp)
                        # Also support str.format
                        try:
                            res = res.format(*m.groups())
                        except (IndexError, KeyError):
                            pass
                        args[k] = res
                    else:
                        args[k] = v
                return {"action": cmd["action"], "args": args}
        return {"action": "unknown", "args": {}}

class NeuralCore:
    def __init__(self):
        self.registry = CommandRegistry()
        self.tools = ToolRegistry()

    def decide(self, prompt: str) -> Dict[str, Any]:
        """Translates natural language prompts into executable action dictionaries."""
        return self.registry.match(prompt)

    def handle_intent(self, intent: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Dispatch intents to the ToolRegistry with verification.
        Returns a JSON-serialisable dict.
        """
        if intent == "OPEN_APPLICATION":
            app_name = payload.get("name")
            if not app_name:
                return {"error": "Missing 'name' in payload"}
            try:
                opened = self.tools.open_application(app_name)
                verified = self.tools.verify_active(app_name)
                status = "ok" if opened and verified else "fail"
                return {
                    "intent": intent,
                    "app": app_name,
                    "opened": opened,
                    "verified": verified,
                    "status": status,
                }
            except Exception as e:
                return {"intent": intent, "error": str(e)}
        else:
            return {"error": f"Unknown intent: {intent}"}

if __name__ == "__main__":
    core = NeuralCore()
    test_prompts = [
        "open browser",
        "open email client",
        "run script backup.py",
        "say Hello world",
        "unknown command",
    ]
    print("--- Neural Core 5.1 Self-Test ---")
    for p in test_prompts:
        res = core.decide(p)
        print(f"Prompt: {p:25} -> Action: {res['action']}, Args: {res['args']}")
`;

export const PYTHON_TOOLS = `# tools.py
# Neural Core 5.1 ToolRegistry & Application Verifier
import platform
import subprocess
import json
from pathlib import Path
from typing import Dict, Any, Union

class ToolRegistry:
    """
    Central registry that maps tools (intent → callable) back to the system.
    Exposes \`open_application\` and active foreground verification.
    """

    def __init__(self):
        self.os_name = platform.system()

    def _activate_macos(self, app_name: str) -> bool:
        try:
            subprocess.run(
                ["osascript", "-e", f'activate application "{app_name}"'],
                check=True,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
            )
            return True
        except subprocess.CalledProcessError:
            return False

    def _activate_linux(self, app_name: str) -> bool:
        mapping = {
            "Google Chrome": "google-chrome-stable",
            "Safari": "open -a Safari",
            "Terminal": "gnome-terminal",
        }
        cmd = mapping.get(app_name, None)
        if not cmd:
            cmd = app_name
        try:
            subprocess.run(
                cmd,
                shell=True,
                check=True,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
            )
            return True
        except subprocess.CalledProcessError:
            return False

    def open_application(self, app_name: str) -> bool:
        if self.os_name == "Darwin":
            return self._activate_macos(app_name)
        elif self.os_name == "Linux":
            return self._activate_linux(app_name)
        else:
            raise NotImplementedError(f"Unsupported OS: {self.os_name}")

    def verify_active(self, app_name: str) -> bool:
        if self.os_name == "Darwin":
            out = subprocess.run(
                ["osascript", "-e", 'tell application "System Events" to name of (processes where frontmost is true)'],
                capture_output=True,
                text=True,
                check=False,
            )
            return app_name in out.stdout
        elif self.os_name == "Linux":
            out = subprocess.run(
                ["xdotool", "getactivewindow", "getwindowname"],
                capture_output=True,
                text=True,
                check=False,
            )
            return app_name in out.stdout
        return False
`;

export const PYTHON_BRAIN = `# brain.py
# Orgo Brain - Client Interface & Remote Controller
import zmq
import json
import argparse
import tkinter as tk
from tkinter.scrolledtext import ScrolledText
from neural_core import NeuralCore

class OrgoApp(tk.Tk):
    def __init__(self, worker_ip="127.0.0.1", port=5555):
        super().__init__()
        self.title("Orgo – Brain")
        self.geometry("820x450")
        self.configure(bg="#1e1e2e")
        self.neural = NeuralCore()

        # ZeroMQ REQ Socket
        self.ctx = zmq.Context()
        self.sock = self.ctx.socket(zmq.REQ)
        self.sock.setsockopt(zmq.RCVTIMEO, 5000)  # 5s timeout
        target_url = f"tcp://{worker_ip}:{port}"
        print(f"[*] Connecting to worker at {target_url}...")
        self.sock.connect(target_url)

        self._build_ui(worker_ip, port)

    def _build_ui(self, worker_ip, port):
        # Header Status Bar
        top_bar = tk.Frame(self, bg="#181825", padx=10, pady=8)
        top_bar.pack(fill="x")
        lbl_info = tk.Label(
            top_bar,
            text=f"Brain Active  |  Worker Target: tcp://{worker_ip}:{port}",
            font=("Segoe UI", 10, "bold"),
            fg="#89b4fa",
            bg="#181825"
        )
        lbl_info.pack(side="left")

        # Input Frame
        prompt_frame = tk.Frame(self, bg="#1e1e2e", padx=10, pady=10)
        prompt_frame.pack(fill="x")

        self.prompt_var = tk.StringVar()
        prompt_entry = tk.Entry(
            prompt_frame,
            textvariable=self.prompt_var,
            font=("Segoe UI", 12),
            bg="#313244",
            fg="#cdd6f4",
            insertbackground="#cdd6f4",
            relief="flat",
            bd=5
        )
        prompt_entry.pack(side="left", fill="x", expand=True, padx=(0, 10))
        prompt_entry.bind("<Return>", lambda e: self.send_prompt())
        prompt_entry.focus()

        send_btn = tk.Button(
            prompt_frame,
            text="Send Command",
            command=self.send_prompt,
            font=("Segoe UI", 10, "bold"),
            bg="#a6e3a1",
            fg="#11111b",
            relief="flat",
            padx=15,
            pady=4,
            cursor="hand2"
        )
        send_btn.pack(side="left")

        # Terminal Log View
        self.remote_log = ScrolledText(
            self,
            font=("Consolas", 10),
            bg="#11111b",
            fg="#a6adc8",
            relief="flat",
            insertbackground="#cdd6f4"
        )
        self.remote_log.pack(fill="both", expand=True, padx=10, pady=(0, 10))
        self._append_log("=== Orgo Brain Initialized ===\\n")
        self._append_log("Try typing: 'open browser', 'run script backup.py', or 'say Hello!'\\n\\n")

    def send_prompt(self):
        prompt = self.prompt_var.get().strip()
        if not prompt:
            return

        self.prompt_var.set("")
        self._append_log(f"> {prompt}\\n")

        # Neural Core Decision
        cmd = self.neural.decide(prompt)
        if cmd["action"] == "unknown":
            self._append_log("❌  Unknown command. Check neural_core patterns.\\n\\n")
            return

        self._append_log(f"⚡ Matched Action: {cmd['action']} | Sending over ZeroMQ...\\n")

        try:
            self.sock.send_json(cmd)
            resp = self.sock.recv_json()
            self._append_log(json.dumps(resp, indent=2) + "\\n\\n")
        except zmq.Again:
            self._append_log("⚠️  Worker Timeout: No response received within 5 seconds.\\n\\n")
        except Exception as e:
            self._append_log(f"❌  ZeroMQ Error: {str(e)}\\n\\n")

    def _append_log(self, text: str):
        self.remote_log.config(state="normal")
        self.remote_log.insert("end", text)
        self.remote_log.see("end")
        self.remote_log.config(state="disabled")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Orgo Brain UI & Client")
    parser.add_argument("--worker-ip", default="127.0.0.1", help="IP address of remote worker machine")
    parser.add_argument("--port", type=int, default=5555, help="ZeroMQ worker port")
    args = parser.parse_args()

    app = OrgoApp(worker_ip=args.worker_ip, port=args.port)
    app.mainloop()
`;

export const PYTHON_WORKER = `# worker.py
# Orgo Remote Worker - Action Executor & ZeroMQ REP Server
import zmq
import subprocess
import platform
import os
import sys
import json
import time

def perform_action(cmd: dict) -> dict:
    action = cmd.get("action")
    args   = cmd.get("args", {})
    system = platform.system()

    try:
        if action == "open_app":
            exe = args.get("exe")
            if not exe:
                return {"status": "error", "msg": "Missing 'exe' argument"}

            # Launch application asynchronously without blocking the server
            if system == "Darwin":
                # macOS open
                subprocess.Popen(["open", "-a", exe])
            elif system == "Windows":
                subprocess.Popen(["start", exe], shell=True)
            else:
                # Linux
                subprocess.Popen([exe])
            return {"status": "ok", "msg": f"Opened application '{exe}' on {system}"}

        elif action == "run_script":
            script = args.get("script")
            if not script:
                return {"status": "error", "msg": "Missing 'script' argument"}

            if not os.path.exists(script):
                # If script file does not exist locally, report clear warning
                return {"status": "error", "msg": f"Script not found at path: {script}"}

            result = subprocess.run(
                [sys.executable, script],
                capture_output=True,
                text=True,
                timeout=120
            )
            return {
                "status": "ok",
                "output": result.stdout or "<no stdout output>",
                "stderr": result.stderr if result.stderr else None,
                "exit_code": result.returncode
            }

        elif action == "say_text":
            text = args.get("text")
            if not text:
                return {"status": "error", "msg": "Missing 'text' argument"}

            if system == "Darwin":
                subprocess.run(["say", text])
            elif system == "Linux":
                # espeak fallback or spd-say
                subprocess.run(["espeak", text])
            elif system == "Windows":
                script = f'(New-Object -ComObject SAPI.SpVoice).Speak("{text}")'
                subprocess.run(["powershell", "-Command", script], shell=True)
            else:
                return {"status": "error", "msg": f"Unsupported voice OS: {system}"}

            return {"status": "ok", "msg": f"Spoken aloud: '{text}'"}

        elif action == "ping":
            return {"status": "ok", "msg": "pong", "time": time.time(), "platform": system}

        elif action == "system_status":
            return {
                "status": "ok",
                "system": system,
                "release": platform.release(),
                "machine": platform.machine(),
                "python": sys.version.split()[0],
                "uptime": "active",
            }

        else:
            return {"status": "error", "msg": f"Unknown action: {action}"}

    except subprocess.TimeoutExpired:
        return {"status": "error", "msg": "Command execution timed out after 120s"}
    except Exception as e:
        return {"status": "error", "msg": str(e)}

def main(port=5555):
    ctx = zmq.Context()
    sock = ctx.socket(zmq.REP)
    bind_address = f"tcp://*:{port}"
    sock.bind(bind_address)
    print(f"[*] Orgo Worker listening on {bind_address}")
    print(f"[*] Operating System: {platform.system()} {platform.machine()}")
    print("[*] Ready to execute commands from brain nodes...")

    while True:
        try:
            cmd = sock.recv_json()
            print(f"[<] Received command: {cmd.get('action')}")
            resp = perform_action(cmd)
            sock.send_json(resp)
            print(f"[>] Dispatched response ({resp.get('status')})")
        except KeyboardInterrupt:
            print("\\n[*] Shutting down worker.")
            break
        except Exception as e:
            print(f"[!] Error in main loop: {e}")
            try:
                sock.send_json({"status": "error", "msg": f"Server error: {str(e)}"})
            except Exception:
                pass

if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 5555
    main(port)
`;

export const PYTHON_REQUIREMENTS = `pyzmq>=25.0.0
`;

export const PYTHON_README = `# Orgo: Neural Core Decision Engine & Brain-Worker System

Orgo is a distributed remote automation framework consisting of three modular components:
1. **neural_core.py** – Pattern-matching decision engine translating human prompts into structured commands.
2. **brain.py** – Interactive Tkinter GUI & ZeroMQ client dispatching requests to remote or local worker.
3. **worker.py** – Remote agent daemon executing actions (subprocess app launcher, script runner, system TTS voice).

---

## 🚀 Quick Start Guide

### Step 1: Install Dependencies
On both the machine running the **worker** and the machine running the **brain**:
\`\`\`bash
pip install -r requirements.txt
\`\`\`

### Step 2: Start the Remote Worker
On the execution target machine (e.g. your desktop, server, or VM):
\`\`\`bash
python worker.py 5555
\`\`\`
Output:
\`\`\`
[*] Orgo Worker listening on tcp://*:5555
[*] Operating System: Linux x86_64
[*] Ready to execute commands from brain nodes...
\`\`\`

### Step 3: Start the Brain Client
On your local controller machine:
\`\`\`bash
# Local testing:
python brain.py --worker-ip 127.0.0.1

# Remote worker testing:
python brain.py --worker-ip 192.168.1.100 --port 5555
\`\`\`

---

## 💡 Example Commands in Brain GUI

- \`open browser\` -> Launches Chrome or default browser
- \`open email client\` -> Launches Mailspring or mail app
- \`run script backup.py\` -> Executes local Python script and captures stdout
- \`say Good morning Dave\` -> Speaks text aloud using system voice synthesizer
`;

export const INITIAL_ARTIFACTS: WorkArtifact[] = [
  {
    id: 'art_etl',
    title: 'Automated Data Pipeline & Telemetry Ingestion',
    type: 'code',
    filename: 'etl_pipeline.py',
    language: 'python',
    summary: 'High-throughput event streaming parser and normalizer written for ZeroMQ telemetry feeds.',
    timestamp: Date.now() - 1000 * 60 * 25,
    author: 'NeuroCore v4.0',
    status: 'completed',
    tags: ['Python', 'ETL', 'ZeroMQ', 'Worker Node'],
    content: `# NeuroCore v4.0 - Automated ETL Data Pipeline
import time
import json
import os
import datetime

class IngestionPipeline:
    def __init__(self, endpoint="tcp://127.0.0.1:5555"):
        self.endpoint = endpoint
        self.batch_size = 500
        print(f"[*] Initialized Ingestion Pipeline connected to {endpoint}")

    def transform(self, raw_events):
        cleaned = []
        for ev in raw_events:
            if "metric_id" in ev and ev.get("val") is not None:
                cleaned.append({
                    "id": ev["metric_id"],
                    "timestamp": datetime.datetime.utcnow().isoformat(),
                    "normalized_value": round(float(ev["val"]) / 100.0, 4),
                    "status": "HEALTHY" if ev["val"] < 85 else "ALERT"
                })
        return cleaned

    def execute_batch(self, events):
        processed = self.transform(events)
        print(f"[+] Successfully processed {len(processed)} telemetry events.")
        return {"count": len(processed), "status": "STORED", "checksum": "a89f92e"}

if __name__ == "__main__":
    pipeline = IngestionPipeline()
    sample = [{"metric_id": f"worker_node_{i}", "val": 42 + i*3} for i in range(8)]
    res = pipeline.execute_batch(sample)
    print(f"Pipeline Result: {res}")
`,
  },
  {
    id: 'art_audit',
    title: 'Remote Workstation Infrastructure & Security Audit',
    type: 'report',
    filename: 'system_audit_2026.md',
    language: 'markdown',
    summary: 'Comprehensive health check, open port scan, process load review, and security score for the worker machine.',
    timestamp: Date.now() - 1000 * 60 * 65,
    author: 'NeuroCore v4.0',
    status: 'completed',
    tags: ['Security', 'Audit', 'Telemetry', 'Linux'],
    content: `# Workstation Diagnostic & Security Assessment
**Date:** March 2026 | **Target:** worker-node-01 (Ubuntu 24.04 LTS / x86_64)
**Evaluator:** NeuroCore Autonomous Agent v4.0
**Overall Security Health Score:** 98.4 / 100 (EXCELLENT)

---

### 1. Executive Summary
The target workstation was examined for service availability, socket latency, zombie processes, and cryptographic communication integrity. The ZeroMQ daemon is bound securely to \`tcp://127.0.0.1:5555\` with zero unauthenticated incoming connections outside the authorized sub-network.

### 2. Core Telemetry Metrics
| Metric | Observed Value | Optimal Threshold | Assessment |
| :--- | :--- | :--- | :--- |
| **CPU Utilization** | 18.2% (8 cores active) | < 70% | Optimal |
| **Memory Allocation** | 4.2 GB / 32.0 GB (13%) | < 80% | Healthy |
| **ZeroMQ Loop Latency** | 1.48 ms average | < 10 ms | High Speed |
| **Disk Storage (Root)** | 142 GB free / 512 GB | > 50 GB | Safe |
| **Active Subprocesses** | 4 daemons running | < 30 | Clean |

### 3. Detected System Services
- \`worker.py\` (PID: 8812) – Status: **ACTIVE (Listening on 5555)**
- \`mailspring\` (PID: 4321) – Status: **IDLE**
- \`google-chrome-stable\` (PID: 5120) – Status: **READY**
- \`code\` (VS Code Server) – Status: **SYNCED**

### 4. Recommendations
1. Maintain periodic log rotation for \`/var/log/orgo_worker.log\`.
2. Keep ZeroMQ connection pools capped at 64 concurrent client channels.
`,
  },
  {
    id: 'art_email',
    title: 'Executive Status & Release Notes to Engineering Team',
    type: 'email',
    filename: 'team_launch_announcement.txt',
    language: 'text',
    summary: 'Ready-to-send email update detailing pattern engine benchmarks, automated script runners, and worker uptime.',
    timestamp: Date.now() - 1000 * 60 * 120,
    author: 'NeuroCore v4.0',
    status: 'completed',
    tags: ['Email', 'Outreach', 'Release Notes'],
    content: `TO: engineering-all@orgo-neural.internal, product-leads@orgo.internal
FROM: neurocore-automation@orgo.internal
SUBJECT: [Update] Neural Core v4.0 & Brain-Worker System Deployment Ready

Team,

I have completed the integration and verification phase for the Orgo Neural Core & Brain-Worker Studio. All primary test suites have executed with a 100% pass rate.

Key Highlights of this release:
1. Regex & Pattern Matching Engine: Sub-millisecond prompt resolution with dynamic argument extraction ($1, $2 templates).
2. Remote Worker Daemon: Autonomous subprocess execution for external applications (Browser, Mailspring, bash terminal).
3. Script Execution Sandbox: Tested with automated backups, network diagnostics, and dataset synthesis with full stdout/stderr capture.
4. Voice Feedback: Native Speech Synthesis hook for operator audio cues.

The workstation environment is primed and waiting for real-time task queues. Please review the attached system audit report and let me know if additional worker instances should be provisioned.

Best regards,
NeuroCore Autonomous System
`,
  },
  {
    id: 'art_benchmarks',
    title: 'Neural Decision Engine Benchmark Matrix',
    type: 'data',
    filename: 'performance_benchmarks.json',
    language: 'json',
    summary: 'Structured JSON benchmarks across 10,000 synthetic operator prompts testing token extraction and decision latency.',
    timestamp: Date.now() - 1000 * 60 * 180,
    author: 'NeuroCore v4.0',
    status: 'completed',
    tags: ['Data', 'JSON', 'Benchmarks', 'Performance'],
    content: `{
  "benchmark_suite": "NeuroCore Synthetic Prompt Stress Test",
  "version": "4.0.2",
  "iterations": 10000,
  "hardware": "AMD Ryzen 9 7950X 16-Core Processor",
  "metrics": {
    "total_duration_seconds": 1.84,
    "prompts_per_second": 5434.7,
    "latency_p50_microseconds": 142,
    "latency_p95_microseconds": 310,
    "latency_p99_microseconds": 485
  },
  "accuracy": {
    "pattern_match_rate": 0.9992,
    "argument_extraction_accuracy": 1.0,
    "false_positive_rate": 0.0008
  },
  "worker_queue": {
    "roundtrip_zeromq_ping_ms": 1.34,
    "concurrent_clients_supported": 128
  }
}
`,
  },
  {
    id: 'art_chrome_toggle',
    title: 'Chrome Foreground & Launch Utility',
    type: 'code',
    filename: 'bring_chrome_front.sh',
    language: 'bash',
    summary: 'Robust Linux utility script leveraging xdotool and pgrep to toggle Google Chrome to the foreground or launch it safely.',
    timestamp: Date.now(),
    author: 'Workstation Automation',
    status: 'completed',
    tags: ['Bash', 'Automation', 'Chrome', 'xdotool', 'Workstation'],
    content: `#!/usr/bin/env bash
# ---------------------------------------------------------------
# Bring Chrome (google‑chrome‑stable) to the foreground.
# If the browser is not running, start it.
#
# Dependencies:
#   - \`xdotool\`   (sudo apt install xdotool)
#   - \`pgrep\`
# ---------------------------------------------------------------

set -euo pipefail          # Fail fast on unset vars / errors

CHROME_CMD="google-chrome-stable"

# Find the first Chrome process by full command line, if any
CHROME_PID=$(pgrep -f "$CHROME_CMD" | head -n1 || true)

if [ -z "$CHROME_PID" ]; then
    # No Chrome running – start it.
    echo "Chrome not running – launching $CHROME_CMD"
    "$CHROME_CMD" &
else
    # Chrome is running – bring its window to the front.
    # Get the window id belonging to the first matching process.
    WIN_ID=$(xdotool search --pid "$CHROME_PID" | head -n1 || true)

    if [ -n "$WIN_ID" ]; then
        echo "Activating Chrome window (pid $CHROME_PID, win $WIN_ID)"
        xdotool windowactivate "$WIN_ID"
    else
        echo "Could not find a window for Chrome – only background process."
    fi
fi
`,
  },
  {
    id: 'art_tools_py',
    title: 'ToolRegistry & Application Verifier (Neural Core 5.1)',
    type: 'code',
    filename: 'tools.py',
    language: 'python',
    summary: 'Neural Core 5.1 ToolRegistry mapping intents to OS-level application launches (macOS/Linux) with foreground window verification.',
    timestamp: Date.now(),
    author: 'Neural Core v5.1',
    status: 'completed',
    tags: ['Python', 'ToolRegistry', 'Verification', 'Chrome', 'IPC'],
    content: `# tools.py
import platform
import subprocess
import json
from pathlib import Path
from typing import Dict, Any, Union

class ToolRegistry:
    """
    Central registry that maps tools (intent → callable) back to the system.
    For the demo we expose only \`open_application\`.
    """

    def __init__(self):
        self.os_name = platform.system()

    def _activate_macos(self, app_name: str) -> bool:
        try:
            subprocess.run(
                ["osascript", "-e", f'activate application "{app_name}"'],
                check=True,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
            )
            return True
        except subprocess.CalledProcessError:
            return False

    def _activate_linux(self, app_name: str) -> bool:
        # a tiny mapping from human name to command
        mapping = {
            "Google Chrome": "google-chrome-stable",
            "Safari": "open -a Safari",   # macOS fallback
            "Terminal": "gnome-terminal",
        }
        cmd = mapping.get(app_name, None)
        if not cmd:
            # assume the name is the executable
            cmd = app_name
        # use shell=True for aliasing but capture output
        try:
            subprocess.run(
                cmd,
                shell=True,
                check=True,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
            )
            return True
        except subprocess.CalledProcessError:
            return False

    def open_application(self, app_name: str) -> bool:
        if self.os_name == "Darwin":
            return self._activate_macos(app_name)
        elif self.os_name == "Linux":
            return self._activate_linux(app_name)
        else:
            raise NotImplementedError(f"Unsupported OS: {self.os_name}")

    # ------------------------------------------------------------------
    # verification helper – is the app in the foreground?
    # ------------------------------------------------------------------
    def verify_active(self, app_name: str) -> bool:
        if self.os_name == "Darwin":
            out = subprocess.run(
                ["osascript", "-e", 'tell application "System Events" to name of (processes where frontmost is true)'],
                capture_output=True,
                text=True,
                check=False,
            )
            return app_name in out.stdout
        elif self.os_name == "Linux":
            # Rough heuristic: look for window titles containing app name
            out = subprocess.run(
                ["xdotool", "getactivewindow", "getwindowname"],
                capture_output=True,
                text=True,
                check=False,
            )
            return app_name in out.stdout
        return False
`,
  },
];

export const INITIAL_CHAT_MESSAGES: ChatMessage[] = [
  {
    id: 'msg_welcome',
    sender: 'neurocore',
    text: "Hello! I am NeuroCore, your autonomous neural decision and execution partner. I'm connected to your worker machine and ready to take your instructions, execute programs, open apps, or build whatever tools you need. You can talk to me directly here, and anything I create or inspect will be presented live on the stage.",
    timestamp: Date.now() - 1000 * 60 * 15,
    presentedArtifactId: 'art_etl',
    actionSummary: 'Worker online. Ingestion pipeline loaded and presented.',
  },
];

export const INITIAL_TASKS: WorkTask[] = [
  {
    id: 'task_tool_registry',
    title: 'Register ToolRegistry & Application Verifier',
    description: 'Provide cross-platform macOS/Linux app activation and foreground verification hook (xdotool / osascript).',
    status: 'verified',
    category: 'automation',
    targetApp: 'browser',
    createdAt: Date.now() - 1000 * 60 * 45,
    completedAt: Date.now() - 1000 * 60 * 40,
    tags: ['Python', 'ToolRegistry', 'xdotool', 'Verification'],
    intent: 'OPEN_APPLICATION',
    verificationDetails: 'Confirmed active via xdotool getactivewindow getwindowname (exit code 0)',
  },
  {
    id: 'task_chrome_foreground',
    title: 'Workstation Chrome Window Bring-to-Front',
    description: 'Ensure Google Chrome is launched or brought into the active foreground on display :0.0.',
    status: 'verified',
    category: 'workstation',
    targetApp: 'browser',
    createdAt: Date.now() - 1000 * 60 * 30,
    completedAt: Date.now() - 1000 * 60 * 25,
    tags: ['Bash', 'pgrep', 'xdotool', 'Chrome'],
    intent: 'OPEN_APPLICATION',
    verificationDetails: 'Window ID activated and focused',
  },
  {
    id: 'task_zeromq_daemon',
    title: 'Maintain ZeroMQ REP Worker Daemon (tcp://127.0.0.1:5555)',
    description: 'Handle incoming JSON intent packets, shell execution requests, and system health checks.',
    status: 'completed',
    category: 'system',
    targetApp: 'terminal',
    createdAt: Date.now() - 1000 * 60 * 60,
    completedAt: Date.now() - 1000 * 60 * 55,
    tags: ['ZeroMQ', 'Port 5555', 'Daemon'],
    verificationDetails: 'Socket bound and responding with 1.34ms roundtrip latency',
  },
  {
    id: 'task_dual_screen_sync',
    title: 'Persistent Dual-Screen Conversational Memory & Task Ledger',
    description: 'Keep conversation unbroken across stage and split-screen mode with persistent memory and visible task ledger.',
    status: 'in_progress',
    category: 'system',
    createdAt: Date.now() - 1000 * 60 * 10,
    tags: ['Memory', 'Persistence', 'SplitScreen', 'Tasks'],
    verificationDetails: 'Unified cross-view state synchronized with persistent local storage',
  },
];

export const INITIAL_MEMORIES: MemoryItem[] = [
  {
    id: 'mem_operator',
    key: 'Operator Identity',
    value: 'Damon (Lead System Engineer & Autonomous Workstation Controller)',
    category: 'preference',
    updatedAt: Date.now() - 1000 * 60 * 60,
  },
  {
    id: 'mem_environment',
    key: 'Workstation OS & Display',
    value: 'Linux X11 (Display :0.0) with xdotool, pgrep, and macOS Darwin fallback support',
    category: 'environment',
    updatedAt: Date.now() - 1000 * 60 * 50,
  },
  {
    id: 'mem_primary_browser',
    key: 'Default Web Browser',
    value: 'Google Chrome (executable: google-chrome-stable)',
    category: 'tool',
    updatedAt: Date.now() - 1000 * 60 * 40,
  },
  {
    id: 'mem_intent_protocol',
    key: 'Neural Core 5.1 Protocol',
    value: 'Structured JSON Intent Dispatcher with foreground window verification (OPEN_APPLICATION)',
    category: 'workflow',
    updatedAt: Date.now() - 1000 * 60 * 30,
  },
  {
    id: 'mem_worker_socket',
    key: 'ZeroMQ Host Worker',
    value: 'davids-Laptop in directory NeuralCore-Orgo listening on tcp://127.0.0.1:5555',
    category: 'environment',
    updatedAt: Date.now() - 1000 * 60 * 20,
  },
];

