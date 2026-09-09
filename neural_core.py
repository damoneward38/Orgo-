# neural_core.py
from pathlib import Path
from dataclasses import dataclass
from datetime import datetime
from tools import ToolRegistry

@dataclass
class CoreConfig:
    base_dir: Path

class NeuralCore:
    def __init__(self, cfg: CoreConfig = None):
        self.cfg      = cfg or CoreConfig(base_dir=Path(".").resolve())
        self.tools    = ToolRegistry()
        self.task_ledger = []   # simple in‑memory list, can be persisted later

    # ---------------------------------------------------------
    # 10.  Handle intents (e.g., open apps)
    # ---------------------------------------------------------
    def handle_intent(self, intent: str, payload: dict) -> dict:
        if intent == "OPEN_APPLICATION":
            app = payload.get("name")
            if not app:
                return {"error": "Missing 'name' in payload"}
            opened = self.tools.open_app(app)
            verified = self.tools.verify_active(app)
            status = "ok" if opened and verified else "fail"
            self.task_ledger.append({
                "intent": intent,
                "app": app,
                "opened": opened,
                "verified": verified,
                "status": status,
                "timestamp": datetime.utcnow().isoformat() + "Z"
            })
            return {"intent": intent, "app": app,
                    "opened": opened,
                    "verified": verified,
                    "status": status}
        else:
            return {"error": f"Unknown intent: {intent}"}
