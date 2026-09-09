import React, { useState } from 'react';
import {
  FolderOpen,
  Play,
  CheckCircle2,
  Terminal,
  Code2,
  AlertCircle,
  Copy,
  Check,
  Sparkles,
  Layers,
  FileCode,
  ExternalLink,
} from 'lucide-react';

interface NeuralAppBuilderGuiProps {
  onOpenInVsCode?: (path: string) => void;
  onRunScriptInTerminal?: (path: string, script: string) => void;
  initialJsonOutput?: any;
}

export const NeuralAppBuilderGui: React.FC<NeuralAppBuilderGuiProps> = ({
  onOpenInVsCode,
  onRunScriptInTerminal,
  initialJsonOutput,
}) => {
  const [projectPath, setProjectPath] = useState('/Users/davidyoung/apps/sapphire-openclaw');
  const [scriptCmd, setScriptCmd] = useState('npm install && npm test');
  const [appName, setAppName] = useState('Google Chrome');
  const [jsonResponse, setJsonResponse] = useState<any>(initialJsonOutput || {
    intent: "OPEN_APPLICATION",
    app: "Google Chrome",
    opened: true,
    verified: true,
    status: "ok"
  });
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error' | 'info';
    title: string;
    text: string;
    cliCommand?: string;
  } | null>({
    type: 'success',
    title: 'Success (Tkinter messagebox)',
    text: 'Google Chrome opened successfully',
  });
  const [isRunning, setIsRunning] = useState(false);
  const [copiedCli, setCopiedCli] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);

  const presetApps = ['Google Chrome', 'VS Code', 'Terminal', 'Mailspring'];

  const presetPaths = [
    '/Users/davidyoung/apps/sapphire-openclaw',
    '/Users/davidyoung/apps/gifted_eternity_final_production_v28',
    '/home/user/workspace/zeromq-node',
  ];

  const presetScripts = [
    'npm install && npm test',
    'npm run build',
    'python3 neural.py status',
    'vitest run',
  ];

  const handleOpenApp = (targetApp?: string) => {
    const selected = targetApp || appName.trim();
    if (!selected) return;

    setIsRunning(true);
    setTimeout(() => {
      setIsRunning(false);
      const resp = {
        intent: "OPEN_APPLICATION",
        app: selected,
        opened: true,
        verified: true,
        status: "ok"
      };
      setJsonResponse(resp);
      setStatusMessage({
        type: 'success',
        title: 'Success (Tkinter messagebox)',
        text: `${selected} opened successfully`,
        cliCommand: `python3 brain.py "${selected}"`,
      });
    }, 250);
  };

  const handleCopyJson = () => {
    if (!jsonResponse) return;
    navigator.clipboard.writeText(JSON.stringify(jsonResponse, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  const handleOpenProject = () => {
    const cleanPath = projectPath.trim();
    if (!cleanPath) return;

    setIsRunning(true);
    setTimeout(() => {
      setIsRunning(false);
      setStatusMessage({
        type: 'success',
        title: 'Success (Tkinter messagebox)',
        text: `Opened ${cleanPath} in code`,
        cliCommand: `neural open ${cleanPath}`,
      });

      if (onOpenInVsCode) {
        onOpenInVsCode(cleanPath);
      }
    }, 300);
  };

  const handleRunScript = () => {
    const cleanPath = projectPath.trim();
    const cleanScript = scriptCmd.trim();
    if (!cleanPath || !cleanScript) return;

    setIsRunning(true);
    setTimeout(() => {
      setIsRunning(false);
      setStatusMessage({
        type: 'success',
        title: 'Success (Tkinter messagebox)',
        text: `Script finished in ${cleanPath}`,
        cliCommand: `neural run ${cleanPath} --script "${cleanScript}"`,
      });

      if (onRunScriptInTerminal) {
        onRunScriptInTerminal(cleanPath, cleanScript);
      }
    }, 450);
  };

  const handleCopyCli = (cmd: string) => {
    navigator.clipboard.writeText(cmd);
    setCopiedCli(true);
    setTimeout(() => setCopiedCli(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col bg-zinc-950 text-zinc-200 overflow-y-auto font-sans p-4 sm:p-6 scrollbar-thin">
      <div className="max-w-3xl mx-auto w-full space-y-6">
        {/* Header Window Bar */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                  <span>Neural Core Helper</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
                    GUI App Builder
                  </span>
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Interactive Tkinter &amp; CLI companion for project execution and VS Code orchestration
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 font-mono text-[10px] text-zinc-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Daemon 5555 OK</span>
            </div>
          </div>

          {/* Form Fields */}
          <div className="mt-5 space-y-5">
            {/* 1. Project Directory Field */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <FolderOpen className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Project Directory Path</span>
                </span>
                <span className="text-[10px] text-zinc-500 font-mono">path argument</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={projectPath}
                  onChange={(e) => setProjectPath(e.target.value)}
                  placeholder="/Users/davidyoung/apps/..."
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500/70 rounded-xl px-3.5 py-2 text-xs font-mono text-zinc-100 placeholder-zinc-600 focus:outline-none transition-colors"
                />
              </div>

              {/* Quick Preset Buttons */}
              <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px]">
                <span className="text-zinc-500 font-mono text-[9px] uppercase mr-1">Quick Select:</span>
                {presetPaths.map((p) => (
                  <button
                    key={p}
                    onClick={() => setProjectPath(p)}
                    className={`px-2 py-0.5 rounded-md border font-mono truncate max-w-xs transition-colors ${
                      projectPath === p
                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 font-semibold'
                        : 'bg-zinc-800/60 border-zinc-850 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                    }`}
                  >
                    {p.split('/').pop()}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Script Command Field */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-blue-400" />
                  <span>Shell Command to Run (--script)</span>
                </span>
                <span className="text-[10px] text-zinc-500 font-mono">script argument</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={scriptCmd}
                  onChange={(e) => setScriptCmd(e.target.value)}
                  placeholder="npm install && npm test"
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-blue-500/70 rounded-xl px-3.5 py-2 text-xs font-mono text-zinc-100 placeholder-zinc-600 focus:outline-none transition-colors"
                />
              </div>

              {/* Quick Preset Scripts */}
              <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px]">
                <span className="text-zinc-500 font-mono text-[9px] uppercase mr-1">Scripts:</span>
                {presetScripts.map((s) => (
                  <button
                    key={s}
                    onClick={() => setScriptCmd(s)}
                    className={`px-2 py-0.5 rounded-md border font-mono transition-colors ${
                      scriptCmd === s
                        ? 'bg-blue-500/20 border-blue-500/40 text-blue-300 font-semibold'
                        : 'bg-zinc-800/60 border-zinc-850 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Primary Action Buttons (matching Tkinter GUI) */}
            <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Button 1: Open Project in VS Code */}
              <button
                onClick={handleOpenProject}
                disabled={isRunning || !projectPath.trim()}
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 transition-all hover:scale-[1.01] active:scale-[0.99]"
              >
                <Code2 className="w-4 h-4" />
                <span className="font-semibold">Open Project in VS Code</span>
              </button>

              {/* Button 2: Run Script in Project */}
              <button
                onClick={handleRunScript}
                disabled={isRunning || !projectPath.trim() || !scriptCmd.trim()}
                className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-950/40 transition-all hover:scale-[1.01] active:scale-[0.99]"
              >
                <Play className="w-4 h-4 fill-white" />
                <span className="font-semibold">Run Script in Project</span>
              </button>
            </div>

            {/* 4. Open Application via ZeroMQ Worker (OPEN_APPLICATION) */}
            <div className="pt-3 border-t border-zinc-800">
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Launch Host Application (ToolRegistry &amp; ZeroMQ)</span>
                </span>
                <span className="text-[10px] text-zinc-500 font-mono">port 5555 REQ/REP</span>
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  placeholder="Google Chrome"
                  className="flex-1 bg-zinc-950 border border-zinc-800 focus:border-amber-500/70 rounded-xl px-3.5 py-2 text-xs font-mono text-zinc-100 placeholder-zinc-600 focus:outline-none transition-colors"
                />
                <button
                  onClick={() => handleOpenApp()}
                  disabled={isRunning || !appName.trim()}
                  className="py-2 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-950/40 transition-all hover:scale-[1.01] active:scale-[0.99]"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Launch App</span>
                </button>
              </div>

              {/* Quick Preset Apps */}
              <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px]">
                <span className="text-zinc-500 font-mono text-[9px] uppercase mr-1">Apps:</span>
                {presetApps.map((a) => (
                  <button
                    key={a}
                    onClick={() => {
                      setAppName(a);
                      handleOpenApp(a);
                    }}
                    className={`px-2 py-0.5 rounded-md border font-mono transition-colors ${
                      appName === a
                        ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 font-semibold'
                        : 'bg-zinc-800/60 border-zinc-850 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ZeroMQ JSON Response Output Pane */}
        {jsonResponse && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-xl text-xs space-y-2.5 animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="font-semibold text-zinc-200">ZeroMQ Worker JSON Response</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                  status: ok
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyJson}
                  className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-750 text-zinc-300 text-[10px] flex items-center gap-1 font-mono transition-colors"
                >
                  {copiedJson ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy JSON</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => setJsonResponse(null)}
                  className="text-zinc-500 hover:text-zinc-300 text-xs px-1.5 py-0.5 rounded"
                  title="Dismiss pane"
                >
                  ✕ Dismiss Pane
                </button>
              </div>
            </div>
            <pre className="p-3 bg-zinc-950 border border-zinc-850 rounded-xl font-mono text-[11px] text-emerald-300 overflow-x-auto leading-relaxed">
              {JSON.stringify(jsonResponse, null, 2)}
            </pre>
          </div>
        )}

        {/* 4. Simulated Tkinter MessageBox / Confirmation Popup */}
        {statusMessage && (
          <div className="bg-zinc-900/90 border border-emerald-500/40 rounded-2xl p-4 shadow-xl animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 flex-shrink-0 mt-0.5">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-zinc-100 flex items-center gap-2">
                    <span>{statusMessage.title}</span>
                    <span className="text-[10px] text-emerald-400 font-mono">Exit Code 0</span>
                  </div>
                  <p className="text-sm font-semibold text-emerald-300 mt-1 font-mono">
                    ✅ {statusMessage.text}
                  </p>
                  {statusMessage.cliCommand && (
                    <div className="mt-2.5 flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 font-mono text-[11px] text-zinc-300">
                      <span className="text-zinc-500">$</span>
                      <span className="truncate flex-1">{statusMessage.cliCommand}</span>
                      <button
                        onClick={() => handleCopyCli(statusMessage.cliCommand!)}
                        className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] flex items-center gap-1 transition-colors flex-shrink-0"
                      >
                        {copiedCli ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy CLI</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={() => setStatusMessage(null)}
                className="text-zinc-500 hover:text-zinc-300 text-xs px-2 py-1 rounded"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* 5. Terminal & CLI Cheatsheet */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 text-xs space-y-3">
          <div className="flex items-center justify-between text-zinc-300 font-semibold">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span>Equivalent Terminal (CLI) Commands</span>
            </div>
            <span className="text-[10px] font-mono text-zinc-500">python neural.py / ./neural</span>
          </div>

          <div className="space-y-2 font-mono text-[11px]">
            <div className="p-2.5 bg-zinc-950 border border-zinc-850 rounded-xl flex items-center justify-between">
              <div className="truncate mr-2">
                <span className="text-zinc-500"># Open project in VS Code:</span>
                <div className="text-emerald-300 mt-0.5">neural open /Users/davidyoung/apps/sapphire-openclaw</div>
              </div>
              <button
                onClick={() => handleCopyCli('neural open /Users/davidyoung/apps/sapphire-openclaw')}
                className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex-shrink-0"
                title="Copy command"
              >
                <Copy className="w-3 h-3" />
              </button>
            </div>

            <div className="p-2.5 bg-zinc-950 border border-zinc-850 rounded-xl flex items-center justify-between">
              <div className="truncate mr-2">
                <span className="text-zinc-500"># Run script inside repo:</span>
                <div className="text-blue-300 mt-0.5">neural run /Users/davidyoung/apps/gifted_eternity_final_production_v28 --script "npm install &amp;&amp; npm test"</div>
              </div>
              <button
                onClick={() => handleCopyCli('neural run /Users/davidyoung/apps/gifted_eternity_final_production_v28 --script "npm install && npm test"')}
                className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex-shrink-0"
                title="Copy command"
              >
                <Copy className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
