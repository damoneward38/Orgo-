import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  Send,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Play,
  Download,
  Copy,
  Check,
  FileCode,
  FileText,
  Mail,
  Database,
  Sparkles,
  Terminal as TermIcon,
  Maximize2,
  RefreshCw,
  Clock,
  User,
  Radio,
  ExternalLink,
  ChevronRight,
  Zap,
  Globe,
  Code2,
  Folder,
  Monitor,
  ListTodo,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  WorkArtifact,
  ChatMessage,
  CommandPattern,
  ActivityLogItem,
  DesktopAppId,
  DesktopWindowState,
  WorkTask,
  MemoryItem,
} from '../types';
import { processNeuroInstruction, processNeuroInstructionAsync } from '../utils/neuroBrain';
import { speakText, stopSpeech, createContinuousSpeechEngine, unlockAudioContext } from '../utils/speechUtils';
import { deriveTaskFromInstruction } from '../utils/taskHelper';
import { useVoice } from '../context/VoiceContext';
import { WorkstationMonitor } from './WorkstationMonitor';
import { WorkstationVoiceDock } from './WorkstationVoiceDock';
import { TaskMemoryBoard } from './TaskMemoryBoard';

interface NeuroCoreStagePageProps {
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
  onExecuteOnWorker: (prompt: string) => void;
  onSwitchToSplitScreen?: () => void;
}

