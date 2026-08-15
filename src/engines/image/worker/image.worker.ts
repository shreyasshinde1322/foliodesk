/// <reference lib="webworker" />

import { ImageProcessingError } from "../types";

interface PsdPayload {
  width: number;
  height: number;
  data: Uint8ClampedArray;
}

interface MessageEventWithData extends MessageEvent {
  data: {
    id: number;
    kind: string;
    buffer?: ArrayBuffer;
  };
}

self.onmessage = async (event: MessageEventWithData) => {
  const request = event.data;
  const id = request.id;
  try {
    if (request.kind === "psd-decode") {
      if (!request.buffer) throw new ImageProcessingError("PSD data missing.", "worker-failed");
      const { default: Psd } = await import("@webtoon/psd");
      const psd = Psd.parse(request.buffer);
      const rgba = await psd.composite();
      const result: PsdPayload = { width: psd.width, height: psd.height, data: rgba };
      self.postMessage({ id, ok: true, result }, [rgba.buffer]);
    } else {
      self.postMessage({ id, ok: false, message: "Unknown worker request.", code: "worker-failed" });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "The worker task failed.";
    const code = error instanceof ImageProcessingError ? error.code : "worker-failed";
    self.postMessage({ id, ok: false, message, code });
  }
};
