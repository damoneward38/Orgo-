import React, { useState, useEffect } from 'react';
import {
  Globe,
  Code2,
  Terminal as TermIcon,
  Mail,
  Folder,
  Play,
  Sparkles,
  Maximize2,
  Minimize2,
  Cpu,
  HardDrive,
  Wifi,
  Clock,
  ExternalLink,
  Search,
  CheckCircle2,
  RotateCcw,
  Zap,
  Radio,
  ArrowRight,
} from 'lucide-react';
import { DesktopAppId, DesktopWindowState } from '../types';
import { WorkstationBrowser } from './WorkstationBrowser';

interface WorkstationMonitorProps {
  activeApp: DesktopAppId;
  setActiveApp: (app: DesktopAppId) => void;
  windows: Record<DesktopAppId, DesktopWindowState>;
  onTriggerApp?: (appId: DesktopAppId, instruction?: string) => void;
  isTypingCode?: boolean;
  codeTypedLength?: number;
  onSwitchToSplitScreen?: () => void;
  initialExpanded?: boolean;
  titleBadge?: string;
  isConversationMode?: boolean;
  isListening?: boolean;
}

export const WorkstationMonitor: React.FC<WorkstationMonitorProps> = ({
  activeApp,
  setActiveApp,
  windows,
  onTriggerApp,
  isTypingCode = false,
  codeTypedLength = 300,
  onSwitchToSplitScreen,
  initialExpanded = false,
  titleBadge,
  isConversationMode = false,
  isListening = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(initialExpanded);
  const [currentTime, setCurrentTime] = useState(
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  );

  // Update clock every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const currentWindow = windows[activeApp] || windows.browser;

  return (
    <div className="flex flex-col w-full">
      {/* Physical Monitor Housing / Bezel */}
      <div className="relative bg-zinc-950 rounded-2xl border-4 border-zinc-800 shadow-[0_12px_40px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden transition-all duration-300">
        
        {/* Top Monitor Bezel with Camera Dot, Model, and Live Status */}
        <div className="px-3.5 py-1.5 bg-zinc-900 border-b border-zinc-800/90 flex items-center justify-between text-[11px] select-none">
          <div className="flex items-center gap-2">
            {/* Top Webcam / Ambient Sensor Pinhole */}
            <div className="w-2 h-2 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center">
              <span className="w-0.5 h-0.5 rounded-full bg-emerald-400" />
            </div>

            <div className="flex items-center gap-1.5">
              <span className="font-mono font-bold text-zinc-300 tracking-wider text-[10px]">
                WORKSTATION MONITOR :0.0
              </span>
              <span className="text-zinc-600 hidden sm:inline">|</span>
              <span className="text-[10px] text-zinc-500 hidden sm:inline font-mono">
                1920×1080@60Hz
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Tied to Computer Indicator */}
            <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full text-emerald-400 font-mono text-[10px]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399] animate-pulse" />
              <span className="font-semibold">TIED TO COMPUTER</span>
              <span className="text-emerald-500/60 hidden md:inline">• 127.0.0.1:5555</span>
            </div>

            {/* Expand / Minimize Monitor Size */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              title={isExpanded ? 'Collapse monitor size' : 'Expand monitor view'}
              className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Quick App Launcher Bar on the Monitor */}
        <div className="px-3 py-1.5 bg-zinc-950/90 border-b border-zinc-800/60 flex items-center justify-between gap-1 overflow-x-auto text-[11px] scrollbar-thin">
          <div className="flex items-center gap-1">
            <span className="text-[10px] uppercase font-mono text-zinc-500 mr-1 flex-shrink-0">
              Desktop Apps:
            </span>
            <button
              id="monitor-app-chrome-btn"
              onClick={() => {
                setActiveApp('browser');
                if (onTriggerApp) onTriggerApp('browser');
              }}
              className={`px-2 py-1 rounded-md flex items-center gap-1.5 font-medium transition-all ${
                activeApp === 'browser'
                  ? 'bg-blue-600/20 border border-blue-500/40 text-blue-300 shadow-sm'
                  : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
              }`}
            >
              <Globe className="w-3.5 h-3.5 text-blue-400" />
              <span>Chrome</span>
            </button>

            <button
              id="monitor-app-vscode-btn"
              onClick={() => {
                setActiveApp('vscode');
                if (onTriggerApp) onTriggerApp('vscode');
              }}
              className={`px-2 py-1 rounded-md flex items-center gap-1.5 font-medium transition-all ${
                activeApp === 'vscode'
                  ? 'bg-emerald-600/20 border border-emerald-500/40 text-emerald-300 shadow-sm'
                  : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
              }`}
            >
              <Code2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>VS Code</span>
            </button>

            <button
              id="monitor-app-terminal-btn"
              onClick={() => {
                setActiveApp('terminal');
                if (onTriggerApp) onTriggerApp('terminal');
              }}
              className={`px-2 py-1 rounded-md flex items-center gap-1.5 font-medium transition-all ${
                activeApp === 'terminal'
                  ? 'bg-amber-600/20 border border-amber-500/40 text-amber-300 shadow-sm'
                  : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
              }`}
            >
              <TermIcon className="w-3.5 h-3.5 text-amber-400" />
              <span>Terminal</span>
            </button>

            <button
              id="monitor-app-mail-btn"
              onClick={() => {
                setActiveApp('mailspring');
                if (onTriggerApp) onTriggerApp('mailspring');
              }}
              className={`px-2 py-1 rounded-md flex items-center gap-1.5 font-medium transition-all ${
                activeApp === 'mailspring'
                  ? 'bg-purple-600/20 border border-purple-500/40 text-purple-300 shadow-sm'
                  : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
              }`}
            >
              <Mail className="w-3.5 h-3.5 text-purple-400" />
              <span>Mailspring</span>
            </button>

            <button
              id="monitor-app-files-btn"
              onClick={() => {
                setActiveApp('files');
                if (onTriggerApp) onTriggerApp('files');
              }}
              className={`px-2 py-1 rounded-md flex items-center gap-1.5 font-medium transition-all ${
                activeApp === 'files'
                  ? 'bg-cyan-600/20 border border-cyan-500/40 text-cyan-300 shadow-sm'
                  : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
              }`}
            >
              <Folder className="w-3.5 h-3.5 text-cyan-400" />
              <span>Files</span>
            </button>
          </div>

          {onSwitchToSplitScreen && (
            <button
              onClick={onSwitchToSplitScreen}
              className="text-[10px] text-zinc-400 hover:text-emerald-300 flex items-center gap-1 whitespace-nowrap pl-2 border-l border-zinc-800 flex-shrink-0"
              title="Open full dual-window split screen"
            >
              <span>Split Screen</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* The Glass Display Surface */}
        <div
          className={`relative bg-zinc-950 flex flex-col transition-all duration-300 ${
            isExpanded ? 'h-[440px]' : 'h-[270px]'
          }`}
        >
          {/* Workstation OS Taskbar inside monitor */}
          <div className="px-3 py-1 bg-zinc-900/95 border-b border-zinc-800 flex items-center justify-between text-[10px] text-zinc-400 font-sans select-none flex-shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-emerald-400 font-bold tracking-wide">
                🐧 NeuroWorkstation OS
              </span>
              <span className="text-zinc-600">|</span>
              <span className="text-zinc-300 font-medium truncate max-w-[140px] sm:max-w-none">
                {currentWindow.title}
              </span>
            </div>

            <div className="flex items-center gap-2.5 font-mono">
              <div className="flex items-center gap-1 text-zinc-400">
                <Cpu className="w-3 h-3 text-emerald-400" />
                <span>18%</span>
              </div>
              <div className="flex items-center gap-1 text-zinc-400">
                <HardDrive className="w-3 h-3 text-blue-400" />
                <span>4.2G</span>
              </div>
              <div className="flex items-center gap-1 text-zinc-300 font-medium">
                <Clock className="w-3 h-3 text-zinc-400" />
                <span>{currentTime}</span>
              </div>
            </div>
          </div>

          {/* Active Application Window Container */}
          <div className="flex-1 flex flex-col bg-zinc-900/90 overflow-hidden relative">
            {/* Window Traffic Lights & Titlebar */}
            <div className="px-3 py-1.5 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between flex-shrink-0 text-xs">
              <div className="flex items-center gap-2 truncate">
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500/80 inline-block" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
                </div>
                <span className="text-[11px] font-semibold text-zinc-200 truncate ml-1">
                  {currentWindow.title}
                </span>
              </div>

              <div className="flex items-center gap-1.5 flex-shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 font-mono">
                  Live View
                </span>
              </div>
            </div>

            {/* ========================================================= */}
            {/* APP 1: GOOGLE CHROME BROWSER                              */}
            {/* ========================================================= */}
            {activeApp === 'browser' && (
              <WorkstationBrowser
                currentUrl={windows.browser.currentUrl || 'https://zeromq.org/docs/python-guide'}
                compact={!isExpanded}
                onNavigate={(url) => {
                  windows.browser.currentUrl = url;
                }}
                onSendToEditor={(code) => {
                  setActiveApp('vscode');
                  windows.vscode.editorContent = code;
                }}
                onSendToTerminal={(cmd) => {
                  setActiveApp('terminal');
                  windows.terminal.terminalLines = [
                    ...(windows.terminal.terminalLines || []),
                    `user@neuro-worker:~$ ${cmd}`,
                    `[✓] Command completed. Exit status: 0`,
                  ];
                }}
              />
            )}

            {/* ========================================================= */}
            {/* APP 2: VISUAL STUDIO CODE                                 */}
            {/* ========================================================= */}
            {activeApp === 'vscode' && (
              <div className="flex-1 flex bg-zinc-950 font-mono text-xs overflow-hidden">
                {/* Left Mini Sidebar */}
                <div className="w-8 bg-zinc-950 border-r border-zinc-800 flex flex-col items-center py-2 gap-3 text-zinc-500 flex-shrink-0">
                  <Folder className="w-3.5 h-3.5 text-emerald-400" />
                  <Search className="w-3.5 h-3.5 hover:text-zinc-300" />
                  <Code2 className="w-3.5 h-3.5 hover:text-zinc-300" />
                </div>

                {/* Editor Content Area */}
                <div className="flex-1 flex flex-col bg-zinc-950 overflow-hidden">
                  <div className="px-2.5 py-1 bg-zinc-900/80 border-b border-zinc-800 flex items-center justify-between text-[10px]">
                    <span className="text-emerald-300 font-semibold flex items-center gap-1">
                      <Code2 className="w-3 h-3 text-emerald-400" />
                      {windows.vscode.editorFile || 'doc_scraper.py'}
                    </span>
                    {isTypingCode && (
                      <span className="text-[9px] text-amber-400 animate-pulse font-mono">
                        ● Her typing live...
                      </span>
                    )}
                  </div>

                  <div className="flex-1 p-3 overflow-y-auto font-mono text-[10px] leading-relaxed text-zinc-200 scrollbar-thin">
                    <pre className="whitespace-pre-wrap">
                      <code>
                        {(windows.vscode.editorContent || '').slice(0, codeTypedLength)}
                        {isTypingCode && (
                          <span className="inline-block w-1.5 h-3.5 bg-emerald-400 animate-pulse ml-0.5 align-middle" />
                        )}
                      </code>
                    </pre>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* APP 3: BASH TERMINAL                                      */}
            {/* ========================================================= */}
            {activeApp === 'terminal' && (
              <div className="flex-1 p-3 bg-zinc-950 font-mono text-[11px] text-zinc-200 overflow-y-auto space-y-1.5 scrollbar-thin">
                <div className="text-zinc-500 text-[10px]">
                  Autonomous Terminal Session — PID 3410 [Connected]
                </div>
                {windows.terminal.terminalLines?.map((line, idx) => (
                  <div
                    key={idx}
                    className={
                      line.startsWith('user@')
                        ? 'text-emerald-400 font-semibold'
                        : line.startsWith('[✓]')
                        ? 'text-emerald-300 font-bold'
                        : line.startsWith('[*]') || line.startsWith('[+]')
                        ? 'text-zinc-300'
                        : 'text-zinc-400'
                    }
                  >
                    {line}
                  </div>
                ))}
                <div className="flex items-center gap-1 text-emerald-400 text-[11px]">
                  <span>user@neuro-worker:~$</span>
                  <span className="w-1.5 h-3.5 bg-emerald-400 animate-pulse inline-block" />
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* APP 4: MAILSPRING EMAIL CLIENT                            */}
            {/* ========================================================= */}
            {activeApp === 'mailspring' && (
              <div className="flex-1 p-3.5 bg-zinc-950 font-sans text-xs space-y-2.5 overflow-y-auto scrollbar-thin">
                <div className="border-b border-zinc-800 pb-1.5 flex items-center justify-between">
                  <span className="font-bold text-zinc-200 text-xs">Compose Operational Update</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                    ✓ SMTP Dispatched
                  </span>
                </div>
                <div className="space-y-1.5 font-mono text-[10px]">
                  <div className="flex items-center gap-2 text-zinc-400">
                    <span className="w-12">To:</span>
                    <span className="text-zinc-200 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800 flex-1 truncate">
                      {windows.mailspring.emailDraft?.to || 'engineering@orgo.internal'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-zinc-400">
                    <span className="w-12">Subject:</span>
                    <span className="text-zinc-200 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800 flex-1 truncate">
                      {windows.mailspring.emailDraft?.subject || 'NeuroCore Automation Run'}
                    </span>
                  </div>
                </div>
                <div className="p-2.5 bg-zinc-900 rounded-lg border border-zinc-800 text-zinc-200 whitespace-pre-wrap leading-relaxed text-[11px]">
                  {windows.mailspring.emailDraft?.body || 'Operational status email body...'}
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* APP 5: FILE MANAGER                                       */}
            {/* ========================================================= */}
            {activeApp === 'files' && (
              <div className="flex-1 p-3 bg-zinc-950 font-sans text-xs space-y-2.5 overflow-y-auto scrollbar-thin">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-1.5 text-[10px]">
                  <span className="font-mono text-zinc-400">Directory: /home/user/scripts</span>
                  <span className="text-zinc-500">4 items</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div
                    onClick={() => setActiveApp('vscode')}
                    className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-emerald-500/50 cursor-pointer flex items-center gap-2 transition-all"
                  >
                    <Code2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                    <div className="truncate text-left">
                      <div className="font-mono text-[11px] text-zinc-200 truncate">doc_scraper.py</div>
                      <div className="text-[9px] text-zinc-500">1.2 KB • Python</div>
                    </div>
                  </div>
                  <div
                    onClick={() => setActiveApp('vscode')}
                    className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-emerald-500/50 cursor-pointer flex items-center gap-2 transition-all"
                  >
                    <Code2 className="w-5 h-5 text-blue-400 flex-shrink-0" />
                    <div className="truncate text-left">
                      <div className="font-mono text-[11px] text-zinc-200 truncate">etl_pipeline.py</div>
                      <div className="text-[9px] text-zinc-500">2.4 KB • Python</div>
                    </div>
                  </div>
                  <div
                    onClick={() => setActiveApp('terminal')}
                    className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-emerald-500/50 cursor-pointer flex items-center gap-2 transition-all"
                  >
                    <TermIcon className="w-5 h-5 text-amber-400 flex-shrink-0" />
                    <div className="truncate text-left">
                      <div className="font-mono text-[11px] text-zinc-200 truncate">backup.py</div>
                      <div className="text-[9px] text-zinc-500">980 B • Bash/Py</div>
                    </div>
                  </div>
                  <div
                    onClick={() => setActiveApp('mailspring')}
                    className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-emerald-500/50 cursor-pointer flex items-center gap-2 transition-all"
                  >
                    <Mail className="w-5 h-5 text-purple-400 flex-shrink-0" />
                    <div className="truncate text-left">
                      <div className="font-mono text-[11px] text-zinc-200 truncate">dispatch.eml</div>
                      <div className="text-[9px] text-zinc-500">420 B • Email</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Monitor Chin Bezel & Brand Logo */}
        <div className="px-3 py-1.5 bg-gradient-to-r from-zinc-900 via-zinc-850 to-zinc-900 border-t border-zinc-800 flex items-center justify-between text-[10px] select-none">
          <div className="flex items-center gap-2">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isConversationMode
                  ? 'bg-emerald-400 shadow-[0_0_8px_#10b981] animate-ping'
                  : 'bg-emerald-400 shadow-[0_0_6px_#10b981]'
              }`}
            />
            <span className="font-bold tracking-widest text-zinc-400 uppercase text-[9px]">
              ORGO NEURAL DISPLAY
            </span>
            {isConversationMode && (
              <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[8px] uppercase tracking-wide border border-emerald-500/30 animate-pulse">
                MIC ALWAYS-ON
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-zinc-400 font-mono text-[9px]">
            {isListening && (
              <span className="text-emerald-400 flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                LISTENING
              </span>
            )}
            <span className="hidden sm:inline text-zinc-500">POWER: ACTIVE</span>
            <span className="text-emerald-400">SYNCED :0.0</span>
          </div>
        </div>
      </div>

      {/* Monitor Stand / Neck & Base Element */}
      <div className="flex flex-col items-center select-none pt-0.5">
        {/* Monitor Neck */}
        <div className="w-16 h-2 bg-gradient-to-b from-zinc-800 to-zinc-900 border-x border-zinc-700/60 shadow-inner" />
        {/* Monitor Base Plate */}
        <div className="w-32 h-1.5 bg-gradient-to-r from-zinc-800 via-zinc-700 to-zinc-800 rounded-full shadow-md border border-zinc-700/60" />
      </div>
    </div>
  );
};
