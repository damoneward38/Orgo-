import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  RefreshCw,
  Sparkles,
  Regex,
  Code2,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Sliders,
} from 'lucide-react';
import { CommandPattern, DecisionResult } from '../types';
import { decideCommand, testAllPrompts } from '../utils/neuralEngine';
import { DEFAULT_PATTERNS } from '../data/defaultData';

interface NeuralRegistryEditorProps {
  patterns: CommandPattern[];
  setPatterns: React.Dispatch<React.SetStateAction<CommandPattern[]>>;
}

export const NeuralRegistryEditor: React.FC<NeuralRegistryEditorProps> = ({
  patterns,
  setPatterns,
}) => {
  const [testPrompt, setTestPrompt] = useState<string>('open browser');
  const [isAddingPattern, setIsAddingPattern] = useState<boolean>(false);

  // New pattern form state
  const [newPattern, setNewPattern] = useState<string>('^calculate (.+)$');
  const [newAction, setNewAction] = useState<string>('calculate_math');
  const [newArgsJson, setNewArgsJson] = useState<string>('{\n  "expression": "$1"\n}');
  const [newDesc, setNewDesc] = useState<string>('Evaluates math expression');
  const [newExample, setNewExample] = useState<string>('calculate 42 * 10');
  const [formError, setFormError] = useState<string | null>(null);

  // Live match result
  const testResult: DecisionResult = React.useMemo(() => {
    return decideCommand(testPrompt, patterns);
  }, [testPrompt, patterns]);

  // Bulk test verification
  const testCases = [
    'open browser',
    'open chrome',
    'open email client',
    'open mail client',
    'run script backup.py',
    'say Good morning team',
    'system status',
    'ping',
    'non-existent task',
  ];

  const bulkResults = React.useMemo(() => {
    return testAllPrompts(testCases, patterns);
  }, [patterns]);

  const handleAddPattern = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validate regex
    try {
      new RegExp(newPattern, 'i');
    } catch (err: any) {
      setFormError(`Invalid Regex syntax: ${err.message}`);
      return;
    }

    // Validate JSON args
    let parsedArgs: Record<string, string> = {};
    try {
      parsedArgs = JSON.parse(newArgsJson);
    } catch {
      setFormError('Invalid JSON format for arguments template.');
      return;
    }

    const created: CommandPattern = {
      id: `pat_custom_${Date.now()}`,
      pattern: newPattern,
      action: newAction.trim(),
      argsTemplate: parsedArgs,
      description: newDesc.trim() || undefined,
      examplePrompt: newExample.trim() || undefined,
    };

    setPatterns((prev) => [...prev, created]);
    setIsAddingPattern(false);
    // Reset form
    setNewPattern('');
    setNewAction('');
    setNewArgsJson('{}');
  };

  const handleDeletePattern = (id: string) => {
    setPatterns((prev) => prev.filter((p) => p.id !== id));
  };

  const handleResetDefaults = () => {
    if (window.confirm('Reset all command patterns back to default neural_core.py patterns?')) {
      setPatterns(DEFAULT_PATTERNS);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Concept Explanation */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold text-zinc-100 text-base">CommandRegistry Rules (neural_core.py)</span>
            <span className="text-xs px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono">
              v4.0 Engine
            </span>
          </div>
          <p className="text-xs text-zinc-400 max-w-2xl leading-relaxed">
            The Neural Core matches natural language prompts using regular expressions with capture groups.
            Matched tokens (e.g. <code className="text-zinc-200 bg-zinc-800 px-1 py-0.5 rounded font-mono">$1</code> or <code className="text-zinc-200 bg-zinc-800 px-1 py-0.5 rounded font-mono">\1</code>) are substituted into the command arguments dictionary and transmitted to the worker.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            onClick={() => setIsAddingPattern(!isAddingPattern)}
            className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-medium text-xs transition-colors shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{isAddingPattern ? 'Close Form' : 'Add Rule'}</span>
          </button>

          <button
            onClick={handleResetDefaults}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium border border-zinc-700/60 transition-colors"
            title="Reset to default patterns"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Live Interactive Pattern Tester */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-zinc-100">Live Decision Engine Tester</h3>
          </div>
          <span className="text-xs text-zinc-500 font-mono">Real-time matching</span>
        </div>

        <div className="space-y-3">
          <div className="relative">
            <input
              type="text"
              value={testPrompt}
              onChange={(e) => setTestPrompt(e.target.value)}
              placeholder="Type any test prompt to test match..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-100 font-mono outline-none focus:border-indigo-500/80 transition-colors"
            />
          </div>

          {/* Result Card */}
          <div
            className={`p-4 rounded-xl border font-mono text-xs transition-all ${
              testResult.action !== 'unknown'
                ? 'bg-emerald-950/20 border-emerald-500/30'
                : 'bg-zinc-950/60 border-zinc-800'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2 border-b border-zinc-800/80">
              <div className="flex items-center gap-2">
                <span className="text-zinc-400">Match Status:</span>
                {testResult.action !== 'unknown' ? (
                  <span className="flex items-center gap-1 text-emerald-400 font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Matched Action: "{testResult.action}"</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-rose-400 font-bold">
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Unknown (No pattern matched)</span>
                  </span>
                )}
              </div>

              {testResult.matchedPattern && (
                <div className="text-zinc-500">
                  Pattern: <code className="text-zinc-300 font-bold">{testResult.matchedPattern}</code>
                </div>
              )}
            </div>

            {testResult.action !== 'unknown' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-zinc-500 mb-1">Captured Groups:</div>
                  <pre className="p-2 rounded bg-zinc-950 border border-zinc-800 text-zinc-300">
                    {testResult.groups && testResult.groups.length > 0
                      ? JSON.stringify(testResult.groups, null, 2)
                      : 'None (literal match)'}
                  </pre>
                </div>
                <div>
                  <div className="text-zinc-500 mb-1">Resolved Command Args:</div>
                  <pre className="p-2 rounded bg-zinc-950 border border-zinc-800 text-zinc-300">
                    {JSON.stringify(testResult.args, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add New Rule Form (Expandable) */}
      {isAddingPattern && (
        <form
          onSubmit={handleAddPattern}
          className="bg-zinc-900/95 border border-indigo-500/30 rounded-2xl p-5 shadow-lg space-y-4 animate-in fade-in duration-200"
        >
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-semibold text-zinc-100">Register New Command Pattern</h3>
            </div>
            <button
              type="button"
              onClick={() => setIsAddingPattern(false)}
              className="text-xs text-zinc-500 hover:text-zinc-300"
            >
              Cancel
            </button>
          </div>

          {formError && (
            <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs font-mono">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            <div>
              <label className="block text-zinc-400 mb-1">Regex Pattern:</label>
              <input
                type="text"
                value={newPattern}
                onChange={(e) => setNewPattern(e.target.value)}
                placeholder="^calculate (.+)$"
                required
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-zinc-200 outline-none focus:border-indigo-500"
              />
              <span className="text-[11px] text-zinc-500 mt-1 block">
                Use parentheses for capture groups (e.g. <code className="text-zinc-400">(.+)</code>)
              </span>
            </div>

            <div>
              <label className="block text-zinc-400 mb-1">Target Action:</label>
              <input
                type="text"
                value={newAction}
                onChange={(e) => setNewAction(e.target.value)}
                placeholder="open_app, run_script, say_text, custom..."
                required
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-zinc-200 outline-none focus:border-indigo-500"
              />
              <span className="text-[11px] text-zinc-500 mt-1 block">
                The action key passed to <code className="text-zinc-400">worker.py</code>
              </span>
            </div>

            <div>
              <label className="block text-zinc-400 mb-1">Arguments JSON Template:</label>
              <textarea
                value={newArgsJson}
                onChange={(e) => setNewArgsJson(e.target.value)}
                rows={3}
                required
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-200 outline-none focus:border-indigo-500 font-mono"
              />
              <span className="text-[11px] text-zinc-500 mt-1 block">
                Use <code className="text-zinc-400">$1</code> or <code className="text-zinc-400">\1</code> for group substitution
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-zinc-400 mb-1">Description (optional):</label>
                <input
                  type="text"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Explains what this rule triggers"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-200 outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Example Prompt (optional):</label>
                <input
                  type="text"
                  value={newExample}
                  onChange={(e) => setNewExample(e.target.value)}
                  placeholder="calculate 42 * 10"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-200 outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs transition-colors cursor-pointer"
            >
              Save Rule to Registry
            </button>
          </div>
        </form>
      )}

      {/* Pattern Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {patterns.map((pat, idx) => (
          <div
            key={pat.id}
            className="bg-zinc-900/80 border border-zinc-800/90 rounded-2xl p-4 flex flex-col justify-between hover:border-zinc-700 transition-all shadow-sm"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono font-medium">
                  Rule #{idx + 1}
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono font-semibold">
                  action: {pat.action}
                </span>
              </div>

              <div className="pt-1">
                <div className="text-[11px] text-zinc-500 font-mono">Pattern:</div>
                <div className="text-sm font-mono text-indigo-300 bg-zinc-950/80 px-2.5 py-1.5 rounded-lg border border-zinc-800/80 break-all font-semibold">
                  {pat.pattern}
                </div>
              </div>

              {pat.description && (
                <p className="text-xs text-zinc-400 pt-1">{pat.description}</p>
              )}

              <div>
                <div className="text-[11px] text-zinc-500 font-mono">Args Template:</div>
                <pre className="text-[11px] font-mono text-zinc-300 bg-zinc-950/80 p-2 rounded-lg border border-zinc-800/60 overflow-x-auto">
                  {JSON.stringify(pat.argsTemplate, null, 2)}
                </pre>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 mt-2 border-t border-zinc-800/60 text-xs">
              {pat.examplePrompt ? (
                <button
                  type="button"
                  onClick={() => setTestPrompt(pat.examplePrompt!)}
                  className="text-zinc-500 hover:text-indigo-400 font-mono text-[11px] truncate flex items-center gap-1"
                  title="Click to test this example in tester"
                >
                  <span>Ex:</span>
                  <span className="text-zinc-300">"{pat.examplePrompt}"</span>
                </button>
              ) : (
                <div></div>
              )}

              <button
                onClick={() => handleDeletePattern(pat.id)}
                className="text-zinc-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-zinc-800 transition-colors"
                title="Delete rule"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Regression / Suite Tester Table */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-semibold text-zinc-100">Test Suite Verification</h3>
          </div>
          <span className="text-xs text-zinc-400 font-mono">
            {bulkResults.filter((r) => r.isRecognized).length} / {bulkResults.length} recognized
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-500">
                <th className="pb-2 pl-2">Test Prompt</th>
                <th className="pb-2">Matched Action</th>
                <th className="pb-2">Resolved Args</th>
                <th className="pb-2 pr-2 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {bulkResults.map((item, idx) => (
                <tr key={idx} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="py-2.5 pl-2 text-zinc-200 font-semibold">{item.prompt}</td>
                  <td className="py-2.5">
                    {item.isRecognized ? (
                      <span className="text-emerald-400">{item.decision.action}</span>
                    ) : (
                      <span className="text-zinc-500">unknown</span>
                    )}
                  </td>
                  <td className="py-2.5 text-zinc-400">
                    {Object.keys(item.decision.args).length > 0
                      ? JSON.stringify(item.decision.args)
                      : '—'}
                  </td>
                  <td className="py-2.5 pr-2 text-right">
                    {item.isRecognized ? (
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px]">
                        Pass
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-500 text-[10px]">
                        Unmatched
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
