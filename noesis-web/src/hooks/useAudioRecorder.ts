import { useEffect, useRef, useState } from "react";

/**
 * Records microphone audio and streams chunks every few seconds to backend.
 * When stopped, calls onStopCallback with the final full audio blob.
 */
export function useAudioRecorder(
  onStopCallback?: (audioBlob: Blob) => void,
  role: "client" | "agent" = "client"
) {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [silenceDetected, setSilenceDetected] = useState(false);

  // Sends a small audio chunk to backend for partial transcription/emotion
  const sendPartialAudioChunk = async (blob: Blob) => {
    try {
      const formData = new FormData();
      formData.append("audio", blob, "chunk.webm");
      formData.append("role", role);

      await fetch("https://hackathonpractice-backend.onrender.com/api/stream-audio-chunk", {
        method: "POST",
        body: formData,
      });
    } catch (err) {
      console.error("Failed to send audio chunk:", err);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = recorder;

      // Optional: setup silence detection
      audioContextRef.current = new AudioContext();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      const analyser = audioContextRef.current.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      const chunks: Blob[] = [];
      const INTERVAL = 3000; // 3 seconds per chunk

      // Whenever recorder emits data, push chunk and send it
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunks.push(e.data);
          sendPartialAudioChunk(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        setAudioBlob(blob);
        if (onStopCallback) onStopCallback(blob);
        setRecording(false);
      };

      recorder.start(INTERVAL);
      setRecording(true);

      // Optional silence detection (auto-stop)
      detectSilence(analyser, () => stopRecording());
    } catch (err) {
      console.error("Error accessing microphone:", err);
    }
  };

  const stopRecording = () => {
    try {
      mediaRecorderRef.current?.stop();
      setRecording(false);
      setSilenceDetected(false);
      audioContextRef.current?.close();
    } catch (err) {
      console.error("Error stopping recorder:", err);
    }
  };

  /**
   * Optional — detect long silence using amplitude threshold.
   */
  const detectSilence = (analyser: AnalyserNode, onSilence: () => void) => {
    const data = new Uint8Array(analyser.fftSize);
    let silenceStart = performance.now();
    const SILENCE_THRESHOLD = 0.01; // normalized RMS
    const SILENCE_DURATION = 5000; // 5 seconds of silence before stopping

    const check = () => {
      analyser.getByteTimeDomainData(data);
      let sumSquares = 0;
      for (let i = 0; i < data.length; i++) {
        const norm = (data[i] - 128) / 128;
        sumSquares += norm * norm;
      }
      const rms = Math.sqrt(sumSquares / data.length);

      if (rms < SILENCE_THRESHOLD) {
        if (performance.now() - silenceStart > SILENCE_DURATION && recording) {
          setSilenceDetected(true);
          console.log("Silence detected — stopping recording");
          onSilence();
          return;
        }
      } else {
        silenceStart = performance.now();
      }

      if (recording) requestAnimationFrame(check);
    };
    requestAnimationFrame(check);
  };

  // Cleanup audio context on unmount
  useEffect(() => {
    return () => {
      stopRecording();
    };
  }, []);

  return {
    recording,
    audioBlob,
    startRecording,
    stopRecording,
    silenceDetected,
  };
}
