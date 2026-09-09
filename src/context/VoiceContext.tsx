// src/context/VoiceContext.tsx
import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import {
  ChatMessage,
  CommandPattern,
  WorkArtifact,
  WorkTask,
  MemoryItem,
  DesktopAppId,
  DesktopWindowState,
} from '../types';
import { processNeuroInstructionAsync } from '../utils/neuroBrain';
import {
  speakText,
  stopSpeech,
  createContinuousSpeechEngine,
  unlockAudioContext,
} from '../utils/speechUtils';
import { deriveTaskFromInstruction } from '../utils/taskHelper';
import { AppTab } from '../components/Header';

export interface VoiceContextType {
  isListening: boolean;
  isSpeaking: boolean;
  isContinuousMode: boolean;
  interimTranscript: string;
  isThinking: boolean;
  toggleMic: () => void;
  startListening: () => void;
  stopListening: () => void;
  toggleContinuousMode: () => void;
  dispatchInstruction: (textToSend?: string) => Promise<void>;
  speak: (text: string) => void;
  openBrowserUrl: (url: string) => void;
  // Page tab navigation autonomy
  activeTab?: AppTab;
  setActiveTab?: (tab: AppTab) => void;
  // Window 1 split screen tab
  window1Tab: 'brain_gui' | 'conversation';
  setWindow1Tab: React.Dispatch<React.SetStateAction<'brain_gui' | 'conversation'>>;
  // Workstation computer desktop state shared across all pages
  activeApp: DesktopAppId;
  setActiveApp: (app: DesktopAppId) => void;
  windows: Record<DesktopAppId, DesktopWindowState>;
  setWindows: React.Dispatch<React.SetStateAction<Record<DesktopAppId, DesktopWindowState>>>;
  isComputerOpen: boolean;
  setIsComputerOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isTypingCode: boolean;
  codeTypedLength: number;
}

const VoiceContext = createContext<VoiceContextType | undefined>(undefined);

interface VoiceProviderProps {
  children: React.ReactNode;
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
  activeTab?: AppTab;
  setActiveTab?: (tab: AppTab) => void;
}

