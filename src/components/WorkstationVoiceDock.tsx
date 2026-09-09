import React, { useState } from 'react';
import {
  Mic,
  MicOff,
  Radio,
  Volume2,
  Sparkles,
  Send,
  Zap,
  Globe,
  Code2,
  Terminal as TermIcon,
  Mail,
  Activity,
  CheckCircle2,
} from 'lucide-react';

interface WorkstationVoiceDockProps {
  isListening: boolean;
  isSpeaking: boolean;
  isContinuousMode: boolean;
  interimTranscript: string;
  onToggleMic: () => void;
  onToggleContinuousMode: () => void;
  onAskQuestion: (question: string) => void;
}

export const WorkstationVoiceDock: React.FC<WorkstationVoiceDockProps> = ({
  isListening,
  isSpeaking,
  isContinuousMode,
  interimTranscript,
  onToggleMic,
  onToggleContinuousMode,
  onAskQuestion,
}) => {
  const [downTextInput, setDownTextInput] = useState('');

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (downTextInput.trim()) {
      onAskQuestion(downTextInput.trim());
      setDownTextInput('');
    }
  };

  return (
    <div
      id="neurocore-workstation-voice-dock"
      className={`mt-2 rounded-2xl border transition-all duration-300 shadow-xl overflow-hidden ${
        isContinuousMode
          ? 'bg-gradient-to-b from-zinc-900 to-zinc-950 border-emerald-500/50 shadow-[0_0_25px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/30'
          : 'bg-zinc-900/95 border-zinc-800 shadow-md'
      }`}
    >
      {/* Top Header Bar of the Voice Dock */}
      <div className="px-3.5 py-2 bg-zinc-950/80 border-b border-zinc-800/80 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div
            className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${
              isContinuousMode
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                : 'bg-zinc-800 text-zinc-400'
            }`}
          >
            <Radio className="w-3.5 h-3.5 animate-pulse" />
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-zinc-200">
                Voice Station &amp; Conversation Console
              </span>
              {isContinuousMode && (
                <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[9px] uppercase tracking-wide font-semibold">
                  Always-On
                </span>
              )}
            </div>
            <p className="text-[10px] text-zinc-400 leading-tight">
              {isContinuousMode
                ? 'Continuous conversation active — microphone stays on without shutting off'
                : 'Ask questions or turn on continuous conversation mode below'}
            </p>
          </div>
        </div>

        {/* Live Audio State Indicator */}
        <div className="flex items-center gap-2 font-mono text-[10px]">
          {isSpeaking ? (
            <div className="flex items-center gap-1 text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30 animate-pulse">
              <Volume2 className="w-3 h-3" />
              <span>Speaking...</span>
            </div>
          ) : isListening ? (
            <div className="flex items-center gap-1.5 text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-full border border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span>Hearing Voice</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-zinc-500">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
              <span>Standby</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Controls Section: Big Microphone + Conversation Mode Toggle */}
      <div className="p-3.5 flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          
          {/* 1. Large Microphone Button down here */}
          <div className="flex items-center gap-2.5 flex-1">
            <button
              type="button"
              id="down-microphone-btn"
              onClick={onToggleMic}
              title={
                isListening
                  ? 'Microphone active — click to pause'
                  : 'Click microphone to ask NeuroCore a question'
              }
              className={`relative p-3 rounded-2xl flex items-center justify-center transition-all duration-300 flex-shrink-0 shadow-lg ${
                isListening
                  ? 'bg-emerald-500 text-black shadow-emerald-500/40 ring-4 ring-emerald-500/30'
                  : 'bg-zinc-800 hover:bg-zinc-750 text-zinc-200 border border-zinc-700 hover:border-zinc-600'
              }`}
            >
              {isListening ? (
                <>
                  <span className="absolute inset-0 rounded-2xl bg-emerald-400 opacity-75 animate-ping" />
                  <Mic className="w-5 h-5 relative z-10" />
                </>
              ) : (
                <Mic className="w-5 h-5" />
              )}
            </button>

            <div className="flex flex-col">
              <span className="text-xs font-bold text-zinc-100 flex items-center gap-1.5">
                <span>Microphone</span>
                {isListening && (
                  <span className="text-[10px] text-emerald-400 font-mono font-normal">
                    (Listening...)
                  </span>
                )}
              </span>
              <span className="text-[11px] text-zinc-400">
                {isListening
                  ? 'Speak your question aloud to her now'
                  : 'Click mic to ask her a question'}
              </span>
            </div>
          </div>

          {/* 2. CONVERSATION MODE BUTTON: Talks continuously, stays on all the time */}
          <button
            type="button"
            id="down-conversation-mode-btn"
            onClick={onToggleContinuousMode}
            title={
              isContinuousMode
                ? 'Turn off continuous conversation mode'
                : 'Turn on conversation mode (microphone stays on all the time)'
            }
            className={`px-3.5 py-2.5 rounded-xl flex items-center justify-between gap-3 transition-all duration-300 border shadow-md ${
              isContinuousMode
                ? 'bg-emerald-600/25 border-emerald-500/70 text-emerald-200 shadow-emerald-950/50'
                : 'bg-zinc-800/90 hover:bg-zinc-800 border-zinc-700/80 text-zinc-300 hover:text-zinc-100'
            }`}
          >
            <div className="flex items-center gap-2 text-left">
              <div
                className={`w-3 h-3 rounded-full flex-shrink-0 ${
                  isContinuousMode
                    ? 'bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse'
                    : 'bg-zinc-600'
                }`}
              />
              <div className="flex flex-col">
                <span className="text-xs font-bold whitespace-nowrap leading-tight">
                  Conversation Mode
                </span>
                <span className="text-[9px] font-mono text-zinc-400">
                  {isContinuousMode ? 'Continuous (Never goes off)' : 'Continuous: OFF'}
                </span>
              </div>
            </div>

            {/* Simulated Toggle Switch UI */}
            <div
              className={`w-11 h-6 rounded-full p-0.5 flex items-center transition-colors flex-shrink-0 ${
                isContinuousMode ? 'bg-emerald-500 justify-end' : 'bg-zinc-700 justify-start'
              }`}
            >
              <div className="w-5 h-5 rounded-full bg-white shadow-md transition-transform" />
            </div>
          </button>
        </div>

        {/* Live Audio Equalizer Waveform when in Continuous Mode or Listening */}
        {(isContinuousMode || isListening || isSpeaking) && (
          <div className="p-2 rounded-xl bg-zinc-950 border border-emerald-500/30 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span className="text-[11px] font-mono text-emerald-300">
                {isSpeaking
                  ? '🔊 NeuroCore is responding...'
                  : interimTranscript
                  ? `🎙️ Hearing: "${interimTranscript}"`
                  : '🟢 Continuous stream active • Speak anytime'}
              </span>
            </div>

            {/* Equalizer Bars */}
            <div className="flex items-center gap-1 h-3 flex-shrink-0">
              <span className="w-1 bg-emerald-400 rounded-full animate-[pulse_0.6s_ease-in-out_infinite] h-2" />
              <span className="w-1 bg-emerald-400 rounded-full animate-[pulse_0.4s_ease-in-out_infinite] h-3" />
              <span className="w-1 bg-emerald-400 rounded-full animate-[pulse_0.8s_ease-in-out_infinite] h-1.5" />
              <span className="w-1 bg-emerald-400 rounded-full animate-[pulse_0.5s_ease-in-out_infinite] h-3" />
              <span className="w-1 bg-emerald-400 rounded-full animate-[pulse_0.7s_ease-in-out_infinite] h-2" />
            </div>
          </div>
        )}

        {/* Direct Ask Question Form down here (Voice or Text fallback) */}
        <form onSubmit={handleFormSubmit} className="flex items-center gap-2">
          <input
            type="text"
            id="down-ask-question-input"
            value={downTextInput}
            onChange={(e) => setDownTextInput(e.target.value)}
            placeholder="Ask her a question down here: 'Open Chrome', 'Write code', 'Run backup'..."
            className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50 shadow-inner"
          />
          <button
            type="submit"
            id="down-ask-question-submit-btn"
            disabled={!downTextInput.trim()}
            className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:hover:bg-emerald-600 text-white font-semibold transition-all shadow-md flex-shrink-0"
            title="Send question to NeuroCore"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

        {/* One-Tap Question & Conversation Prompts directly down here */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-[10px] text-zinc-300 scrollbar-thin pt-0.5">
          <span className="text-zinc-500 font-mono flex-shrink-0">Quick Chat:</span>
          <button
            type="button"
            onClick={() => onAskQuestion('How are you feeling today and what are you thinking about?')}
            className="px-2 py-0.5 rounded-md bg-zinc-950 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 hover:border-zinc-700 whitespace-nowrap transition-colors flex items-center gap-1"
          >
            <Sparkles className="w-2.5 h-2.5 text-emerald-400" />
            <span>How are you?</span>
          </button>
          <button
            type="button"
            onClick={() => onAskQuestion('What do you think about autonomous AI systems cooperating with humans?')}
            className="px-2 py-0.5 rounded-md bg-zinc-950 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 hover:border-zinc-700 whitespace-nowrap transition-colors flex items-center gap-1"
          >
            <Activity className="w-2.5 h-2.5 text-teal-400" />
            <span>What do you think?</span>
          </button>
          <button
            type="button"
            onClick={() => onAskQuestion('Open up Chrome and search ZeroMQ docs')}
            className="px-2 py-0.5 rounded-md bg-zinc-950 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 hover:border-zinc-700 whitespace-nowrap transition-colors flex items-center gap-1"
          >
            <Globe className="w-2.5 h-2.5 text-blue-400" />
            <span>Open Chrome</span>
          </button>
          <button
            type="button"
            onClick={() => onAskQuestion('Create a Python web scraper for documentation')}
            className="px-2 py-0.5 rounded-md bg-zinc-950 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 hover:border-zinc-700 whitespace-nowrap transition-colors flex items-center gap-1"
          >
            <Code2 className="w-2.5 h-2.5 text-emerald-400" />
            <span>Write Scraper</span>
          </button>
          <button
            type="button"
            onClick={() => onAskQuestion('run script backup.py')}
            className="px-2 py-0.5 rounded-md bg-zinc-950 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 hover:border-zinc-700 whitespace-nowrap transition-colors flex items-center gap-1"
          >
            <TermIcon className="w-2.5 h-2.5 text-amber-400" />
            <span>Run Backup</span>
          </button>
          <button
            type="button"
            onClick={() => onAskQuestion('Draft an email to the dev team about release')}
            className="px-2 py-0.5 rounded-md bg-zinc-950 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 hover:border-zinc-700 whitespace-nowrap transition-colors flex items-center gap-1"
          >
            <Mail className="w-2.5 h-2.5 text-purple-400" />
            <span>Draft Email</span>
          </button>
        </div>
      </div>
    </div>
  );
};
