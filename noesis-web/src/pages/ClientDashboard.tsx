import { useState, useEffect } from "react";
import { sendClientMessage, subscribeToAgentReplies } from "../api/clientApi";

export const ClientDashboard = () => {
  const [messages, setMessages] = useState<string[]>([]);
  const [text, setText] = useState("");

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

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Client Dashboard</h1>
      <p>Welcome to the Client Dashboard. Here you can view your projects and track progress.</p>

      <div className="p-4">
      <h2>Client Page</h2>
      <ul className="mb-4">
        {messages.map((msg, i) => (
          <li key={i} className="border-b py-2">{msg}</li>
        ))}
      </ul>
      <textarea
        className="border p-2 w-full"
        rows={4}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Speak or type a message..."
      />
      <button
        className="bg-blue-500 text-white px-4 py-2 mt-2"
        onClick={handleSend}
      >
        Send to Agent
      </button>
    </div>

    </div>
  );
}
