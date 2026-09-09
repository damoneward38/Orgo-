# NeuralCore Architecture

A minimal, self-contained implementation of the Orgo Neural Core and Brain-Worker distributed architecture.

## 1. Directory Layout

```
NeuralCore/
├─ .venv/                     # virtualenv
├─ brain.py                   # Interactive GUI (Tkinter) – window 1
├─ worker_real.py             # ZeroMQ REQ/REP worker – window 2
├─ tools.py                   # ToolRegistry with open_app() / verify()
├─ neural_core.py             # Core logic, registry, ledger
├─ requirements.txt
└─ README.md
```

## 2. Requirements

Install dependencies:
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## 3. How to Run (Two Windows Side-by-Side)

### Window 2: Start the ZeroMQ Worker Terminal
```bash
python worker_real.py --host 127.0.0.1 --port 5555
```

### Window 1: Start the Interactive Brain GUI
```bash
python brain.py --ip 127.0.0.1 --port 5555
```

The GUI will:
* Show **CONNECTED** in green once it receives a ping.
* Let you type a JSON command in the input bar (`Enter` key submits).
* Show every request (`> …`) and the raw response (`< …`) in the scrollable console.

### Example: Open Google Chrome
```json
{
  "command": "handle_intent",
  "payload": {
    "intent": "OPEN_APPLICATION",
    "payload": { "name": "Google Chrome" }
  }
}
```
