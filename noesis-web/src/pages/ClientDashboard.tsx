import "../clientdashboard.css";
export const ClientDashboard = () => {
  // Get session ID from URL
  const urlParams = new URLSearchParams(window.location.search);
  const sessionId = urlParams.get("session");

  /* if (!sessionId) {
            document.body.innerHTML = `
                <div  className="error-message">
                    <div  className="error-title">Invalid Session</div>
                    <div  className="error-subtitle">Please use the link provided by your support agent</div>
                </div>
            `;
        }*/

  // State
  let recognition = null;
  let isRecording = false;
  let recognitionActive = false;
  let callStartTime = null;
  let timerInterval = null;

  // Initialize Speech Recognition
  if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = async (event) => {
      let interimTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          // Send final transcript to server
          await sendMessage("customer", transcript);
          document.getElementById("call-subtitle").textContent = "Listening...";
        } else {
          interimTranscript += transcript;
        }
      }

      // Show interim results
      if (interimTranscript) {
        document.getElementById("call-subtitle").textContent =
          interimTranscript;
      }
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      if (event.error !== "no-speech") {
        updateConnectionStatus(false);
      }
    };

    recognition.onend = () => {
      recognitionActive = false;
      if (isRecording) {
        try {
          recognition.start();
          recognitionActive = true;
        } catch (e) {
          console.error("Error restarting recognition:", e);
        }
      }
    };

    // Auto-start recording when page loads
    setTimeout(() => {
      if (sessionId) {
        toggleMute();
      }
    }, 500);
  }

  function toggleMute() {
    if (!recognition) {
      alert(
        "Speech recognition is not supported in your browser. Please use Chrome, Safari, or Edge."
      );
      return;
    }

    if (!isRecording) {
      startRecording();
    } else {
      stopRecording();
    }
  }

  function startRecording() {
    try {
      if (!recognitionActive) {
        recognition.start();
        recognitionActive = true;
      }
      isRecording = true;

      // Start call timer
      if (!callStartTime) {
        callStartTime = Date.now();
        timerInterval = setInterval(updateTimer, 1000);
      }

      // Update UI
      document.getElementById("mute-button").classList.add("active");
      document.getElementById("mute-icon").className = "fas fa-microphone";
      document.getElementById("mute-label").textContent = "unmute";
      document.getElementById("call-subtitle").textContent = "Listening...";

      // Animate audio bars
      const bars = document.querySelectorAll(".audio-bar");
      bars.forEach((bar) => bar.classList.add("active"));

      updateConnectionStatus(true);
    } catch (e) {
      console.error("Error starting recording:", e);
    }
  }

  function stopRecording() {
    try {
      if (recognitionActive) {
        recognition.stop();
        recognitionActive = false;
      }
      isRecording = false;

      // Update UI
      document.getElementById("mute-button").classList.remove("active");
      document.getElementById("mute-icon").className =
        "fas fa-microphone-slash";
      document.getElementById("mute-label").textContent = "mute";
      document.getElementById("call-subtitle").textContent = "Tap to speak";

      // Stop animating audio bars
      const bars = document.querySelectorAll(".audio-bar");
      bars.forEach((bar) => bar.classList.remove("active"));
    } catch (e) {
      console.error("Error stopping recording:", e);
    }
  }

  function endCall() {
    if (isRecording) {
      stopRecording();
    }

    if (timerInterval) {
      clearInterval(timerInterval);
    }

    // Show end call message
    document.body.innerHTML = `
                <div  className="error-message">
                    <div  className="error-title">Call Ended</div>
                    <div  className="error-subtitle">Thank you for contacting support. You may close this window.</div>
                </div>
            `;
  }

  function updateTimer() {
    if (!callStartTime) return;

    const elapsed = Math.floor((Date.now() - callStartTime) / 1000);
    const mins = Math.floor(elapsed / 60);
    const secs = elapsed % 60;

    document.getElementById("call-timer").textContent = `${String(
      mins
    ).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }

  async function sendMessage(role, content) {
    try {
      const response = await fetch("/api/session/message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId,
          role,
          content,
          timestamp: Date.now(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      updateConnectionStatus(true);
    } catch (error) {
      console.error("Error sending message:", error);
      updateConnectionStatus(false);
    }
  }

  function updateConnectionStatus(connected) {
    const dot = document.getElementById("status-dot");
    const text = document.getElementById("status-text");

    if (connected) {
      dot.style.background = "#30d158";
      dot.style.boxShadow = "0 0 12px rgba(48, 209, 88, 0.6)";
      text.textContent = "Connected";
    } else {
      dot.style.background = "#ff3b30";
      dot.style.boxShadow = "0 0 12px rgba(255, 59, 48, 0.6)";
      text.textContent = "Disconnected";
    }
  }

  async function checkConnection() {
    try {
      const response = await fetch(`/api/session/check?sessionId=${sessionId}`);
      if (response.ok) {
        updateConnectionStatus(true);
      } else {
        updateConnectionStatus(false);
      }
    } catch (error) {
      updateConnectionStatus(false);
    }
  }

  // Check connection every 5 seconds
  if (sessionId) {
    checkConnection();
    setInterval(checkConnection, 5000);
  }

  return (
    <div>
      <div className="blur-bg"></div>

      <div className="call-container">
        {/* Top Section */}
        <div className="call-header">
          <div className="status-badge">
            <div className="status-dot" id="status-dot"></div>
            <span id="status-text">Connected</span>
          </div>

          <div className="company-name">SUPPORT</div>
          <div className="call-title">Customer Service</div>
          <div className="call-subtitle" id="call-subtitle">
            Tap to speak
          </div>
          <div className="call-timer" id="call-timer">
            00:00
          </div>
        </div>

        {/* Middle Section - Audio Visualization */}
        <div className="audio-visualization" id="audio-viz">
          <div className="audio-bar animation-delay: 0s;"></div>
          <div className="audio-bar animation-delay: 0.1s;"></div>
          <div className="audio-bar animation-delay: 0.2s;"></div>
          <div className="audio-bar animation-delay: 0.3s;"></div>
          <div className="audio-bar animation-delay: 0.4s;"></div>
          <div className="audio-bar animation-delay: 0.5s;"></div>
          <div className="audio-bar animation-delay: 0.6s;"></div>
          <div className="audio-bar animation-delay: 0.7s;"></div>
          <div className="audio-bar animation-delay: 0.8s;"></div>
          <div className="audio-bar animation-delay: 0.9s;"></div>
          <div className="audio-bar animation-delay: 1.0s;"></div>
          <div className="audio-bar animation-delay: 1.1s;"></div>
        </div>

        {/* Bottom Section - Controls */}
        <div className="call-controls">
          <div className="control-row">
            <div className="control-item">
              <button
                className="main-button mute-button"
                id="mute-button"
                onClick={toggleMute}
              >
                <i className="fas fa-microphone" id="mute-icon"></i>
              </button>
              <div className="button-label" id="mute-label">
                mute
              </div>
            </div>
          </div>

          <div className="control-item">
            <button
              className="main-button hangup-button"
              id="hangup-button"
              onClick={endCall}
            >
              <i className="fas fa-phone"></i>
            </button>
            <div className="button-label">end call</div>
          </div>
        </div>
      </div>
    </div>
  );
};
