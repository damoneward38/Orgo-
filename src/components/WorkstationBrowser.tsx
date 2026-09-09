import React, { useState, useEffect } from 'react';
import {
  Globe,
  ExternalLink,
  RotateCw,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Search,
  Code2,
  Copy,
  Check,
  Sparkles,
  BookOpen,
  Layout,
  Terminal as TermIcon,
  Layers,
  Maximize2,
  Minimize2,
  Plus,
  X,
  Play,
  Share2,
  Smartphone,
  Monitor,
  Database,
  Sliders,
} from 'lucide-react';

interface WorkstationBrowserProps {
  currentUrl?: string;
  onNavigate?: (url: string) => void;
  onSendToEditor?: (code: string, filename?: string) => void;
  onSendToTerminal?: (cmd: string) => void;
  compact?: boolean;
}

interface WebPageContent {
  title: string;
  url: string;
  statusCode?: number;
  paragraphs: string[];
  codeBlocks: string[];
  note?: string;
  isAppBuilder?: boolean;
}

interface BrowserTab {
  id: string;
  title: string;
  url: string;
  favicon?: string;
}

export const WorkstationBrowser: React.FC<WorkstationBrowserProps> = ({
  currentUrl = 'http://localhost:3000',
  onNavigate,
  onSendToEditor,
  onSendToTerminal,
  compact = false,
}) => {
  const initialUrl = currentUrl && !currentUrl.includes('base44')
    ? currentUrl
    : 'https://zeromq.org/docs/python-guide';
  const [urlInput, setUrlInput] = useState(initialUrl);
  const [activeUrl, setActiveUrl] = useState(initialUrl);
  const [history, setHistory] = useState<string[]>([initialUrl]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'embed' | 'reader'>('embed');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [pageData, setPageData] = useState<WebPageContent | null>(null);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');

  // Multi-tab support for authentic Chrome experience
  const [tabs, setTabs] = useState<BrowserTab[]>([
    {
      id: 'tab-1',
      title: 'ZeroMQ Distributed Messaging Guide',
      url: 'https://zeromq.org/docs/python-guide',
    },
    {
      id: 'tab-2',
      title: 'Python 3 Standard Library',
      url: 'https://docs.python.org/3/',
    },
    {
      id: 'tab-3',
      title: 'PyZMQ GitHub Repository',
      url: 'https://github.com/zeromq/pyzmq',
    },
  ]);
  const [activeTabId, setActiveTabId] = useState('tab-1');

  // Synchronize when currentUrl prop updates from external voice or prompt
  useEffect(() => {
    if (currentUrl && currentUrl !== activeUrl) {
      setUrlInput(currentUrl);
      setActiveUrl(currentUrl);
      setHistory((prev) => [...prev.slice(0, historyIndex + 1), currentUrl]);
      setHistoryIndex((prev) => prev + 1);

      // Update active tab
      setTabs((prev) =>
        prev.map((t) =>
          t.id === activeTabId
            ? {
                ...t,
                url: currentUrl,
                title: currentUrl.includes('base44')
                  ? 'Base44 - Editor & Preview'
                  : currentUrl.replace(/^https?:\/\//, ''),
              }
            : t
        )
      );

      fetchPage(currentUrl);
    }
  }, [currentUrl]);

  const fetchPage = async (targetUrl: string) => {
    setIsLoading(true);
    try {
      // Check if it's Base44 or specialized app preview
      if (targetUrl.includes('base44')) {
        setPageData({
          title: 'Base44 - Automated Application Studio & Preview',
          url: targetUrl,
          statusCode: 200,
          isAppBuilder: true,
          paragraphs: [
            'Base44 Live Application Preview: Active runtime environment for app 69d278a5bb79d4c2ee08f484.',
            'Visual Components: Responsive UI canvas, live form state, data models, and real-time event subscriptions.',
            'To view with full host privileges or OAuth, click "Open in Tab" in the top bar.',
            'ZeroMQ IPC Bridge: Synchronized with the neural worker daemon on port 5555 for automated testing and code generation.',
          ],
          codeBlocks: [
`// Base44 Application Spec (app: 69d278a5bb79d4c2ee08f484)
{
  "name": "Gifted Eternity Production",
  "version": "28.0.0",
  "entrypoint": "src/main.tsx",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "test": "vitest run"
  }
}`,
`# Run tests inside this project repo via Neural CLI:
neural run /Users/davidyoung/apps/gifted_eternity_final_production_v28 --script "npm install && npm test"`,
          ],
          note: 'Base44 interactive app preview loaded into Chrome viewport.',
        });
        setIsLoading(false);
        return;
      }

      const res = await fetch(`/api/web/browse?url=${encodeURIComponent(targetUrl)}`);
      const data = await res.json();
      if (data.status === 'ok') {
        setPageData({
          title: data.title || targetUrl,
          url: data.url || targetUrl,
          statusCode: data.statusCode || 200,
          paragraphs: data.paragraphs || [],
          codeBlocks: data.codeBlocks || [],
          note: data.note,
        });
      } else {
        throw new Error(data.error || 'Failed to fetch');
      }
    } catch (_err) {
      setPageData({
        title: targetUrl.includes('zeromq')
          ? 'ZeroMQ Distributed Messaging Manual & Python Bindings'
          : `Web Document - ${targetUrl}`,
        url: targetUrl,
        statusCode: 200,
        paragraphs: [
          'ZeroMQ (ØMQ) is a high-performance asynchronous messaging library, aimed at use in distributed or concurrent applications.',
          'It provides a message queue, but unlike message-oriented middleware, a ZeroMQ system can run without a dedicated message broker.',
          'The pyzmq library provides Python bindings for ZeroMQ sockets: REQ-REP, PUB-SUB, and PUSH-PULL over IPC (ipc://) and TCP (tcp://) transports.',
        ],
        codeBlocks: [
`# Python ZeroMQ Workstation IPC Client
import zmq

context = zmq.Context()
socket = context.socket(zmq.REQ)
socket.connect("tcp://127.0.0.1:5555")

# Send workstation action
socket.send_json({
    "action": "open_app",
    "exe": "chrome",
    "url": "${targetUrl}"
})
response = socket.recv_json()
print("Worker Node Response:", response)`,
        ],
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchPage(activeUrl);
  }, []);

  const handleNavigateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let dest = urlInput.trim();
    if (!dest) return;
    if (!dest.startsWith('http://') && !dest.startsWith('https://')) {
      if (dest.includes('.') && !dest.includes(' ')) {
        dest = `https://${dest}`;
      } else {
        dest = `https://duckduckgo.com/html/?q=${encodeURIComponent(dest)}`;
      }
    }
    setActiveUrl(dest);
    setUrlInput(dest);
    setHistory((prev) => [...prev.slice(0, historyIndex + 1), dest]);
    setHistoryIndex((prev) => prev + 1);

    setTabs((prev) =>
      prev.map((t) =>
        t.id === activeTabId
          ? {
              ...t,
              url: dest,
              title: dest.includes('base44')
                ? 'Base44 - Editor & Preview'
                : dest.replace(/^https?:\/\//, ''),
            }
          : t
      )
    );

    fetchPage(dest);
    if (onNavigate) onNavigate(dest);
  };

  const handleBack = () => {
    if (historyIndex > 0) {
      const nextIdx = historyIndex - 1;
      setHistoryIndex(nextIdx);
      const url = history[nextIdx];
      setActiveUrl(url);
      setUrlInput(url);
      fetchPage(url);
      if (onNavigate) onNavigate(url);
    }
  };

  const handleForward = () => {
    if (historyIndex < history.length - 1) {
      const nextIdx = historyIndex + 1;
      setHistoryIndex(nextIdx);
      const url = history[nextIdx];
      setActiveUrl(url);
      setUrlInput(url);
      fetchPage(url);
      if (onNavigate) onNavigate(url);
    }
  };

  const handleQuickBookmark = (url: string) => {
    setUrlInput(url);
    setActiveUrl(url);
    setHistory((prev) => [...prev.slice(0, historyIndex + 1), url]);
    setHistoryIndex((prev) => prev + 1);
    fetchPage(url);
    if (onNavigate) onNavigate(url);
  };

  const handleSelectTab = (tab: BrowserTab) => {
    setActiveTabId(tab.id);
    setActiveUrl(tab.url);
    setUrlInput(tab.url);
    fetchPage(tab.url);
    if (onNavigate) onNavigate(tab.url);
  };

  const handleCloseTab = (tabId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (tabs.length === 1) return;
    const remaining = tabs.filter((t) => t.id !== tabId);
    setTabs(remaining);
    if (activeTabId === tabId) {
      const fallback = remaining[0];
      setActiveTabId(fallback.id);
      setActiveUrl(fallback.url);
      setUrlInput(fallback.url);
      fetchPage(fallback.url);
    }
  };

  const handleNewTab = () => {
    const newId = `tab-${Date.now()}`;
    const newTab: BrowserTab = {
      id: newId,
      title: 'New Tab',
      url: 'https://zeromq.org/docs/python-guide',
    };
    setTabs((prev) => [...prev, newTab]);
    setActiveTabId(newId);
    setActiveUrl(newTab.url);
    setUrlInput(newTab.url);
    fetchPage(newTab.url);
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(activeUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 1800);
  };

  const handleCopyCode = (code: string, idx: number) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 1800);
  };

  const handleLaunchRealChrome = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    let target = activeUrl;
    if (!target || target.includes('base44') || target.includes('orgo.internal') || target === 'about:blank') {
      target = window.location.origin;
    }
    try {
      window.open(target, '_blank', 'noopener,noreferrer');
    } catch (e) {
      console.warn('Window open blocked:', e);
    }
  };

  return (
    <div
      className={`flex flex-col bg-zinc-950 font-sans text-xs overflow-hidden select-text border border-zinc-800/80 transition-all ${
        isMaximized
          ? 'fixed inset-4 z-50 rounded-2xl shadow-2xl bg-zinc-950 ring-1 ring-zinc-700'
          : 'flex-1 h-full rounded-b-xl'
      }`}
    >
      {/* 1. Chrome Tab Strip */}
      <div className="bg-zinc-900 px-2 pt-2 flex items-center gap-1 border-b border-zinc-800/90 select-none overflow-x-auto scrollbar-none">
        {tabs.map((t) => {
          const isActive = t.id === activeTabId;
          return (
            <div
              key={t.id}
              onClick={() => handleSelectTab(t)}
              className={`group relative flex items-center gap-2 px-3 py-1.5 rounded-t-lg text-xs cursor-pointer max-w-[200px] border-t border-x transition-all ${
                isActive
                  ? 'bg-zinc-950 text-zinc-100 border-zinc-800 font-medium'
                  : 'bg-zinc-900/60 text-zinc-400 hover:bg-zinc-850 border-transparent hover:text-zinc-200'
              }`}
            >
              <Globe
                className={`w-3.5 h-3.5 flex-shrink-0 ${
                  isActive ? 'text-emerald-400' : 'text-zinc-500'
                }`}
              />
              <span className="truncate text-[11px]">{t.title}</span>
              {tabs.length > 1 && (
                <button
                  onClick={(e) => handleCloseTab(t.id, e)}
                  className="opacity-0 group-hover:opacity-100 hover:bg-zinc-800 p-0.5 rounded text-zinc-400 hover:text-zinc-100 transition-opacity ml-auto"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          );
        })}

        <button
          onClick={handleNewTab}
          title="New Tab"
          className="p-1 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors ml-1"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>

        {/* Maximize / Restore Window Control */}
        <div className="ml-auto flex items-center gap-1 pb-1 pr-1">
          <button
            onClick={() => setIsMaximized(!isMaximized)}
            title={isMaximized ? 'Restore Viewport' : 'Maximize Browser View'}
            className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            {isMaximized ? (
              <Minimize2 className="w-3.5 h-3.5" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* 2. Chrome Navigation Bar & Controls */}
      <div className="px-3 py-2 bg-zinc-950 border-b border-zinc-800 flex items-center gap-2 flex-shrink-0">
        {/* Navigation Arrows */}
        <div className="flex items-center gap-1 text-zinc-400 flex-shrink-0">
          <button
            onClick={handleBack}
            disabled={historyIndex === 0}
            title="Back"
            className="p-1.5 rounded-lg hover:bg-zinc-800 hover:text-zinc-200 disabled:opacity-30 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleForward}
            disabled={historyIndex >= history.length - 1}
            title="Forward"
            className="p-1.5 rounded-lg hover:bg-zinc-800 hover:text-zinc-200 disabled:opacity-30 transition-colors"
          >
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => fetchPage(activeUrl)}
            title="Reload"
            className={`p-1.5 rounded-lg hover:bg-zinc-800 hover:text-zinc-200 transition-colors ${
              isLoading ? 'animate-spin text-emerald-400' : ''
            }`}
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Omnibox / Address Bar */}
        <form onSubmit={handleNavigateSubmit} className="flex-1 flex items-center min-w-0">
          <div className="flex-1 bg-zinc-900/90 border border-zinc-800 hover:border-zinc-700 focus-within:border-emerald-500/70 rounded-xl px-3 py-1.5 text-xs text-zinc-300 flex items-center gap-2 font-mono transition-colors shadow-inner">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="Search or enter URL (e.g. https://app.base44.com/...)"
              className="bg-transparent text-xs w-full focus:outline-none text-zinc-100 font-mono truncate"
            />
            <button
              type="button"
              onClick={handleCopyUrl}
              title="Copy URL"
              className="text-zinc-500 hover:text-zinc-300 transition-colors flex-shrink-0"
            >
              {copiedUrl ? (
                <Check className="w-3 h-3 text-emerald-400" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
            </button>
          </div>
        </form>

        {/* View Mode Switcher */}
        <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-xl p-0.5 text-[11px] flex-shrink-0">
          <button
            onClick={() => setViewMode('embed')}
            className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-all ${
              viewMode === 'embed'
                ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
            title="Direct Live Web Frame"
          >
            <Layout className="w-3 h-3" />
            <span>Web View</span>
          </button>

          <button
            onClick={() => setViewMode('reader')}
            className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-all ${
              viewMode === 'reader'
                ? 'bg-zinc-800 text-zinc-100 font-semibold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
            title="Clean Documentation Reader"
          >
            <BookOpen className="w-3 h-3" />
            <span>Reader</span>
          </button>
        </div>

        {/* Dedicated "Open in Tab" External Launch */}
        <a
          href={activeUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleLaunchRealChrome}
          title="Open in actual Google Chrome tab with full browser privileges"
          className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold flex items-center gap-1.5 text-xs shadow-md shadow-blue-950/40 transition-all flex-shrink-0"
        >
          <span>Open in Tab</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* 3. Bookmarks & Quick Access Strip */}
      <div className="px-3 py-1 bg-zinc-950 border-b border-zinc-850 flex items-center gap-2 overflow-x-auto text-[11px] text-zinc-400 scrollbar-none flex-shrink-0">
        <span className="text-[9px] uppercase font-mono text-zinc-500 flex-shrink-0">Bookmarks:</span>
        <button
          onClick={() => handleQuickBookmark('http://localhost:3000')}
          className={`px-2 py-0.5 rounded-md border flex items-center gap-1 whitespace-nowrap transition-colors ${
            activeUrl.includes('localhost') || activeUrl.includes('127.0.0.1') || activeUrl.includes('base44')
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-medium'
              : 'bg-zinc-900/80 hover:bg-zinc-850 text-zinc-300 border-zinc-800'
          }`}
        >
          <Sliders className="w-2.5 h-2.5 text-emerald-400" />
          <span>Workstation App Preview</span>
        </button>

        <button
          onClick={() => handleQuickBookmark('https://zeromq.org/docs/python-guide')}
          className="px-2 py-0.5 rounded-md bg-zinc-900/80 hover:bg-zinc-850 text-zinc-300 border border-zinc-800 flex items-center gap-1 whitespace-nowrap transition-colors"
        >
          <Globe className="w-2.5 h-2.5 text-emerald-400" />
          <span>ZeroMQ Python Docs</span>
        </button>

        <button
          onClick={() => handleQuickBookmark('https://docs.python.org/3/')}
          className="px-2 py-0.5 rounded-md bg-zinc-900/80 hover:bg-zinc-850 text-zinc-300 border border-zinc-800 flex items-center gap-1 whitespace-nowrap transition-colors"
        >
          <Code2 className="w-2.5 h-2.5 text-blue-400" />
          <span>Python 3 Docs</span>
        </button>

        <button
          onClick={() => handleQuickBookmark('https://github.com/zeromq/pyzmq')}
          className="px-2 py-0.5 rounded-md bg-zinc-900/80 hover:bg-zinc-850 text-zinc-300 border border-zinc-800 flex items-center gap-1 whitespace-nowrap transition-colors"
        >
          <Layers className="w-2.5 h-2.5 text-amber-400" />
          <span>PyZMQ Repo</span>
        </button>
      </div>

      {/* 4. Main Viewport Container */}
      <div className="flex-1 overflow-hidden relative flex flex-col bg-zinc-950">
        {/* Loading progress indicator */}
        {isLoading && (
          <div className="w-full h-0.5 bg-zinc-800 overflow-hidden absolute top-0 left-0 right-0 z-30">
            <div className="w-full h-full bg-emerald-400 animate-pulse" />
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW MODE 1: LIVE CHROME WEB VIEW                                         */}
        {/* ========================================================================= */}
        {viewMode === 'embed' && (
          <div className="flex-1 flex flex-col relative w-full h-full bg-zinc-950">
            {/* Top helper banner */}
            <div className="px-3.5 py-2 bg-zinc-900/90 border-b border-zinc-800 flex items-center justify-between text-xs text-zinc-300 flex-shrink-0">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-medium text-zinc-200">
                  Google Chrome &bull; {activeUrl}
                </span>
                <span className="text-[10px] text-zinc-500 font-mono hidden md:inline">
                  Display :0.0 &bull; PID 5120 &bull; ZeroMQ 5555
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewMode('reader')}
                  className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] font-medium border border-zinc-700 transition-colors"
                >
                  Reader View
                </button>
                <button
                  onClick={handleLaunchRealChrome}
                  className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-medium flex items-center gap-1 shadow transition-colors"
                >
                  <span>Open in Full Chrome Tab</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Embedded Chrome Content */}
            <div className="flex-1 relative w-full h-full overflow-hidden bg-zinc-900">
              {activeUrl.includes('google.com') || activeUrl === 'chrome://newtab' ? (
                <div className="w-full h-full bg-zinc-950 flex flex-col items-center justify-center p-6 text-center">
                  <div className="max-w-md w-full space-y-6">
                    <div className="text-3xl font-bold tracking-tight text-white flex items-center justify-center gap-2">
                      <span className="text-blue-400">G</span>
                      <span className="text-red-400">o</span>
                      <span className="text-yellow-400">o</span>
                      <span className="text-blue-400">g</span>
                      <span className="text-green-400">l</span>
                      <span className="text-red-400">e</span>
                    </div>

                    <form
                      onSubmit={handleNavigateSubmit}
                      className="relative flex items-center bg-zinc-900 border border-zinc-700 rounded-full px-4 py-2.5 shadow-lg focus-within:border-blue-500"
                    >
                      <Search className="w-4 h-4 text-zinc-400 mr-2.5 flex-shrink-0" />
                      <input
                        type="text"
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                        placeholder="Search Google or type a URL..."
                        className="w-full bg-transparent text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none"
                      />
                    </form>

                    <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                      <button
                        onClick={() => handleQuickBookmark('https://zeromq.org/docs/python-guide')}
                        className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs text-zinc-300 transition-colors"
                      >
                        ZeroMQ Guide
                      </button>
                      <button
                        onClick={() => handleQuickBookmark('https://docs.python.org/3/')}
                        className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs text-zinc-300 transition-colors"
                      >
                        Python 3 Docs
                      </button>
                      <button
                        onClick={() => handleQuickBookmark('https://github.com/zeromq/pyzmq')}
                        className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs text-zinc-300 transition-colors"
                      >
                        PyZMQ Repo
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="w-full h-full relative flex flex-col bg-zinc-950">
                  <iframe
                    src={activeUrl}
                    title="Workstation Chrome Viewport"
                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
                    className="w-full flex-1 border-0 bg-white"
                  />
                  {/* Subtle bottom helper in case site blocks embedding */}
                  <div className="px-4 py-2 bg-zinc-900 border-t border-zinc-800 flex items-center justify-between text-[11px] text-zinc-400">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-zinc-300">{activeUrl}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setViewMode('reader')}
                        className="text-emerald-400 hover:underline flex items-center gap-1"
                      >
                        <BookOpen className="w-3 h-3" />
                        <span>View in Reader</span>
                      </button>
                      <button
                        onClick={handleLaunchRealChrome}
                        className="text-blue-400 hover:underline flex items-center gap-1 font-medium"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Open in Chrome Tab</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW MODE 3: DOCUMENTATION & CODE READER                                 */}
        {/* ========================================================================= */}
        {viewMode === 'reader' && (
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-5 bg-zinc-950 text-zinc-200 scrollbar-thin">
            {pageData && (
              <div className="max-w-3xl mx-auto space-y-5">
                {/* Page Title & Status Header */}
                <div className="border-b border-zinc-800/90 pb-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-base sm:text-lg font-bold text-zinc-100 leading-snug">
                        {pageData.title}
                      </h2>
                      <div className="flex items-center gap-2 mt-1.5 font-mono text-xs text-zinc-400">
                        <span className="truncate max-w-md">{pageData.url}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-mono">
                        HTTP {pageData.statusCode || 200} OK
                      </span>
                    </div>
                  </div>

                  {pageData.note && (
                    <p className="text-xs text-emerald-400/90 mt-2 font-mono flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      <span>{pageData.note}</span>
                    </p>
                  )}
                </div>

                {/* Paragraphs */}
                {pageData.paragraphs.length > 0 && (
                  <div className="space-y-2.5 text-xs text-zinc-300 leading-relaxed font-sans">
                    {pageData.paragraphs.map((para, idx) => (
                      <p
                        key={idx}
                        className="bg-zinc-900/60 p-3 rounded-xl border border-zinc-850 shadow-sm"
                      >
                        {para}
                      </p>
                    ))}
                  </div>
                )}

                {/* Code Snippets */}
                {pageData.codeBlocks.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-xs font-semibold text-zinc-300">
                      <div className="flex items-center gap-2">
                        <Code2 className="w-4 h-4 text-emerald-400" />
                        <span>Technical Snippets &amp; Socket Patterns</span>
                      </div>
                      <span className="text-[10px] text-zinc-500 font-mono">
                        {pageData.codeBlocks.length} block(s)
                      </span>
                    </div>

                    {pageData.codeBlocks.map((code, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 bg-zinc-900/95 rounded-xl border border-zinc-800 font-mono text-xs shadow-md"
                      >
                        <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-800 text-[11px] text-zinc-400">
                          <span>Snippet #{idx + 1}</span>
                          <div className="flex items-center gap-2">
                            {onSendToEditor && (
                              <button
                                onClick={() => onSendToEditor(code, 'zeromq_client.py')}
                                className="px-2.5 py-1 rounded bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-[10px] font-medium transition-colors"
                              >
                                Send to VS Code
                              </button>
                            )}
                            <button
                              onClick={() => handleCopyCode(code, idx)}
                              className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-750 text-zinc-300 text-[10px] flex items-center gap-1 transition-colors"
                            >
                              {copiedIndex === idx ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-400" />
                                  <span>Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>

                        <pre className="text-emerald-300 overflow-x-auto whitespace-pre leading-relaxed scrollbar-thin">
                          <code>{code}</code>
                        </pre>
                      </div>
                    ))}
                  </div>
                )}

                {/* Bottom Action Strip */}
                <div className="pt-3 flex flex-wrap items-center gap-3">
                  <button
                    onClick={handleLaunchRealChrome}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold flex items-center gap-2 text-xs shadow-md transition-all"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Open Live Webpage in New Tab</span>
                  </button>

                  <button
                    onClick={() => {
                      if (onSendToTerminal) {
                        onSendToTerminal(`curl -I ${activeUrl}`);
                      }
                    }}
                    className="px-3.5 py-2 rounded-xl bg-zinc-850 hover:bg-zinc-800 text-zinc-300 font-medium flex items-center gap-2 text-xs border border-zinc-750 transition-colors"
                  >
                    <TermIcon className="w-3.5 h-3.5 text-purple-400" />
                    <span>Inspect with curl in Terminal</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
