import React, { useState, useEffect } from 'react';
import { Header, AppTab } from './components/Header';
import { NeuroCoreStagePage } from './components/NeuroCoreStagePage';
import { DoubleWindowSplitScreen } from './components/DoubleWindowSplitScreen';
import { BrainConsole } from './components/BrainConsole';
import { NeuralRegistryEditor } from './components/NeuralRegistryEditor';
import { ArchitectureFlow } from './components/ArchitectureFlow';
import { CodeViewer } from './components/CodeViewer';
import { DEFAULT_PATTERNS, VIRTUAL_SCRIPTS } from './data/defaultData';
import { CommandPattern, VirtualScript, WorkArtifact, ChatMessage, WorkTask, MemoryItem } from './types';
import {
  loadChatMessages,
  saveChatMessages,
  loadTasks,
  saveTasks,
  loadMemories,
  saveMemories,
  loadArtifacts,
  saveArtifacts,
} from './utils/persistentStorage';
import { VoiceProvider } from './context/VoiceContext';

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('splitscreen');
  const [patterns, setPatterns] = useState<CommandPattern[]>(DEFAULT_PATTERNS);
  const [scripts, setScripts] = useState<VirtualScript[]>(VIRTUAL_SCRIPTS);
  const [artifacts, setArtifacts] = useState<WorkArtifact[]>(loadArtifacts);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(loadChatMessages);
  const [tasks, setTasks] = useState<WorkTask[]>(loadTasks);
  const [memories, setMemories] = useState<MemoryItem[]>(loadMemories);
  const [workerIp, setWorkerIp] = useState<string>('127.0.0.1');
  const [workerPort, setWorkerPort] = useState<number>(5555);
  const [isAudioEnabled, setIsAudioEnabled] = useState<boolean>(true);
  const [platform, setPlatform] = useState<'Linux' | 'Darwin' | 'Windows'>('Linux');

  // Automatically save to local persistent storage on every change
  useEffect(() => {
    saveChatMessages(chatMessages);
  }, [chatMessages]);

  useEffect(() => {
    saveTasks(tasks);
  }, [tasks]);

  useEffect(() => {
    saveMemories(memories);
  }, [memories]);

  useEffect(() => {
    saveArtifacts(artifacts);
  }, [artifacts]);

  return (
    <VoiceProvider
      patterns={patterns}
      artifacts={artifacts}
      setArtifacts={setArtifacts}
      chatMessages={chatMessages}
      setChatMessages={setChatMessages}
      tasks={tasks}
      setTasks={setTasks}
      memories={memories}
      setMemories={setMemories}
      isAudioEnabled={isAudioEnabled}
      setIsAudioEnabled={setIsAudioEnabled}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
    >
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
        {/* Header Navigation */}
        <Header
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          workerIp={workerIp}
          workerPort={workerPort}
          isAudioEnabled={isAudioEnabled}
          setIsAudioEnabled={setIsAudioEnabled}
          workerConnected={true}
        />

        {/* Main Content Area */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5 md:p-6">
          {activeTab === 'neurocore' && (
            <NeuroCoreStagePage
              patterns={patterns}
              artifacts={artifacts}
              setArtifacts={setArtifacts}
              chatMessages={chatMessages}
              setChatMessages={setChatMessages}
              tasks={tasks}
              setTasks={setTasks}
              memories={memories}
              setMemories={setMemories}
              isAudioEnabled={isAudioEnabled}
              setIsAudioEnabled={setIsAudioEnabled}
              onExecuteOnWorker={(prompt) => {
                // Switch to console or stage run
              }}
              onSwitchToSplitScreen={() => setActiveTab('splitscreen')}
            />
          )}

          {activeTab === 'splitscreen' && (
            <DoubleWindowSplitScreen
              patterns={patterns}
              artifacts={artifacts}
              setArtifacts={setArtifacts}
              chatMessages={chatMessages}
              setChatMessages={setChatMessages}
              tasks={tasks}
              setTasks={setTasks}
              memories={memories}
              setMemories={setMemories}
              isAudioEnabled={isAudioEnabled}
              setIsAudioEnabled={setIsAudioEnabled}
              onSwitchToStage={() => setActiveTab('neurocore')}
            />
          )}

          {activeTab === 'console' && (
            <BrainConsole
              patterns={patterns}
              scripts={scripts}
              workerIp={workerIp}
              setWorkerIp={setWorkerIp}
              workerPort={workerPort}
              setWorkerPort={setWorkerPort}
              isAudioEnabled={isAudioEnabled}
              platform={platform}
              setPlatform={setPlatform}
            />
          )}

          {activeTab === 'patterns' && (
            <NeuralRegistryEditor
              patterns={patterns}
              setPatterns={setPatterns}
            />
          )}

          {activeTab === 'architecture' && (
            <ArchitectureFlow />
          )}

          {activeTab === 'code' && (
            <CodeViewer />
          )}
        </main>

        {/* Subtle Footer */}
        <footer className="border-t border-zinc-900 bg-zinc-950 py-6 text-center text-xs text-zinc-500">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2 font-mono">
            <div>
              Orgo Neural Core (v4.0) &bull; Distributed Python ZeroMQ Automation Engine
            </div>
            <div className="text-zinc-600">
              REQ/REP socket: <span className="text-zinc-400">tcp://{workerIp}:{workerPort}</span>
            </div>
          </div>
        </footer>
      </div>
    </VoiceProvider>
  );
}
