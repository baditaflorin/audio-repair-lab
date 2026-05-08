import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BadgeCheck,
  Bandage,
  Download,
  Github,
  HeartHandshake,
  Mic,
  Mic2,
  Play,
  Radio,
  SlidersHorizontal,
  Square,
  Upload,
  WandSparkles,
  Waves
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Waveform } from "./components/Waveform";
import { audioDataToObjectUrl, decodeAudioFile, encodeWav } from "./features/audio/lib/audioFile";
import { detectCapabilities } from "./features/audio/lib/capabilities";
import { createDemoClip } from "./features/audio/lib/demo";
import { defaultSettings } from "./features/audio/lib/defaults";
import { computeStats, getDurationSeconds } from "./features/audio/lib/stats";
import { createSession, getRecentSessions, saveSession } from "./features/audio/lib/storage";
import { createAudioProcessor } from "./features/audio/workers/client";
import type {
  AudioData,
  ProcessResult,
  ProcessSettings,
  ProcessingMode
} from "./features/audio/types";

const buildInfo = {
  version: __APP_VERSION__,
  commit: __APP_COMMIT__,
  builtAt: __APP_BUILT_AT__,
  repoUrl: __APP_REPO_URL__,
  supportUrl: __APP_SUPPORT_URL__
};

const modeOptions: Array<{
  value: ProcessingMode;
  label: string;
  icon: typeof WandSparkles;
}> = [
  { value: "noise", label: "Clean", icon: WandSparkles },
  { value: "vocal", label: "Vocals", icon: Mic2 },
  { value: "repair", label: "Repair", icon: Bandage },
  { value: "chain", label: "Chain", icon: SlidersHorizontal }
];