export const VoiceProvider: React.FC<VoiceProviderProps> = ({
  children,
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
  activeTab,
  setActiveTab,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isContinuousMode, setIsContinuousMode] = useState(true); // Default continuous on so she stays listening
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [window1Tab, setWindow1Tab] = useState<'brain_gui' | 'conversation'>('conversation');

  // Global Workstation Computer State (shared across all views: Stage, Split Screen, etc.)
  const [isComputerOpen, setIsComputerOpen] = useState(true); // Open workstation computer by default
  const [activeApp, setActiveApp] = useState<DesktopAppId>('terminal');
  const [isTypingCode, setIsTypingCode] = useState(false);
  const [codeTypedLength, setCodeTypedLength] = useState(300);

  const [windows, setWindows] = useState<Record<DesktopAppId, DesktopWindowState>>({
    browser: {
      appId: 'browser',
      title: 'Google Chrome - Workstation Live Application',
      isOpen: true,
      isMinimized: false,
      zIndex: 2,
      currentUrl: 'http://localhost:3000',
    },
    vscode: {
      appId: 'vscode',
      title: 'Visual Studio Code - /home/user/scripts/doc_scraper.py',
      isOpen: true,
      isMinimized: false,
      zIndex: 1,
      editorFile: 'doc_scraper.py',
      editorContent: `# NeuroCore Autonomous Scraper & Tool Verifier
import urllib.request
import re
import json

def scrape_docs(url):
    print(f"Connecting to {url}...")
    headers = {"User-Agent": "NeuroCore/5.1"}
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req) as resp:
        html = resp.read().decode('utf-8', errors='ignore')
    
    links = re.findall(r'href=[\'"](https?://[^\'" >]+)', html)
    return {"url": url, "links_found": len(links)}

if __name__ == "__main__":
    res = scrape_docs("https://zeromq.org/docs")
    print(f"Results: {res}")
`,
    },
    terminal: {
      appId: 'terminal',
      title: 'Terminal - bash (davids-Laptop: tcp://127.0.0.1:5555)',
      isOpen: true,
      isMinimized: false,
      zIndex: 10,
      terminalLines: [
        '(.venv) davidyoung@davids-Laptop NeuralCore-Orgo % python worker_real.py --host 127.0.0.1 --port 5555',
        '[*] [WORKER] Listening on tcp://127.0.0.1:5555 (base: /Users/davidyoung/NeuralCore-Orgo)',
        '[+] Connected to NeuralCore GUI on port 3000',
        '[✓] ZeroMQ Worker daemon operational and standing by for commands.',
        'user@neuro-worker:~$ # Ready on Display :0.0 | Waiting for operator prompts...',
      ],
    },
    mailspring: {
      appId: 'mailspring',
      title: 'Mailspring - Compose: Operational Update',
      isOpen: false,
      isMinimized: false,
      zIndex: 1,
      emailDraft: {
        to: 'engineering-core@orgo.internal',
        subject: 'NeuroCore Automation Run: Scraper & ToolRegistry verified',
        body: 'Team,\n\nI have successfully opened the computer, written the scraper module, and verified it in the terminal.\n\nAll automated systems are functioning with sub-2ms latency.\n\n— NeuroCore v5.1',
        sent: true,
      },
    },
    files: {
      appId: 'files',
      title: 'Files - /home/user/scripts',
      isOpen: false,
      isMinimized: false,
      zIndex: 1,
    },
    app_builder: {
      appId: 'app_builder',
      title: 'Neural Core Helper - GUI App Builder',
      isOpen: true,
      isMinimized: false,
      zIndex: 1,
    },
  });

  const continuousEngineRef = useRef<any>(null);

  // Sync refs to avoid stale closures in continuous voice listener
  const chatMessagesRef = useRef(chatMessages);
  chatMessagesRef.current = chatMessages;

  const patternsRef = useRef(patterns);
  patternsRef.current = patterns;

  const artifactsRef = useRef(artifacts);
  artifactsRef.current = artifacts;

  const isAudioEnabledRef = useRef(isAudioEnabled);
  isAudioEnabledRef.current = isAudioEnabled;

  const isContinuousModeRef = useRef(isContinuousMode);
  isContinuousModeRef.current = isContinuousMode;

  const activeAppRef = useRef(activeApp);
  activeAppRef.current = activeApp;

  const lastProcessedPromptRef = useRef<string>('');
  const lastProcessedTimestampRef = useRef<number>(0);

  const dispatchInstructionRef = useRef<(textToSend?: string) => Promise<void>>(async () => {});

  // Dispatch an instruction from voice or text
  const dispatchInstruction = useCallback(
    async (textToSend?: string) => {
      const prompt = (textToSend || '').trim();
      if (!prompt) return;

      // Duplicate prompt shield: prevent rapid repetition (e.g. mic bouncing within 2.5s)
      const now = Date.now();
      if (
        lastProcessedPromptRef.current.toLowerCase() === prompt.toLowerCase() &&
        now - lastProcessedTimestampRef.current < 2500
      ) {
        console.log('[VoiceContext] Suppressed rapid duplicate prompt:', prompt);
        return;
      }

      // Echo filter: if prompt is an echo of the last NeuroCore message, ignore
      const lastBotMessage = chatMessagesRef.current.slice(-1)[0];
      if (lastBotMessage && lastBotMessage.sender === 'neurocore') {
        const normPrompt = prompt.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
        const normBot = lastBotMessage.text.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
        if (normPrompt.length > 6 && (normBot.includes(normPrompt) || normPrompt.includes(normBot))) {
          console.log('[VoiceContext] Suppressed acoustic echo of bot message:', prompt);
          return;
        }
      }

      lastProcessedPromptRef.current = prompt;
      lastProcessedTimestampRef.current = now;

      // Barge-in: stop any active speech immediately
      stopSpeech();
      setIsSpeaking(false);
      unlockAudioContext();

      // 1. Add user message to unbroken conversation
      const userMsg: ChatMessage = {
        id: `msg_${Date.now()}`,
        sender: 'user',
        text: prompt,
        timestamp: Date.now(),
      };
      const updatedMessages = [...chatMessagesRef.current, userMsg];
      setChatMessages(updatedMessages);
      setIsThinking(true);

      try {
        const historyPayload = updatedMessages.map((m) => ({
          sender: m.sender,
          text: m.text,
        }));

        const result = await processNeuroInstructionAsync(
          prompt,
          patternsRef.current,
          artifactsRef.current,
          historyPayload,
          activeAppRef.current
        );

        const lowerPrompt = prompt.toLowerCase();

        // Screen Navigation Autonomy (switchTab)
        if (result.switchTab && setActiveTab) {
          setActiveTab(result.switchTab);
        } else if (setActiveTab) {
          if (lowerPrompt.includes('split screen') || lowerPrompt.includes('dual window')) {
            setActiveTab('splitscreen');
          } else if (lowerPrompt.includes('stage') || lowerPrompt.includes('neurocore stage')) {
            setActiveTab('neurocore');
          } else if (lowerPrompt.includes('console') || lowerPrompt.includes('zeromq console')) {
            setActiveTab('console');
          } else if (lowerPrompt.includes('pattern') || lowerPrompt.includes('patterns')) {
            setActiveTab('patterns');
          } else if (lowerPrompt.includes('architecture') || lowerPrompt.includes('pipeline map')) {
            setActiveTab('architecture');
          } else if (
            lowerPrompt.includes('system code') ||
            lowerPrompt.includes('source code') ||
            lowerPrompt.includes('inspect code') ||
            lowerPrompt === 'open code'
          ) {
            setActiveTab('code');
          }
        }

        // Window 1 Navigation Autonomy (Brain GUI vs Conversation)
        if (result.window1Tab) {
          setWindow1Tab(result.window1Tab);
        } else if (lowerPrompt.includes('brain gui') || lowerPrompt.includes('tkinter')) {
          setWindow1Tab('brain_gui');
        } else if (lowerPrompt.includes('conversation') || lowerPrompt.includes('show chat') || lowerPrompt.includes('dialogue')) {
          setWindow1Tab('conversation');
        }

        // Workstation Computer Autonomy:
        // Only open or switch computer apps if requested or if performing a desktop action
        const shouldOpenComputer =
          result.openComputer ||
          Boolean(result.desktopAction) ||
          lowerPrompt.includes('open computer') ||
          lowerPrompt.includes('show computer') ||
          lowerPrompt.includes('open workstation') ||
          lowerPrompt.includes('open browser') ||
          lowerPrompt.includes('open chrome') ||
          lowerPrompt.includes('open terminal') ||
          lowerPrompt.includes('open bash') ||
          lowerPrompt.includes('open vscode') ||
          lowerPrompt.includes('open vs code') ||
          lowerPrompt.includes('open email') ||
          lowerPrompt.includes('open mailspring') ||
          lowerPrompt.includes('open files') ||
          lowerPrompt.includes('open app builder');

        if (shouldOpenComputer) {
          setIsComputerOpen(true);
        }

        let targetApp: DesktopAppId | null = null;
        if (result.desktopAction?.appId) {
          targetApp = result.desktopAction.appId;
        } else if (lowerPrompt.includes('open chrome') || lowerPrompt.includes('open browser')) {
          targetApp = 'browser';
        } else if (lowerPrompt.includes('open vscode') || lowerPrompt.includes('open vs code') || lowerPrompt.includes('fix code') || lowerPrompt.includes('fix python')) {
          targetApp = 'vscode';
        } else if (lowerPrompt.includes('open terminal') || lowerPrompt.includes('open bash')) {
          targetApp = 'terminal';
        } else if (lowerPrompt.includes('open email') || lowerPrompt.includes('open mailspring') || lowerPrompt.includes('send email')) {
          targetApp = 'mailspring';
        } else if (lowerPrompt.includes('open files') || lowerPrompt.includes('open file manager')) {
          targetApp = 'files';
        } else if (lowerPrompt.includes('open app builder') || lowerPrompt.includes('open gui builder')) {
          targetApp = 'app_builder';
        }

        if (targetApp) {
          setActiveApp(targetApp);

          // Update desktop window state
          const appToUpdate = targetApp;
          setWindows((prev) => {
            const next = { ...prev };
            next[appToUpdate] = {
              ...next[appToUpdate],
              isOpen: true,
              isMinimized: false,
              zIndex: 10,
            };

            const url =
              result.desktopAction?.details?.url ||
              (lowerPrompt.includes('zeromq')
                ? 'https://zeromq.org/docs/python-guide'
                : lowerPrompt.includes('python')
                ? 'https://docs.python.org/3/'
                : 'http://localhost:3000');

            if (appToUpdate === 'browser') {
              next.browser.currentUrl = url;
              next.browser.title = `Google Chrome - ${url.replace('https://', '').replace('http://', '')}`;
            }

            if (appToUpdate === 'vscode' && result.desktopAction?.details?.editorContent) {
              next.vscode.editorContent = result.desktopAction.details.editorContent;
              next.vscode.editorFile = result.desktopAction.details.editorFile || 'neural_script.py';
              setIsTypingCode(true);
              setCodeTypedLength(40);
              setTimeout(() => {
                setCodeTypedLength(result.desktopAction!.details!.editorContent!.length);
                setIsTypingCode(false);
              }, 600);
            }

            if (appToUpdate === 'mailspring' && result.desktopAction?.details?.emailDraft) {
              next.mailspring.emailDraft = result.desktopAction.details.emailDraft;
            }

            // Stream execution output to terminal if relevant
            const timeStr = new Date().toLocaleTimeString();
            const executionLogs: string[] = [
              `user@neuro-worker:~$ # [${timeStr}] Operator Prompt: "${prompt}"`,
              `[*] Brain Dispatcher: Intent routed to ZeroMQ worker daemon (port 5555)...`,
            ];

            if (appToUpdate === 'browser') {
              executionLogs.push(
                `[*] Intent: OPEN_APPLICATION ("Google Chrome")`,
                `[*] Spawning Chrome subprocess: google-chrome --remote-debugging-port=9222 "${url}"`,
                `[+] ZeroMQ Worker REP: {"status": "ok", "app": "Google Chrome", "pid": 5120}`,
                `[✓] Chrome active on Display :0.0 (${url})`
              );
            } else if (appToUpdate === 'vscode') {
              executionLogs.push(
                `[*] Intent: OPEN_EDITOR (${result.desktopAction?.details?.editorFile || 'script.py'})`,
                `[+] Buffer updated in Visual Studio Code workspace`,
                `[✓] VS Code editor in foreground`
              );
            } else if (result.desktopAction?.details?.terminalOutput) {
              executionLogs.push(...result.desktopAction.details.terminalOutput);
            } else {
              executionLogs.push(
                `[+] ZeroMQ Worker REP: {"status": "ok", "latency": "1.4ms"}`,
                `[✓] Command completed on workstation computer`
              );
            }

            next.terminal.terminalLines = [
              ...(prev.terminal.terminalLines || []),
              ...executionLogs,
            ];

            return next;
          });
        }

        // Save presented artifact
        if (result.artifactToPresent) {
          setArtifacts((prev) => [
            result.artifactToPresent!,
            ...prev.filter((a) => a.id !== result.artifactToPresent!.id),
          ]);
        }

        // Auto-derive and log task
        const derivedTask = deriveTaskFromInstruction(prompt, result);
        if (derivedTask) {
          setTasks((prev) => [derivedTask, ...prev.filter((t) => t.id !== derivedTask.id)]);
        }

        // Append NeuroCore chat message
        const ncMsg: ChatMessage = {
          id: `msg_nc_${Date.now()}`,
          sender: 'neurocore',
          text: result.chatReply,
          timestamp: Date.now(),
          decision: result.decision,
          workerResponse: result.workerResponse,
          presentedArtifactId: result.artifactToPresent?.id,
          actionSummary:
            result.desktopAction?.actionDescription ||
            result.workerResponse?.msg ||
            (derivedTask ? `Task: ${derivedTask.title}` : undefined),
          taskId: derivedTask?.id,
        };
        setChatMessages((prev) => [...prev, ncMsg]);

        // Speak aloud with TTS if audio enabled
        if (isAudioEnabledRef.current && result.spokenReply) {
          setIsSpeaking(true);
          // Pause continuous listener while TTS speaks to eliminate acoustic feedback loop
          if (continuousEngineRef.current) {
            try {
              continuousEngineRef.current.stop();
            } catch (e) {}
          }

          speakText(
            result.spokenReply,
            () => setIsSpeaking(true),
            () => {
              setIsSpeaking(false);
              // Wait cooldown before re-starting microphone listener
              setTimeout(() => {
                if (isContinuousModeRef.current && continuousEngineRef.current) {
                  try {
                    continuousEngineRef.current.start();
                  } catch (e) {}
                }
              }, 600);
            },
            () => {
              setIsSpeaking(false);
              setTimeout(() => {
                if (isContinuousModeRef.current && continuousEngineRef.current) {
                  try {
                    continuousEngineRef.current.start();
                  } catch (e) {}
                }
              }, 600);
            }
          );
        }
      } catch (err) {
        console.error('Error processing instruction:', err);
      } finally {
        setIsThinking(false);
      }
    },
    [setArtifacts, setChatMessages, setTasks, setActiveTab]
  );

  dispatchInstructionRef.current = dispatchInstruction;

  // Initialize continuous speech engine at the application root
  useEffect(() => {
    const engine = createContinuousSpeechEngine({
      onTranscript: (transcript) => {
        setInterimTranscript('');
        dispatchInstructionRef.current(transcript);
      },
      onInterim: (interim) => {
        setInterimTranscript(interim);
      },
      onStateChange: (listening) => {
        setIsListening(listening);
      },
      onError: (err) => {
        console.warn('[GlobalSpeechEngine] warning:', err);
      },
    });

    continuousEngineRef.current = engine;

    // Start listening right away if continuous mode is enabled
    if (isContinuousMode) {
      engine.setContinuous(true);
      engine.start();
    }

    return () => {
      engine.stop();
      stopSpeech();
    };
  }, []);

  const toggleMic = useCallback(() => {
    unlockAudioContext();
    if (isListening) {
      continuousEngineRef.current?.stop();
      setIsListening(false);
      setIsContinuousMode(false);
    } else {
      continuousEngineRef.current?.startContinuous();
      setIsContinuousMode(true);
    }
  }, [isListening]);

  const startListening = useCallback(() => {
    unlockAudioContext();
    continuousEngineRef.current?.startContinuous();
    setIsContinuousMode(true);
  }, []);

  const stopListening = useCallback(() => {
    continuousEngineRef.current?.stop();
    setIsListening(false);
    setIsContinuousMode(false);
  }, []);

  const speak = useCallback(
    (text: string) => {
      if (!isAudioEnabledRef.current) return;
      speakText(
        text,
        () => setIsSpeaking(true),
        () => {
          setIsSpeaking(false);
          if (isContinuousModeRef.current) {
            continuousEngineRef.current?.start();
          }
        }
      );
    },
    []
  );

  const toggleContinuousMode = useCallback(() => {
    unlockAudioContext();
    if (isContinuousMode) {
      continuousEngineRef.current?.setContinuous(false);
      continuousEngineRef.current?.stop();
      setIsContinuousMode(false);
      setIsListening(false);
    } else {
      continuousEngineRef.current?.setContinuous(true);
      continuousEngineRef.current?.start();
      setIsContinuousMode(true);
    }
  }, [isContinuousMode]);

  const openBrowserUrl = useCallback((url: string) => {
    setIsComputerOpen(true);
    setActiveApp('browser');
    setWindows((prev) => ({
      ...prev,
      browser: {
        ...prev.browser,
        isOpen: true,
        isMinimized: false,
        zIndex: 10,
        currentUrl: url,
        title: `Google Chrome - ${url.replace(/^https?:\/\//, '')}`,
      },
    }));
  }, []);

  return (
    <VoiceContext.Provider
      value={{
        isListening,
        isSpeaking,
        isContinuousMode,
        interimTranscript,
        isThinking,
        toggleMic,
        startListening,
        stopListening,
        toggleContinuousMode,
        dispatchInstruction,
        speak,
        openBrowserUrl,
        activeTab,
        setActiveTab,
        window1Tab,
        setWindow1Tab,
        activeApp,
        setActiveApp,
        windows,
        setWindows,
        isComputerOpen,
        setIsComputerOpen,
        isTypingCode,
        codeTypedLength,
      }}
    >
      {children}
    </VoiceContext.Provider>
  );
};

export const useVoice = (): VoiceContextType => {
  const context = useContext(VoiceContext);
  if (!context) {
    throw new Error('useVoice must be used within a VoiceProvider');
  }
  return context;
};
