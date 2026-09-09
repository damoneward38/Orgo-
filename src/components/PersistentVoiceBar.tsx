// src/components/PersistentVoiceBar.tsx
import React, { useState } from 'react';
import {
  Mic,
  MicOff,
  Radio,
  Volume2,
  VolumeX,
  Sparkles,
  Send,
  Layers,
  Bot,
  Monitor,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useVoice } from '../context/VoiceContext';

interface PersistentVoiceBarProps {
  isAudioEnabled: boolean;
  setIsAudioEnabled: (val: boolean) => void;
  activeTab: string;
  setActiveTab: (tab: any) => void;
}

export const PersistentVoiceBar: React.FC<PersistentVoiceBarProps> = ({
  isAudioEnabled,
  setIsAudioEnabled,
  activeTab,
  setActiveTab,
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
    isComputerOpen,
    setIsComputerOpen,
  } = useVoice();

  const [inputVal, setInputVal] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputVal.trim()) {
      dispatchInstruction(inputVal.trim());
      setInputVal('');
    }
  };

  return (
    <div
      id="persistent-voice-station"
      className="fixed bottom-3 right-3 sm:right-6 z-50 transition-all duration-300 max-w-xl w-[calc(100vw-1.5rem)] sm:w-auto"
    >
      <div
        className={`rounded-2xl border shadow-2xl backdrop-blur-xl transition-all ${
          isContinuousMode && isListening
            ? 'bg-zinc-950/95 border-emerald-500/50 shadow-[0_0_35px_rgba(16,185,129,0.25)] ring-1 ring-emerald-500/30'
            : isSpeaking
            ? 'bg-zinc-950/95 border-blue-500/50 shadow-[0_0_35px_rgba(59,130,246,0.25)] ring-1 ring-blue-500/30'
            : 'bg-zinc-950/95 border-zinc-800 shadow-xl'
        }`}
      >
        {/* Minimized Pill View */}
        {isMinimized ? (
          <div className="px-3.5 py-2 flex items-center gap-3">
            <button
              onClick={toggleMic}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                isListening
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/40 animate-pulse'
                  : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
              title={isListening ? 'Microphone Listening - Click to Mute' : 'Microphone Muted - Click to Listen'}
            >
              {isListening ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
            </button>

            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setIsMinimized(false)}>
              <span className="text-xs font-semibold text-zinc-200">Continuous Voice Station</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
                {isListening ? 'Hearing' : 'Standby'}
              </span>
            </div>

            <button
              onClick={() => setIsMinimized(false)}
              className="p-1 rounded text-zinc-400 hover:text-zinc-200"
              title="Expand Voice Station"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
          </div>
        ) : (
          /* Full Expanded Voice Console Bar */
          <div className="p-3 sm:p-3.5 flex flex-col gap-2.5">
            {/* Top Row Status & Controls */}
            <div className="flex items-center justify-between gap-2 border-b border-zinc-800/80 pb-2">
              <div className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                    isListening
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-zinc-800 text-zinc-400'
                  }`}
                >
                  <Radio className={`w-4 h-4 ${isListening ? 'animate-pulse' : ''}`} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-zinc-200">
                      Persistent Voice &amp; Ear
                    </span>
                    <span
                      className={`text-[9px] px-2 py-0.2 rounded-full font-mono uppercase font-semibold ${
                        isListening
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      {isContinuousMode ? 'Always-On Mic' : 'Push-to-Talk'}
                    </span>
                  </div>
                  <p className="text-[10px] text-zinc-400">
                    Active on all pages &bull; Talk anytime without conversation cut-off
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {/* Audio TTS toggle */}
                <button
                  onClick={() => setIsAudioEnabled(!isAudioEnabled)}
                  className={`p-1.5 rounded-lg border text-xs transition-colors ${
                    isAudioEnabled
                      ? 'bg-zinc-900 border-zinc-700 text-emerald-400'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-500'
                  }`}
                  title={isAudioEnabled ? 'TTS Audio Enabled' : 'TTS Audio Muted'}
                >
                  {isAudioEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                </button>

                {/* View Switcher Shortcut */}
                {activeTab !== 'splitscreen' ? (
                  <button
                    onClick={() => setActiveTab('splitscreen')}
                    className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-300 text-xs flex items-center gap-1"
                    title="Open Dual Window Split Screen"
                  >
                    <Layers className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="hidden sm:inline text-[11px]">Split Screen</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setActiveTab('neurocore')}
                    className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-300 text-xs flex items-center gap-1"
                    title="Open Stage View"
                  >
                    <Bot className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="hidden sm:inline text-[11px]">Stage View</span>
                  </button>
                )}

                <button
                  onClick={() => setIsMinimized(true)}
                  className="p-1 rounded text-zinc-500 hover:text-zinc-300"
                  title="Minimize bar"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Middle: Live Voice Waveform / Hearing Banner */}
            <div className="flex items-center gap-3">
              {/* Main Glowing Mic Button */}
              <button
                type="button"
                id="global-persistent-mic-btn"
                onClick={toggleMic}
                className={`relative px-4 py-2.5 rounded-xl font-medium text-xs flex items-center gap-2.5 transition-all shadow-lg select-none ${
                  isListening
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/40 ring-2 ring-emerald-400/50'
                    : 'bg-zinc-900 hover:bg-zinc-850 text-zinc-300 border border-zinc-800'
                }`}
              >
                {isListening ? (
                  <>
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75" />
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-white" />
                    </span>
                    <Mic className="w-4 h-4" />
                    <span className="font-semibold">Hearing You...</span>
                  </>
                ) : (
                  <>
                    <MicOff className="w-4 h-4 text-zinc-400" />
                    <span>Unmute Mic</span>
                  </>
                )}
              </button>

              {/* Status or Interim transcript pill */}
              <div className="flex-1 bg-zinc-900/80 border border-zinc-800/80 rounded-xl px-3 py-2 text-xs overflow-hidden flex items-center">
                {interimTranscript ? (
                  <div className="flex items-center gap-2 text-emerald-300 font-mono text-[11px] truncate">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
                    <span className="italic truncate">"{interimTranscript}"</span>
                  </div>
                ) : isSpeaking ? (
                  <div className="flex items-center gap-2 text-blue-400 font-mono text-[11px]">
                    <Volume2 className="w-3.5 h-3.5 animate-pulse" />
                    <span>She is speaking back...</span>
                  </div>
                ) : isThinking ? (
                  <div className="flex items-center gap-2 text-amber-400 font-mono text-[11px]">
                    <Sparkles className="w-3.5 h-3.5 animate-spin" />
                    <span>Executing workstation action...</span>
                  </div>
                ) : isListening ? (
                  <div className="text-zinc-400 text-[11px] flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    <span>Listening continuously &bull; Say "Open computer" or "Write code"...</span>
                  </div>
                ) : (
                  <div className="text-zinc-500 text-[11px]">
                    Microphone is off &bull; Click Unmute Mic to speak continuously
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Row: Quick Text Input & Quick Computer Launcher */}
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
              <input
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder="Or type here: 'Open computer', 'Open Chrome', 'Run script'..."
                className="flex-1 bg-zinc-900 border border-zinc-800/90 rounded-xl px-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50"
              />
              <button
                type="submit"
                disabled={!inputVal.trim()}
                className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white transition-all shadow-md shadow-emerald-900/30"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
