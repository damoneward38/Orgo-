import React, { useState } from 'react';
import {
  Cpu,
  Monitor,
  Server,
  ArrowRight,
  Shield,
  Zap,
  Volume2,
  Terminal,
  Layers,
  CheckCircle2,
  Lock,
} from 'lucide-react';

export const ArchitectureFlow: React.FC = () => {
  const [activeStep, setActiveStep] = useState<number>(2);
  const [isPulseActive, setIsPulseActive] = useState<boolean>(false);

  const triggerPulse = () => {
    setIsPulseActive(true);
    setTimeout(() => setIsPulseActive(false), 2000);
  };

  const steps = [
    {
      id: 1,
      title: '1. Human Prompt Input',
      role: 'brain.py (Tkinter GUI / CLI)',
      badge: 'Client UI',
      icon: Monitor,
      desc: 'User inputs natural language task prompts such as "open browser" or "run script backup.py" into the GUI or terminal.',
      codeSnippet: `prompt = self.prompt_var.get().strip()
cmd = self.neural.decide(prompt)`,
      color: 'from-blue-500/20 to-indigo-500/10 border-blue-500/30',
      iconColor: 'text-blue-400',
    },
    {
      id: 2,
      title: '2. Neural Core Decision Engine',
      role: 'neural_core.py (v4.0)',
      badge: 'Pattern Matcher',
      icon: Cpu,
      desc: 'CommandRegistry compiles regex patterns, extracts dynamic groups, and maps them to concrete command arguments.',
      codeSnippet: `for pat, cmd in self.patterns.items():
    m = re.match(pat, prompt)
    if m:
        args = {k: v.format(*m.groups()) ...}
        return {"action": cmd["action"], "args": args}`,
      color: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/30',
      iconColor: 'text-emerald-400',
    },
    {
      id: 3,
      title: '3. ZeroMQ REQ / REP Socket',
      role: 'pyzmq Network Layer',
      badge: 'tcp://*:5555',
      icon: Zap,
      desc: 'ZeroMQ REQ socket connects to remote worker IP. JSON payload is transmitted over a low-latency non-blocking TCP pipe.',
      codeSnippet: `# Brain Client (REQ):
self.sock.send_json(cmd)
resp = self.sock.recv_json()

# Worker Server (REP):
cmd = sock.recv_json()
sock.send_json(resp)`,
      color: 'from-amber-500/20 to-orange-500/10 border-amber-500/30',
      iconColor: 'text-amber-400',
    },
    {
      id: 4,
      title: '4. Worker Agent Executor',
      role: 'worker.py daemon',
      badge: 'Remote Executor',
      icon: Server,
      desc: 'Decodes action and invokes host operating system capabilities: subprocess app launcher, python script execution, or voice synthesizer.',
      codeSnippet: `if action == "open_app":
    subprocess.Popen([exe])
elif action == "run_script":
    subprocess.run(["python", script], capture_output=True)
elif action == "say_text":
    speak_native_tts(text)`,
      color: 'from-purple-500/20 to-pink-500/10 border-purple-500/30',
      iconColor: 'text-purple-400',
    },
    {
      id: 5,
      title: '5. Response & Scrolled Log',
      role: 'brain.py ScrolledText',
      badge: 'Output View',
      icon: Terminal,
      desc: 'Worker response status and stdout output are sent back across ZeroMQ and formatted in the client activity log.',
      codeSnippet: `self._append_log(json.dumps(resp, indent=2) + "\\n")`,
      color: 'from-cyan-500/20 to-blue-500/10 border-cyan-500/30',
      iconColor: 'text-cyan-400',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
            <span>Orgo Distributed System Architecture</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-mono border border-emerald-500/20">
              ZeroMQ TCP Pipeline
            </span>
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Visual breakdown of request flow, from prompt capture to remote OS execution and log return.
          </p>
        </div>

        <button
          onClick={triggerPulse}
          disabled={isPulseActive}
          className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-sm shadow-emerald-500/20"
        >
          <Zap className={`w-3.5 h-3.5 ${isPulseActive ? 'animate-bounce' : ''}`} />
          <span>{isPulseActive ? 'Transmitting Pulse...' : 'Simulate Signal Pulse'}</span>
        </button>
      </div>

      {/* Visual Pipeline Flow */}
      <div className="relative bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 overflow-x-auto shadow-sm">
        {/* Animated pulse line */}
        <div className="hidden lg:block absolute top-[52px] left-12 right-12 h-1 bg-zinc-800 rounded-full z-0 overflow-hidden">
          {isPulseActive && (
            <div className="w-24 h-full bg-emerald-400 rounded-full animate-[marquee_1.8s_linear_infinite] shadow-[0_0_12px_#34d399]"></div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 relative z-10">
          {steps.map((step) => {
            const Icon = step.icon;
            const isSelected = activeStep === step.id;
            return (
              <div
                key={step.id}
                onClick={() => setActiveStep(step.id)}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? `bg-gradient-to-b ${step.color} shadow-md scale-[1.02]`
                    : 'bg-zinc-950/80 border-zinc-800/80 hover:border-zinc-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center ${step.iconColor}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded font-mono font-semibold bg-zinc-900 text-zinc-300 border border-zinc-800">
                      {step.badge}
                    </span>
                  </div>

                  <h3 className="text-xs font-bold text-zinc-100 mb-1">{step.title}</h3>
                  <div className="text-[11px] text-zinc-400 font-mono mb-2">{step.role}</div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">{step.desc}</p>
                </div>

                <div className="pt-3 mt-3 border-t border-zinc-800/60 flex items-center justify-between text-[10px]">
                  <span className={isSelected ? 'text-zinc-200 font-semibold' : 'text-zinc-500'}>
                    {isSelected ? 'Inspecting' : 'Click to inspect'}
                  </span>
                  <ArrowRight className="w-3 h-3 text-zinc-500" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Step Code & Architecture Deep-Dive */}
      {activeStep && (
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-semibold text-zinc-100">
                Detailed Implementation: {steps[activeStep - 1].title}
              </h3>
            </div>
            <span className="text-xs text-zinc-400 font-mono">
              Module: {steps[activeStep - 1].role}
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7">
              <div className="text-xs text-zinc-400 mb-2 font-mono">Python Code Implementation:</div>
              <pre className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 font-mono text-xs text-zinc-200 overflow-x-auto leading-relaxed">
                {steps[activeStep - 1].codeSnippet}
              </pre>
            </div>

            <div className="lg:col-span-5 space-y-3 text-xs">
              <div className="text-xs text-zinc-400 font-mono">Architectural Principles:</div>

              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-1.5">
                <div className="flex items-center gap-1.5 text-zinc-200 font-semibold">
                  <Shield className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Decoupled Design</span>
                </div>
                <p className="text-zinc-400 text-[11px] leading-relaxed">
                  The client GUI knows nothing about the underlying OS mechanics (macOS vs Windows vs Linux). It simply sends an abstract JSON intent.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-1.5">
                <div className="flex items-center gap-1.5 text-zinc-200 font-semibold">
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Network &amp; Firewall</span>
                </div>
                <p className="text-zinc-400 text-[11px] leading-relaxed">
                  Worker listens on <code className="text-zinc-300 font-mono">tcp://*:5555</code>. When running across LAN or VPN, ensure port 5555 is open in host firewall (<code className="text-zinc-300 font-mono">ufw allow 5555/tcp</code>).
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
