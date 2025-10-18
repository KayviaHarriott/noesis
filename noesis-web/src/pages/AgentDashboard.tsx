import { useEffect, useMemo, useRef, useState } from "react";
import {
  sendAgentReply,
  subscribeToClientMessages,
  fetchAiSuggestion,
  fetchEmotion,
} from "../api/agentApi";

export const AgentDashboard = () => {
  // Chat + AI suggestion
  const [messages, setMessages] = useState<string[]>([]);
  const [reply, setReply] = useState("");
  const [suggestion, setSuggestion] = useState<string>("");
  const [loadingSuggestion, setLoadingSuggestion] = useState(false);

  // Theme
  const [isLight, setIsLight] = useState(false);

  // Live metrics (demo-friendly)
  const [empathy, setEmpathy] = useState(8.4);
  const [clock, setClock] = useState(0); // seconds in-call
  const [emotions, setEmotions] = useState({ frustration: 75, confusion: 42, hope: 28 });
  const [sentiment, setSentiment] = useState<{ emotion: string; confidence: number }>({ emotion: "Frustrated", confidence: 0.8 });

  const transcriptRef = useRef<HTMLDivElement>(null);

  // Load saved theme
  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "light") {
      document.body.classList.add("light-mode");
      setIsLight(true);
    }
  }, []);

  const toggleTheme = () => {
    const next = !isLight;
    setIsLight(next);
    document.body.classList.toggle("light-mode", next);
    localStorage.setItem("theme", next ? "light" : "dark");
  };

  // Subscribe to client messages and fetch AI suggestion + emotion
 useEffect(() => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const unsubscribe = subscribeToClientMessages((data: any) => {
    const msgText =
      typeof data === "string"
        ? data
        : data?.transcript || JSON.stringify(data);

    setMessages((prev) => [...prev, `Client: ${msgText}`]);

    // Scroll transcript
    setTimeout(() => transcriptRef.current?.scrollTo({ top: 999999, behavior: "smooth" }), 50);

    // Fire both calls (AI suggestion + emotion) in parallel
    const run = async () => {
      try {
        setLoadingSuggestion(true);
        const [ai, emo] = await Promise.allSettled([
          fetchAiSuggestion(msgText),
          fetchEmotion(msgText),
        ]);
        if (ai.status === "fulfilled") {
          setSuggestion(ai.value);
        } else {
          setSuggestion("⚠️ Could not load AI suggestion");
        }
        if (emo.status === "fulfilled") {
          const e = emo.value.emotion
            ? emo.value.emotion[0].toUpperCase() + emo.value.emotion.slice(1)
            : "Unknown";
          setSentiment({
            emotion: e,
            confidence: emo.value.confidence ?? 0,
          });
          setEmotions((prev) => ({
            frustration:
              e.toLowerCase().includes("anger") ||
              e.toLowerCase().includes("frustrat")
                ? Math.max(prev.frustration, 70)
                : prev.frustration - 1,
            confusion:
              prev.confusion + (e.toLowerCase().includes("confus") ? 2 : -1),
            hope:
              prev.hope +
              (e.toLowerCase().includes("joy") ||
              e.toLowerCase().includes("hope")
                ? 2
                : -1),
          }));
        }
      } finally {
        setLoadingSuggestion(false);
      }
    };
    run();
  });

  return () => unsubscribe();
}, []);


  // Small demo timers: empathy drift + ticking clock
  useEffect(() => {
    const t1 = setInterval(() => {
      setEmpathy((prev) => {
        const next = prev + (Math.random() * 0.2 - 0.1);
        return Math.max(6.8, Math.min(9.6, +next.toFixed(1)));
      });
    }, 5000);
    const t2 = setInterval(() => setClock((c) => c + 1), 1000);
    return () => {
      clearInterval(t1);
      clearInterval(t2);
    };
  }, []);

  const mmss = useMemo(() => {
    const m = String(Math.floor(clock / 60)).padStart(2, "0");
    const s = String(clock % 60).padStart(2, "0");
    return `${m}:${s}`;
  }, [clock]);

  const handleSend = () => {
    if (!reply.trim()) return;
    sendAgentReply(reply);
    setMessages((prev) => [...prev, `You: ${reply}`]);
    setReply("");
    setTimeout(() => transcriptRef.current?.scrollTo({ top: 999999, behavior: "smooth" }), 50);
  };

  const useSuggestion = () => {
    if (suggestion) setReply(suggestion);
  };

  const bubble = (msg: string, i: number) => {
    const isClient = msg.startsWith("Client:");
    const who = isClient ? "Client" : "Agent (You)";
    const color = isClient ? "red" : "blue";
    return (
      <div key={i} className={`p-2 rounded bg-slate-800/40 border-l-2 border-${color}-500`}>
        <div className="flex items-center justify-between mb-1">
          <span className={`text-xs font-semibold text-${isClient ? "red" : "blue"}-300`}>{who}</span>
          <span className="text-xs text-gray-500">{mmss}</span>
        </div>
        <p className="text-sm text-gray-200">{msg.replace(/^Client:\s?/i, "").replace(/^You:\s?/i, "")}</p>
      </div>
    );
  };

  return (
    <div className="p-3">
      {/* Header */}
      <div className="glass-panel p-3 mb-3">
        <div className="flex items-center justify-between mobile-header">
          <div className="flex items-center gap-3 mobile-header-left">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 via-blue-500 to-blue-400 flex items-center justify-center relative overflow-hidden shadow-lg shadow-blue-500/50">
              <svg className="w-6 h-6 text-white relative z-10" viewBox="0 0 24 24" fill="none">
                <circle cx="6" cy="6" r="2.5" fill="currentColor" />
                <circle cx="18" cy="6" r="2.5" fill="currentColor" />
                <circle cx="6" cy="18" r="2.5" fill="currentColor" />
                <circle cx="18" cy="18" r="2.5" fill="currentColor" />
                <circle cx="12" cy="12" r="2" fill="currentColor" opacity="0.7" />
                <line x1="6" y1="6" x2="12" y2="12" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
                <line x1="18" y1="6" x2="12" y2="12" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
                <line x1="6" y1="18" x2="12" y2="12" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
                <line x1="18" y1="18" x2="12" y2="12" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
                <path d="M6 6 L6 18 M18 6 L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-500 to-blue-400 bg-clip-text text-transparent">Noesis</h1>
              <p className="text-xs text-gray-500">Real-time Call Intelligence</p>
            </div>
          </div>
          <div className="flex items-center gap-6 mobile-header-right">
            <div className="text-center">
              <div className="text-xs text-gray-500">Empathy</div>
              <div className="text-2xl font-bold text-blue-400">{empathy.toFixed(1)}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-500">Time</div>
              <div className="text-xl font-bold text-blue-300">{mmss}</div>
            </div>
            <button
              onClick={toggleTheme}
              className="theme-toggle w-9 h-9 rounded-lg bg-slate-800/40 hover:bg-slate-700/60 flex items-center justify-center border border-blue-500/20"
              aria-label="Toggle theme"
            >
              <i className={`fas ${isLight ? "fa-moon text-blue-600" : "fa-sun text-yellow-400"} text-sm`} />
            </button>
          </div>
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-12 gap-3 mobile-grid" style={{ height: "calc(100vh - 120px)" }}>
        {/* LEFT: Info */}
        <div className="col-span-12 md:col-span-2 space-y-3 overflow-y-auto scrollbar-thin pr-1 mobile-info-cards">
          {/* Agent */}
          <div className="glass-panel p-3">
            <div className="flex items-center gap-2 mb-2">
              <i className="fas fa-headset text-blue-400 text-xs" />
              <h3 className="font-semibold text-sm">Agent</h3>
            </div>
            <div className="flex items-center gap-2 mb-3">
              <img
                src="https://ui-avatars.com/api/?name=Sarah+J&background=3b82f6&color=fff&size=32"
                className="w-8 h-8 rounded-full ring-1 ring-blue-500"
                alt="Agent"
              />
              <div>
                <div className="font-semibold text-sm text-blue-300">Sarah J.</div>
                <div className="text-xs text-gray-500">ID: 2847</div>
              </div>
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-400">Calls Today</span>
                <span className="font-semibold">34</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Avg CSAT</span>
                <span className="font-semibold text-green-400">9.1</span>
              </div>
            </div>
          </div>

          {/* Customer */}
          <div className="glass-panel p-3">
            <div className="flex items-center gap-2 mb-2">
              <i className="fas fa-user text-cyan-400 text-xs" />
              <h3 className="font-semibold text-sm">Customer</h3>
            </div>
            <div className="flex items-center gap-2 mb-3">
              <img
                src="https://ui-avatars.com/api/?name=Michael+C&background=06b6d4&color=fff&size=32"
                className="w-8 h-8 rounded-full ring-1 ring-cyan-500"
                alt="Customer"
              />
              <div>
                <div className="font-semibold text-sm text-cyan-300">Michael C.</div>
                <div className="text-xs text-gray-500">Premium • 3.5yr</div>
              </div>
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-400">Issue</span>
                <span className="text-red-400 font-semibold">Billing</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Sentiment</span>
                <span className="text-yellow-400 font-semibold">
                  {sentiment.emotion} {sentiment.confidence ? `(${Math.round(sentiment.confidence * 100)}%)` : ""}
                </span>
              </div>
            </div>
          </div>

          {/* Voice */}
          <div className="glass-panel p-3 mobile-voice">
            <div className="flex items-center gap-2 mb-2">
              <i className="fas fa-waveform text-purple-400 text-xs" />
              <h3 className="font-semibold text-sm">Customer Voice</h3>
            </div>
            <div className="flex items-center h-12 bg-slate-900/30 rounded mb-2 px-2">
              <div className="flex items-end gap-0.5 w-full justify-between">
                {Array.from({ length: 25 }).map((_, i) => (
                  <div key={i} className="wave-bar" style={{ animationDelay: `${(i % 12) * 0.1}s` }} />
                ))}
              </div>
            </div>
            <div className="space-y-2 text-xs">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-gray-400">Stress Level</span>
                  <span className="text-orange-400 font-semibold">{emotions.frustration >= 70 ? "High" : "Moderate"}</span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-1">
                  <div className="bg-orange-500 h-1 rounded-full" style={{ width: `${Math.min(100, Math.max(0, emotions.frustration))}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-gray-400">Clarity</span>
                  <span className="text-green-400 font-semibold">{emotions.hope > 30 ? "Good" : "Fair"}</span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-1">
                  <div className="bg-green-500 h-1 rounded-full" style={{ width: `${Math.min(100, Math.max(0, 88))}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CENTER: Transcript & controls */}
        <div className="col-span-12 md:col-span-8 flex flex-col gap-3 mobile-transcript">
          {/* Emotion bar */}
          <div className="glass-panel p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-4 text-xs">
                <div>
                  <span className="text-gray-400">Frustration</span>
                  <span className="ml-2 font-bold text-red-400">{Math.round(emotions.frustration)}%</span>
                </div>
                <div>
                  <span className="text-gray-400">Confusion</span>
                  <span className="ml-2 font-bold text-yellow-400">{Math.round(emotions.confusion)}%</span>
                </div>
                <div>
                  <span className="text-gray-400">Hope</span>
                  <span className="ml-2 font-bold text-green-400">{Math.round(emotions.hope)}%</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-xs text-gray-400">LIVE</span>
              </div>
            </div>
            <div className="emotion-indicator" />
          </div>

          {/* Transcript */}
          <div className="glass-panel p-3 flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <i className="fas fa-comment-dots text-green-400 text-sm" />
                <h3 className="font-semibold text-sm">Live Transcript</h3>
              </div>
            </div>

            <div ref={transcriptRef} className="flex-1 overflow-y-auto scrollbar-thin space-y-2">
              {messages.map((m, i) => bubble(m, i))}
              {loadingSuggestion && (
                <div className="p-2 rounded bg-slate-800/40 border-l-2 border-blue-500">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-blue-300">Agent (You)</span>
                    <div className="flex gap-1 ml-2">
                      <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" />
                      <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                      <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Compose */}
            <div className="mt-3">
              <textarea
                className="border border-slate-700 rounded p-2 w-full bg-slate-900/30"
                rows={3}
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder="Type reply..."
              />
              <div className="flex gap-2">
                <button className="bg-green-500 text-white px-4 py-2 mt-2 rounded" onClick={handleSend}>
                  Send to Client
                </button>
                <button
                  className="bg-blue-500/20 text-blue-300 px-4 py-2 mt-2 rounded border border-blue-500/30"
                  disabled={!suggestion || loadingSuggestion}
                  onClick={useSuggestion}
                >
                  Use AI Suggestion
                </button>
              </div>
            </div>
          </div>

          {/* Inline controls (hidden on mobile via your CSS) */}
          <div className="glass-panel p-2 hide-mobile">
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <button className="px-4 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 font-semibold rounded text-sm transition flex items-center gap-2 border border-yellow-500/30">
                  <i className="fas fa-pause text-xs" />
                  Hold
                </button>
                <button className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded text-sm transition flex items-center gap-2">
                  <i className="fas fa-arrow-up text-xs" />
                  Escalate
                </button>
                <button className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 font-semibold rounded text-sm transition border border-purple-500/30 flex items-center gap-2">
                  <i className="fas fa-user-plus text-xs" />
                  Transfer
                </button>
              </div>
              <div className="flex gap-2">
                <button className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 font-semibold rounded text-sm transition border border-blue-500/30 flex items-center gap-2">
                  <i className="fas fa-microphone-slash text-xs" />
                  Mute
                </button>
                <button className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded text-sm transition flex items-center gap-2">
                  <i className="fas fa-phone-slash text-xs" />
                  End
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: AI suggestions + metrics */}
        <div className="col-span-12 md:col-span-2 flex flex-col gap-3 overflow-y-auto scrollbar-thin pr-1">
          {/* AI Coaching */}
          <div className="glass-panel p-3">
            <div className="flex items-center gap-2 mb-3">
              <i className="fas fa-lightbulb text-yellow-400 text-sm" />
              <h3 className="font-semibold text-sm">AI Coaching</h3>
            </div>

            {/* Main AI suggestion */}
            <div className="border rounded p-3 bg-gray-50/5 mb-3 min-h-[120px]">
              {loadingSuggestion ? (
                <p className="text-gray-400 italic">Generating suggestion...</p>
              ) : suggestion ? (
                <p className="text-gray-200">{suggestion}</p>
              ) : (
                <p className="text-gray-400 italic">Waiting for client message...</p>
              )}
              <button
                className="w-full px-2 py-1 mt-3 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs font-semibold disabled:bg-gray-500"
                onClick={useSuggestion}
                disabled={!suggestion || loadingSuggestion}
              >
                Use This Phrase
              </button>
            </div>

            {/* Tone guidance (static tips; your emotion drives emphasis elsewhere) */}
            <div className="p-2 rounded bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/30">
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                  <i className="fas fa-volume-down text-white text-xs" />
                </div>
                <div className="flex-1">
                  <div className="text-xs font-semibold text-blue-300 mb-1">Adjust Tone</div>
                  <ul className="text-xs text-gray-300 space-y-1">
                    <li>• Slow speech by 15%</li>
                    <li>• Use warmer tone</li>
                    <li>• Lower volume slightly</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="glass-panel p-3">
            <div className="text-xs font-semibold text-gray-400 mb-2">This Call</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="text-center p-2 bg-slate-800/30 rounded">
                <div className="text-gray-400 text-xs">Response Quality</div>
                <div className="text-lg font-bold text-blue-400">{Math.min(100, Math.round(84 + empathy * 1))}%</div>
              </div>
              <div className="text-center p-2 bg-slate-800/30 rounded">
                <div className="text-gray-400 text-xs">Predicted CSAT</div>
                <div className="text-lg font-bold text-yellow-400">{(6.5 + (empathy - 7.5)).toFixed(1)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sticky controls (CSS shows/hides) */}
      <div className="mobile-controls">
        <div className="mobile-controls-inner">
          <button className="bg-yellow-500/20 text-yellow-300 rounded border border-yellow-500/30 flex flex-col items-center justify-center">
            <i className="fas fa-pause" />
            <span>Hold</span>
          </button>
          <button className="bg-orange-500 text-white rounded flex flex-col items-center justify-center">
            <i className="fas fa-arrow-up" />
            <span>Escalate</span>
          </button>
          <button className="bg-blue-500/20 text-blue-300 rounded border border-blue-500/30 flex flex-col items-center justify-center">
            <i className="fas fa-microphone-slash" />
            <span>Mute</span>
          </button>
          <button className="bg-red-500 text-white rounded flex flex-col items-center justify-center">
            <i className="fas fa-phone-slash" />
            <span>End</span>
          </button>
        </div>
      </div>
    </div>
  );
};