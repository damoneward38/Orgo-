import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Terminal,
  Activity,
  Server,
  Play,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Volume2,
  FileCode,
  Globe,
  Mail,
  Trash2,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { CommandPattern, DecisionResult, WorkerResponse, ActivityLogItem, VirtualProcess, VirtualScript } from '../types';
import { decideCommand } from '../utils/neuralEngine';
import { executeWorkerAction } from '../utils/workerSimulator';

interface BrainConsoleProps {
  patterns: CommandPattern[];
  scripts: VirtualScript[];
  workerIp: string;
  setWorkerIp: (ip: string) => void;
  workerPort: number;
  setWorkerPort: (port: number) => void;
  isAudioEnabled: boolean;
  platform: 'Linux' | 'Darwin' | 'Windows';
  setPlatform: (p: 'Linux' | 'Darwin' | 'Windows') => void;
}

export const BrainConsole: React.FC<BrainConsoleProps> = ({
  patterns,
  scripts,
  workerIp,
  setWorkerIp,
  workerPort,
  setWorkerPort,
  isAudioEnabled,
  platform,
  setPlatform,
}) => {
  const [prompt, setPrompt] = useState<string>('open browser');
  const [isSending, setIsSending] = useState<boolean>(false);
  const [logs, setLogs] = useState<ActivityLogItem[]>([
    {
      id: 'init_log_1',
      timestamp: Date.now() - 30000,
      prompt: 'ping',
      decision: {
        action: 'ping',
        args: {},
        matchedPattern: '^ping$',
        patternId: 'pat_ping',
        rawPrompt: 'ping',
        timestamp: Date.now() - 30000,
      },
      response: {
        status: 'ok',
        msg: 'pong',
        details: { roundtrip_ms: 12, platform: 'Linux' },
        executionTimeMs: 14,
      },
      status: 'success',
      workerIp: '127.0.0.1',
      port: 5555,
    },
  ]);

  const [processes, setProcesses] = useState<VirtualProcess[]>([
    {
      id: 'proc_init',
      name: 'ZeroMQ Daemon (worker.py)',
      type: 'system',
      target: 'tcp://*:5555',
      startedAt: Date.now() - 60000,
      status: 'running',
      outputPreview: 'Listening on port 5555 (REP socket)',
    },
  ]);

  const [workerLogs, setWorkerLogs] = useState<string[]>([
    '[*] Orgo Worker v4.0 listening on tcp://*:5555',
    '[*] Operating System: Linux x86_64 Kernel 6.5.0-generic',
    '[*] Subprocess execution sandbox active',
    '[<] [127.0.0.1] Received command: ping',
    '[>] Dispatched response (ok) in 14ms',
  ]);

  const terminalEndRef = useRef<HTMLDivElement>(null);
  const workerTerminalEndRef = useRef<HTMLDivElement>(null);

  // Live decision preview for the current input
  const liveDecision = React.useMemo(() => {
    if (!prompt.trim()) return null;
    return decideCommand(prompt, patterns);
  }, [prompt, patterns]);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  useEffect(() => {
    workerTerminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [workerLogs]);

  const handleSendPrompt = async (promptToSend?: string) => {
    const text = (promptToSend ?? prompt).trim();
    if (!text || isSending) return;

    setIsSending(true);

    // 1. Neural Core decision
    const decision: DecisionResult = decideCommand(text, patterns);

    const logId = `log_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const pendingLog: ActivityLogItem = {
      id: logId,
      timestamp: Date.now(),
      prompt: text,
      decision,
      status: 'executing',
      workerIp,
      port: workerPort,
    };

    setLogs((prev) => [...prev, pendingLog]);

    // Append to worker daemon logs
    const timeStr = new Date().toLocaleTimeString();
    setWorkerLogs((prev) => [
      ...prev,
      `[${timeStr}] [<] [${workerIp}] Received payload: action="${decision.action}"`,
    ]);

    if (decision.action === 'unknown') {
      setTimeout(() => {
        setLogs((prev) =>
          prev.map((l) =>
            l.id === logId
              ? {
                  ...l,
                  status: 'error',
                  response: {
                    status: 'error',
                    msg: 'Unknown command. No registered pattern in neural_core.py matched this prompt.',
                  },
                }
              : l
          )
        );
        setWorkerLogs((prev) => [
          ...prev,
          `[${timeStr}] [!] Rejected unknown command from client`,
        ]);
        setIsSending(false);
      }, 100);
      return;
    }

    // 2. Dispatch to worker
    try {
      const response = await executeWorkerAction(decision, {
        platform,
        enableVoiceAudio: isAudioEnabled,
        scripts,
        onProcessSpawn: (proc) => {
          setProcesses((prev) => [proc, ...prev.slice(0, 7)]);
        },
      });

      setLogs((prev) =>
        prev.map((l) =>
          l.id === logId
            ? {
                ...l,
                status: response.status === 'ok' ? 'success' : 'error',
                response,
              }
            : l
        )
      );

      const finishTimeStr = new Date().toLocaleTimeString();
      setWorkerLogs((prev) => [
        ...prev,
        `[${finishTimeStr}] [>] Dispatched response (${response.status}) in ${response.executionTimeMs || 45}ms`,
        ...(response.output
          ? response.output.split('\n').map((line) => `    | ${line}`)
          : response.msg
          ? [`    | msg: ${response.msg}`]
          : []),
      ]);
    } catch (err: any) {
      setLogs((prev) =>
        prev.map((l) =>
          l.id === logId
            ? {
                ...l,
                status: 'error',
                response: {
                  status: 'error',
                  msg: err?.message || 'Connection error to worker node',
                },
              }
            : l
        )
      );
    } finally {
      setIsSending(false);
    }
  };

  const quickPrompts = [
    { label: 'open browser', icon: Globe },
    { label: 'open email client', icon: Mail },
    { label: 'run script backup.py', icon: Play },
    { label: 'run script test.py', icon: FileCode },
    { label: 'say Task executed successfully!', icon: Volume2 },
    { label: 'system status', icon: Activity },
    { label: 'ping', icon: RefreshCw },
  ];

  const clearLogs = () => {
    setLogs([]);
    setWorkerLogs([`[*] Log cleared. ZeroMQ socket listening on tcp://*:${workerPort}`]);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Quick Config */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
              <span>ZeroMQ Worker Node</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            </div>
            <p className="text-xs text-zinc-400">
              Brain communicates via ZeroMQ REQ/REP socket over TCP
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs font-mono">
            <span className="text-zinc-500">Worker Host:</span>
            <input
              id="worker-ip-input"
              type="text"
              value={workerIp}
              onChange={(e) => setWorkerIp(e.target.value)}
              className="bg-transparent text-zinc-200 outline-none w-28 font-mono"
              placeholder="127.0.0.1"
            />
            <span className="text-zinc-500">:</span>
            <input
              id="worker-port-input"
              type="number"
              value={workerPort}
              onChange={(e) => setWorkerPort(Number(e.target.value) || 5555)}
              className="bg-transparent text-zinc-200 outline-none w-14 font-mono"
            />
          </div>

          <div className="flex items-center gap-1 bg-zinc-950 border border-zinc-800 rounded-lg p-1 text-xs">
            <span className="px-2 text-zinc-500">Host OS:</span>
            {(['Linux', 'Darwin', 'Windows'] as const).map((os) => (
              <button
                key={os}
                onClick={() => setPlatform(os)}
                className={`px-2.5 py-1 rounded transition-all font-medium ${
                  platform === os
                    ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {os === 'Darwin' ? 'macOS' : os}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Dual Console Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Brain UI (brain.py) */}
        <div className="lg:col-span-6 flex flex-col gap-4">
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl overflow-hidden flex flex-col h-[640px] shadow-lg">
            {/* Brain Header */}
            <div className="px-4 py-3 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500/80"></span>
                <span className="w-3 h-3 rounded-full bg-amber-500/80"></span>
                <span className="w-3 h-3 rounded-full bg-emerald-500/80"></span>
                <span className="text-xs font-mono font-medium text-zinc-300 ml-2">
                  brain.py — Orgo Tkinter &amp; Client GUI
                </span>
              </div>
              <span className="text-[11px] text-zinc-500 font-mono">
                Socket: REQ | Timeout: 5000ms
              </span>
            </div>

            {/* Prompt Input Section */}
            <div className="p-4 border-b border-zinc-800/80 bg-zinc-900/40 space-y-3">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendPrompt();
                }}
                className="flex items-center gap-2"
              >
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-zinc-500 font-mono text-sm">
                    &gt;
                  </div>
                  <input
                    id="brain-prompt-input"
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Type prompt (e.g. open browser, say Hello, run script backup.py)..."
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-8 pr-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:border-indigo-500/80 transition-colors font-mono"
                    autoFocus
                  />
                </div>
                <button
                  id="send-prompt-btn"
                  type="submit"
                  disabled={isSending || !prompt.trim()}
                  className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-98 text-zinc-950 font-semibold text-sm flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm shadow-emerald-500/20"
                >
                  {isSending ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  <span>Send</span>
                </button>
              </form>

              {/* Real-time Decision Inspector */}
              <div className="flex items-center justify-between text-xs font-mono px-1">
                <div className="flex items-center gap-2 text-zinc-400">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Neural Core v4.0 Match:</span>
                  {liveDecision ? (
                    liveDecision.action !== 'unknown' ? (
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                        {liveDecision.action}
                        {Object.keys(liveDecision.args).length > 0 &&
                          ` (${JSON.stringify(liveDecision.args)})`}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        Unknown command
                      </span>
                    )
                  ) : (
                    <span className="text-zinc-600">Enter a prompt</span>
                  )}
                </div>

                <button
                  onClick={clearLogs}
                  className="text-zinc-500 hover:text-zinc-300 flex items-center gap-1 text-[11px]"
                  title="Clear Brain logs"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Clear</span>
                </button>
              </div>

              {/* Quick Prompt Pills */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[11px] text-zinc-500 font-medium mr-1">Quick:</span>
                {quickPrompts.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => {
                        setPrompt(item.label);
                        handleSendPrompt(item.label);
                      }}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-zinc-800/80 hover:bg-zinc-700/80 border border-zinc-700/50 text-[11px] text-zinc-300 font-mono transition-colors"
                    >
                      <Icon className="w-3 h-3 text-zinc-400" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Brain Scrolled Activity Log (mirroring tkinter ScrolledText) */}
            <div className="flex-1 p-4 overflow-y-auto font-mono text-xs space-y-4 bg-zinc-950/60">
              {logs.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-zinc-600 space-y-2">
                  <Terminal className="w-8 h-8 opacity-40" />
                  <p>No activity yet. Type a command above to test the Neural Core.</p>
                </div>
              ) : (
                logs.map((item) => {
                  const isSuccess = item.status === 'success';
                  const isPending = item.status === 'executing';
                  const isErr = item.status === 'error';

                  return (
                    <div
                      key={item.id}
                      className="border border-zinc-800/80 rounded-xl p-3 bg-zinc-900/60 space-y-2.5 transition-all"
                    >
                      {/* Prompt & Status line */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-indigo-400 font-bold">&gt;</span>
                          <span className="text-zinc-100 font-semibold">{item.prompt}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {isPending && (
                            <span className="flex items-center gap-1 text-[11px] text-amber-400">
                              <RefreshCw className="w-3 h-3 animate-spin" />
                              <span>ZeroMQ dispatching...</span>
                            </span>
                          )}
                          {isSuccess && (
                            <span className="flex items-center gap-1 text-[11px] text-emerald-400">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>{item.response?.executionTimeMs || 45}ms</span>
                            </span>
                          )}
                          {isErr && (
                            <span className="flex items-center gap-1 text-[11px] text-rose-400">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              <span>Failed</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Decided Action Payload */}
                      <div className="bg-zinc-950/90 rounded-lg p-2.5 border border-zinc-800/60 text-[11px]">
                        <div className="text-zinc-500 mb-1 flex items-center justify-between">
                          <span>neural_core.decide() ➔ ZeroMQ REQ JSON:</span>
                          <span className="text-zinc-600">action: {item.decision.action}</span>
                        </div>
                        <pre className="text-zinc-300 overflow-x-auto whitespace-pre-wrap">
                          {JSON.stringify(
                            { action: item.decision.action, args: item.decision.args },
                            null,
                            2
                          )}
                        </pre>
                      </div>

                      {/* Worker Response Payload */}
                      {item.response && (
                        <div
                          className={`rounded-lg p-2.5 border text-[11px] ${
                            isSuccess
                              ? 'bg-emerald-950/20 border-emerald-500/20 text-emerald-300'
                              : 'bg-rose-950/20 border-rose-500/20 text-rose-300'
                          }`}
                        >
                          <div className="text-zinc-400 mb-1 flex items-center justify-between">
                            <span>worker.py ZeroMQ REP JSON:</span>
                            <span className="font-mono">status: {item.response.status}</span>
                          </div>
                          <pre className="overflow-x-auto whitespace-pre-wrap">
                            {JSON.stringify(item.response, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
              <div ref={terminalEndRef} />
            </div>
          </div>
        </div>

        {/* Right Column: Remote Worker Executor (worker.py) */}
        <div className="lg:col-span-6 flex flex-col gap-4">
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl overflow-hidden flex flex-col h-[640px] shadow-lg">
            {/* Worker Header */}
            <div className="px-4 py-3 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-xs font-mono font-medium text-zinc-300">
                  worker.py — Remote Executor Sandbox [{platform}]
                </span>
              </div>
              <span className="text-[11px] text-zinc-500 font-mono">
                Socket: REP | tcp://*:5555
              </span>
            </div>

            {/* Active Processes & Spawned Tasks */}
            <div className="p-4 border-b border-zinc-800/80 bg-zinc-900/40">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-semibold text-zinc-300 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-emerald-400" />
                  Subprocess Task Monitor
                </span>
                <span className="text-zinc-500 text-[11px] font-mono">
                  Active Tasks: {processes.length}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {processes.slice(0, 4).map((proc) => (
                  <div
                    key={proc.id}
                    className="bg-zinc-950/80 border border-zinc-800/80 rounded-xl p-2.5 text-xs flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="font-semibold text-zinc-200 truncate font-mono">
                        {proc.name}
                      </span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                          proc.status === 'running'
                            ? 'bg-emerald-500/15 text-emerald-400'
                            : 'bg-zinc-800 text-zinc-400'
                        }`}
                      >
                        {proc.status}
                      </span>
                    </div>
                    <div className="text-[11px] text-zinc-500 font-mono truncate">
                      {proc.target}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Worker Remote Terminal (stdout stream) */}
            <div className="flex-1 p-4 overflow-y-auto font-mono text-xs space-y-1 bg-black/90 text-zinc-300">
              <div className="text-zinc-600 pb-2 border-b border-zinc-800/60 mb-2 flex items-center justify-between">
                <span>// Remote Host STDOUT &amp; ZeroMQ Loop</span>
                <span>Port: {workerPort}</span>
              </div>
              {workerLogs.map((logLine, idx) => {
                const isIncoming = logLine.includes('[<]');
                const isOutgoing = logLine.includes('[>]');
                const isErr = logLine.includes('[!]');
                return (
                  <div
                    key={idx}
                    className={`leading-relaxed whitespace-pre-wrap ${
                      isIncoming
                        ? 'text-cyan-400'
                        : isOutgoing
                        ? 'text-emerald-400'
                        : isErr
                        ? 'text-rose-400'
                        : logLine.startsWith('    |')
                        ? 'text-zinc-400 pl-2'
                        : 'text-zinc-500'
                    }`}
                  >
                    {logLine}
                  </div>
                );
              })}
              <div ref={workerTerminalEndRef} />
            </div>

            {/* Quick Virtual Script Run Drawer */}
            <div className="p-3 bg-zinc-950 border-t border-zinc-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-zinc-400">
                <FileCode className="w-4 h-4 text-amber-400" />
                <span className="text-[11px] hidden sm:inline">Available remote scripts:</span>
              </div>
              <div className="flex items-center gap-2">
                {scripts.map((sc) => (
                  <button
                    key={sc.filename}
                    onClick={() => {
                      const cmd = `run script ${sc.filename}`;
                      setPrompt(cmd);
                      handleSendPrompt(cmd);
                    }}
                    className="px-2 py-1 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[11px] text-zinc-300 font-mono transition-colors"
                    title={sc.description}
                  >
                    {sc.filename}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
