import React from 'react';
import { Cpu, Terminal, Network, Code2, Volume2, VolumeX, Layers, Bot, Database, LogIn, LogOut, User as UserIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

export type AppTab = 'neurocore' | 'splitscreen' | 'console' | 'patterns' | 'architecture' | 'code';

interface HeaderProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  workerIp: string;
  workerPort: number;
  isAudioEnabled: boolean;
  setIsAudioEnabled: (enabled: boolean) => void;
  workerConnected: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  workerIp,
  workerPort,
  isAudioEnabled,
  setIsAudioEnabled,
  workerConnected,
}) => {
  const { user, signInWithGoogle, signOut, hasCloudSql } = useAuth();

  return (
    <header className="border-b border-zinc-800 bg-zinc-950/90 backdrop-blur sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand & Identity */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-sm shadow-emerald-500/10">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-zinc-100 tracking-tight text-base sm:text-lg">Orgo</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-mono border border-emerald-500/20">
                v4.0 Core
              </span>
            </div>
            <p className="text-xs text-zinc-400 hidden sm:block">
              Neural Core Decision Engine &amp; ZeroMQ Remote Worker
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 bg-zinc-900/80 p-1 rounded-xl border border-zinc-800/80 text-xs sm:text-sm font-medium">
          <button
            id="tab-neurocore-btn"
            onClick={() => setActiveTab('neurocore')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'neurocore'
                ? 'bg-emerald-600 text-white shadow-sm font-semibold'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            <Bot className="w-4 h-4" />
            <span>Talk &amp; Results</span>
          </button>

          <button
            id="tab-splitscreen-btn"
            onClick={() => setActiveTab('splitscreen')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'splitscreen'
                ? 'bg-emerald-600 text-white shadow-sm font-semibold'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Split Screen</span>
          </button>

          <button
            id="tab-console-btn"
            onClick={() => setActiveTab('console')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'console'
                ? 'bg-zinc-800 text-zinc-100 shadow-sm font-semibold'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span className="hidden sm:inline">Brain &amp; Worker</span>
          </button>

          <button
            id="tab-patterns-btn"
            onClick={() => setActiveTab('patterns')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'patterns'
                ? 'bg-zinc-800 text-zinc-100 shadow-sm font-semibold'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>Neural Registry</span>
          </button>

          <button
            id="tab-arch-btn"
            onClick={() => setActiveTab('architecture')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'architecture'
                ? 'bg-zinc-800 text-zinc-100 shadow-sm font-semibold'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            <Network className="w-4 h-4" />
            <span className="hidden md:inline">Architecture</span>
          </button>

          <button
            id="tab-code-btn"
            onClick={() => setActiveTab('code')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'code'
                ? 'bg-zinc-800 text-zinc-100 shadow-sm font-semibold'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span>Python Source</span>
          </button>
        </nav>

        {/* Right Tools & Worker Connection Status */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Cloud SQL Database Status */}
          <div
            id="cloud-sql-status-badge"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-mono"
            title="Cloud SQL PostgreSQL Instance active (Region: us-east1)"
          >
            <Database className="w-3.5 h-3.5 text-cyan-400" />
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-zinc-300 hidden md:inline">SQL: us-east1</span>
          </div>

          <button
            id="toggle-tts-audio-btn"
            onClick={() => setIsAudioEnabled(!isAudioEnabled)}
            title={isAudioEnabled ? 'Voice TTS speech synthesis active (Click to mute)' : 'Voice TTS muted (Click to enable)'}
            className={`p-2 rounded-lg border transition-all text-xs flex items-center gap-1.5 ${
              isAudioEnabled
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {isAudioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden lg:inline">{isAudioEnabled ? 'TTS ON' : 'Muted'}</span>
          </button>

          {/* User Sign In / Profile */}
          {user ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-xs">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-5 h-5 rounded-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <UserIcon className="w-4 h-4 text-zinc-400" />
                )}
                <span className="text-zinc-200 hidden sm:inline max-w-[90px] truncate">
                  {user.displayName || user.email?.split('@')[0]}
                </span>
                <button
                  id="user-signout-btn"
                  onClick={signOut}
                  title="Sign Out"
                  className="text-zinc-500 hover:text-rose-400 transition-colors ml-1"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <button
              id="google-signin-btn"
              onClick={signInWithGoogle}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-400 text-xs font-medium transition-colors"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}

          <div
            id="worker-socket-status"
            className="hidden xl:flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-mono"
            title={`Socket connected to tcp://${workerIp}:${workerPort}`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                workerConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}
            />
            <span className="text-zinc-300">tcp://{workerIp}:{workerPort}</span>
          </div>
        </div>
      </div>
    </header>
  );
};
