"use client";

import { useCallback, useRef, useState } from "react";

interface TestResult {
  name: string;
  inputSize: number;
  outputSize: number;
  inputWidth: number;
  inputHeight: number;
  outputWidth: number;
  outputHeight: number;
  mimeValid: boolean;
  dimensionsMatch: boolean;
  decodeSuccess: boolean;
  error?: string;
}

export function PngTest() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [running, setRunning] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(async (file: File): Promise<TestResult> => {
    const result: TestResult = {
      name: file.name,
      inputSize: file.size,
      outputSize: 0,
      inputWidth: 0,
      inputHeight: 0,
      outputWidth: 0,
      outputHeight: 0,
      mimeValid: false,
      dimensionsMatch: false,
      decodeSuccess: false,
    };

    try {
      // Step 1: createImageBitmap from file
      const bitmap = await createImageBitmap(file);
      result.inputWidth = bitmap.width;
      result.inputHeight = bitmap.height;

      // Step 2: Draw to canvas with exact dimensions
      const canvas = document.createElement("canvas");
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const ctx = canvas.getContext("2d")!;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(bitmap, 0, 0);
      bitmap.close();

      // Step 3: toBlob("image/png") — no quality parameter
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error("toBlob returned null"))),
          "image/png",
        );
      });

      // Step 4: Validate blob
      result.outputSize = blob.size;
      result.mimeValid = blob.type === "image/png" && blob.size > 0;

      // Step 5: Re-decode the output blob
      const outputBitmap = await createImageBitmap(blob);
      result.outputWidth = outputBitmap.width;
      result.outputHeight = outputBitmap.height;
      result.dimensionsMatch =
        outputBitmap.width === result.inputWidth &&
        outputBitmap.height === result.inputHeight;
      result.decodeSuccess = true;
      outputBitmap.close();
    } catch (error) {
      result.error = error instanceof Error ? error.message : String(error);
    }

    return result;
  }, []);

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      setRunning(true);
      const newResults: TestResult[] = [];
      for (let i = 0; i < files.length; i += 1) {
        newResults.push(await processFile(files[i]));
      }
      setResults((prev) => [...prev, ...newResults]);
      setRunning(false);
    },
    [processFile],
  );

  const allPass = results.length > 0 && results.every(
    (r) => r.decodeSuccess && r.mimeValid && r.dimensionsMatch && !r.error,
  );

  return (
    <div className="mx-auto max-w-2xl p-8">
      <h1 className="text-2xl font-bold mb-4">Isolated PNG Pipeline Test</h1>
      <p className="text-sm text-gray-600 mb-4">
        Uses ONLY: <code>createImageBitmap</code> → <code>canvas</code> →{" "}
        <code>drawImage</code> →         <code>toBlob(&quot;image/png&quot;)</code> → re-decode.
        No custom encoders. No WASM. No optimization.
      </p>

      <input
        ref={inputRef}
        accept="image/png"
        multiple
        onChange={(e) => handleFiles(e.target.files)}
        type="file"
      />

      <button
        className="ml-4 px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
        disabled={running}
        onClick={() => inputRef.current?.click()}
        type="button"
      >
        {running ? "Processing…" : "Select PNG Files"}
      </button>

      {results.length > 0 && (
        <div className="mt-6">
          <div
            className={`p-3 rounded mb-4 font-semibold ${
              allPass
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {allPass
              ? `ALL ${results.length} TESTS PASSED`
              : `${results.filter((r) => !r.decodeSuccess || !r.mimeValid || !r.dimensionsMatch || r.error).length} of ${results.length} FAILED`}
          </div>

          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">File</th>
                <th className="p-2">Input</th>
                <th className="p-2">Output</th>
                <th className="p-2">Dims Match</th>
                <th className="p-2">Valid PNG</th>
                <th className="p-2">Decoded</th>
                <th className="p-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r, i) => (
                <tr
                  key={`${r.name}-${i}`}
                  className={`border-b ${
                    r.error ? "bg-red-50" : "bg-green-50"
                  }`}
                >
                  <td className="p-2 truncate max-w-[200px]" title={r.name}>
                    {r.name}
                  </td>
                  <td className="p-2 text-center">
                    {r.inputWidth}×{r.inputHeight}
                    <br />
                    <span className="text-xs text-gray-500">
                      {formatSize(r.inputSize)}
                    </span>
                  </td>
                  <td className="p-2 text-center">
                    {r.outputWidth}×{r.outputHeight}
                    <br />
                    <span className="text-xs text-gray-500">
                      {formatSize(r.outputSize)}
                    </span>
                  </td>
                  <td className="p-2 text-center">
                    {r.dimensionsMatch ? "✓" : "✗"}
                  </td>
                  <td className="p-2 text-center">{r.mimeValid ? "✓" : "✗"}</td>
                  <td className="p-2 text-center">
                    {r.decodeSuccess ? "✓" : "✗"}
                  </td>
                  <td className="p-2 text-center">
                    {r.error ? (
                      <span className="text-red-600 text-xs">{r.error}</span>
                    ) : (
                      <span className="text-green-600">PASS</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
