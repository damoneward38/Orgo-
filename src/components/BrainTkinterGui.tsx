import React, { useState, useEffect, useRef } from 'react';
import { Send, RotateCw, CheckCircle, AlertCircle, Play, Terminal, Shield } from 'lucide-react';

interface BrainTkinterGuiProps {
  onIntentDispatched?: (appName: string, rawResp: any) => void;
  onSendToTerminal?: (cmd: string) => void;
}

export const BrainTkinterGui: React.FC<BrainTkinterGuiProps> = ({
  onIntentDispatched,
  onSendToTerminal,
}) => {
  const [status, setStatus] = useState<'CONNECTED' | 'CONNECTING…' | 'DISCONNECTED'>('CONNECTING…');
  const [consoleLogs, setConsoleLogs] = useState<string[]>([
    '[*] Orgo Brain v4.0 Tkinter Bridge initialized',
    '[*] ZeroMQ socket REQ connecting to tcp://127.0.0.1:5555',
    '[*] RCVTIMEO configured to 5000ms',
    '> {"command": "ping"}',
    '< {\n  "status": "alive",\n  "timestamp": "' + new Date().toISOString() + '"\n}',
  ]);
  const [inputText, setInputText] = useState(
    '{"command":"handle_intent","payload":{"intent":"OPEN_APPLICATION","payload":{"name":"Google Chrome"}}}'
  );
  const [isSending, setIsSending] = useState(false);
  const consoleBottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll console
  useEffect(() => {
    consoleBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [consoleLogs]);

  // Periodic ping worker (every 2.5s)
  useEffect(() => {
    let isMounted = true;
    const pingWorker = async () => {
      try {
        const res = await fetch('/api/zeromq/ping');
        const data = await res.json();
        if (isMounted) {
          if (data.status === 'alive' || data.status === 'ok') {
            setStatus('CONNECTED');
          } else {
            setStatus('DISCONNECTED');
          }
        }
      } catch {
        if (isMounted) {
          setStatus('DISCONNECTED');
        }
      }
    };

    pingWorker();
    const interval = setInterval(pingWorker, 2500);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleSend = async (customCommand?: string) => {
    const textToSend = (customCommand ?? inputText).trim();
    if (!textToSend || isSending) return;

    setIsSending(true);
    // Write request to console
    setConsoleLogs((prev) => [...prev, `> ${textToSend}`]);

    let payload: any;
    try {
      if (textToSend.startsWith('{')) {
        payload = JSON.parse(textToSend);
      } else {
        payload = {
          command: 'handle_intent',
          payload: {
            intent: 'OPEN_APPLICATION',
            payload: { name: textToSend },
          },
        };
      }
    } catch {
      payload = {
        command: 'handle_intent',
        payload: {
          intent: 'OPEN_APPLICATION',
          payload: { name: textToSend },
        },
      };
    }

    try {
      const res = await fetch('/api/zeromq/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      setConsoleLogs((prev) => [
        ...prev,
        `< ${JSON.stringify(data, null, 2)}`,
      ]);

      if (data.status === 'ok' || data.status === 'alive') {
        setStatus('CONNECTED');
      }

      // If opening an app, notify parent workstation
      if (payload.payload?.payload?.name) {
        onIntentDispatched?.(payload.payload.payload.name, data);
      } else if (payload.command === 'OPEN_APPLICATION') {
        onIntentDispatched?.(payload.payload?.name || 'Google Chrome', data);
      }
    } catch (err: any) {
      setConsoleLogs((prev) => [...prev, `[ERR] ${err.message || 'ZeroMQ Timeout'}`]);
      setStatus('DISCONNECTED');
    } finally {
      setIsSending(false);
    }
  };

  const statusColor =
    status === 'CONNECTED'
      ? '#8caa39' // green matching brain.py
      : status === 'CONNECTING…'
      ? '#e5c890'
      : '#ff5555'; // red matching brain.py

  return (
    <div className="flex-1 flex flex-col bg-[#181825] text-[#cdd6f4] font-mono select-text h-full overflow-hidden border border-zinc-800 rounded-xl">
      {/* Tkinter Window Title & Status Bar matching brain.py */}
      <div className="px-3 py-2 bg-[#11111b] border-b border-[#313244] flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#f38ba8]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#f9e2af]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#a6e3a1]" />
          <span className="font-bold text-[#cdd6f4] ml-2">Orgo Brain v4.0 (Tkinter)</span>
        </div>
        <div className="flex items-center gap-2 font-bold text-xs" style={{ color: statusColor }}>
          <span
            className="w-2 h-2 rounded-full animate-pulse"
            style={{ backgroundColor: statusColor }}
          />
          <span>{status}</span>
        </div>
      </div>

      {/* ScrolledText Console Output Area matching brain.py bg="#1e1e2e" fg="#cdd6f4" */}
      <div className="flex-1 p-3.5 overflow-y-auto bg-[#1e1e2e] text-[#cdd6f4] font-mono text-[11px] sm:text-xs leading-relaxed space-y-1">
        {consoleLogs.map((log, index) => {
          const isReq = log.startsWith('>');
          const isResp = log.startsWith('<');
          const isErr = log.startsWith('[ERR]') || log.startsWith('[-] ');

          let textColor = 'text-[#cdd6f4]';
          if (isReq) textColor = 'text-[#89b4fa] font-bold';
          else if (isResp) textColor = 'text-[#a6e3a1]';
          else if (isErr) textColor = 'text-[#f38ba8] font-bold';
          else if (log.startsWith('[*]')) textColor = 'text-[#bac2de]';

          return (
            <div key={index} className={`whitespace-pre-wrap ${textColor}`}>
              {log}
            </div>
          );
        })}
        <div ref={consoleBottomRef} />
      </div>

      {/* Preset Quick Shortcut Pills matching brain.py */}
      <div className="px-3 py-1.5 bg-[#181825] border-t border-[#313244] flex items-center gap-1.5 overflow-x-auto text-[10px] text-[#a6adc8] no-scrollbar flex-shrink-0">
        <span className="text-[#6c7086] font-bold uppercase">Quick:</span>
        <button
          onClick={() => {
            const cmd = '{"command":"handle_intent","payload":{"intent":"OPEN_APPLICATION","payload":{"name":"Google Chrome"}}}';
            setInputText(cmd);
            handleSend(cmd);
          }}
          className="px-2 py-0.5 rounded bg-[#313244] hover:bg-[#45475a] text-[#89dceb] transition-colors whitespace-nowrap"
        >
          Open Chrome
        </button>

        <button
          onClick={() => {
            const cmd = '{"command":"ping"}';
            setInputText(cmd);
            handleSend(cmd);
          }}
          className="px-2 py-0.5 rounded bg-[#313244] hover:bg-[#45475a] text-[#a6e3a1] transition-colors whitespace-nowrap"
        >
          Ping Worker
        </button>

        <button
          onClick={() => {
            const cmd = '{"command":"handle_intent","payload":{"intent":"OPEN_APPLICATION","payload":{"name":"VS Code"}}}';
            setInputText(cmd);
            handleSend(cmd);
          }}
          className="px-2 py-0.5 rounded bg-[#313244] hover:bg-[#45475a] text-[#cba6f7] transition-colors whitespace-nowrap"
        >
          Open VS Code
        </button>

        <button
          onClick={() => {
            const cmd = '{"command":"handle_intent","payload":{"intent":"OPEN_APPLICATION","payload":{"name":"Mailspring"}}}';
            setInputText(cmd);
            handleSend(cmd);
          }}
          className="px-2 py-0.5 rounded bg-[#313244] hover:bg-[#45475a] text-[#f9e2af] transition-colors whitespace-nowrap"
        >
          Open Mailspring
        </button>

        {onSendToTerminal && (
          <button
            onClick={() => onSendToTerminal("ss -lptn 'sport = :5555'")}
            className="px-2 py-0.5 rounded bg-[#313244] hover:bg-[#45475a] text-[#fab387] transition-colors whitespace-nowrap ml-auto"
          >
            Check :5555
          </button>
        )}
      </div>

      {/* Input Frame matching brain.py Tkinter Entry and Send Button */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="p-2.5 bg-[#181825] border-t border-[#313244] flex items-center gap-2 flex-shrink-0"
      >
        <span className="text-[#89b4fa] font-bold text-xs select-none">&gt;</span>
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder='{"command":"handle_intent","payload":{"intent":"OPEN_APPLICATION","payload":{"name":"Google Chrome"}}}'
          className="flex-1 bg-[#1e1e2e] border border-[#313244] rounded px-3 py-1.5 text-xs text-[#cdd6f4] focus:outline-none focus:border-[#89b4fa] font-mono"
        />
        <button
          type="submit"
          disabled={isSending}
          className="px-4 py-1.5 bg-[#89b4fa] hover:bg-[#b4befe] disabled:opacity-50 text-[#11111b] rounded text-xs font-bold font-mono transition-colors flex items-center gap-1.5 shadow"
        >
          <Send className="w-3 h-3" />
          <span>Send</span>
        </button>
      </form>
    </div>
  );
};
