import "../clientdashboard.css";
import { useEffect, useRef, useState } from "react";
import { VoiceSocket } from "../realtimeAudio";

export const ClientDashboard = () => {
  const [sessionId] = useState(() => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get("session") || crypto.randomUUID();
  });

  const audioRef = useRef<HTMLAudioElement>(null);
  const voiceRef = useRef<VoiceSocket | null>(null);
  const [recording, setRecording] = useState(false);
  const [connected, setConnected] = useState(false);
  const [subtitle, setSubtitle] = useState("Tap to speak");
  const [timer, setTimer] = useState("00:00");
  const [callStartTime, setCallStartTime] = useState<number | null>(null);

  // --- VoiceSocket setup ---
  useEffect(() => {
    if (!audioRef.current) return;
    const v = new VoiceSocket({
      url: (location.protocol === "https:" ? "wss://" : "ws://") + location.host.replace(/:\d+$/, "") + ":3001",
      sessionId,
      role: "client",
      audioEl: audioRef.current,
    });
    voiceRef.current = v;
    v.connect();
    return () => v.close();
  }, [sessionId]);

  // --- Speech Recognition setup ---
 useEffect(() => {
  if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) return;

  type SpeechRecognitionEventLike = {
    resultIndex: number;
    results: SpeechRecognitionResultList;
  };

  const SpeechRecognition =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  const recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = "en-US";

  recognition.onresult = async (event: SpeechRecognitionEventLike) => {
    let interim = "";
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        await sendMessage("customer", transcript);
        setSubtitle("Listening...");
      } else {
        interim += transcript;
      }
    }
    if (interim) setSubtitle(interim);
  };

  recognition.onerror = (e: any) => console.error("Speech error:", e.error);

  if (recording) recognition.start();
  return () => recognition.stop();
}, [recording]);


  // --- Timer handling ---
  useEffect(() => {
    if (!callStartTime) return;
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - callStartTime) / 1000);
      const mins = Math.floor(elapsed / 60);
      const secs = elapsed % 60;
      setTimer(`${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`);
    }, 1000);
    return () => clearInterval(interval);
  }, [callStartTime]);

  async function sendMessage(role: string, content: string) {
    try {
      const res = await fetch("/api/session/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, role, content, timestamp: Date.now() }),
      });
      setConnected(res.ok);
    } catch {
      setConnected(false);
    }
  }

  function toggleMute() {
    if (recording) {
      setRecording(false);
      voiceRef.current?.stopCapture();
      setSubtitle("Tap to speak");
    } else {
      setRecording(true);
      voiceRef.current?.startCapture(250);
      if (!callStartTime) setCallStartTime(Date.now());
      setSubtitle("Listening...");
    }
  }

  function endCall() {
    voiceRef.current?.close();
    setRecording(false);
    setSubtitle("Call ended");
  }

  return (
    <div>
      <div className="blur-bg"></div>
      <div className="call-container">
        <div className="call-header">
          <div className="status-badge">
            <div
              className="status-dot"
              style={{
                background: connected ? "#30d158" : "#ff3b30",
                boxShadow: connected
                  ? "0 0 12px rgba(48, 209, 88, 0.6)"
                  : "0 0 12px rgba(255, 59, 48, 0.6)",
              }}
            ></div>
            <span>{connected ? "Connected" : "Disconnected"}</span>
          </div>
          <div className="company-name">SUPPORT</div>
          <div className="call-title">Customer Service</div>
          <div className="call-subtitle">{subtitle}</div>
          <div className="call-timer">{timer}</div>
        </div>

        <div className="audio-visualization">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className={`audio-bar ${recording ? "active" : ""}`} />
          ))}
        </div>

        <div className="call-controls">
          <div className="control-row">
            <div className="control-item">
              <button className="main-button mute-button" onClick={toggleMute}>
                <i className={`fas ${recording ? "fa-microphone" : "fa-microphone-slash"}`}></i>
              </button>
              <div className="button-label">{recording ? "unmute" : "mute"}</div>
            </div>
          </div>
          <div className="control-item">
            <button className="main-button hangup-button" onClick={endCall}>
              <i className="fas fa-phone"></i>
            </button>
            <div className="button-label">end call</div>
          </div>
        </div>
      </div>
      <audio ref={audioRef} hidden />
    </div>
  );
};