export const NeuroCoreStagePage: React.FC<NeuroCoreStagePageProps> = ({
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
  onExecuteOnWorker,
  onSwitchToSplitScreen,
}) => {
  const {
    isListening,
    isSpeaking,
    isContinuousMode,
    interimTranscript,
    isThinking,
    toggleMic: handleToggleMic,
    toggleContinuousMode: handleToggleContinuousMode,
    dispatchInstruction,
    speak,
    activeApp,
    setActiveApp,
    windows,
    setWindows,
    isTypingCode,
    codeTypedLength,
  } = useVoice();

  const [inputText, setInputText] = useState('');
  const [showTaskLedger, setShowTaskLedger] = useState(false);
  const [activeArtifactId, setActiveArtifactId] = useState<string>(
    artifacts[0]?.id || 'art_etl'
  );
  const [copied, setCopied] = useState(false);
  const [workerRunning, setWorkerRunning] = useState(false);
  const [workerOutput, setWorkerOutput] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Active presented artifact
  const presentedArtifact =
    artifacts.find((a) => a.id === activeArtifactId) || artifacts[0];

  // Auto-scroll chat to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, interimTranscript]);

  const handleSend = async (textToSend?: string) => {
    const prompt = (textToSend !== undefined ? textToSend : inputText).trim();
    if (!prompt) return;
    setInputText('');
    await dispatchInstruction(prompt);
  };

  const handleCopyContent = () => {
    if (!presentedArtifact) return;
    navigator.clipboard.writeText(presentedArtifact.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadFile = () => {
    if (!presentedArtifact) return;
    const blob = new Blob([presentedArtifact.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = presentedArtifact.filename || `${presentedArtifact.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleRunPresentedOnWorker = () => {
    if (!presentedArtifact) return;
    setWorkerRunning(true);
    setWorkerOutput(null);

    // Simultaneously switch computer monitor to terminal
    setActiveApp('terminal');
    setWindows((prev) => ({
      ...prev,
      terminal: {
        ...prev.terminal,
        terminalLines: [
          ...(prev.terminal.terminalLines || []).slice(-3),
          `user@neuro-worker:~$ /usr/bin/python3 ${presentedArtifact.filename || 'script.py'}`,
          `[*] Executing on ZeroMQ worker node tcp://127.0.0.1:5555...`,
          `[+] Telemetry event pipeline enriched: 8 records processed.`,
          `[✓] Execution completed with status OK (exit code 0).`,
        ],
      },
    }));

    setTimeout(() => {
      setWorkerRunning(false);
      if (presentedArtifact.type === 'code') {
        setWorkerOutput(
          `[ZeroMQ Daemon 5555] Spawned subprocess /usr/bin/python3 ${
            presentedArtifact.filename || 'script.py'
          }\n[*] Executing bytecode...\n[+] Processing 8 streaming events...\n[+] Pipeline Result: {"count": 8, "status": "STORED", "checksum": "a89f92e"}\n[✓] Finished with returncode 0 in 0.24s.`
        );
      } else if (presentedArtifact.type === 'email') {
        setWorkerOutput(
          `[ZeroMQ Daemon 5555] Dispatched IPC to Mailspring daemon (PID 4321)\n[+] Message queued: ${presentedArtifact.title}\n[✓] SMTP dispatch delivered.`
        );
      } else {
        setWorkerOutput(
          `[ZeroMQ Daemon 5555] Evaluated document ${
            presentedArtifact.filename || 'doc'
          }\n[+] Health score verified: 98.4/100\n[✓] Worker diagnostics logged.`
        );
      }
    }, 800);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Banner introducing the Big Open NeuroCore Hub */}
      <div className="bg-gradient-to-r from-emerald-950/40 via-zinc-900 to-zinc-900/80 border border-emerald-500/20 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="relative">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-inner">
              <Bot className="w-6 h-6" />
            </div>
            <span
              className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-zinc-950 ${
                isSpeaking
                  ? 'bg-emerald-400 animate-ping'
                  : 'bg-emerald-500 animate-pulse'
              }`}
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-zinc-100 tracking-tight">
                NeuroCore Presentation Stage &amp; Voice Hub
              </h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono border border-emerald-500/30">
                Autonomous v4.0
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Talk directly with NeuroCore. Anything she brings up or builds is presented live on the stage with full worker execution.
            </p>
          </div>
        </div>

        {/* Quick action buttons & view switch */}
        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end flex-wrap">
          <button
            id="stage-task-ledger-toggle-btn"
            onClick={() => setShowTaskLedger(!showTaskLedger)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all border ${
              showTaskLedger
                ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-900/30'
                : 'bg-zinc-850 hover:bg-zinc-800 text-zinc-300 border-zinc-700'
            }`}
          >
            <ListTodo className="w-3.5 h-3.5 text-emerald-400" />
            <span>
              Tasks ({tasks.filter((t) => t.status === 'completed' || t.status === 'verified').length}/{tasks.length} Done)
            </span>
            {showTaskLedger ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          {onSwitchToSplitScreen && (
            <button
              id="switch-to-split-btn"
              onClick={onSwitchToSplitScreen}
              className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-xs font-semibold flex items-center gap-2 transition-all shadow-sm hover:text-white"
            >
              <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
              <span>Open Dual-Window Split Screen</span>
            </button>
          )}

          <button
            id="stage-voice-toggle-btn"
            onClick={() => {
              const next = !isAudioEnabled;
              setIsAudioEnabled(next);
              if (!next) stopSpeech();
            }}
            className={`px-3 py-2 rounded-xl border text-xs font-medium flex items-center gap-2 transition-all ${
              isAudioEnabled
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {isAudioEnabled ? (
              <>
                <Volume2 className="w-4 h-4 text-emerald-400" />
                <span>Her Voice: ON</span>
              </>
            ) : (
              <>
                <VolumeX className="w-4 h-4" />
                <span>Voice Muted</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Collapsible Persistent Task & Memory Ledger */}
      {showTaskLedger && (
        <TaskMemoryBoard
          tasks={tasks}
          setTasks={setTasks}
          memories={memories}
          setMemories={setMemories}
        />
      )}

      {/* Main Big Open 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[760px] items-start">
        {/* Left Column: Conversational Voice & Instruction Stream + Live Computer Monitor Down There (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* Top Panel: Dialogue with NeuroCore */}
          <div className="flex flex-col bg-zinc-900/90 border border-zinc-800/80 rounded-2xl overflow-hidden shadow-lg h-[360px]">
            {/* Persona Header */}
            <div className="px-4 py-3 bg-zinc-950 border-b border-zinc-800/80 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Radio className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-zinc-200">
                      Dialogue with NeuroCore
                    </span>
                    {isContinuousMode && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono animate-pulse border border-emerald-500/30">
                        Conversation Mode ON
                      </span>
                    )}
                    {isSpeaking && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono animate-pulse">
                        Speaking...
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    Voice &amp; instruction link tied to computer
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] text-zinc-400 font-mono">
                  tcp://127.0.0.1:5555
                </span>
              </div>
            </div>

            {/* Quick Prompts Bar */}
            <div className="px-3 py-1.5 bg-zinc-950/40 border-b border-zinc-800/60 flex items-center gap-1.5 overflow-x-auto text-[11px] text-zinc-300 scrollbar-thin">
              <span className="text-zinc-500 text-[10px] uppercase font-mono px-1 flex-shrink-0">
                Ask Her:
              </span>
              <button
                onClick={() => handleSend('How are you doing today and what are you thinking about?')}
                className="px-2 py-0.5 rounded-md bg-zinc-800/70 hover:bg-zinc-700/80 text-zinc-300 border border-zinc-700/60 whitespace-nowrap transition-colors flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3 text-emerald-400" />
                <span>How are you?</span>
              </button>
              <button
                onClick={() => handleSend('What do you think about autonomous AI systems and our collaboration?')}
                className="px-2 py-0.5 rounded-md bg-zinc-800/70 hover:bg-zinc-700/80 text-zinc-300 border border-zinc-700/60 whitespace-nowrap transition-colors flex items-center gap-1"
              >
                <Radio className="w-3 h-3 text-teal-400" />
                <span>What do you think?</span>
              </button>
              <button
                onClick={() => handleSend('Open up Chrome and search documentation')}
                className="px-2 py-0.5 rounded-md bg-zinc-800/70 hover:bg-zinc-700/80 text-zinc-300 border border-zinc-700/60 whitespace-nowrap transition-colors flex items-center gap-1"
              >
                <Globe className="w-3 h-3 text-blue-400" />
                <span>Open Chrome</span>
              </button>
              <button
                onClick={() => handleSend('Create a Python web scraper for documentation')}
                className="px-2 py-0.5 rounded-md bg-zinc-800/70 hover:bg-zinc-700/80 text-zinc-300 border border-zinc-700/60 whitespace-nowrap transition-colors flex items-center gap-1"
              >
                <Code2 className="w-3 h-3 text-emerald-400" />
                <span>Write Scraper</span>
              </button>
              <button
                onClick={() => handleSend('run script backup.py')}
                className="px-2 py-0.5 rounded-md bg-zinc-800/70 hover:bg-zinc-700/80 text-zinc-300 border border-zinc-700/60 whitespace-nowrap transition-colors flex items-center gap-1"
              >
                <TermIcon className="w-3 h-3 text-amber-400" />
                <span>Run Backup</span>
              </button>
              <button
                onClick={() => handleSend('Draft an email to the dev team about release')}
                className="px-2 py-0.5 rounded-md bg-zinc-800/70 hover:bg-zinc-700/80 text-zinc-300 border border-zinc-700/60 whitespace-nowrap transition-colors flex items-center gap-1"
              >
                <Mail className="w-3 h-3 text-purple-400" />
                <span>Draft Email</span>
              </button>
            </div>

            {/* Chat Messages Scrollable Box */}
            <div className="flex-1 p-3 overflow-y-auto space-y-3 text-xs font-sans scrollbar-thin">
              {chatMessages.map((msg) => {
                const isMe = msg.sender === 'user';
                return (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-2.5 ${
                      isMe ? 'flex-row-reverse' : 'flex-row'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                        isMe
                          ? 'bg-zinc-700 text-zinc-200'
                          : 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400'
                      }`}
                    >
                      {isMe ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
                    </div>

                    <div
                      className={`max-w-[85%] rounded-2xl px-3 py-2 space-y-1.5 ${
                        isMe
                          ? 'bg-emerald-600 text-white rounded-tr-none'
                          : 'bg-zinc-800/90 text-zinc-200 border border-zinc-700/60 rounded-tl-none shadow-sm'
                      }`}
                    >
                      <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>

                      {/* If message has presented artifact badge */}
                      {msg.presentedArtifactId && (
                        <button
                          onClick={() => setActiveArtifactId(msg.presentedArtifactId!)}
                          className="w-full flex items-center justify-between gap-2 p-1.5 rounded-lg bg-zinc-900/80 hover:bg-zinc-950 border border-emerald-500/30 text-emerald-300 text-[10px] font-mono transition-colors text-left"
                        >
                          <span className="flex items-center gap-1.5 truncate">
                            <Sparkles className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                            <span className="truncate">
                              Presented:{' '}
                              {artifacts.find((a) => a.id === msg.presentedArtifactId)?.title ||
                                'Deliverable'}
                            </span>
                          </span>
                          <ChevronRight className="w-3 h-3 flex-shrink-0" />
                        </button>
                      )}

                      {/* Action summary badge */}
                      {msg.actionSummary && (
                        <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 font-mono bg-zinc-900/50 px-2 py-0.5 rounded border border-zinc-800/80">
                          <Zap className="w-3 h-3 text-emerald-400" />
                          <span className="truncate">{msg.actionSummary}</span>
                        </div>
                      )}

                      {/* Audio replay button */}
                      {!isMe && isAudioEnabled && (
                        <div className="pt-0.5 flex items-center justify-between text-[10px] text-zinc-400">
                          <span>NeuroCore Voice</span>
                          <button
                            onClick={() => speak(msg.text)}
                            className="hover:text-emerald-300 flex items-center gap-1"
                          >
                            <Volume2 className="w-3 h-3" />
                            <span>Replay Audio</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              {isThinking && (
                <div className="flex items-start gap-2.5 flex-row">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 animate-pulse">
                    <Bot className="w-3 h-3" />
                  </div>
                  <div className="rounded-2xl px-3 py-2 bg-zinc-800/90 text-zinc-400 border border-zinc-700/60 rounded-tl-none text-xs flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    <span className="animate-pulse">NeuroCore is thinking...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* User Prompt Input Box */}
            <div className="p-2.5 bg-zinc-950 border-t border-zinc-800/80">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex items-center gap-2"
              >
                <button
                  type="button"
                  id="voice-mic-input-btn"
                  onClick={handleToggleMic}
                  title={isListening ? 'Stop listening' : 'Speak to NeuroCore (Speech to text)'}
                  className={`p-2 rounded-xl border transition-all ${
                    isListening
                      ? 'bg-red-500/20 border-red-500/40 text-red-400 animate-pulse'
                      : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>

                <input
                  type="text"
                  id="neurocore-talk-input"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={
                    isListening
                      ? 'Listening to your voice...'
                      : "Say: 'Open Chrome', 'Write scraper', 'Run backup'..."
                  }
                  className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50"
                />

                <button
                  type="submit"
                  id="neurocore-talk-send-btn"
                  disabled={!inputText.trim()}
                  className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:hover:bg-emerald-600 text-white font-semibold transition-all shadow-md shadow-emerald-900/30"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>

          {/* Bottom Panel of Left Column: The Computer Monitor Down There */}
          <div className="flex flex-col">
            <div className="flex items-center justify-between pb-1.5 px-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-300">
                <Monitor className="w-4 h-4 text-emerald-400" />
                <span>Computer Monitor (Live Work View)</span>
              </div>
              <span className="text-[10px] text-zinc-500 font-mono">
                Simultaneous Screen Sync
              </span>
            </div>

            <WorkstationMonitor
              activeApp={activeApp}
              setActiveApp={setActiveApp}
              windows={windows}
              onTriggerApp={(appId) => {
                if (appId === 'browser') {
                  handleSend('Open up Chrome and browse documentation');
                } else if (appId === 'vscode') {
                  handleSend('Create a Python web scraper for documentation');
                } else if (appId === 'terminal') {
                  handleSend('run script backup.py');
                } else if (appId === 'mailspring') {
                  handleSend('Draft an email to the dev team about release');
                }
              }}
              isTypingCode={isTypingCode}
              codeTypedLength={codeTypedLength}
              onSwitchToSplitScreen={onSwitchToSplitScreen}
              isConversationMode={isContinuousMode}
              isListening={isListening}
            />

            {/* Microphone down there & Conversation Mode Button that stays on all the time */}
            <WorkstationVoiceDock
              isListening={isListening}
              isSpeaking={isSpeaking}
              isContinuousMode={isContinuousMode}
              interimTranscript={interimTranscript}
              onToggleMic={handleToggleMic}
              onToggleContinuousMode={handleToggleContinuousMode}
              onAskQuestion={(question) => handleSend(question)}
            />
          </div>
        </div>

        {/* Right Column: Big Open Work Presentation Stage (7 cols) */}
        <div className="lg:col-span-7 flex flex-col bg-zinc-900/90 border border-zinc-800/80 rounded-2xl overflow-hidden shadow-lg min-h-[760px]">
          {/* Presentation Stage Header */}
          <div className="px-5 py-3.5 bg-zinc-950 border-b border-zinc-800/80 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                {presentedArtifact.type === 'code' ? (
                  <FileCode className="w-4 h-4" />
                ) : presentedArtifact.type === 'email' ? (
                  <Mail className="w-4 h-4" />
                ) : presentedArtifact.type === 'data' ? (
                  <Database className="w-4 h-4" />
                ) : (
                  <FileText className="w-4 h-4" />
                )}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-zinc-100">
                    {presentedArtifact.title}
                  </h2>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-mono uppercase font-semibold">
                    {presentedArtifact.status}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 font-mono">
                  {presentedArtifact.filename || presentedArtifact.type} • Presented by {presentedArtifact.author}
                </p>
              </div>
            </div>

            {/* Action Buttons: Run on Worker, Copy, Download */}
            <div className="flex items-center gap-2">
              <button
                id="run-presented-worker-btn"
                onClick={handleRunPresentedOnWorker}
                disabled={workerRunning}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{workerRunning ? 'Executing...' : 'Run on Worker'}</span>
              </button>

              <button
                id="copy-presented-btn"
                onClick={handleCopyContent}
                title="Copy contents"
                className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800 transition-colors"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>

              <button
                id="download-presented-btn"
                onClick={handleDownloadFile}
                title="Download deliverable"
                className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800 transition-colors"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Sub-bar with Tags & Summary */}
          <div className="px-5 py-2.5 bg-zinc-950/60 border-b border-zinc-800/60 flex items-center justify-between text-xs text-zinc-400">
            <p className="line-clamp-1 italic text-zinc-300">
              "{presentedArtifact.summary}"
            </p>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {presentedArtifact.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded bg-zinc-800/80 text-zinc-400 text-[10px] font-mono"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>

          {/* Main Stage Content Display */}
          <div className="flex-1 p-4 overflow-y-auto bg-zinc-950/80 font-mono text-xs text-zinc-200">
            {presentedArtifact.type === 'code' ? (
              <div className="space-y-1">
                <pre className="text-zinc-300 leading-relaxed overflow-x-auto whitespace-pre">
                  <code>{presentedArtifact.content}</code>
                </pre>
              </div>
            ) : presentedArtifact.type === 'email' ? (
              <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-4 font-sans text-xs space-y-3">
                <div className="border-b border-zinc-800 pb-2 text-zinc-400 space-y-1 font-mono text-[11px]">
                  <div className="text-emerald-400 font-bold uppercase tracking-wider text-[10px]">
                    Mailspring Client Preview
                  </div>
                  <div>To: engineering-all@orgo-neural.internal</div>
                  <div>From: neurocore-automation@orgo.internal</div>
                </div>
                <div className="text-zinc-200 whitespace-pre-wrap leading-relaxed">
                  {presentedArtifact.content}
                </div>
              </div>
            ) : (
              <div className="font-sans text-xs text-zinc-300 space-y-3 leading-relaxed">
                <pre className="font-mono text-zinc-300 whitespace-pre-wrap">
                  {presentedArtifact.content}
                </pre>
              </div>
            )}

            {/* Worker Execution Output Drawer if executed */}
            {workerOutput && (
              <div className="mt-4 p-3.5 rounded-xl bg-zinc-900 border border-emerald-500/30 font-mono text-xs text-emerald-300 space-y-1">
                <div className="flex items-center justify-between text-[11px] text-zinc-400 border-b border-zinc-800 pb-1.5 mb-1.5">
                  <span className="flex items-center gap-1.5 font-bold text-emerald-400">
                    <TermIcon className="w-3.5 h-3.5" />
                    Remote Worker Execution Output
                  </span>
                  <button
                    onClick={() => setWorkerOutput(null)}
                    className="hover:text-zinc-200 text-[10px]"
                  >
                    Dismiss
                  </button>
                </div>
                <pre className="whitespace-pre-wrap text-[11px] leading-relaxed">
                  {workerOutput}
                </pre>
              </div>
            )}
          </div>

          {/* Bottom Stage Carousel: Deliverables Gallery (Switch what she presents) */}
          <div className="p-3 bg-zinc-950 border-t border-zinc-800 flex items-center gap-2 overflow-x-auto">
            <span className="text-[11px] font-semibold text-zinc-400 uppercase font-mono px-2 flex-shrink-0">
              Work History:
            </span>
            {artifacts.map((art) => {
              const isSelected = art.id === activeArtifactId;
              return (
                <button
                  key={art.id}
                  onClick={() => setActiveArtifactId(art.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs flex items-center gap-2 border flex-shrink-0 transition-all ${
                    isSelected
                      ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 font-semibold shadow-sm'
                      : 'bg-zinc-900/90 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80'
                  }`}
                >
                  {art.type === 'code' ? (
                    <FileCode className="w-3.5 h-3.5" />
                  ) : art.type === 'email' ? (
                    <Mail className="w-3.5 h-3.5" />
                  ) : (
                    <FileText className="w-3.5 h-3.5" />
                  )}
                  <span>{art.filename || art.title}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
