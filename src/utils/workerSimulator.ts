import { DecisionResult, WorkerResponse, VirtualProcess, VirtualScript } from '../types';

export interface WorkerExecutionOptions {
  platform: 'Linux' | 'Darwin' | 'Windows';
  enableVoiceAudio: boolean;
  scripts: VirtualScript[];
  onProcessSpawn?: (proc: VirtualProcess) => void;
}

const BRIDGE_TIMEOUT_MS = 4000;

async function callWorker(payload: Record<string, unknown>): Promise<WorkerResponse | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), BRIDGE_TIMEOUT_MS);
  try {
    const response = await fetch('/api/zeromq/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    if (!response.ok) return null;
    const data = await response.json();
    if (!data || data.error || data.status === 'fail') return null;
    return {
      status: data.status === 'ok' ? 'ok' : 'error',
      msg: typeof data.msg === 'string' ? data.msg : undefined,
      output: typeof data.output === 'string' ? data.output : undefined,
      details: data.details,
      executionTimeMs: typeof data.executionTimeMs === 'number' ? data.executionTimeMs : undefined,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function processFor(name: string, type: VirtualProcess['type'], target: string, preview: string): VirtualProcess {
  return {
    id: `proc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    name,
    type,
    target,
    startedAt: Date.now(),
    status: type === 'script' ? 'completed' : 'running',
    outputPreview: preview,
  };
}

export async function executeWorkerAction(
  decision: DecisionResult,
  options: WorkerExecutionOptions
): Promise<WorkerResponse> {
  const startTime = performance.now();
  const { action, args } = decision;
  const { platform, enableVoiceAudio, onProcessSpawn } = options;

  try {
    if (action === 'open_app') {
      const exe = String(args.exe || '').toLowerCase();
      if (!exe) {
        return { status: 'error', msg: "Missing 'exe' argument.", executionTimeMs: Math.round(performance.now() - startTime) };
      }

      const targets: Record<string, string> = {
        chrome: 'https://www.google.com/',
        browser: 'https://www.google.com/',
        vscode: 'https://vscode.dev/',
        mailspring: 'https://mail.google.com/',
        files: 'https://drive.google.com/',
      };
      const url = targets[exe] || `https://duckduckgo.com/?q=${encodeURIComponent(exe)}`;
      const opened = window.open(url, '_blank', 'noopener,noreferrer');
      if (!opened) {
        return {
          status: 'error',
          msg: `The browser blocked opening ${exe}. Allow popups or connect a workstation worker to launch native applications.`,
          executionTimeMs: Math.round(performance.now() - startTime),
        };
      }

      const proc = processFor(exe, 'app', url, `Opened ${url} in a new browser tab`);
      if (onProcessSpawn) onProcessSpawn(proc);
      return {
        status: 'ok',
        msg: `Opened ${exe} at ${url}`,
        details: { target: exe, url, runtime: 'browser', platform },
        executionTimeMs: Math.round(performance.now() - startTime),
      };
    }

    if (action === 'run_script') {
      const script = String(args.script || '');
      if (!script) {
        return { status: 'error', msg: "Missing 'script' argument.", executionTimeMs: Math.round(performance.now() - startTime) };
      }

      const worker = await callWorker({ action: 'run_script', args: { script } });
      if (!worker) {
        return {
          status: 'error',
          msg: `No workstation worker is connected. Start worker_real.py on tcp://127.0.0.1:5555 to execute ${script}.`,
          details: { script, bridge: '/api/zeromq/send', connected: false },
          executionTimeMs: Math.round(performance.now() - startTime),
        };
      }

      const proc = processFor(script, 'script', `python ${script}`, (worker.output || worker.msg || '').slice(0, 80));
      if (onProcessSpawn) onProcessSpawn(proc);
      return { ...worker, executionTimeMs: worker.executionTimeMs ?? Math.round(performance.now() - startTime) };
    }

    if (action === 'say_text') {
      const text = String(args.text || '');
      if (!text) {
        return { status: 'error', msg: "Missing 'text' argument.", executionTimeMs: Math.round(performance.now() - startTime) };
      }

      if (!enableVoiceAudio || typeof window === 'undefined' || !('speechSynthesis' in window)) {
        return {
          status: 'error',
          msg: 'Speech output is disabled or unavailable in this browser.',
          details: { textLength: text.length, audioEnabled: enableVoiceAudio },
          executionTimeMs: Math.round(performance.now() - startTime),
        };
      }

      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        window.speechSynthesis.speak(utterance);
      } catch {
        return {
          status: 'error',
          msg: 'The browser blocked speech synthesis.',
          executionTimeMs: Math.round(performance.now() - startTime),
        };
      }

      const proc = processFor(
        `TTS: "${text.slice(0, 25)}${text.length > 25 ? '...' : ''}"`,
        'voice',
        'SpeechSynthesis',
        `Vocalized ${text.length} chars`
      );
      if (onProcessSpawn) onProcessSpawn(proc);
      return {
        status: 'ok',
        msg: `Spoken text: "${text}"`,
        details: { synthesizer: 'browser SpeechSynthesis', platform },
        executionTimeMs: Math.round(performance.now() - startTime),
      };
    }

    if (action === 'ping') {
      const worker = await callWorker({ action: 'ping' });
      if (worker) {
        const proc = processFor('Worker ping', 'system', 'tcp://127.0.0.1:5555', 'ZeroMQ worker replied');
        if (onProcessSpawn) onProcessSpawn(proc);
        return { ...worker, executionTimeMs: worker.executionTimeMs ?? Math.round(performance.now() - startTime) };
      }

      const backend = (window as any).PortfolioBackend;
      if (backend && typeof backend.health === 'function') {
        const pingStart = performance.now();
        try {
          const health = await backend.health();
          return {
            status: 'ok',
            msg: `portfolio-api reachable (${health.service} v${health.version})`,
            details: {
              roundtrip_ms: Math.round(performance.now() - pingStart),
              target: 'portfolio-api',
              ollama: health.ollama?.ok ?? false,
              workerConnected: false,
              platform,
            },
            executionTimeMs: Math.round(performance.now() - startTime),
          };
        } catch {
          // Fall through to a direct origin check
        }
      }

      const pingStart = performance.now();
      try {
        await fetch(location.href, { method: 'HEAD', cache: 'no-store' });
        return {
          status: 'ok',
          msg: 'pong (static host reachable; workstation worker offline)',
          details: {
            roundtrip_ms: Math.round(performance.now() - pingStart),
            target: location.origin,
            workerConnected: false,
            platform,
          },
          executionTimeMs: Math.round(performance.now() - startTime),
        };
      } catch {
        return {
          status: 'error',
          msg: 'No host reachable from this browser session.',
          executionTimeMs: Math.round(performance.now() - startTime),
        };
      }
    }

    if (action === 'system_status') {
      const worker = await callWorker({ action: 'system_status' });
      if (worker) return { ...worker, executionTimeMs: worker.executionTimeMs ?? Math.round(performance.now() - startTime) };

      const nav = navigator as Navigator & { deviceMemory?: number };
      const memory = (performance as Performance & { memory?: { usedJSHeapSize: number; jsHeapSizeLimit: number } }).memory;
      const backend = (window as any).PortfolioBackend;
      let backendStatus = 'offline';
      try {
        const health = await backend?.health?.();
        if (health) backendStatus = `${health.service} v${health.version} (ollama ${health.ollama?.ok ? 'ready' : 'offline'})`;
      } catch {
        backendStatus = 'offline';
      }

      const output = [
        `Runtime: browser (${nav.userAgent})`,
        `Logical cores: ${nav.hardwareConcurrency || 'unknown'}`,
        `Device memory: ${nav.deviceMemory ? `${nav.deviceMemory} GB` : 'not exposed'}`,
        `Heap: ${memory ? `${Math.round(memory.usedJSHeapSize / 1048576)} MB used of ${Math.round(memory.jsHeapSizeLimit / 1048576)} MB` : 'not exposed'}`,
        `Network: ${nav.onLine ? 'online' : 'offline'}`,
        `Backend: ${backendStatus}`,
        `Workstation worker: not connected`,
      ].join('\n');

      return {
        status: 'ok',
        output,
        details: {
          platform,
          runtime: 'browser',
          logicalCores: nav.hardwareConcurrency || null,
          networkOnline: nav.onLine,
          workerConnected: false,
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
