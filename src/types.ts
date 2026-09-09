export interface CommandPattern {
  id: string;
  pattern: string;
  action: string;
  argsTemplate: Record<string, string>;
  description?: string;
  examplePrompt?: string;
}

export interface DecisionResult {
  action: string;
  args: Record<string, any>;
  matchedPattern?: string;
  patternId?: string;
  groups?: string[];
  rawPrompt: string;
  timestamp: number;
}

export interface WorkerResponse {
  status: 'ok' | 'error';
  msg?: string;
  output?: string;
  details?: Record<string, any>;
  executionTimeMs?: number;
}

export interface ActivityLogItem {
  id: string;
  timestamp: number;
  prompt: string;
  decision: DecisionResult;
  response?: WorkerResponse;
  status: 'executing' | 'success' | 'error' | 'timeout';
  workerIp: string;
  port: number;
}

export interface VirtualProcess {
  id: string;
  name: string;
  type: 'app' | 'script' | 'voice' | 'system';
  target: string;
  startedAt: number;
  status: 'running' | 'completed' | 'terminated';
  outputPreview?: string;
}

export interface VirtualScript {
  filename: string;
  description: string;
  code: string;
  simulatedOutput: string;
}

export interface WorkArtifact {
  id: string;
  title: string;
  type: 'code' | 'report' | 'email' | 'data' | 'system';
  filename?: string;
  language?: string;
  content: string;
  summary: string;
  timestamp: number;
  author: string;
  status: 'completed' | 'in_progress';
  tags: string[];
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'neurocore';
  text: string;
  timestamp: number;
  decision?: DecisionResult;
  workerResponse?: WorkerResponse;
  presentedArtifactId?: string;
  actionSummary?: string;
  taskId?: string;
}

export interface WorkTask {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'verified';
  category: 'workstation' | 'automation' | 'script' | 'research' | 'system';
  targetApp?: DesktopAppId;
  createdAt: number;
  completedAt?: number;
  tags?: string[];
  intent?: string;
  verificationDetails?: string;
}

export interface MemoryItem {
  id: string;
  key: string;
  value: string;
  category: 'preference' | 'environment' | 'workflow' | 'tool';
  updatedAt: number;
}

export type DesktopAppId = 'browser' | 'vscode' | 'terminal' | 'mailspring' | 'files' | 'app_builder';

export interface DesktopWindowState {
  appId: DesktopAppId;
  title: string;
  isOpen: boolean;
  isMinimized: boolean;
  zIndex: number;
  activeTab?: string;
  currentUrl?: string;
  editorFile?: string;
  editorContent?: string;
  terminalLines?: string[];
  emailDraft?: { to: string; subject: string; body: string; sent: boolean };
  activeActionDescription?: string;
}
