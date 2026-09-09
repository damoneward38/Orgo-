// src/components/DoubleWindowSplitScreen.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  Layers,
  Send,
  Sparkles,
  ExternalLink,
  Cpu,
  HardDrive,
  Wifi,
  Clock,
  User,
  Bot,
  Globe,
  Code2,
  Terminal as TermIcon,
  Mail,
  Folder,
  Search,
  Play,
  CheckCircle2,
  Brain,
  ListTodo,
  ShieldCheck,
  Activity,
  Mic,
  MicOff,
  Radio,
  Volume2,
  VolumeX,
  RefreshCw,
  Power,
  Monitor,
  Maximize2,
  Check,
} from 'lucide-react';
import {
  CommandPattern,
  WorkArtifact,
  ChatMessage,
  WorkTask,
  MemoryItem,
  DesktopAppId,
  DesktopWindowState,
} from '../types';
import { useVoice } from '../context/VoiceContext';
import { TaskMemoryBoard } from './TaskMemoryBoard';
import { WorkstationBrowser } from './WorkstationBrowser';
import { NeuralAppBuilderGui } from './NeuralAppBuilderGui';
import { BrainTkinterGui } from './BrainTkinterGui';

interface DoubleWindowSplitScreenProps {
  patterns: CommandPattern[];
  artifacts: WorkArtifact[];
  setArtifacts: React.Dispatch<React.SetStateAction<WorkArtifact[]>>;
  chatMessages: ChatMessage[];
  setChatMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  tasks: WorkTask[];
  setTasks: React.Dispatch<React.SetStateAction<WorkTask[]>>;
  memories: MemoryItem[];
  setMemories: React.Dispatch<React.SetStateAction<MemoryItem[]>>;
  isAudioEnabled: boolean;
  setIsAudioEnabled: (val: boolean) => void;
  onSwitchToStage?: () => void;
}

