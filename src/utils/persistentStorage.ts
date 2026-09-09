// src/utils/persistentStorage.ts
import { ChatMessage, WorkTask, MemoryItem, WorkArtifact } from '../types';
import {
  INITIAL_CHAT_MESSAGES,
  INITIAL_TASKS,
  INITIAL_MEMORIES,
  INITIAL_ARTIFACTS,
} from '../data/defaultData';

const CHAT_KEY = 'neurocore_chat_messages_v2';
const TASKS_KEY = 'neurocore_tasks_v2';
const MEMORIES_KEY = 'neurocore_memories_v2';
const ARTIFACTS_KEY = 'neurocore_artifacts_v2';

export function loadChatMessages(): ChatMessage[] {
  if (typeof window === 'undefined') return INITIAL_CHAT_MESSAGES;
  try {
    const raw = localStorage.getItem(CHAT_KEY);
    if (!raw) return INITIAL_CHAT_MESSAGES;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch (err) {
    console.warn('[PersistentStorage] Failed to parse chat messages:', err);
  }
  return INITIAL_CHAT_MESSAGES;
}

export function saveChatMessages(messages: ChatMessage[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CHAT_KEY, JSON.stringify(messages));
  } catch (err) {
    console.warn('[PersistentStorage] Failed to save chat messages:', err);
  }
}

export function loadTasks(): WorkTask[] {
  if (typeof window === 'undefined') return INITIAL_TASKS;
  try {
    const raw = localStorage.getItem(TASKS_KEY);
    if (!raw) return INITIAL_TASKS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch (err) {
    console.warn('[PersistentStorage] Failed to parse tasks:', err);
  }
  return INITIAL_TASKS;
}

export function saveTasks(tasks: WorkTask[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
  } catch (err) {
    console.warn('[PersistentStorage] Failed to save tasks:', err);
  }
}

export function loadMemories(): MemoryItem[] {
  if (typeof window === 'undefined') return INITIAL_MEMORIES;
  try {
    const raw = localStorage.getItem(MEMORIES_KEY);
    if (!raw) return INITIAL_MEMORIES;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch (err) {
    console.warn('[PersistentStorage] Failed to parse memories:', err);
  }
  return INITIAL_MEMORIES;
}

export function saveMemories(memories: MemoryItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(MEMORIES_KEY, JSON.stringify(memories));
  } catch (err) {
    console.warn('[PersistentStorage] Failed to save memories:', err);
  }
}

export function loadArtifacts(): WorkArtifact[] {
  if (typeof window === 'undefined') return INITIAL_ARTIFACTS;
  try {
    const raw = localStorage.getItem(ARTIFACTS_KEY);
    if (!raw) return INITIAL_ARTIFACTS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch (err) {
    console.warn('[PersistentStorage] Failed to parse artifacts:', err);
  }
  return INITIAL_ARTIFACTS;
}

export function saveArtifacts(artifacts: WorkArtifact[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ARTIFACTS_KEY, JSON.stringify(artifacts));
  } catch (err) {
    console.warn('[PersistentStorage] Failed to save artifacts:', err);
  }
}

export function clearAllMemory(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(CHAT_KEY);
  localStorage.removeItem(TASKS_KEY);
  localStorage.removeItem(MEMORIES_KEY);
  localStorage.removeItem(ARTIFACTS_KEY);
}
