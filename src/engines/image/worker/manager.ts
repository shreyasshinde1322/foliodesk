import { ImageProcessingError } from "../types";

export interface PsdDecodeRequest {
  kind: "psd-decode";
  buffer: ArrayBuffer;
}

export type WorkerRequest = PsdDecodeRequest;

export interface WorkerResponse<T = unknown> {
  id: number;
  ok: boolean;
  result?: T;
  message?: string;
  code?: string;
}

let workerPromise: Promise<Worker> | null = null;
let nextId = 1;
const pending = new Map<number, { resolve: (value: unknown) => void; reject: (error: Error) => void }>();

function postError(reject: (error: Error) => void): void {
  reject(new ImageProcessingError("The background worker failed to start.", "worker-failed"));
}

export async function getWorker(): Promise<Worker> {
  if (!workerPromise) {
    workerPromise = new Promise<Worker>((resolve, reject) => {
      try {
        const worker = new Worker(new URL("./image.worker.ts", import.meta.url), { type: "module" });
        worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
          const message = event.data;
          const handler = pending.get(message.id);
          if (!handler) return;
          pending.delete(message.id);
          if (message.ok) {
            handler.resolve(message.result);
          } else {
            handler.reject(
              new ImageProcessingError(
                message.message ?? "The background worker failed.",
                message.code ?? "worker-failed",
              ),
            );
          }
        };
        worker.onerror = () => {
          for (const [, handler] of pending) handler.reject(new ImageProcessingError("The background worker stopped unexpectedly.", "worker-failed"));
          pending.clear();
          workerPromise = null;
          reject(new ImageProcessingError("The background worker stopped unexpectedly.", "worker-failed"));
        };
        resolve(worker);
      } catch {
        workerPromise = null;
        postError(reject);
      }
    });
  }
  return workerPromise;
}

export async function callWorker<T>(request: WorkerRequest): Promise<T> {
  const worker = await getWorker();
  const id = nextId;
  nextId += 1;
  const full = { ...request, id };
  return new Promise<T>((resolve, reject) => {
    pending.set(id, { resolve: resolve as (value: unknown) => void, reject });
    const transfers: Transferable[] = [];
    if (full.kind === "psd-decode") transfers.push(full.buffer);
    worker.postMessage(full, transfers);
  });
}

/** Shut the worker down (page unload, component unmount, or error recovery). */
export function terminateWorkers(): void {
  if (workerPromise) {
    workerPromise.then((worker) => worker.terminate()).catch(() => undefined);
    workerPromise = null;
  }
  for (const [, handler] of pending) {
    handler.reject(new ImageProcessingError("Conversion cancelled.", "cancelled"));
  }
  pending.clear();
}
