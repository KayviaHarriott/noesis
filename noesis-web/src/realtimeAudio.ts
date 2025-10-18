// src/realtimeAudio.ts
export type Role = "client" | "agent";

export class VoiceSocket {
  ws: WebSocket | null = null;
  url: string;
  sessionId: string;
  role: Role;

  // Playback pipeline
  mediaSource: MediaSource;
  sourceBuffer: SourceBuffer | null = null;
  mime = 'audio/webm;codecs=opus';
  audioEl: HTMLAudioElement;

  // Capture pipeline
  mediaStream: MediaStream | null = null;
  recorder: MediaRecorder | null = null;

  constructor({ url, sessionId, role, audioEl }: { url: string; sessionId: string; role: Role; audioEl: HTMLAudioElement; }) {
    this.url = url;
    this.sessionId = sessionId;
    this.role = role;

    this.mediaSource = new MediaSource();
    this.audioEl = audioEl;
    this.audioEl.src = URL.createObjectURL(this.mediaSource);

    this.mediaSource.addEventListener("sourceopen", () => {
      if (MediaSource.isTypeSupported(this.mime)) {
        this.sourceBuffer = this.mediaSource.addSourceBuffer(this.mime);
        this.sourceBuffer.mode = "sequence";
      } else {
        console.error("Codec not supported:", this.mime);
      }
    });
  }

  connect() {
    this.ws = new WebSocket(this.url);
    this.ws.binaryType = "arraybuffer";

    this.ws.onopen = () => {
      this.send({ type: "hello", sessionId: this.sessionId, role: this.role });
    };

    // We’ll get a small JSON header immediately followed by a binary frame.
    // Browsers deliver frames in order; we buffer the binary in a small queue.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let pendingMeta: any = null;

    this.ws.onmessage = async (evt) => {
      if (typeof evt.data === "string") {
        const msg = JSON.parse(evt.data);
        if (msg.type === "audio-chunk") {
          pendingMeta = msg; // next frame is binary
        } else if (msg.type === "stt") {
          // bubble up a DOM event for transcripts
          this.audioEl.dispatchEvent(new CustomEvent("stt", { detail: msg }));
        }
        // handle other control msgs as needed
      } else if (evt.data instanceof ArrayBuffer) {
        if (pendingMeta?.type === "audio-chunk") {
          const chunk = new Uint8Array(evt.data);
          this.appendChunk(chunk);
          pendingMeta = null;
        }
      }
    };
  }

  //@ts-check
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  send(obj: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(obj));
    }
  }

  async startCapture(timeslice = 250) {
    this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.recorder = new MediaRecorder(this.mediaStream, { mimeType: this.mime });

    this.recorder.ondataavailable = (ev) => {
      if (ev.data && ev.data.size > 0 && this.ws?.readyState === WebSocket.OPEN) {
        ev.data.arrayBuffer().then((buf) => this.ws!.send(buf));
      }
    };

    this.recorder.start(timeslice); // send chunks every N ms
  }

  stopCapture() {
    this.recorder?.stop();
    this.mediaStream?.getTracks().forEach(t => t.stop());
    this.recorder = null;
    this.mediaStream = null;
  }

  appendChunk(chunk: Uint8Array) {
    if (!this.sourceBuffer || this.sourceBuffer.updating) return queueMicrotask(() => this.appendChunk(chunk));
    try {
      this.sourceBuffer.appendBuffer(chunk);
      if (this.audioEl.paused) this.audioEl.play().catch(() => {});
    } catch (e) {
      console.error("appendBuffer failed:", e);
    }
  }

  close() {
    this.send({ type: "bye" });
    this.ws?.close();
    this.stopCapture();
    if (this.mediaSource.readyState === "open") this.mediaSource.endOfStream();
  }
}
