import { useEffect, useRef } from "react";
import type { AudioData } from "../features/audio/types";

interface WaveformProps {
  audio?: AudioData;
  processed?: Pick<AudioData, "sampleRate" | "channels">;
}

export function Waveform({ audio, processed }: WaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ratio = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.max(1, Math.floor(rect.width * ratio));
    canvas.height = Math.max(1, Math.floor(rect.height * ratio));

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.scale(ratio, ratio);
    ctx.clearRect(0, 0, rect.width, rect.height);
    ctx.fillStyle = "#121619";
    ctx.fillRect(0, 0, rect.width, rect.height);
    drawGrid(ctx, rect.width, rect.height);

    if (!audio) {
      drawEmpty(ctx, rect.width, rect.height);
      return;
    }

    drawChannel(
      ctx,
      audio.channels[0] ?? new Float32Array(),
      rect.width,
      rect.height,
      "#78dcca",
      0.62
    );
    if (processed) {
      drawChannel(
        ctx,
        processed.channels[0] ?? new Float32Array(),
        rect.width,
        rect.height,
        "#f2b15d",
        0.88
      );
    }
  }, [audio, processed]);

  return <canvas ref={canvasRef} className="h-56 w-full rounded-md border border-line bg-ink" />;
}

function drawGrid(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.strokeStyle = "rgba(238, 242, 240, 0.08)";
  ctx.lineWidth = 1;
  for (let x = 0; x <= width; x += width / 10) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y <= height; y += height / 4) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
}

function drawEmpty(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.strokeStyle = "rgba(120, 220, 202, 0.65)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let x = 0; x < width; x += 1) {
    const y = height / 2 + Math.sin(x * 0.04) * Math.sin(x * 0.009) * height * 0.18;
    if (x === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
}

function drawChannel(
  ctx: CanvasRenderingContext2D,
  samples: Float32Array,
  width: number,
  height: number,
  color: string,
  yScale: number
) {
  const step = Math.max(1, Math.floor(samples.length / width));
  const center = height / 2;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.8;
  ctx.beginPath();

  for (let x = 0; x < width; x += 1) {
    let min = 1;
    let max = -1;
    const start = x * step;

    for (let i = 0; i < step; i += 1) {
      const sample = samples[start + i] ?? 0;
      min = Math.min(min, sample);
      max = Math.max(max, sample);
    }

    ctx.moveTo(x, center + min * center * yScale);
    ctx.lineTo(x, center + max * center * yScale);
  }

  ctx.stroke();
}
