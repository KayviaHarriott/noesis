/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef } from "react";
import { sendClientMessage, subscribeToAgentReplies } from "../api/clientApi";

// Allow use of the browser SpeechRecognition API in TypeScript
declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }

  interface SpeechRecognition extends EventTarget {
    lang: string;
    continuous: boolean;
    interimResults: boolean;
    onresult: ((event: SpeechRecognitionEvent) => void) | null;
    onerror: ((event: any) => void) | null;
    onend: (() => void) | null;
    onstart: (() => void) | null;
    start: () => void;
    stop: () => void;
  }

  interface SpeechRecognitionEvent extends Event {
    resultIndex: number;
    results: SpeechRecognitionResultList;
  }
}


export const ClientDashboard = () => {
  const [messages, setMessages] = useState<string[]>([]);
  const [text, setText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const partialBuffer = useRef<string>("");

  useEffect(() => {
    const unsubscribe = subscribeToAgentReplies((msg) => {
      setMessages((prev) => [...prev, `Agent: ${msg}`]);
    });
    return unsubscribe;
  }, []);

  const handleSend = () => {
    if (text.trim()) {
      sendClientMessage(text);
      setMessages((prev) => [...prev, `You: ${text}`]);
      setText("");
    }
  };

  // 🔊 Speech recognition setup
  // 🔊 Speech recognition setup
const startListening = () => {
  const SpeechRecognition =
    window.SpeechRecognition || (window as any).webkitSpeechRecognition;
  if (!SpeechRecognition) {
    alert("Speech Recognition not supported in this browser.");
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.interimResults = true;
  recognition.continuous = true;

  let lastPartial = "";
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  recognition.onstart = () => setIsRecording(true);

  recognition.onend = () => {
    setIsRecording(false);

    // 🟢 Send final message once
    const finalText = partialBuffer.current.trim();
    if (finalText) {
      sendClientMessage(finalText);
      setMessages((prev) => [...prev, `You (final): ${finalText}`]);
      partialBuffer.current = "";
    }
  };

  recognition.onresult = (event: SpeechRecognitionEvent) => {
    let interimTranscript = "";
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        partialBuffer.current += " " + transcript;
      } else {
        interimTranscript += transcript;
      }
    }

    const currentFull = (partialBuffer.current + " " + interimTranscript).trim();
    setText(currentFull);

    // 🕐 Debounced partial sending (every ~1.2s, only if new content)
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      if (currentFull && currentFull !== lastPartial) {
        sendClientMessage(currentFull);
        lastPartial = currentFull;
      }
    }, 1200);
  };

  recognition.onerror = (event: { error: any; }) => {
    console.error("Speech recognition error:", event.error);
    setIsRecording(false);
  };

  recognitionRef.current = recognition;
  recognition.start();
};


  const stopListening = () => {
    recognitionRef.current?.stop();
    setIsRecording(false);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Client Dashboard</h1>
      <p>Speak or type your message below. Your voice will be transcribed live.</p>

      <div className="p-4">
        <h2>Client Page</h2>
        <ul className="mb-4">
          {messages.map((msg, i) => (
            <li key={i} className="border-b py-2">
              {msg}
            </li>
          ))}
        </ul>

        <textarea
          className="border p-2 w-full"
          rows={4}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Speak or type a message..."
        />

        <div className="flex gap-2 mt-2">
          <button
            className="bg-blue-500 text-white px-4 py-2"
            onClick={handleSend}
          >
            Send to Agent
          </button>

          {!isRecording ? (
            <button
              className="bg-green-500 text-white px-4 py-2"
              onClick={startListening}
            >
              🎙️ Start Speaking
            </button>
          ) : (
            <button
              className="bg-red-500 text-white px-4 py-2"
              onClick={stopListening}
            >
              ⏹️ Stop
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
