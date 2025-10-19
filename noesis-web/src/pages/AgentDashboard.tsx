/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  sendAgentReply,
  subscribeToClientMessages,
  fetchAiSuggestion,
  fetchRelevantDocs,
} from "../api/agentApi";
import { Link } from "react-router-dom";



// Types
type RelevantDoc = {
  title: string;
  snippet: string;
  score?: string;
};

type ChatMessage = {
  text: string;
  sender: "client" | "agent";
  sentiment?: { emotion: string; confidence: number };
};

// Default export for easy import in your React router/pages
export const AgentDashboard: React.FC = () => {
  // Chat + AI suggestion
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [reply, setReply] = useState("");
  const [suggestion, setSuggestion] = useState<string>("");
  const [loadingSuggestion, setLoadingSuggestion] = useState(false);

  // Theme
  const [isLight, setIsLight] = useState(false);

  // Live metrics (demo-friendly)
  const [empathy, setEmpathy] = useState(8.4);
  const [clock, setClock] = useState(0); // seconds in-call
  const [relevantDocs, setRelevantDocs] = useState<RelevantDoc[]>([]);

  const [sentiment, setSentiment] = useState<{ emotion: string; confidence: number }>({
    emotion: "",
    confidence: 0.0,
  });


const handleOpenClient = (e: React.MouseEvent) => {
  e.preventDefault();
  window.open("/client", "_blank", "noopener,noreferrer");
};

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

  // Subscribe to client messages and drive AI flows
  useEffect(() => {
    const unsubscribe = subscribeToClientMessages(async (data: any) => {
      const msgText = typeof data === "string" ? data : data?.transcript || JSON.stringify(data);

      // ✅ Add message with sentiment info
      setMessages((prev) => [
        ...prev,
        {
          text: msgText,
          sender: "client",
          sentiment: {
            emotion: data?.emotion ?? "Neutral",
            confidence: data?.confidence ?? 0.5,
          },
        },
      ]);

      // Scroll transcript
      setTimeout(() => transcriptRef.current?.scrollTo({ top: 999999, behavior: "smooth" }), 50);

      // Async suggestion + docs fetch
      try {
        setLoadingSuggestion(true);
        const ai = data?.suggestion && data?.emotion
          ? { suggestion: data.suggestion, emotion: data.emotion, confidence: data.confidence ?? 0 }
          : await fetchAiSuggestion(msgText);

        setSuggestion(ai.suggestion);
        setSentiment({ emotion: ai.emotion, confidence: ai.confidence });

        const docs = await fetchRelevantDocs(msgText);
        setRelevantDocs(docs);
      } catch (err) {
        console.error("Error fetching AI or docs:", err);
      } finally {
        setLoadingSuggestion(false);
      }
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
    setMessages((prev) => [...prev, { text: reply, sender: "agent" }]);
    setReply("");
    setTimeout(() => transcriptRef.current?.scrollTo({ top: 999999, behavior: "smooth" }), 50);
  };

  const useSuggestion = () => {
    if (suggestion) setReply(suggestion);
  };

  const bubble = (msg: ChatMessage, i: number) => {
  const isClient = msg.sender === "client";
  const who = isClient ? "Client" : "Agent (You)";
  const color = isClient ? "#ef4444" : "#3b82f6"; // Tailwind red-500 / blue-500
  const textColor = isClient ? "#fca5a5" : "#93c5fd"; // red-300 / blue-300
  const alignment = isClient ? "items-start" : "items-end";

  return (
    <div key={i} className={`flex flex-col ${alignment}`}>
      <div
        className="p-2 rounded bg-slate-800/40 border-l-2"
        style={{ borderLeftColor: color }}
      >
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-semibold" style={{ color: textColor }}>
            {who}
          </span>
          <span className="text-xs text-gray-500">{mmss}</span>
        </div>

        <p className="text-sm text-gray-200">{msg.text}</p>

        {isClient && msg.sentiment && (
          <div
            className="mt-1 text-xs italic"
            style={{
              color:
                msg.sentiment.emotion === "Frustrated"
                  ? "#f87171" // red-400
                  : msg.sentiment.emotion === "Happy"
                  ? "#4ade80" // green-400
                  : "#facc15", // yellow-400
            }}
          >
            Sentiment: {msg.sentiment.emotion} (
            {Math.round(msg.sentiment.confidence * 100)}%)
          </div>
        )}
      </div>
    </div>
  );
};



  return (
    <div className="p-3">
      {/* Header Bar (from agent.html design) */}
      <div className="glass-panel p-3 mb-3">
        <div className="flex items-center justify-between">
          {/* Logo Left */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 via-blue-500 to-blue-400 flex items-center justify-center relative overflow-hidden shadow-lg shadow-blue-500/50">
              <svg className="w-6 h-6 text-white relative z-10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="6" cy="6" r="2.5" fill="currentColor"/>
                <circle cx="18" cy="6" r="2.5" fill="currentColor"/>
                <circle cx="6" cy="18" r="2.5" fill="currentColor"/>
                <circle cx="18" cy="18" r="2.5" fill="currentColor"/>
                <circle cx="12" cy="12" r="2" fill="currentColor" opacity="0.7"/>
                <line x1="6" y1="6" x2="12" y2="12" stroke="currentColor" strokeWidth="1.5" opacity="0.6"/>
                <line x1="18" y1="6" x2="12" y2="12" stroke="currentColor" strokeWidth="1.5" opacity="0.6"/>
                <line x1="6" y1="18" x2="12" y2="12" stroke="currentColor" strokeWidth="1.5" opacity="0.6"/>
                <line x1="18" y1="18" x2="12" y2="12" stroke="currentColor" strokeWidth="1.5" opacity="0.6"/>
                <path d="M6 6 L6 18 M18 6 L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"/>
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-500 to-blue-400 bg-clip-text text-transparent">Noesis</h1>
              <p className="text-xs text-gray-500">Real-Time Call Intelligence</p>
            </div>
          </div>

          {/* Action Buttons Right */}
          <div className="flex items-center gap-2">
            <button onClick={toggleTheme} className="px-3 py-2 bg-slate-800/40 hover:bg-slate-700/40 border border-slate-700/30 rounded-lg transition flex items-center gap-2">
              <i className={`fas ${isLight ? "fa-moon" : "fa-sun"} text-sm text-gray-400`}/>
            </button>
            <button className="px-3 py-2 bg-slate-800/40 hover:bg-slate-700/40 border border-slate-700/30 rounded-lg transition flex items-center gap-2">
              <i className="fas fa-cog text-sm text-gray-400"/>
              {/* <span className="text-xs text-gray-300 hidden md:inline">Customer Dashboard</span> */}
              
              <Link to="/client" onClick={handleOpenClient} ><span className="text-xs text-gray-300 hidden md:inline">Customer Dashboard</span></Link>
            </button>
            <button className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-lg transition flex items-center gap-2">
              <i className="fas fa-sign-out-alt text-sm text-red-400"/>
              <span className="text-xs text-red-400 hidden md:inline">Exit</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-12 gap-3 mobile-grid" style={{ height: "calc(100vh - 120px)" }}>
        {/* LEFT: Agent/Customer/Voice */}
        <div className="col-span-12 md:col-span-2 space-y-3 overflow-y-auto scrollbar-thin pr-1 mobile-sidebar">
          {/* Agent Card */}
          <div className="glass-panel p-3">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Agent</h3>
            </div>
            <div className="flex items-center gap-3 mb-4">
              <img src="https://ui-avatars.com/api/?name=Sarah+J&background=3b82f6&color=fff&size=40" className="w-10 h-10 rounded-full ring-2 ring-blue-500/30" alt="Agent" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <div className="font-medium text-sm">Sarah J.</div>
                  <div className="presence-dot"/>
                </div>
                <div className="text-xs text-gray-500">ID: 2847</div>
              </div>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between"><span className="text-gray-400">Calls Today</span><span className="font-semibold">34</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Avg CSAT</span><span className="font-semibold text-green-400">9.1</span></div>
            </div>
          </div>

          {/* Customer Card */}
          <div className="glass-panel p-3">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Customer</h3>
            </div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center ring-2 ring-yellow-500/30 text-white font-semibold text-sm">MC</div>
              <div className="flex-1">
                <div className="font-medium text-sm text-gray-300">Michael C.</div>
                <div className="text-xs text-gray-500">Premium • 3.5yr</div>
              </div>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between"><span className="text-gray-400">Issue</span><span className="text-red-400 font-semibold">Billing</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Sentiment</span><span className="text-yellow-400 font-semibold">{sentiment.emotion}{sentiment.confidence ? ` (${Math.round(sentiment.confidence * 100)}%)` : ""}</span></div>
            </div>
          </div>

          {/* Customer Voice */}
          <div className="glass-panel p-3">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Customer Voice</h3>
            <div className="bg-slate-800/30 rounded mb-3 p-3 flex items-end justify-between gap-1" style={{ height: 60 }}>
              {Array.from({ length: 24 }).map((_, i) => (
                <div key={i} className="spectrum-bar" style={{ height: `${30 + (i % 12) * 5}%`, animationDelay: `${(i % 12) * 0.1}s` }} />
              ))}
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center"><span className="text-gray-400">Stress</span><span className="font-semibold text-gray-500">—</span></div>
              <div className="flex justify-between items-center"><span className="text-gray-400">Clarity</span><span className="font-semibold text-gray-500">—</span></div>
            </div>
          </div>
        </div>

        {/* CENTER: Transcript & controls */}
        <div className="col-span-12 md:col-span-6 flex flex-col gap-3 mobile-transcript">
          {/* Top metrics strip */}
          <div className="glass-panel p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <span className="text-xs text-gray-400">Emotion</span>
                <span className="text-base font-bold text-blue-400 tabular-nums">{empathy.toFixed(1)}</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <span className="text-xs text-gray-400">Pred. CSAT</span>
                <span className="text-base font-bold text-yellow-400 tabular-nums">{(6.5 + (empathy - 7.5)).toFixed(1)}</span>
              </div>
              <div className="px-3 py-1.5 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <span className="text-base font-mono font-bold text-blue-400 tabular-nums">{mmss}</span>
              </div>
              <div className="flex items-center gap-1"><div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"/><span className="text-xs text-gray-400">LIVE</span></div>
            </div>
          </div>

          {/* Transcript */}
          <div className="glass-panel p-3 flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2"><i className="fas fa-comment-dots text-green-400 text-sm"/><h3 className="font-semibold text-sm">Live Transcript</h3></div>
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
              <textarea className="border border-slate-700 rounded p-2 w-full bg-slate-900/30" rows={3} value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Type reply..."/>
              <div className="flex gap-2">
                <button className="bg-green-500 text-white px-4 py-2 mt-2 rounded" onClick={handleSend}>Send to Client</button>
                <button className="bg-blue-500/20 text-blue-300 px-4 py-2 mt-2 rounded border border-blue-500/30" disabled={!suggestion || loadingSuggestion} onClick={useSuggestion}>Use AI Suggestion</button>
              </div>
            </div>
          </div>

          {/* Inline controls */}
          <div className="glass-panel p-2">
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <button className="px-4 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 font-semibold rounded text-sm transition flex items-center gap-2 border border-yellow-500/30"><i className="fas fa-pause text-xs"/>Hold</button>
                <button className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded text-sm transition flex items-center gap-2"><i className="fas fa-arrow-up text-xs"/>Escalate</button>
                <button className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 font-semibold rounded text-sm transition border border-purple-500/30 flex items-center gap-2"><i className="fas fa-user-plus text-xs"/>Transfer</button>
              </div>
              <div className="flex gap-2">
                <button className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 font-semibold rounded text-sm transition border border-blue-500/30 flex items-center gap-2"><i className="fas fa-microphone-slash text-xs"/>Mute</button>
                <button className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded text-sm transition flex items-center gap-2"><i className="fas fa-phone-slash text-xs"/>End</button>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: AI Coaching & Docs & Metrics */}
        <div className="col-span-12 md:col-span-4 flex flex-col gap-3 overflow-y-auto scrollbar-thin pr-1">
          {/* AI Coaching */}
          <div className="glass-panel p-3">
            <div className="flex items-center gap-2 mb-3"><i className="fas fa-lightbulb text-yellow-400 text-sm"/><h3 className="font-semibold text-sm">AI Coaching</h3></div>
            <div className="border rounded p-3 bg-gray-50/5 mb-3 min-h-[120px]">
              {loadingSuggestion ? (
                <p className="text-gray-400 italic">Generating suggestion...</p>
              ) : suggestion ? (
                <p className="text-gray-200">{suggestion}</p>
              ) : (
                <p className="text-gray-400 italic">Waiting for client message...</p>
              )}
              <button className="w-full px-2 py-1 mt-3 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs font-semibold disabled:bg-gray-500" onClick={useSuggestion} disabled={!suggestion || loadingSuggestion}>Use This Phrase</button>
            </div>
          </div>

          {/* Relevant Docs */}
          <div className="glass-panel p-3">
            <div className="flex items-center gap-2 mb-3"><i className="fas fa-book text-blue-400 text-sm"/><h3 className="font-semibold text-sm">Relevant Documents</h3></div>
            <div className="border rounded p-3 bg-gray-50/5 mb-3 min-h-[120px]">
              <p className="text-xs text-gray-400 mb-1"># of Docs: {relevantDocs.length}</p>
              {relevantDocs.length > 0 ? (
                <div className="space-y-2">
                  {relevantDocs.map((doc, i) => (
                    <div key={i} className="border-b border-slate-700 pb-1 mb-1">
                      <p className="text-blue-400 font-semibold text-xs">{doc.title}</p>
                      <p className="text-gray-300 text-xs">{doc.snippet}…</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 italic text-xs">No relevant documents yet.</p>
              )}
              <button className="w-full px-2 py-1 mt-3 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs font-semibold disabled:bg-gray-500" disabled>Open Document</button>
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

      {/* Mobile sticky controls (visible on small screens via CSS) */}
      <div className="mobile-controls">
        <div className="mobile-controls-inner">
          <button className="bg-yellow-500/20 text-yellow-300 rounded border border-yellow-500/30 flex flex-col items-center justify-center"><i className="fas fa-pause"/><span>Hold</span></button>
          <button className="bg-orange-500 text-white rounded flex flex-col items-center justify-center"><i className="fas fa-arrow-up"/><span>Escalate</span></button>
          <button className="bg-blue-500/20 text-blue-300 rounded border border-blue-500/30 flex flex-col items-center justify-center"><i className="fas fa-microphone-slash"/><span>Mute</span></button>
          <button className="bg-red-500 text-white rounded flex flex-col items-center justify-center"><i className="fas fa-phone-slash"/><span>End</span></button>
        </div>
      </div>

      {/* Inline custom CSS to mirror agent.html visuals */}
      <style>{`
        :root { color-scheme: dark; }
        body { background: #0a0e17; color: #e2e8f0; font-family: Inter, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif; }
        .glass-panel { background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(10px); border: 1px solid rgba(59, 130, 246, 0.15); border-radius: 8px; }
        .scrollbar-thin::-webkit-scrollbar { width: 3px; }
        .scrollbar-thin::-webkit-scrollbar-thumb { background: rgba(59, 130, 246, 0.3); border-radius: 10px; }
        .presence-dot { width: 8px; height: 8px; background: #10b981; border-radius: 50%; box-shadow: 0 0 8px rgba(16,185,129,0.6); }
        .spectrum-bar { width: 4px; background: linear-gradient(to top, #3b82f6, #06b6d4); border-radius: 2px; animation: wave 1.5s ease-in-out infinite; transform-origin: bottom; }
        @keyframes wave { 0%,100%{ transform: scaleY(0.3);} 50%{ transform: scaleY(1);} }

        /* Mobile controls */
        .mobile-controls { display: none; }
        @media (max-width: 768px) {
          html, body { height: auto !important; overflow-y: auto !important; overflow-x: hidden !important; }
          body { padding-bottom: 100px !important; }
          .mobile-grid { display: flex !important; flex-direction: column !important; height: auto !important; gap: 12px !important; overflow-y: visible !important; padding-bottom: 20px; }
          .mobile-sidebar, .mobile-transcript { width: 100% !important; max-height: none !important; overflow: visible !important; }
          .mobile-controls { position: fixed; display: block; bottom: 0; left: 0; right: 0; padding: 12px 8px; background: rgba(10,14,23,0.95); backdrop-filter: blur(10px); border-top: 1px solid rgba(59,130,246,0.15); z-index: 100; }
          .mobile-controls-inner { display: grid; grid-template-columns: repeat(4, minmax(0,1fr)); gap: 8px; }
          .mobile-controls button { font-size: 11px !important; padding: 8px 12px !important; }
        }

        /* Light mode overrides */
        body.light-mode { background: #f1f5f9; color: #1e293b; }
        body.light-mode .glass-panel { background: rgba(255,255,255,0.9); border: 1px solid rgba(148,163,184,0.3); }
        body.light-mode .text-gray-300, body.light-mode .text-gray-400 { color: #64748b !important; }
        body.light-mode .text-gray-500 { color: #475569 !important; }
        body.light-mode .mobile-controls { background: rgba(255,255,255,0.95) !important; border-top-color: rgba(148,163,184,0.3) !important; }
      `}</style>
    </div>
  );
}