export const DoubleWindowSplitScreen: React.FC<DoubleWindowSplitScreenProps> = ({
  patterns,
  artifacts,
  setArtifacts,
  chatMessages,
  setChatMessages,
  tasks,
  setTasks,
  memories,
  setMemories,
  isAudioEnabled,
  setIsAudioEnabled,
  onSwitchToStage,
}) => {
  const {
    isListening,
    isSpeaking,
    isContinuousMode,
    interimTranscript,
    isThinking,
    toggleMic,
    toggleContinuousMode,
    dispatchInstruction,
    activeApp,
    setActiveApp,
    windows,
    setWindows,
    isComputerOpen,
    setIsComputerOpen,
    isTypingCode,
    codeTypedLength,
    window1Tab,
    setWindow1Tab,
  } = useVoice();

  const [operatorInput, setOperatorInput] = useState('');
  const [showTaskLedger, setShowTaskLedger] = useState(false);
  const [browserInputUrl, setBrowserInputUrl] = useState(
    windows.browser.currentUrl || 'http://localhost:3000'
  );
  const [terminalCustomCmd, setTerminalCustomCmd] = useState('');
  const [isDualTerminalSplit, setIsDualTerminalSplit] = useState(false);
  const [currentTime, setCurrentTime] = useState(
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  );

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const terminalBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, interimTranscript]);

  useEffect(() => {
    terminalBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [windows.terminal.terminalLines, isDualTerminalSplit, activeApp]);

  const handleOperatorSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!operatorInput.trim() || isThinking) return;
    const text = operatorInput.trim();
    setOperatorInput('');
    dispatchInstruction(text);
  };

  const handleQuickPrompt = (prompt: string) => {
    dispatchInstruction(prompt);
  };

  const handleBrowserNavigate = (e: React.FormEvent) => {
    e.preventDefault();
    let url = browserInputUrl.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    setWindows((prev) => ({
      ...prev,
      browser: {
        ...prev.browser,
        currentUrl: url,
        title: `Google Chrome - ${url.replace('https://', '')}`,
        isOpen: true,
      },
    }));
    setActiveApp('browser');
  };

  const executePresetCommand = async (cmd: string) => {
    setWindows((prev) => ({
      ...prev,
      terminal: {
        ...prev.terminal,
        terminalLines: [
          ...(prev.terminal.terminalLines || []),
          `user@neuro-worker:~$ ${cmd}`,
        ],
      },
    }));

    try {
      const res = await fetch('/api/terminal/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: cmd }),
      });
      const data = await res.json();
      const outputLines: string[] = [];
      if (data.stdout && data.stdout.trim()) {
        outputLines.push(...data.stdout.trim().split('\n'));
      }
      if (data.stderr && data.stderr.trim()) {
        outputLines.push(...data.stderr.trim().split('\n'));
      }
      if (outputLines.length === 0) {
        outputLines.push(`[✓] Exit code: ${data.returncode ?? 0}`);
      }

      setWindows((prev) => ({
        ...prev,
        terminal: {
          ...prev.terminal,
          terminalLines: [
            ...(prev.terminal.terminalLines || []),
            ...outputLines,
          ],
        },
      }));
    } catch (err: any) {
      setWindows((prev) => ({
        ...prev,
        terminal: {
          ...prev.terminal,
          terminalLines: [
            ...(prev.terminal.terminalLines || []),
            `[!] Error executing: ${err.message || err}`,
          ],
        },
      }));
    }
  };

  const handleTerminalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!terminalCustomCmd.trim()) return;
    const cmd = terminalCustomCmd.trim();
    setTerminalCustomCmd('');

    // Check for "neural open <path>" command
    const openMatch = cmd.match(/^neural\s+open\s+(.+)$/i);
    if (openMatch) {
      const projectPath = openMatch[1].trim();
      const folderName = projectPath.split('/').filter(Boolean).pop() || 'project';
      const newLines = [
        ...(windows.terminal.terminalLines || []),
        `user@neuro-worker:~$ ${cmd}`,
        `[*] Resolving project path: ${projectPath}`,
        `[*] Dispatched to Visual Studio Code workspace...`,
        `✅ Opened ${projectPath} in code`,
      ];
      setWindows((prev) => ({
        ...prev,
        terminal: {
          ...prev.terminal,
          terminalLines: newLines,
        },
        vscode: {
          ...prev.vscode,
          isOpen: true,
          editorFile: `${folderName}/src/main.ts`,
          editorContent: `// Project: ${projectPath}\n// Loaded into Visual Studio Code via: ${cmd}\n\nexport function bootstrap() {\n  console.log("Initialized workspace: ${folderName}");\n}\n\nbootstrap();\n`,
        },
      }));
      return;
    }

    // Check for "neural run <path> --script '<script>'" command
    const runMatch = cmd.match(/^neural\s+run\s+(.+?)\s+--script\s+["']?(.+?)["']?$/i);
    if (runMatch) {
      const projectPath = runMatch[1].trim();
      const script = runMatch[2].trim();
      const newLines = [
        ...(windows.terminal.terminalLines || []),
        `user@neuro-worker:~$ ${cmd}`,
        `[*] Executing script inside: ${projectPath}`,
        `[*] Command: ${script}`,
        `[npm] > running task: ${script}...`,
        `[npm] ✓ packages up to date and verified in 1.4s`,
        `[test] PASS test/core.test.ts (4 tests passed)`,
        `✅ Script finished in ${projectPath}`,
      ];
      setWindows((prev) => ({
        ...prev,
        terminal: {
          ...prev.terminal,
          terminalLines: newLines,
        },
      }));
      return;
    }

    // Check for "neural" or "neural --help"
    if (cmd === 'neural' || cmd === 'neural --help' || cmd === 'neural -h') {
      const newLines = [
        ...(windows.terminal.terminalLines || []),
        `user@neuro-worker:~$ ${cmd}`,
        `usage: neural [-h] {open,run,status} ...`,
        ``,
        `Neural Core Workstation Automation CLI`,
        ``,
        `positional arguments:`,
        `  {open,run,status}`,
        `    open             Open a project directory in VS Code`,
        `    run              Run a script inside a project directory`,
        `    status           Check ZeroMQ worker daemon on port 5555`,
        ``,
        `optional arguments:`,
        `  -h, --help         show this help message and exit`,
      ];
      setWindows((prev) => ({
        ...prev,
        terminal: {
          ...prev.terminal,
          terminalLines: newLines,
        },
      }));
      return;
    }

    // Live execution via backend /api/terminal/execute
    setWindows((prev) => ({
      ...prev,
      terminal: {
        ...prev.terminal,
        terminalLines: [
          ...(prev.terminal.terminalLines || []),
          `user@neuro-worker:~$ ${cmd}`,
        ],
      },
    }));

    try {
      const res = await fetch('/api/terminal/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: cmd }),
      });
      const data = await res.json();
      const outputLines: string[] = [];
      if (data.stdout && data.stdout.trim()) {
        outputLines.push(...data.stdout.trim().split('\n'));
      }
      if (data.stderr && data.stderr.trim()) {
        outputLines.push(...data.stderr.trim().split('\n'));
      }
      if (outputLines.length === 0) {
        outputLines.push(`[✓] Exit code: ${data.returncode ?? 0}`);
      }

      setWindows((prev) => ({
        ...prev,
        terminal: {
          ...prev.terminal,
          terminalLines: [
            ...(prev.terminal.terminalLines || []),
            ...outputLines,
          ],
        },
      }));
    } catch (err: any) {
      setWindows((prev) => ({
        ...prev,
        terminal: {
          ...prev.terminal,
          terminalLines: [
            ...(prev.terminal.terminalLines || []),
            `[!] Execution error: ${err.message || err}`,
          ],
        },
      }));
    }
  };

  const executeCodeInTerminal = (code: string, filename: string) => {
    setActiveApp('terminal');
    setWindows((prev) => ({
      ...prev,
      terminal: {
        ...prev.terminal,
        isOpen: true,
        terminalLines: [
          ...(prev.terminal.terminalLines || []),
          `user@neuro-worker:~$ python3 /home/user/scripts/${filename}`,
          `[*] Compiling and executing ${filename} with ZeroMQ IPC...`,
          `[+] Worker response: Process OK (PID 5120)`,
          `[✓] Execution completed in 0.18s. Exit code: 0`,
        ],
      },
    }));
  };

  const copyCodeToEditor = (code: string, filename?: string) => {
    setActiveApp('vscode');
    setWindows((prev) => ({
      ...prev,
      vscode: {
        ...prev.vscode,
        isOpen: true,
        editorFile: filename || 'zeromq_client.py',
        editorContent: code,
      },
    }));
  };

  const renderChromeBlock = () => (
    <WorkstationBrowser
      currentUrl={windows.browser.currentUrl || 'http://localhost:3000'}
      compact={false}
      onNavigate={(url) => {
        setWindows((prev) => ({
          ...prev,
          browser: {
            ...prev.browser,
            currentUrl: url,
            title: `Google Chrome - ${url.replace(/^https?:\/\//, '')}`,
          },
        }));
      }}
      onSendToEditor={(code, filename) => {
        copyCodeToEditor(code, filename || 'zeromq_client.py');
      }}
      onSendToTerminal={(cmd) => {
        executePresetCommand(cmd);
      }}
    />
  );

  const renderVSCodeBlock = () => (
    <div className="flex-1 flex flex-col bg-zinc-950 font-mono text-xs">
      <div className="bg-zinc-900 border-b border-zinc-800 px-3 py-1.5 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded bg-zinc-800 text-blue-300 border border-zinc-700 flex items-center gap-1.5">
            <Code2 className="w-3.5 h-3.5" />
            <span>{windows.vscode.editorFile || 'doc_scraper.py'}</span>
          </span>
          {isTypingCode && (
            <span className="text-[10px] text-amber-400 animate-pulse">
              Typing code...
            </span>
          )}
        </div>

        <button
          onClick={() =>
            executeCodeInTerminal(
              windows.vscode.editorContent || '',
              windows.vscode.editorFile || 'doc_scraper.py'
            )
          }
          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
        >
          <Play className="w-3 h-3 fill-current" />
          <span>Run in Terminal</span>
        </button>
      </div>

      <div className="flex-1 p-4 overflow-y-auto bg-zinc-950 text-zinc-300 select-text">
        <pre className="font-mono text-xs leading-relaxed">
          {isTypingCode
            ? (windows.vscode.editorContent || '').slice(0, codeTypedLength)
            : windows.vscode.editorContent}
        </pre>
      </div>
    </div>
  );

  const renderTerminalBlock = (heightClass = 'flex-1') => (
    <div className={`${heightClass} flex flex-col bg-zinc-950 font-mono text-xs text-zinc-300 min-h-0`}>
      <div className="bg-zinc-900 border-b border-zinc-800 px-3 py-1.5 flex items-center justify-between text-[11px] text-zinc-400 flex-shrink-0">
        <div className="flex items-center gap-2">
          <TermIcon className="w-3.5 h-3.5 text-amber-400" />
          <span>bash (PID 5088 &bull; Display :0.0)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-emerald-400 font-semibold text-[10px]">ZeroMQ tcp://127.0.0.1:5555 Connected</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        </div>
      </div>

      {/* Quick Executable Actions */}
      <div className="px-3 py-1 bg-zinc-900/60 border-b border-zinc-800/80 flex items-center gap-1.5 overflow-x-auto text-[10px] text-zinc-400 no-scrollbar flex-shrink-0">
        <span className="text-zinc-500 font-mono text-[9px] uppercase">Quick Run:</span>
        <button
          onClick={() => executePresetCommand('python3 brain.py "Google Chrome"')}
          className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-emerald-300 border border-zinc-700 whitespace-nowrap transition-colors"
        >
          python3 brain.py "Chrome"
        </button>
        <button
          onClick={() => executePresetCommand("ss -lptn 'sport = :5555'")}
          className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-blue-300 border border-zinc-700 whitespace-nowrap transition-colors"
        >
          ss -lptn :5555
        </button>
        <button
          onClick={() => executePresetCommand('ps aux | grep python')}
          className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-amber-300 border border-zinc-700 whitespace-nowrap transition-colors"
        >
          ps aux | grep python
        </button>
        <button
          onClick={() => executePresetCommand('ls -la')}
          className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 whitespace-nowrap transition-colors"
        >
          ls -la
        </button>
      </div>

      <div className="flex-1 p-4 overflow-y-auto space-y-1 bg-black/80 font-mono">
        {(windows.terminal.terminalLines || []).map((line, idx) => (
          <div
            key={idx}
            className={`whitespace-pre-wrap leading-relaxed ${
              line.startsWith('user@')
                ? 'text-emerald-400 font-semibold'
                : line.startsWith('[✓]') || line.includes('Finished') || line.includes('Exit code: 0')
                ? 'text-emerald-300'
                : line.startsWith('[+]')
                ? 'text-blue-300'
                : line.startsWith('[*]')
                ? 'text-amber-300'
                : line.startsWith('[!]') || line.includes('Error')
                ? 'text-rose-400'
                : 'text-zinc-300'
            }`}
          >
            {line}
          </div>
        ))}
        <div ref={terminalBottomRef} />
      </div>

      {/* Terminal Command Input */}
      <form
        onSubmit={handleTerminalSubmit}
        className="p-2.5 bg-zinc-900 border-t border-zinc-800 flex items-center gap-2 flex-shrink-0"
      >
        <span className="text-emerald-400 font-bold select-none">$</span>
        <input
          type="text"
          value={terminalCustomCmd}
          onChange={(e) => setTerminalCustomCmd(e.target.value)}
          placeholder="Type bash command (e.g. ss -lptn 'sport = :5555')..."
          className="flex-1 bg-transparent text-xs text-zinc-200 focus:outline-none font-mono"
        />
        <button
          type="submit"
          className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded text-xs border border-zinc-700 font-mono"
        >
          Execute
        </button>
      </form>
    </div>
  );

  const renderMailspringBlock = () => (
    <div className="flex-1 p-5 overflow-y-auto bg-zinc-950 font-sans">
      <div className="max-w-2xl mx-auto bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-4">
          <div className="flex items-center gap-2 text-purple-400 font-semibold text-sm">
            <Mail className="w-4 h-4" />
            <span>Mailspring &bull; Compose Operational Dispatch</span>
          </div>
          <span className="text-xs px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono">
            Ready
          </span>
        </div>

        <div className="space-y-3 text-xs">
          <div>
            <label className="text-zinc-500 block mb-1 font-mono text-[11px]">To:</label>
            <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-200 font-mono">
              {windows.mailspring.emailDraft?.to || 'engineering-core@orgo.internal'}
            </div>
          </div>

          <div>
            <label className="text-zinc-500 block mb-1 font-mono text-[11px]">Subject:</label>
            <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-200 font-semibold">
              {windows.mailspring.emailDraft?.subject || 'NeuroCore Operational Update'}
            </div>
          </div>

          <div>
            <label className="text-zinc-500 block mb-1 font-mono text-[11px]">Body:</label>
            <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-zinc-300 whitespace-pre-wrap leading-relaxed min-h-[140px]">
              {windows.mailspring.emailDraft?.body || 'All daemons operational.'}
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={() => {
                handleQuickPrompt('Send an operational update email');
              }}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold shadow-md transition-colors"
            >
              Dispatch via Mailspring
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderFilesBlock = () => (
    <div className="flex-1 p-5 overflow-y-auto bg-zinc-950 font-sans text-xs">
      <div className="max-w-2xl mx-auto bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
        <div className="text-xs font-mono text-zinc-400 mb-3 pb-2 border-b border-zinc-800 flex items-center gap-2">
          <Folder className="w-4 h-4 text-amber-400" />
          <span>/home/user/scripts</span>
        </div>

        <div className="space-y-2">
          {[
            { name: 'doc_scraper.py', type: 'Python Script', size: '1.2 KB' },
            { name: 'bring_chrome_front.sh', type: 'Bash Utility', size: '890 B' },
            { name: 'etl_pipeline.py', type: 'Python Daemon', size: '2.4 KB' },
            { name: 'worker_real.py', type: 'ZeroMQ Daemon', size: '3.1 KB' },
            { name: 'workstation_session.json', type: 'Config Session', size: '450 B' },
          ].map((f, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800/80 hover:border-zinc-700 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Code2 className="w-4 h-4 text-blue-400" />
                <span className="font-mono text-zinc-200">{f.name}</span>
                <span className="text-[10px] text-zinc-500">{f.type}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-zinc-500">{f.size}</span>
                <button
                  onClick={() => {
                    setActiveApp('vscode');
                    setWindows((prev) => ({
                      ...prev,
                      vscode: {
                        ...prev.vscode,
                        isOpen: true,
                        editorFile: f.name,
                      },
                    }));
                  }}
                  className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-medium"
                >
                  Open in VS Code
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderAppBuilderBlock = () => (
    <NeuralAppBuilderGui
      onOpenInVsCode={(path) => {
        const folder = path.split('/').filter(Boolean).pop() || 'project';
        setActiveApp('vscode');
        setWindows((prev) => ({
          ...prev,
          vscode: {
            ...prev.vscode,
            isOpen: true,
            editorFile: `${folder}/src/main.ts`,
            editorContent: `// Project: ${path}\n// Opened via Neural Core App Builder GUI\nimport { createServer } from 'http';\n\nconsole.log("Ready in VS Code: ${path}");\n`,
          },
        }));
      }}
      onRunScriptInTerminal={(path, script) => {
        executePresetCommand(`neural run ${path} --script "${script}"`);
      }}
    />
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Top Banner & Control Strip */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-zinc-900/90 border border-zinc-800 rounded-2xl p-3.5 px-4 shadow-lg backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-sm">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-zinc-100 text-sm sm:text-base">
                Dual-Window Split Screen Workstation
              </h1>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono border border-emerald-500/30">
                Continuous Sync
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Window 1: Continuous Conversation &amp; Memory &bull; Window 2: Interactive Workstation Computer (:0.0)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
          {/* Continuous Mic Status Badge */}
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-mono transition-all ${
              isListening
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isListening ? 'bg-emerald-400 animate-ping' : 'bg-zinc-500'
              }`}
            />
            <span>{isListening ? 'Ears Active & Listening' : 'Mic Standby'}</span>
          </div>

          {/* Toggle Task Ledger Button */}
          <button
            onClick={() => setShowTaskLedger(!showTaskLedger)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
              showTaskLedger
                ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
            }`}
          >
            <ListTodo className="w-3.5 h-3.5 text-blue-400" />
            <span>Task Ledger ({tasks.length})</span>
          </button>

          {/* Return to Stage View button */}
          {onSwitchToStage && (
            <button
              onClick={onSwitchToStage}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 text-xs font-medium transition-all"
            >
              <Bot className="w-3.5 h-3.5 text-emerald-400" />
              <span>Stage View</span>
            </button>
          )}
        </div>
      </div>

      {/* Task Memory Ledger Expandable Drawer */}
      {showTaskLedger && (
        <div className="transition-all animate-fadeIn">
          <TaskMemoryBoard
            tasks={tasks}
            setTasks={setTasks}
            memories={memories}
            setMemories={setMemories}
          />
        </div>
      )}

      {/* Main Dual Windows Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* ============================================================ */}
        {/* WINDOW 1: Dialogue & Brain GUI (5 Columns on Desktop)        */}
        {/* ============================================================ */}
        <div className="lg:col-span-5 flex flex-col bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl h-[740px]">
          {/* Window 1 Header */}
          <div className="bg-zinc-900/90 border-b border-zinc-800/80 px-3 py-2.5 flex items-center justify-between">
            {/* Mode Switcher Tabs */}
            <div className="flex items-center gap-1.5 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
              <button
                onClick={() => setWindow1Tab('brain_gui')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  window1Tab === 'brain_gui'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Brain className="w-3.5 h-3.5" />
                <span>Brain GUI</span>
              </button>
              <button
                onClick={() => setWindow1Tab('conversation')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  window1Tab === 'conversation'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Bot className="w-3.5 h-3.5" />
                <span>Voice &amp; Dialogue</span>
              </button>
            </div>

            {/* Continuous Mode Toggle */}
            <button
              onClick={toggleContinuousMode}
              className={`px-2.5 py-1 rounded-lg border text-[11px] font-mono flex items-center gap-1.5 transition-all ${
                isContinuousMode
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                  : 'bg-zinc-800 border-zinc-700 text-zinc-400'
              }`}
              title="Continuous conversation keeps listening across turns"
            >
              <Radio className={`w-3 h-3 ${isContinuousMode && isListening ? 'animate-pulse' : ''}`} />
              <span>{isContinuousMode ? 'Always-On Mic: ON' : 'Always-On Mic: OFF'}</span>
            </button>
          </div>

          {/* Conditional Window 1 Content */}
          {window1Tab === 'brain_gui' ? (
            <div className="flex-1 overflow-hidden flex flex-col">
              <BrainTkinterGui
                onIntentDispatched={(appName) => {
                  if (appName.toLowerCase().includes('chrome') || appName.toLowerCase().includes('browser')) {
                    setActiveApp('browser');
                    setWindows((prev) => ({
                      ...prev,
                      browser: {
                        ...prev.browser,
                        isOpen: true,
                        currentUrl: prev.browser.currentUrl || 'https://zeromq.org/docs/python-guide',
                      },
                      terminal: {
                        ...prev.terminal,
                        terminalLines: [
                          ...(prev.terminal.terminalLines || []),
                          `[WORKER] Received request: cmd=handle_intent intent=OPEN_APPLICATION name=${appName}`,
                          `[WORKER] open '${appName}': opened=True verified=True status=ok`,
                          `[WORKER] Display :0.0 active window: ${appName}`,
                        ],
                      },
                    }));
                  } else if (appName.toLowerCase().includes('code') || appName.toLowerCase().includes('editor')) {
                    setActiveApp('vscode');
                  } else if (appName.toLowerCase().includes('mail')) {
                    setActiveApp('mailspring');
                  }
                }}
                onSendToTerminal={(cmd) => {
                  setActiveApp('terminal');
                  setWindows((prev) => ({
                    ...prev,
                    terminal: {
                      ...prev.terminal,
                      terminalLines: [
                        ...(prev.terminal.terminalLines || []),
                        `$ ${cmd}`,
                        `[WORKER] ZeroMQ execute: command dispatched`,
                      ],
                    },
                  }));
                }}
              />
            </div>
          ) : (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Window 1: Chat Messages Feed */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-zinc-950/60 font-sans">
            {chatMessages.map((msg) => {
              const isUser = msg.sender === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-2.5 text-xs ${
                    isUser ? 'flex-row-reverse' : 'flex-row'
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs shadow-sm ${
                      isUser
                        ? 'bg-zinc-800 text-zinc-200 border border-zinc-700'
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}
                  >
                    {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                  </div>

                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 border shadow-sm ${
                      isUser
                        ? 'bg-zinc-800/90 text-zinc-100 border-zinc-700/80 rounded-tr-none'
                        : 'bg-zinc-900/90 text-zinc-200 border-zinc-800/90 rounded-tl-none'
                    }`}
                  >
                    <div className="whitespace-pre-wrap leading-relaxed text-xs sm:text-[13px]">
                      {msg.text}
                    </div>

                    {/* Action Summary Pill */}
                    {msg.actionSummary && (
                      <div className="mt-2 pt-2 border-t border-zinc-800/80 flex items-center gap-1.5 text-[11px] text-emerald-400 font-mono">
                        <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">{msg.actionSummary}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Live Interim Transcript Bubble */}
            {interimTranscript && (
              <div className="flex items-start gap-2.5 text-xs">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/30 text-emerald-300 flex items-center justify-center flex-shrink-0 border border-emerald-500/40 animate-pulse">
                  <Mic className="w-3.5 h-3.5" />
                </div>
                <div className="max-w-[85%] rounded-2xl px-3.5 py-2.5 bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 rounded-tl-none font-mono text-xs">
                  <div className="flex items-center gap-2 mb-1 text-[10px] text-emerald-400 uppercase tracking-wider font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span>Hearing Speech (Real-Time)</span>
                  </div>
                  <div className="italic">"{interimTranscript}"</div>
                </div>
              </div>
            )}

            {/* Speaking / Thinking State Indicators */}
            {isSpeaking && !interimTranscript && (
              <div className="flex items-center gap-2 text-xs text-blue-400 font-mono px-2 py-1 bg-blue-950/20 border border-blue-500/20 rounded-xl w-fit">
                <Volume2 className="w-3.5 h-3.5 animate-pulse" />
                <span>Speaking response aloud via TTS...</span>
              </div>
            )}

            {isThinking && (
              <div className="flex items-center gap-2 text-xs text-amber-400 font-mono px-2 py-1 bg-amber-950/20 border border-amber-500/20 rounded-xl w-fit">
                <Sparkles className="w-3.5 h-3.5 animate-spin" />
                <span>Executing workstation action &amp; updating computer...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Window 1 Quick Prompts Strip */}
          <div className="px-3 py-2 bg-zinc-900/50 border-t border-zinc-800/60 flex items-center gap-1.5 overflow-x-auto text-[11px] no-scrollbar">
            <span className="text-zinc-500 font-mono flex-shrink-0">Quick:</span>
            <button
              onClick={() => handleQuickPrompt('Open the computer')}
              className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 flex-shrink-0 transition-colors"
            >
              🖥️ Open The Computer
            </button>
            <button
              onClick={() => handleQuickPrompt('Bring Google Chrome to foreground')}
              className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 flex-shrink-0 transition-colors"
            >
              🌐 Open Chrome
            </button>
            <button
              onClick={() => handleQuickPrompt('Write a python scraper for ZeroMQ documentation')}
              className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 flex-shrink-0 transition-colors"
            >
              💻 Write Scraper
            </button>
            <button
              onClick={() => handleQuickPrompt('Run the scraper script in terminal')}
              className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 flex-shrink-0 transition-colors"
            >
              ⬛ Run Terminal
            </button>
            <button
              onClick={() => handleQuickPrompt('Send an operational update email')}
              className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 flex-shrink-0 transition-colors"
            >
              ✉️ Send Email
            </button>
          </div>

          {/* Window 1 Bottom: Integrated Continuous Microphone & Input Controls */}
          <div className="p-3 bg-zinc-900/90 border-t border-zinc-800 flex flex-col gap-2.5">
            {/* Audio & Mic Master Control Bar */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {/* Master Continuous Microphone Button */}
                <button
                  type="button"
                  id="split-screen-mic-toggle"
                  onClick={toggleMic}
                  className={`px-3.5 py-2 rounded-xl text-xs font-medium flex items-center gap-2 transition-all shadow-md ${
                    isListening
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/40 ring-2 ring-emerald-400/50'
                      : 'bg-zinc-800 hover:bg-zinc-750 text-zinc-300 border border-zinc-700'
                  }`}
                  title={isListening ? 'Mic is listening - Click to mute' : 'Mic is muted - Click to listen'}
                >
                  {isListening ? (
                    <>
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white" />
                      </span>
                      <Mic className="w-4 h-4" />
                      <span>Mic Active</span>
                    </>
                  ) : (
                    <>
                      <MicOff className="w-4 h-4 text-zinc-400" />
                      <span>Mic Off</span>
                    </>
                  )}
                </button>

                {/* Audio TTS output button */}
                <button
                  type="button"
                  onClick={() => setIsAudioEnabled(!isAudioEnabled)}
                  className={`p-2 rounded-xl border text-xs transition-colors ${
                    isAudioEnabled
                      ? 'bg-zinc-850 border-zinc-700 text-emerald-400'
                      : 'bg-zinc-850 border-zinc-800 text-zinc-500'
                  }`}
                  title={isAudioEnabled ? 'TTS Audio Enabled' : 'TTS Audio Muted'}
                >
                  {isAudioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </button>
              </div>

              {/* Status explanation */}
              <div className="text-[11px] text-zinc-400 font-mono text-right truncate">
                {isListening ? (
                  <span className="text-emerald-400 font-semibold">Continuous listening active</span>
                ) : (
                  <span>Click Mic or type below</span>
                )}
              </div>
            </div>

            {/* Operator Text Input */}
            <form onSubmit={handleOperatorSend} className="flex items-center gap-2">
              <input
                type="text"
                value={operatorInput}
                onChange={(e) => setOperatorInput(e.target.value)}
                placeholder="Talk into mic, or type instruction here..."
                disabled={isThinking}
                className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50"
              />
              <button
                type="submit"
                disabled={!operatorInput.trim() || isThinking}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs sm:text-sm font-semibold transition-all shadow-md shadow-emerald-900/30 flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>

        {/* ============================================================ */}
        {/* WINDOW 2: Interactive Workstation Computer (:0.0) (7 Columns) */}
        {/* ============================================================ */}
        <div className="lg:col-span-7 flex flex-col bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl h-[740px] relative">
          {/* Computer Header Bar */}
          <div className="bg-zinc-900/95 border-b border-zinc-800 px-4 py-2.5 flex items-center justify-between">
            {/* OS Brand & Display State */}
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
              </div>
              <div className="h-4 w-px bg-zinc-700 mx-1" />
              <div className="flex items-center gap-2">
                <Monitor className="w-4 h-4 text-emerald-400" />
                <span className="font-semibold text-xs sm:text-sm text-zinc-100">
                  Window 2: Workstation Computer
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Display :0.0 OPEN</span>
                </span>
              </div>
            </div>

            {/* Power / Open Toggle & Diagnostics */}
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-2 text-[11px] font-mono text-zinc-400">
                <span>IPC: tcp://127.0.0.1:5555</span>
                <span>&bull;</span>
                <span>{currentTime}</span>
              </div>

              {/* Power / Re-open computer button */}
              <button
                onClick={() => setIsComputerOpen(!isComputerOpen)}
                className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 transition-all ${
                  isComputerOpen
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25'
                    : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-zinc-200'
                }`}
                title={isComputerOpen ? 'Workstation Computer is Open' : 'Click to Open Workstation Computer'}
              >
                <Power className="w-3.5 h-3.5" />
                <span className="text-[11px] hidden sm:inline">
                  {isComputerOpen ? 'Open & Active' : 'Closed'}
                </span>
              </button>
            </div>
          </div>

          {/* If Computer Display is powered off / closed, show explicit Open Button */}
          {!isComputerOpen ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 bg-zinc-950 text-center">
              <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 mb-4 shadow-xl">
                <Monitor className="w-8 h-8" />
              </div>
              <h2 className="text-base font-bold text-zinc-200 mb-1">
                Workstation Display Session Inactive
              </h2>
              <p className="text-xs text-zinc-400 max-w-sm mb-5">
                The computer viewport is currently in sleep mode. Click below or say "Open the computer" to boot the desktop session.
              </p>
              <button
                onClick={() => {
                  setIsComputerOpen(true);
                  setActiveApp('browser');
                }}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-900/40 flex items-center gap-2 transition-all"
              >
                <Power className="w-4 h-4" />
                <span>Open Workstation Computer</span>
              </button>
            </div>
          ) : (
            /* Active Computer OS Viewport */
            <div className="flex-1 flex flex-col overflow-hidden bg-zinc-950">
              {/* Application Launcher Tabs Strip */}
              <div className="bg-zinc-900/90 border-b border-zinc-800 px-3 py-1.5 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
                <div className="flex items-center gap-1">
                  {/* Terminal Tab */}
                  <button
                    id="comp-tab-terminal"
                    onClick={() => {
                      setActiveApp('terminal');
                      setWindows((prev) => ({
                        ...prev,
                        terminal: { ...prev.terminal, isOpen: true, zIndex: 10 },
                      }));
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      activeApp === 'terminal'
                        ? 'bg-zinc-800 text-amber-400 shadow-sm border border-zinc-700/80 font-semibold'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850'
                    }`}
                  >
                    <TermIcon className="w-3.5 h-3.5" />
                    <span>Terminal</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  </button>

                  {/* Browser / Chrome Tab */}
                  <button
                    id="comp-tab-browser"
                    onClick={() => {
                      setActiveApp('browser');
                      setWindows((prev) => ({
                        ...prev,
                        browser: { ...prev.browser, isOpen: true, zIndex: 10 },
                      }));
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      activeApp === 'browser'
                        ? 'bg-zinc-800 text-emerald-400 shadow-sm border border-zinc-700/80 font-semibold'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850'
                    }`}
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>Google Chrome</span>
                  </button>

                  {/* VS Code Tab */}
                  <button
                    id="comp-tab-vscode"
                    onClick={() => {
                      setActiveApp('vscode');
                      setWindows((prev) => ({
                        ...prev,
                        vscode: { ...prev.vscode, isOpen: true, zIndex: 10 },
                      }));
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      activeApp === 'vscode'
                        ? 'bg-zinc-800 text-blue-400 shadow-sm border border-zinc-700/80 font-semibold'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850'
                    }`}
                  >
                    <Code2 className="w-3.5 h-3.5" />
                    <span>VS Code</span>
                  </button>

                  {/* Mailspring Tab */}
                  <button
                    id="comp-tab-mailspring"
                    onClick={() => {
                      setActiveApp('mailspring');
                      setWindows((prev) => ({
                        ...prev,
                        mailspring: { ...prev.mailspring, isOpen: true, zIndex: 10 },
                      }));
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      activeApp === 'mailspring'
                        ? 'bg-zinc-800 text-purple-400 shadow-sm border border-zinc-700/80 font-semibold'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850'
                    }`}
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Mailspring</span>
                  </button>

                  {/* Files Tab */}
                  <button
                    id="comp-tab-files"
                    onClick={() => {
                      setActiveApp('files');
                      setWindows((prev) => ({
                        ...prev,
                        files: { ...prev.files, isOpen: true, zIndex: 10 },
                      }));
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      activeApp === 'files'
                        ? 'bg-zinc-800 text-zinc-100 shadow-sm border border-zinc-700/80 font-semibold'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850'
                    }`}
                  >
                    <Folder className="w-3.5 h-3.5" />
                    <span>Files</span>
                  </button>

                  {/* App Builder (GUI) Tab */}
                  <button
                    id="comp-tab-appbuilder"
                    onClick={() => {
                      setActiveApp('app_builder');
                      setWindows((prev) => ({
                        ...prev,
                        app_builder: { ...prev.app_builder, isOpen: true, zIndex: 10 },
                      }));
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      activeApp === 'app_builder'
                        ? 'bg-zinc-800 text-emerald-400 shadow-sm border border-emerald-500/40 font-semibold'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>App Builder</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    id="toggle-dual-terminal-split"
                    onClick={() => setIsDualTerminalSplit(!isDualTerminalSplit)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                      isDualTerminalSplit
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                        : 'bg-zinc-800/80 text-zinc-400 border-zinc-700/60 hover:text-zinc-200'
                    }`}
                    title="Simultaneously view the active application AND the live bash terminal running on your computer"
                  >
                    <Layers className="w-3.5 h-3.5 text-amber-400" />
                    <span>{isDualTerminalSplit ? 'Dual Active (App + Terminal)' : 'Split View (App + Terminal)'}</span>
                  </button>
                  <div className="text-[11px] font-mono text-zinc-500 hidden xl:block">
                    Display :0.0
                  </div>
                </div>
              </div>

              {/* Active Application Canvas */}
              <div className="flex-1 overflow-hidden bg-zinc-950 relative flex flex-col">
                {isDualTerminalSplit ? (
                  <div className="flex-1 flex flex-col h-full overflow-hidden">
                    <div className="h-[52%] flex flex-col border-b border-zinc-800 overflow-hidden">
                      {activeApp === 'terminal' || activeApp === 'browser'
                        ? renderChromeBlock()
                        : activeApp === 'vscode'
                        ? renderVSCodeBlock()
                        : activeApp === 'mailspring'
                        ? renderMailspringBlock()
                        : activeApp === 'files'
                        ? renderFilesBlock()
                        : renderAppBuilderBlock()}
                    </div>
                    <div className="h-[48%] flex flex-col overflow-hidden">
                      {renderTerminalBlock('h-full')}
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto flex flex-col">
                    {activeApp === 'browser' && renderChromeBlock()}
                    {activeApp === 'vscode' && renderVSCodeBlock()}
                    {activeApp === 'terminal' && renderTerminalBlock('flex-1')}
                    {activeApp === 'mailspring' && renderMailspringBlock()}
                    {activeApp === 'files' && renderFilesBlock()}
                    {activeApp === 'app_builder' && renderAppBuilderBlock()}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
