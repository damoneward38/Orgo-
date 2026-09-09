import { DecisionResult, WorkerResponse, VirtualProcess, VirtualScript } from '../types';

export interface WorkerExecutionOptions {
  platform: 'Linux' | 'Darwin' | 'Windows';
  enableVoiceAudio: boolean;
  scripts: VirtualScript[];
  onProcessSpawn?: (proc: VirtualProcess) => void;
}

export async function executeWorkerAction(
  decision: DecisionResult,
  options: WorkerExecutionOptions
): Promise<WorkerResponse> {
  const startTime = performance.now();
  const { action, args } = decision;
  const { platform, enableVoiceAudio, scripts, onProcessSpawn } = options;

  // Simulate network roundtrip latency (40ms - 150ms)
  await new Promise((r) => setTimeout(r, Math.floor(Math.random() * 80) + 45));

  try {
    if (action === 'open_app') {
      const exe = args.exe;
      if (!exe) {
        return {
          status: 'error',
          msg: "Missing 'exe' argument.",
          executionTimeMs: Math.round(performance.now() - startTime),
        };
      }

      const proc: VirtualProcess = {
        id: `proc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: exe === 'chrome' ? 'Google Chrome' : exe === 'mailspring' ? 'Mailspring Client' : exe,
        type: 'app',
        target: exe,
        startedAt: Date.now(),
        status: 'running',
        outputPreview: `Process spawned PID ${Math.floor(Math.random() * 8000) + 2000} [${platform}]`,
      };

      if (onProcessSpawn) onProcessSpawn(proc);

      return {
        status: 'ok',
        msg: `Opened ${exe} successfully on ${platform}`,
        details: { pid: Math.floor(Math.random() * 8000) + 2000, target: exe, os: platform },
        executionTimeMs: Math.round(performance.now() - startTime),
      };
    }

    if (action === 'run_script') {
      const script = args.script;
      if (!script) {
        return {
          status: 'error',
          msg: "Missing 'script' argument.",
          executionTimeMs: Math.round(performance.now() - startTime),
        };
      }

      // Small delay for script execution
      await new Promise((r) => setTimeout(r, 120));

      const foundScript = scripts.find(
        (s) => s.filename.toLowerCase() === script.toLowerCase() || script.endsWith(s.filename)
      );

      const output = foundScript
        ? foundScript.simulatedOutput
        : `[${script}] Executed successfully on Python 3.11 (${platform})\n[Process exited with return code 0]`;

      const proc: VirtualProcess = {
        id: `proc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: script,
        type: 'script',
        target: `python ${script}`,
        startedAt: Date.now(),
        status: 'completed',
        outputPreview: output.slice(0, 80) + '...',
      };
      if (onProcessSpawn) onProcessSpawn(proc);

      return {
        status: 'ok',
        output,
        details: { script, exit_code: 0, stdout_lines: output.split('\n').length },
        executionTimeMs: Math.round(performance.now() - startTime),
      };
    }

    if (action === 'say_text') {
      const text = args.text;
      if (!text) {
        return {
          status: 'error',
          msg: "Missing 'text' argument.",
          executionTimeMs: Math.round(performance.now() - startTime),
        };
      }

      // If voice audio is enabled and SpeechSynthesis is supported, speak it!
      if (enableVoiceAudio && typeof window !== 'undefined' && 'speechSynthesis' in window) {
        try {
          window.speechSynthesis.cancel(); // Stop any pending speech
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.rate = 1.0;
          utterance.pitch = 1.0;
          window.speechSynthesis.speak(utterance);
        } catch {
          // Ignore speech synth error if audio permissions blocked in iframe
        }
      }

      const proc: VirtualProcess = {
        id: `proc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: `TTS: "${text.slice(0, 25)}${text.length > 25 ? '...' : ''}"`,
        type: 'voice',
        target: platform === 'Darwin' ? 'say' : platform === 'Windows' ? 'SAPI.SpVoice' : 'espeak',
        startedAt: Date.now(),
        status: 'completed',
        outputPreview: `Vocalized ${text.length} chars`,
      };
      if (onProcessSpawn) onProcessSpawn(proc);

      return {
        status: 'ok',
        msg: `Spoken text: "${text}"`,
        details: { synthesizer: platform === 'Darwin' ? 'say' : platform === 'Windows' ? 'PowerShell SAPI' : 'espeak' },
        executionTimeMs: Math.round(performance.now() - startTime),
      };
    }

    if (action === 'ping') {
      return {
        status: 'ok',
        msg: 'pong',
        details: {
          roundtrip_ms: Math.round(performance.now() - startTime),
          platform,
          timestamp: new Date().toISOString(),
        },
        executionTimeMs: Math.round(performance.now() - startTime),
      };
    }

    if (action === 'system_status') {
      return {
        status: 'ok',
        output: `Node: worker-node-01 [${platform}]
OS: ${platform} x86_64 Kernel 6.5.0-generic
Python: 3.11.4 | ZeroMQ: 4.3.4 (pyzmq 25.1.0)
Memory: 16GB Total (4.2GB in use)
CPU Load: 1.12, 0.98, 0.85
Subprocess Queue: 0 pending tasks`,
        details: {
          platform,
          uptime: '14 days, 3 hours',
          activeSocket: 'tcp://*:5555',
        },
        executionTimeMs: Math.round(performance.now() - startTime),
      };
    }

    return {
      status: 'error',
      msg: `Unknown action: '${action}'. No handler registered in worker.`,
      executionTimeMs: Math.round(performance.now() - startTime),
    };
  } catch (err: any) {
    return {
      status: 'error',
      msg: err?.message || 'Worker execution failed',
      executionTimeMs: Math.round(performance.now() - startTime),
    };
  }
}
