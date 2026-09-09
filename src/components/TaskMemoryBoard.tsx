// src/components/TaskMemoryBoard.tsx
import React, { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Activity,
  Plus,
  Trash2,
  Cpu,
  Brain,
  ShieldCheck,
  Tag,
  FolderCheck,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Sparkles,
  ExternalLink,
  Laptop,
} from 'lucide-react';
import { WorkTask, MemoryItem, DesktopAppId } from '../types';

interface TaskMemoryBoardProps {
  tasks: WorkTask[];
  setTasks: React.Dispatch<React.SetStateAction<WorkTask[]>>;
  memories: MemoryItem[];
  setMemories: React.Dispatch<React.SetStateAction<MemoryItem[]>>;
  compact?: boolean;
}

export const TaskMemoryBoard: React.FC<TaskMemoryBoardProps> = ({
  tasks,
  setTasks,
  memories,
  setMemories,
  compact = false,
}) => {
  const [activeTab, setActiveTab] = useState<'tasks' | 'memory'>('tasks');
  const [filter, setFilter] = useState<'all' | 'in_progress' | 'completed'>('all');
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskApp, setNewTaskApp] = useState<DesktopAppId>('browser');

  const [isAddingMemory, setIsAddingMemory] = useState(false);
  const [newMemKey, setNewMemKey] = useState('');
  const [newMemValue, setNewMemValue] = useState('');

  const filteredTasks = tasks.filter((t) => {
    if (filter === 'all') return true;
    if (filter === 'in_progress') return t.status === 'in_progress' || t.status === 'pending';
    if (filter === 'completed') return t.status === 'completed' || t.status === 'verified';
    return true;
  });

  const verifiedCount = tasks.filter((t) => t.status === 'verified').length;
  const completedCount = tasks.filter((t) => t.status === 'completed').length;
  const inProgressCount = tasks.filter((t) => t.status === 'in_progress' || t.status === 'pending').length;

  const handleToggleTaskStatus = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const nextStatus =
          t.status === 'verified'
            ? 'in_progress'
            : t.status === 'completed'
            ? 'verified'
            : 'completed';
        return {
          ...t,
          status: nextStatus,
          completedAt: nextStatus === 'completed' || nextStatus === 'verified' ? Date.now() : undefined,
        };
      })
    );
  };

  const handleDeleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    const task: WorkTask = {
      id: `task_${Date.now()}`,
      title: newTaskTitle.trim(),
      description: newTaskDesc.trim() || undefined,
      status: 'in_progress',
      category: 'workstation',
      targetApp: newTaskApp,
      createdAt: Date.now(),
      tags: ['Workstation', newTaskApp],
    };
    setTasks((prev) => [task, ...prev]);
    setNewTaskTitle('');
    setNewTaskDesc('');
    setIsAddingTask(false);
  };

  const handleCreateMemory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemKey.trim() || !newMemValue.trim()) return;
    const mem: MemoryItem = {
      id: `mem_${Date.now()}`,
      key: newMemKey.trim(),
      value: newMemValue.trim(),
      category: 'preference',
      updatedAt: Date.now(),
    };
    setMemories((prev) => [mem, ...prev]);
    setNewMemKey('');
    setNewMemValue('');
    setIsAddingMemory(false);
  };

  const handleDeleteMemory = (id: string) => {
    setMemories((prev) => prev.filter((m) => m.id !== id));
  };

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col gap-4">
      {/* Header with Navigation & Counters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-zinc-850 pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Brain className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-zinc-100 font-sans tracking-tight">
                Persistent Memory & Task Ledger
              </h3>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Persistent Across Views
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 font-sans">
              All ongoing and completed tasks are permanently stored. Memory remains steady during split screen and session switches.
            </p>
          </div>
        </div>

        {/* Tab Selector & Counts */}
        <div className="flex items-center gap-2">
          <div className="flex bg-zinc-900 border border-zinc-800 rounded-xl p-1 text-xs font-mono">
            <button
              onClick={() => setActiveTab('tasks')}
              className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'tasks'
                  ? 'bg-emerald-600 text-white shadow-sm font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <FolderCheck className="w-3.5 h-3.5" />
              <span>Tasks ({tasks.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('memory')}
              className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'memory'
                  ? 'bg-emerald-600 text-white shadow-sm font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Memory ({memories.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* TASKS VIEW */}
      {activeTab === 'tasks' && (
        <div className="space-y-3">
          {/* Sub-bar: Filters & Add Task */}
          <div className="flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5 font-mono text-[11px]">
              <button
                onClick={() => setFilter('all')}
                className={`px-2.5 py-1 rounded-lg border transition-all ${
                  filter === 'all'
                    ? 'bg-zinc-800 border-zinc-700 text-zinc-100 font-bold'
                    : 'bg-zinc-900/50 border-zinc-800/80 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                All ({tasks.length})
              </button>
              <button
                onClick={() => setFilter('in_progress')}
                className={`px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1 ${
                  filter === 'in_progress'
                    ? 'bg-amber-950/60 border-amber-500/50 text-amber-300 font-bold'
                    : 'bg-zinc-900/50 border-zinc-800/80 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Activity className="w-3 h-3 text-amber-400 animate-pulse" />
                <span>Active ({inProgressCount})</span>
              </button>
              <button
                onClick={() => setFilter('completed')}
                className={`px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1 ${
                  filter === 'completed'
                    ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300 font-bold'
                    : 'bg-zinc-900/50 border-zinc-800/80 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>Done/Verified ({completedCount + verifiedCount})</span>
              </button>
            </div>

            <button
              onClick={() => setIsAddingTask(!isAddingTask)}
              className="px-2.5 py-1 rounded-lg bg-zinc-850 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 flex items-center gap-1 font-mono text-[11px] transition-all"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isAddingTask ? 'Cancel' : 'New Task'}</span>
            </button>
          </div>

          {/* New Task Inline Form */}
          {isAddingTask && (
            <form
              onSubmit={handleCreateTask}
              className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl space-y-2.5 text-xs font-sans"
            >
              <div className="font-semibold text-zinc-200 text-xs">Add Workstation Task</div>
              <input
                type="text"
                placeholder="Task title (e.g. 'Scrape Python docs and parse API signatures')..."
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50"
              />
              <textarea
                placeholder="Optional description or acceptance criteria..."
                value={newTaskDesc}
                onChange={(e) => setNewTaskDesc(e.target.value)}
                rows={2}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50"
              />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-zinc-400 text-[11px] font-mono">
                  <span>Target App:</span>
                  <select
                    value={newTaskApp}
                    onChange={(e) => setNewTaskApp(e.target.value as DesktopAppId)}
                    className="bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-zinc-200"
                  >
                    <option value="browser">Google Chrome</option>
                    <option value="vscode">VS Code</option>
                    <option value="terminal">Bash Terminal</option>
                    <option value="mailspring">Mailspring</option>
                    <option value="files">File Explorer</option>
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={!newTaskTitle.trim()}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold disabled:opacity-40 transition-all font-mono text-[11px]"
                >
                  Save to Task Ledger
                </button>
              </div>
            </form>
          )}

          {/* Task List Items */}
          <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
            {filteredTasks.length === 0 ? (
              <div className="p-6 text-center text-zinc-500 text-xs font-mono border border-dashed border-zinc-850 rounded-xl">
                No tasks matching filter. Everything is clean and synchronized.
              </div>
            ) : (
              filteredTasks.map((task) => {
                const isVerified = task.status === 'verified';
                const isCompleted = task.status === 'completed';
                const isInProgress = task.status === 'in_progress';

                return (
                  <div
                    key={task.id}
                    className={`p-3 rounded-xl border transition-all text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isVerified
                        ? 'bg-emerald-950/20 border-emerald-500/30'
                        : isCompleted
                        ? 'bg-zinc-900/60 border-zinc-800'
                        : 'bg-zinc-900/90 border-amber-500/30'
                    }`}
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center flex-wrap gap-2">
                        {/* Status Toggle Button */}
                        <button
                          onClick={() => handleToggleTaskStatus(task.id)}
                          title="Click to toggle task status"
                          className="flex items-center gap-1.5 focus:outline-none group"
                        >
                          {isVerified ? (
                            <span className="flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 group-hover:bg-emerald-500/30">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Verified</span>
                            </span>
                          ) : isCompleted ? (
                            <span className="flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700 group-hover:bg-zinc-700">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Completed</span>
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 group-hover:bg-amber-500/30">
                              <Activity className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                              <span>In Progress</span>
                            </span>
                          )}
                        </button>

                        <span className="font-medium text-zinc-100 font-sans break-words">
                          {task.title}
                        </span>

                        {task.intent && (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            Intent: {task.intent}
                          </span>
                        )}

                        {task.targetApp && (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                            App: {task.targetApp}
                          </span>
                        )}
                      </div>

                      {task.description && (
                        <p className="text-[11px] text-zinc-400 leading-snug pl-0.5">
                          {task.description}
                        </p>
                      )}

                      {task.verificationDetails && (
                        <div className="flex items-center gap-1 text-[10px] font-mono text-emerald-400/90 pl-0.5">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>{task.verificationDetails}</span>
                        </div>
                      )}
                    </div>

                    {/* Metadata & Actions */}
                    <div className="flex items-center gap-2.5 sm:self-center flex-shrink-0">
                      <div className="text-[10px] font-mono text-zinc-500 text-right">
                        {new Date(task.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="text-zinc-500 hover:text-red-400 p-1 rounded transition-colors"
                        title="Delete task"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* MEMORY VIEW */}
      {activeTab === 'memory' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2 text-xs">
            <p className="text-[11px] text-zinc-400 font-sans">
              Autonomous memory matrix. Facts, context, and environment keys her brain actively references across conversations and split-screen actions.
            </p>
            <button
              onClick={() => setIsAddingMemory(!isAddingMemory)}
              className="px-2.5 py-1 rounded-lg bg-zinc-850 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 flex items-center gap-1 font-mono text-[11px] transition-all flex-shrink-0"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isAddingMemory ? 'Cancel' : 'Add Memory'}</span>
            </button>
          </div>

          {/* New Memory Form */}
          {isAddingMemory && (
            <form
              onSubmit={handleCreateMemory}
              className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl space-y-2 text-xs font-sans"
            >
              <div className="font-semibold text-zinc-200 text-xs">Store Persistent Memory Item</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Memory Key (e.g. 'preferred_terminal')..."
                  value={newMemKey}
                  onChange={(e) => setNewMemKey(e.target.value)}
                  className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50"
                />
                <input
                  type="text"
                  placeholder="Value / Context..."
                  value={newMemValue}
                  onChange={(e) => setNewMemValue(e.target.value)}
                  className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50"
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!newMemKey.trim() || !newMemValue.trim()}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold disabled:opacity-40 transition-all font-mono text-[11px]"
                >
                  Save Fact to Memory
                </button>
              </div>
            </form>
          )}

          {/* Memory List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-[360px] overflow-y-auto pr-1">
            {memories.map((mem) => (
              <div
                key={mem.id}
                className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-start justify-between gap-2.5 text-xs font-sans"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[10px] uppercase px-1.5 py-0.5 rounded bg-zinc-800 text-emerald-400 border border-zinc-700">
                      {mem.category}
                    </span>
                    <span className="font-bold text-zinc-200">{mem.key}</span>
                  </div>
                  <p className="text-zinc-300 text-[11px] leading-relaxed font-mono">
                    {mem.value}
                  </p>
                  <div className="text-[10px] font-mono text-zinc-500">
                    Updated {new Date(mem.updatedAt).toLocaleDateString()}
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteMemory(mem.id)}
                  className="text-zinc-500 hover:text-red-400 p-1 rounded transition-colors"
                  title="Remove memory item"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
