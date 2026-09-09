import React, { useState } from 'react';
import {
  Code2,
  Copy,
  Check,
  Download,
  FileCode,
  FolderDown,
  Terminal,
  FileText,
  ExternalLink,
} from 'lucide-react';
import {
  PYTHON_NEURAL_CORE,
  PYTHON_BRAIN,
  PYTHON_WORKER,
  PYTHON_REQUIREMENTS,
  PYTHON_README,
} from '../data/defaultData';

export const CodeViewer: React.FC = () => {
  const [activeFile, setActiveFile] = useState<'neural_core' | 'brain' | 'worker' | 'requirements' | 'readme'>(
    'neural_core'
  );
  const [copied, setCopied] = useState<boolean>(false);

  const fileMap = {
    neural_core: {
      filename: 'neural_core.py',
      label: 'neural_core.py',
      language: 'python',
      content: PYTHON_NEURAL_CORE,
      description: 'The v4.0 decision engine and CommandRegistry dataclass',
    },
    brain: {
      filename: 'brain.py',
      label: 'brain.py',
      language: 'python',
      content: PYTHON_BRAIN,
      description: 'Client-side GUI (Tkinter) and ZeroMQ REQ communicator',
    },
    worker: {
      filename: 'worker.py',
      label: 'worker.py',
      language: 'python',
      content: PYTHON_WORKER,
      description: 'Remote daemon (ZeroMQ REP) and multi-OS subprocess executor',
    },
    requirements: {
      filename: 'requirements.txt',
      label: 'requirements.txt',
      language: 'text',
      content: PYTHON_REQUIREMENTS,
      description: 'Python dependency specifications (pyzmq)',
    },
    readme: {
      filename: 'README.md',
      label: 'README.md',
      language: 'markdown',
      content: PYTHON_README,
      description: 'Quick start instructions, command examples, and network guide',
    },
  };

  const currentFile = fileMap[activeFile];

  const handleCopy = () => {
    navigator.clipboard.writeText(currentFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadFile = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadCurrent = () => {
    downloadFile(currentFile.filename, currentFile.content);
  };

  const handleDownloadAll = () => {
    Object.values(fileMap).forEach((f, idx) => {
      setTimeout(() => {
        downloadFile(f.filename, f.content);
      }, idx * 250);
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
            <span>Finished Python Production Codebase</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400 font-mono border border-indigo-500/20">
              Complete &amp; Verified
            </span>
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Fully implemented source code for the entire Orgo ecosystem. Ready to run locally or on remote servers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="download-all-code-btn"
            onClick={handleDownloadAll}
            className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm shadow-emerald-500/20"
          >
            <FolderDown className="w-4 h-4" />
            <span>Download All (.py)</span>
          </button>
        </div>
      </div>

      {/* Code Editor & Viewer Box */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl overflow-hidden shadow-lg flex flex-col">
        {/* File Tabs */}
        <div className="bg-zinc-950 border-b border-zinc-800 px-4 pt-2 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1 overflow-x-auto">
            {(Object.keys(fileMap) as (keyof typeof fileMap)[]).map((key) => {
              const file = fileMap[key];
              const isCurrent = activeFile === key;
              return (
                <button
                  key={key}
                  onClick={() => setActiveFile(key)}
                  className={`flex items-center gap-2 px-3.5 py-2 text-xs font-mono font-medium rounded-t-xl border-t border-x transition-all ${
                    isCurrent
                      ? 'bg-zinc-900 text-emerald-400 border-zinc-800 border-b-transparent shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200 border-transparent hover:bg-zinc-900/50'
                  }`}
                >
                  <FileCode className="w-3.5 h-3.5" />
                  <span>{file.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 pb-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition-colors"
              title="Copy current file contents"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy Code'}</span>
            </button>

            <button
              onClick={handleDownloadCurrent}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition-colors"
              title={`Download ${currentFile.filename}`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </button>
          </div>
        </div>

        {/* File Description Header */}
        <div className="px-5 py-2.5 bg-zinc-900/50 border-b border-zinc-800/80 flex items-center justify-between text-xs">
          <span className="text-zinc-400">{currentFile.description}</span>
          <span className="text-zinc-500 font-mono text-[11px]">
            {currentFile.content.split('\n').length} lines
          </span>
        </div>

        {/* Code Content Container */}
        <div className="p-5 bg-zinc-950/90 overflow-x-auto">
          <pre className="font-mono text-xs text-zinc-200 leading-relaxed whitespace-pre font-light selection:bg-indigo-500/30 selection:text-indigo-200">
            {currentFile.content}
          </pre>
        </div>
      </div>

      {/* Terminal Launch Instructions */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 space-y-3">
        <div className="flex items-center gap-2 text-zinc-100 font-semibold text-sm">
          <Terminal className="w-4 h-4 text-emerald-400" />
          <span>Local Deployment Instructions</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
          <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800 space-y-2">
            <div className="text-emerald-400 font-bold">1. Remote / Target Machine (Worker)</div>
            <p className="text-zinc-400 text-[11px]">
              Start the worker daemon listening on port 5555:
            </p>
            <div className="bg-zinc-900 p-2 rounded text-zinc-200 select-all">
              pip install pyzmq<br />
              python worker.py 5555
            </div>
          </div>

          <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800 space-y-2">
            <div className="text-indigo-400 font-bold">2. Local Controller Machine (Brain)</div>
            <p className="text-zinc-400 text-[11px]">
              Launch the Tkinter GUI and connect to the worker:
            </p>
            <div className="bg-zinc-900 p-2 rounded text-zinc-200 select-all">
              python brain.py --worker-ip &lt;WORKER_IP&gt; --port 5555
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
