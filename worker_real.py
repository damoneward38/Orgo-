#!/usr/bin/env python3
# worker_real.py
import zmq
import json
import sys
import argparse
from pathlib import Path
from datetime import datetime
from neural_core import NeuralCore, CoreConfig

def main(host="127.0.0.1", port=5555, base_dir="."):
    cfg = CoreConfig(base_dir=Path(base_dir).resolve())
    core = NeuralCore(cfg)

    ctx = zmq.Context()
    socket = ctx.socket(zmq.REP)
    socket.bind(f"tcp://{host}:{port}")
    print(f"[WORKER] Listening on tcp://{host}:{port}")

    while True:
        try:
            msg = socket.recv()
            req = json.loads(msg.decode())
            cmd = req.get("command")
            payload = req.get("payload", {})

            if cmd == "handle_intent":
                resp = core.handle_intent(payload.get("intent"),
                                          payload.get("payload", {}))
                socket.send(json.dumps(resp).encode())
            elif cmd == "ping":
                socket.send(json.dumps({"status":"alive",
                                        "timestamp":datetime.utcnow().isoformat()+"Z"}).encode())
            else:
                socket.send(json.dumps({"error":"unknown command"}).encode())

        except KeyboardInterrupt:
            print("\n[WORKER] shutting down")
            break
        except Exception as exc:
            socket.send(json.dumps({"error": str(exc)}).encode())
            print(f"[WORKER] error: {exc}", file=sys.stderr)

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=5555)
    parser.add_argument("--base", default=".")

    args = parser.parse_args()
    main(args.host, args.port, args.base)