export function App() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const processorRef = useRef(createAudioProcessor());
  const [audio, setAudio] = useState<AudioData | undefined>();
  const [originalUrl, setOriginalUrl] = useState<string | undefined>();
  const [processed, setProcessed] = useState<(ProcessResult & { name: string }) | undefined>();
  const [processedUrl, setProcessedUrl] = useState<string | undefined>();
  const [settings, setSettings] = useState<ProcessSettings>(defaultSettings);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [elapsedMs, setElapsedMs] = useState<number | undefined>();
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const capabilities = useQuery({
    queryKey: ["capabilities"],
    queryFn: detectCapabilities
  });

  const recentSessions = useQuery({
    queryKey: ["recent-sessions"],
    queryFn: getRecentSessions
  });

  useEffect(() => () => processorRef.current.dispose(), []);

  useEffect(() => {
    return () => {
      if (originalUrl) URL.revokeObjectURL(originalUrl);
    };
  }, [originalUrl]);

  useEffect(() => {
    return () => {
      if (processedUrl) URL.revokeObjectURL(processedUrl);
    };
  }, [processedUrl]);

  const sourceStats = useMemo(() => (audio ? computeStats(audio) : undefined), [audio]);

  async function persistSession(nextAudio: AudioData, nextSettings: ProcessSettings) {
    const session = createSession({
      fileName: nextAudio.name,
      durationSeconds: getDurationSeconds(nextAudio),
      sampleRate: nextAudio.sampleRate,
      settings: nextSettings
    });
    await saveSession(session);
    await queryClient.invalidateQueries({ queryKey: ["recent-sessions"] });
  }

  async function loadFile(file: File) {
    setError(undefined);
    setProcessed(undefined);
    setElapsedMs(undefined);
    if (processedUrl) URL.revokeObjectURL(processedUrl);
    setProcessedUrl(undefined);

    try {
      const decoded = await decodeAudioFile(file);
      if (originalUrl) URL.revokeObjectURL(originalUrl);
      setAudio(decoded);
      setOriginalUrl(URL.createObjectURL(file));
      await persistSession(decoded, settings);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not decode that audio file.");
    }
  }

  async function loadDemo() {
    setError(undefined);
    setProcessed(undefined);
    setElapsedMs(undefined);
    if (processedUrl) URL.revokeObjectURL(processedUrl);
    const demo = createDemoClip();
    const url = audioDataToObjectUrl(demo);
    if (originalUrl) URL.revokeObjectURL(originalUrl);
    setAudio(demo);
    setOriginalUrl(url);
    await persistSession(demo, settings);
  }

  async function startRecording() {
    setError(undefined);
    audioChunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: recorder.mimeType });
        const extension = recorder.mimeType.includes("webm") ? "webm" : "wav";
        const file = new File([blob], `recording.${extension}`, { type: recorder.mimeType });
        await loadFile(file);
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      setIsRecording(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not access microphone.");
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }

  async function processCurrentAudio() {
    if (!audio) {
      setError("Import audio or generate the demo clip first.");
      return;
    }

    setIsProcessing(true);
    setError(undefined);
    const startedAt = performance.now();

    try {
      const result = await processorRef.current.api.process(audio, settings);
      const name = processedName(audio.name, settings.mode);
      if (processedUrl) URL.revokeObjectURL(processedUrl);
      setProcessed({ ...result, name });
      setProcessedUrl(audioDataToObjectUrl(result));
      setElapsedMs(performance.now() - startedAt);
      await persistSession(audio, settings);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Processing failed.");
    } finally {
      setIsProcessing(false);
    }
  }

  function exportProcessed() {
    if (!processed) return;
    const blob = encodeWav(processed);
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = processed.name;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function updateSettings(next: Partial<ProcessSettings>) {
    setSettings((current) => ({ ...current, ...next }));
  }

  const disabled = isProcessing || !audio;

  return (
    <div className="min-h-screen bg-ink text-slate-100">
      <header className="border-b border-line bg-panel">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-md border border-line bg-ink text-mint">
              <Waves aria-hidden="true" size={24} />
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-normal">Audio Repair Lab</h1>
              <p className="text-sm text-slate-400">Local audio cleanup for podcasts and music</p>
            </div>
          </div>
          <nav className="flex flex-wrap items-center gap-2">
            <a className="tool-link" href={buildInfo.repoUrl} target="_blank" rel="noreferrer">
              <Github aria-hidden="true" size={18} />
              Star on GitHub
            </a>
            <a
              className="tool-link accent"
              href={buildInfo.supportUrl}
              target="_blank"
              rel="noreferrer"
            >
              <HeartHandshake aria-hidden="true" size={18} />
              PayPal
            </a>
          </nav>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-7xl gap-4 px-4 py-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_390px]">
        {error ? (
          <section className="lg:col-span-2 rounded-md border border-rose/60 bg-rose/10 px-4 py-3 text-sm text-rose-100">
            {error}
          </section>
        ) : null}

        <section className="panel">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="panel-title">Source and Preview</h2>
              <p className="panel-kicker">{audio ? audio.name : "No source loaded"}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <input
                ref={fileInputRef}
                className="hidden"
                type="file"
                accept="audio/*,.wav,.mp3,.m4a,.flac,.ogg"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void loadFile(file);
                  event.currentTarget.value = "";
                }}
              />
              <button
                className={`button secondary ${isRecording ? "recording-pulse" : ""}`}
                type="button"
                onClick={isRecording ? stopRecording : startRecording}
              >
                {isRecording ? (
                  <Square className="text-rose-500" aria-hidden="true" size={18} />
                ) : (
                  <Mic aria-hidden="true" size={18} />
                )}
                {isRecording ? "Stop" : "Record"}
              </button>
              <button
                className="button secondary"
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isRecording}
              >
                <Upload aria-hidden="true" size={18} />
                Import
              </button>
              <button
                className="button secondary"
                type="button"
                onClick={() => void loadDemo()}
                disabled={isRecording}
              >
                <Radio aria-hidden="true" size={18} />
                Demo
              </button>
            </div>
          </div>

          <div
            className="mt-4"
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              const file = event.dataTransfer.files[0];
              if (file) void loadFile(file);
            }}
          >
            <Waveform audio={audio} processed={processed} />
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="media-strip">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Play aria-hidden="true" size={16} />
                Original
              </div>
              {originalUrl ? (
                <audio className="w-full" controls src={originalUrl} />
              ) : (
                <div className="audio-empty" />
              )}
            </div>
            <div className="media-strip">
              <div className="flex items-center gap-2 text-sm font-medium">
                <BadgeCheck aria-hidden="true" size={16} />
                Processed
              </div>
              {processedUrl ? (
                <audio className="w-full" controls src={processedUrl} />
              ) : (
                <div className="audio-empty" />
              )}
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Metric
              label="Duration"
              value={sourceStats ? formatDuration(sourceStats.durationSeconds) : "--"}
            />
            <Metric label="Source RMS" value={sourceStats ? sourceStats.rms.toFixed(3) : "--"} />
            <Metric
              label="Output peak"
              value={processed ? processed.stats.peak.toFixed(3) : "--"}
            />
            <Metric label="Render" value={elapsedMs ? `${Math.round(elapsedMs)} ms` : "--"} />
          </div>

          {processed ? (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-md border border-line bg-panel2 px-3 py-3">
              <div className="text-sm text-slate-300">
                {processed.operations.join(" + ")}
                {processed.warnings.length ? ` | ${processed.warnings.join(" ")}` : ""}
              </div>
              <button className="button" type="button" onClick={exportProcessed}>
                <Download aria-hidden="true" size={18} />
                Export WAV
              </button>
            </div>
          ) : null}
        </section>

        <aside className="panel">
          <h2 className="panel-title">Repair Rack</h2>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {modeOptions.map((option) => {
              const Icon = option.icon;
              return (
                <button
                  key={option.value}
                  type="button"
                  className={settings.mode === option.value ? "mode active" : "mode"}
                  onClick={() => updateSettings({ mode: option.value })}
                >
                  <Icon aria-hidden="true" size={18} />
                  {option.label}
                </button>
              );
            })}
          </div>

          <div className="mt-5 space-y-4">
            <Slider
              label="Noise reduction"
              value={settings.noiseReduction}
              onChange={(noiseReduction) => updateSettings({ noiseReduction })}
            />
            <Slider
              label="Noise sensitivity"
              value={settings.noiseSensitivity}
              onChange={(noiseSensitivity) => updateSettings({ noiseSensitivity })}
            />
            <Slider
              label="Vocal strength"
              value={settings.vocalStrength}
              onChange={(vocalStrength) => updateSettings({ vocalStrength })}
            />
            <div>
              <label className="control-label" htmlFor="vocal-target">
                Vocal target
              </label>
              <select
                id="vocal-target"
                className="select"
                value={settings.vocalTarget}
                onChange={(event) =>
                  updateSettings({ vocalTarget: event.target.value as "vocals" | "instrumental" })
                }
              >
                <option value="vocals">Vocals</option>
                <option value="instrumental">Instrumental</option>
              </select>
            </div>
            <Slider
              label="Repair strength"
              value={settings.repairStrength}
              onChange={(repairStrength) => updateSettings({ repairStrength })}
            />
            <label className="toggle">
              <input
                type="checkbox"
                checked={settings.removeClicks}
                onChange={(event) => updateSettings({ removeClicks: event.currentTarget.checked })}
              />
              Remove clicks
            </label>
            <label className="toggle">
              <input
                type="checkbox"
                checked={settings.softenClipping}
                onChange={(event) =>
                  updateSettings({ softenClipping: event.currentTarget.checked })
                }
              />
              Soften clipping
            </label>
          </div>

          <button
            className="button mt-5 w-full"
            type="button"
            disabled={disabled}
            onClick={() => void processCurrentAudio()}
          >
            <WandSparkles aria-hidden="true" size={18} />
            {isProcessing ? "Processing" : "Process"}
          </button>

          <div className="mt-5 border-t border-line pt-4">
            <h3 className="text-sm font-semibold text-slate-200">Browser</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              <Capability label="Web Audio" active={capabilities.data?.webAudio} />
              <Capability label="Worker" active={capabilities.data?.webWorker} />
              <Capability label="WebGPU" active={capabilities.data?.webGpu} />
              <Capability label="Offline" active={capabilities.data?.offlineAudioContext} />
            </div>
          </div>

          <div className="mt-5 border-t border-line pt-4">
            <h3 className="text-sm font-semibold text-slate-200">Recent</h3>
            <div className="mt-2 space-y-2">
              {recentSessions.data?.length ? (
                recentSessions.data.map((session) => (
                  <div key={session.id} className="recent-row">
                    <span className="truncate">{session.fileName}</span>
                    <span>{formatDuration(session.durationSeconds)}</span>
                  </div>
                ))
              ) : (
                <div className="text-sm text-slate-500">Empty</div>
              )}
            </div>
          </div>
        </aside>
      </main>

      <footer className="mx-auto flex w-full max-w-7xl flex-col gap-2 px-4 pb-6 pt-2 text-xs text-slate-500 sm:px-6 md:flex-row md:items-center md:justify-between">
        <span>
          Version {buildInfo.version} · Commit {buildInfo.commit} · Built{" "}
          {new Date(buildInfo.builtAt).toLocaleString()}
        </span>
        <span>Mode A · GitHub Pages · No server-side audio upload</span>
      </footer>
    </div>
  );
}

function Slider({
  label,
  value,
  onChange
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  const id = label.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <label className="control-label" htmlFor={id}>
          {label}
        </label>
        <span className="font-mono text-xs text-slate-400">{Math.round(value * 100)}%</span>
      </div>
      <input
        id={id}
        className="slider"
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={value}
        onChange={(event) => onChange(Number(event.currentTarget.value))}
      />
    </div>
  );
}

function Capability({ label, active }: { label: string; active?: boolean }) {
  return <span className={active ? "capability active" : "capability"}>{label}</span>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function processedName(name: string, mode: ProcessingMode): string {
  const clean = name.replace(/\.[^.]+$/, "");
  return `${clean}-${mode}-repaired.wav`;
}

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remaining = Math.round(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${minutes}:${remaining}`;
}
