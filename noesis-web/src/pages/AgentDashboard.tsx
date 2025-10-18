import { useEffect, useState } from "react";
import type { AgentDetails, ClientDetails, aiCoachingResponseDetails } from "../interface/interfaces";
// import "@fortawesome/fontawesome-free/css/all.min.css";
// import "./index.css"; // Tailwind included here
// import { fetchBackendMessage } from "../api/clientApi";

export const AgentDashboard = () => {
  const [appName, setAppName] = useState("Loading...");

    const [timer, setTimer] = useState<number>(0);

  // 💙 Empathy Score (0–100)
  const [empathyScore, setEmpathyScore] = useState<number>(0);

  // 🟢 Live or not (boolean flag)
  const [isLive, setIsLive] = useState<boolean>(false);

  // 👤 Client details (object)
  const [clientDetails, setClientDetails] = useState<ClientDetails>({
    name: "John Doe",
    id: "CL-1023",
    company: "Acme Corp",
    sentiment: "Neutral",
  });

  // 🧑 Agent details (object)
  const [agentDetails, setAgentDetails] = useState<AgentDetails>({
    name: "Agent Name",
    id: "AG-4521",
    experienceLevel: "Senior",
    availability: true,
  });

  // 🤖 AI Coaching response (string or object)
  const [aiCoachingResponse, setAiCoachingResponse] = useState<aiCoachingResponseDetails>({summary: "Summary", suggestions: "Suggestions"});



  //   const [lightMode, setLightMode] = useState(false);
  //   const [settingsOpen, setSettingsOpen] = useState(false);
  useEffect(() => {
    //   fetchBackendMessage().then(setAppName);
    setAppName(import.meta.env.VITE_APP_NAME);
  }, []);

  return (
    <div>
      {/* Compact Header */}
      <div className="glass-panel p-3 mb-3">
        <div className="flex items-center justify-between mobile-header">
          <div className="flex items-center gap-3 mobile-header-left">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 via-blue-500 to-blue-400 flex items-center justify-center relative overflow-hidden shadow-lg shadow-blue-500/50">
              <svg
                className="w-6 h-6 text-white relative z-10"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Modern N letter with neural network nodes */}
                <circle cx="6" cy="6" r="2.5" fill="currentColor" />
                <circle cx="18" cy="6" r="2.5" fill="currentColor" />
                <circle cx="6" cy="18" r="2.5" fill="currentColor" />
                <circle cx="18" cy="18" r="2.5" fill="currentColor" />
                <circle
                  cx="12"
                  cy="12"
                  r="2"
                  fill="currentColor"
                  opacity="0.7"
                />
                <line
                  x1="6"
                  y1="6"
                  x2="12"
                  y2="12"
                  stroke="currentColor"
                  stroke-width="1.5"
                  opacity="0.6"
                />
                <line
                  x1="18"
                  y1="6"
                  x2="12"
                  y2="12"
                  stroke="currentColor"
                  stroke-width="1.5"
                  opacity="0.6"
                />
                <line
                  x1="6"
                  y1="18"
                  x2="12"
                  y2="12"
                  stroke="currentColor"
                  stroke-width="1.5"
                  opacity="0.6"
                />
                <line
                  x1="18"
                  y1="18"
                  x2="12"
                  y2="12"
                  stroke="currentColor"
                  stroke-width="1.5"
                  opacity="0.6"
                />
                <path
                  d="M6 6 L6 18 M18 6 L18 18"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                />
              </svg>
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-500 to-blue-400 bg-clip-text text-transparent">
                {appName}
              </h1>
              <p className="text-xs text-gray-500">
                Real-time Call Intelligence
              </p>
            </div>
          </div>
          <div className="flex items-center gap-6 mobile-header-right">
            <div className="text-center">
              <div className="text-xs text-gray-500">Empathy</div>
              <div className="text-2xl font-bold text-blue-400">{empathyScore}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-500">Time</div>
              <div className="text-xl font-bold text-blue-300">{timer}</div>
            </div>
            {/* <button onclick="toggleTheme()" className="theme-toggle w-9 h-9 rounded-lg bg-slate-800/40 hover:bg-slate-700/60 flex items-center justify-center border border-blue-500/20">
                    <i className="fas fa-sun text-yellow-400 text-sm" id="theme-icon"></i>
                </button> */}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-3 mobile-grid height: calc(100vh - 120px);">
        {/* Left Sidebar - Agent & Customer */}
        <div className="col-span-2 space-y-3 overflow-y-auto scrollbar-thin pr-1 mobile-info-cards">
          {/* Agent Info */}
          <div className="glass-panel p-3">
            <div className="flex items-center gap-2 mb-2">
              <i className="fas fa-headset text-blue-400 text-xs"></i>
              <h3 className="font-semibold text-sm">Agent</h3>
            </div>
            <div className="flex items-center gap-2 mb-3">
              <img
                src="https://ui-avatars.com/api/?name=Sarah+J&background=3b82f6&color=fff&size=32"
                className="w-8 h-8 rounded-full ring-1 ring-blue-500"
                alt="Agent"
              />
              <div>
                <div className="font-semibold text-sm text-blue-300">
                  {agentDetails.name}
                </div>
                <div className="text-xs text-gray-500">ID: {agentDetails.id}</div>
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

          {/* Customer Info */}
          <div className="glass-panel p-3">
            <div className="flex items-center gap-2 mb-2">
              <i className="fas fa-user text-cyan-400 text-xs"></i>
              <h3 className="font-semibold text-sm">Customer</h3>
            </div>
            <div className="flex items-center gap-2 mb-3">
              <img
                src="https://ui-avatars.com/api/?name=Michael+C&background=06b6d4&color=fff&size=32"
                className="w-8 h-8 rounded-full ring-1 ring-cyan-500"
                alt="Customer"
              />
              <div>
                <div className="font-semibold text-sm text-cyan-300">
                  Michael C.
                </div>
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
                  Frustrated
                </span>
              </div>
            </div>
          </div>

          {/* Customer Voice Metrics */}
          <div className="glass-panel p-3 mobile-voice">
            <div className="flex items-center gap-2 mb-2">
              <i className="fas fa-waveform text-purple-400 text-xs"></i>
              <h3 className="font-semibold text-sm">Customer Voice</h3>
            </div>
            <div className="flex items-center h-12 bg-slate-900/30 rounded mb-2 px-2">
              <div className="flex items-end gap-0.5 w-full justify-between">
                <div className="wave-bar"></div>
                <div className="wave-bar"></div>
                <div className="wave-bar"></div>
                <div className="wave-bar"></div>
                <div className="wave-bar"></div>
                <div className="wave-bar"></div>
                <div className="wave-bar"></div>
                <div className="wave-bar"></div>
                <div className="wave-bar"></div>
                <div className="wave-bar"></div>
                <div className="wave-bar"></div>
                <div className="wave-bar"></div>
                <div className="wave-bar"></div>
                <div className="wave-bar"></div>
                <div className="wave-bar"></div>
                <div className="wave-bar"></div>
                <div className="wave-bar"></div>
                <div className="wave-bar"></div>
                <div className="wave-bar"></div>
                <div className="wave-bar"></div>
                <div className="wave-bar"></div>
                <div className="wave-bar"></div>
                <div className="wave-bar"></div>
                <div className="wave-bar"></div>
                <div className="wave-bar"></div>
              </div>
            </div>
            <div className="space-y-2 text-xs">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-gray-400">Stress Level</span>
                  <span className="text-orange-400 font-semibold">High</span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-1">
                  <div className="bg-orange-500 h-1 rounded-full width: 75%"></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-gray-400">Clarity</span>
                  <span className="text-green-400 font-semibold">Good</span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-1">
                  <div className="bg-green-500 h-1 rounded-full width: 88%"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Center - Transcript & Controls */}
        <div className="col-span-8 flex flex-col gap-3 mobile-transcript">
          {/* Emotion Bar */}
          <div className="glass-panel p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-4 text-xs">
                <div>
                  <span className="text-gray-400">Frustration</span>
                  <span className="ml-2 font-bold text-red-400">75%</span>
                </div>
                <div>
                  <span className="text-gray-400">Confusion</span>
                  <span className="ml-2 font-bold text-yellow-400">42%</span>
                </div>
                <div>
                  <span className="text-gray-400">Hope</span>
                  <span className="ml-2 font-bold text-green-400">28%</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-gray-400">LIVE</span>
              </div>
            </div>
            <div className="emotion-indicator"></div>
          </div>

          {/* Live Transcript */}
          <div className="glass-panel p-3 flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <i className="fas fa-comment-dots text-green-400 text-sm"></i>
                <h3 className="font-semibold text-sm">Live Transcript</h3>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-thin space-y-2">
              {/* Customer Message */}
              <div className="p-2 rounded bg-slate-800/40 border-l-2 border-red-500">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-red-300">
                    Customer
                  </span>
                  <span className="text-xs text-gray-500">05:39</span>
                </div>
                <p className="text-sm text-gray-200">
                  "This is unacceptable! I've been charged twice and I've called
                  three times already."
                </p>
              </div>

              {/* Agent Message */}
              <div className="p-2 rounded bg-slate-800/40 border-l-2 border-blue-500">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-blue-300">
                    Agent (You)
                  </span>
                  <span className="text-xs text-gray-500">05:40</span>
                </div>
                <p className="text-sm text-gray-200">
                  "I completely understand your frustration, Michael. Let me
                  prioritize fixing this for you right now."
                </p>
              </div>

              {/* Customer Response */}
              <div className="p-2 rounded bg-slate-800/40 border-l-2 border-yellow-500">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-yellow-300">
                    Customer
                  </span>
                  <span className="text-xs text-gray-500">05:42</span>
                </div>
                <p className="text-sm text-gray-200">
                  "I've heard that before. The last agent said it would be fixed
                  in 48 hours."
                </p>
              </div>

              {/* Typing */}
              <div className="p-2 rounded bg-slate-800/40 border-l-2 border-blue-500">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-blue-300">
                    Agent (You)
                  </span>
                  <div className="flex gap-1 ml-2">
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce animation-delay: 0.1s"></div>
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce animation-delay: 0.2s"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Compact Controls */}
          <div className="glass-panel p-2 hide-mobile">
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <button className="px-4 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 font-semibold rounded text-sm transition flex items-center gap-2 border border-yellow-500/30">
                  <i className="fas fa-pause text-xs"></i>
                  Hold
                </button>
                <button className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded text-sm transition flex items-center gap-2">
                  <i className="fas fa-arrow-up text-xs"></i>
                  Escalate
                </button>
                <button className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 font-semibold rounded text-sm transition border border-purple-500/30 flex items-center gap-2">
                  <i className="fas fa-user-plus text-xs"></i>
                  Transfer
                </button>
              </div>
              <div className="flex gap-2">
                <button className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 font-semibold rounded text-sm transition border border-blue-500/30 flex items-center gap-2">
                  <i className="fas fa-microphone-slash text-xs"></i>
                  Mute
                </button>
                <button className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded text-sm transition flex items-center gap-2">
                  <i className="fas fa-phone-slash text-xs"></i>
                  End
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar - AI Suggestions */}
        <div className="col-span-2 flex flex-col gap-3 overflow-y-auto scrollbar-thin pr-1">
          {/* AI Coaching */}
          <div className="glass-panel p-3">
            <div className="flex items-center gap-2 mb-3">
              <i className="fas fa-lightbulb text-yellow-400 text-sm"></i>
              <h3 className="font-semibold text-sm">AI Coaching</h3>
            </div>

            <div className="space-y-2">
              {/* Critical Alert */}
              <div className="p-2 rounded bg-gradient-to-br from-red-500/10 to-orange-500/10 border border-red-500/30">
                <div className="flex items-start gap-2 mb-2">
                  <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-exclamation text-white text-xs"></i>
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-semibold text-red-300 mb-1">
                      {aiCoachingResponse.summary}
                    </div>
                    <p className="text-xs text-gray-300 mb-2">
                      {aiCoachingResponse.suggestions}
                    </p>
                    <button className="w-full px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs font-semibold">
                      Use This Phrase
                    </button>
                  </div>
                </div>
              </div>

              {/* Tone Guidance */}
              <div className="p-2 rounded bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/30">
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-volume-down text-white text-xs"></i>
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-semibold text-blue-300 mb-1">
                      Adjust Tone
                    </div>
                    <ul className="text-xs text-gray-300 space-y-1">
                      <li>• Slow speech by 15%</li>
                      <li>• Use warmer tone</li>
                      <li>• Lower volume slightly</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Trust Building */}
              <div className="p-2 rounded bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/30">
                <div className="flex items-start gap-2 mb-2">
                  <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-heart text-white text-xs"></i>
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-semibold text-green-300 mb-1">
                      Build Trust
                    </div>
                    <p className="text-xs text-gray-300 mb-2">
                      "I'm going to stay on this call with you until we see the
                      resolution. You have my word."
                    </p>
                    <button className="w-full px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs font-semibold">
                      Use This Phrase
                    </button>
                  </div>
                </div>
              </div>

              {/* Knowledge Base */}
              <div className="p-2 rounded bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30">
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-book text-white text-xs"></i>
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-semibold text-purple-300 mb-1">
                      KB Article
                    </div>
                    <p className="text-xs text-gray-300 mb-1">
                      Double Billing Resolution
                    </p>
                    <button className="text-xs text-purple-400 hover:text-purple-300">
                      View Protocol →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="glass-panel p-3">
            <div className="text-xs font-semibold text-gray-400 mb-2">
              This Call
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="text-center p-2 bg-slate-800/30 rounded">
                <div className="text-gray-400 text-xs">Response Quality</div>
                <div className="text-lg font-bold text-blue-400">92%</div>
              </div>
              <div className="text-center p-2 bg-slate-800/30 rounded">
                <div className="text-gray-400 text-xs">Predicted CSAT</div>
                <div className="text-lg font-bold text-yellow-400">8.5</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Controls (sticky at bottom) */}
      <div className="mobile-controls">
        <div className="mobile-controls-inner">
          <button className="bg-yellow-500/20 text-yellow-300 rounded border border-yellow-500/30 flex flex-col items-center justify-center">
            <i className="fas fa-pause"></i>
            <span>Hold</span>
          </button>
          <button className="bg-orange-500 text-white rounded flex flex-col items-center justify-center">
            <i className="fas fa-arrow-up"></i>
            <span>Escalate</span>
          </button>
          <button className="bg-blue-500/20 text-blue-300 rounded border border-blue-500/30 flex flex-col items-center justify-center">
            <i className="fas fa-microphone-slash"></i>
            <span>Mute</span>
          </button>
          <button className="bg-red-500 text-white rounded flex flex-col items-center justify-center">
            <i className="fas fa-phone-slash"></i>
            <span>End</span>
          </button>
        </div>
      </div>

      {/* <script>
        // Theme toggle function
        function toggleTheme() {
            const body = document.body;
            const themeIcon = document.getElementById('theme-icon');
            
            body.classList.toggle('light-mode');
            
            if (body.classList.contains('light-mode')) {
                themeIcon.classList.remove('fa-sun');
                themeIcon.classList.add('fa-moon');
                themeIcon.classList.remove('text-yellow-400');
                themeIcon.classList.add('text-blue-600');
                localStorage.setItem('theme', 'light');
            } else {
                themeIcon.classList.remove('fa-moon');
                themeIcon.classList.add('fa-sun');
                themeIcon.classList.remove('text-blue-600');
                themeIcon.classList.add('text-yellow-400');
                localStorage.setItem('theme', 'dark');
            }
        }

        // Load saved theme on page load
        document.addEventListener('DOMContentLoaded', () => {
            const savedTheme = localStorage.getItem('theme');
            if (savedTheme === 'light') {
                toggleTheme();
            }
        });

        // Simple real-time simulation
        setInterval(() => {
            // Update empathy score
            const score = (7 + Math.random() * 2).toFixed(1);
            document.querySelectorAll('.text-2xl.font-bold.text-blue-400').forEach(el => {
                if (el.textContent.length < 5) el.textContent = score;
            });

            // Update emotion percentages
            const emotions = document.querySelectorAll('.emotion-indicator').length > 0;
            if (emotions) {
                const frustration = Math.floor(70 + Math.random() * 10);
                const confusion = Math.floor(40 + Math.random() * 10);
                const hope = Math.floor(25 + Math.random() * 10);
            }
        }, 5000);
    </script> */}
    </div>
  );
};
