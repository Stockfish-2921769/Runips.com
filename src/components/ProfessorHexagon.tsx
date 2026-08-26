'use client';

import { useEffect, useRef } from 'react';

interface ProfessorHexagonProps {
  values: number[];
  labels?: string[];
  size?: number;
  maxValue?: number;
  emptyLabel?: string;
  ariaLabel?: string;
}

export default function ProfessorHexagon({
  values,
  labels = ['一', '二', '三', '四', '五', '六'],
  size = 180,
  maxValue = 6,
  emptyLabel = '暂无数据',
  ariaLabel = 'Professor rating radar chart',
}: ProfessorHexagonProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pad = 34;
    const cx = size / 2;
    const cy = size / 2;
    const radius = size / 2 - pad;
    const levels = 5;

    const hasData = values.some((v) => v > 0);
    const clamped = values.map((v) => Math.min(Math.max(v, 0), maxValue));

    ctx.clearRect(0, 0, size, size);

    for (let i = 1; i <= levels; i++) {
      ctx.beginPath();
      for (let j = 0; j < 6; j++) {
        const angle = (Math.PI * 2 * j) / 6 - Math.PI / 2;
        const r = (radius * i) / levels;
        const x = cx + r * Math.cos(angle);
        const y = cy + r * Math.sin(angle);
        if (j === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    for (let j = 0; j < 6; j++) {
      ctx.beginPath();
      const angle = (Math.PI * 2 * j) / 6 - Math.PI / 2;
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + radius * Math.cos(angle), cy + radius * Math.sin(angle));
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    if (hasData) {
      ctx.beginPath();
      for (let j = 0; j < 6; j++) {
        const angle = (Math.PI * 2 * j) / 6 - Math.PI / 2;
        const r = (radius * clamped[j]) / maxValue;
        const x = cx + r * Math.cos(angle);
        const y = cy + r * Math.sin(angle);
        if (j === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fillStyle = 'rgba(59, 130, 246, 0.25)';
      ctx.fill();
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.stroke();

      for (let j = 0; j < 6; j++) {
        const angle = (Math.PI * 2 * j) / 6 - Math.PI / 2;
        const r = (radius * clamped[j]) / maxValue;
        ctx.beginPath();
        ctx.arc(cx + r * Math.cos(angle), cy + r * Math.sin(angle), 3.5, 0, Math.PI * 2);
        ctx.fillStyle = '#3b82f6';
        ctx.fill();
      }
    } else {
      ctx.fillStyle = '#9ca3af';
      ctx.font = `${Math.floor(size / 10)}px system-ui, -apple-system, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(emptyLabel, cx, cy);
    }

    ctx.fillStyle = '#6b7280';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    for (let j = 0; j < 6; j++) {
      const angle = (Math.PI * 2 * j) / 6 - Math.PI / 2;
      const labelRadius = radius + 18;
      const x = cx + labelRadius * Math.cos(angle);
      const y = cy + labelRadius * Math.sin(angle) + 4;
      const label = labels[j] || '';
      ctx.font = label.length > 6 ? '8px system-ui, -apple-system, sans-serif' : label.length > 4 ? '9px system-ui, -apple-system, sans-serif' : '11px system-ui, -apple-system, sans-serif';
      ctx.fillText(label, x, y);
    }
  }, [values, labels, size, maxValue, emptyLabel]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      style={{ width: size, height: size }}
      role="img"
      aria-label={ariaLabel}
    />
  );
}
