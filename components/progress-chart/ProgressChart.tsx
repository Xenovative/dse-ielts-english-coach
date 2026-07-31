"use client";

/**
 * Lightweight dependency-free SVG line chart for score trends. Avoids pulling a
 * heavy charting library into the bundle for a simple sparkline.
 */
export function ProgressChart({
  data,
  height = 140,
}: {
  data: { date: string; percent: number }[];
  height?: number;
}) {
  if (data.length === 0) {
    return null;
  }

  const width = 320;
  const pad = 12;
  const maxX = Math.max(1, data.length - 1);
  const points = data.map((d, i) => {
    const x = pad + (i / maxX) * (width - pad * 2);
    const y = pad + (1 - d.percent / 100) * (height - pad * 2);
    return { x, y, ...d };
  });

  const path = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-auto w-full"
      role="img"
      aria-label="Score trend chart"
    >
      {[0, 25, 50, 75, 100].map((g) => {
        const y = pad + (1 - g / 100) * (height - pad * 2);
        return (
          <line
            key={g}
            x1={pad}
            x2={width - pad}
            y1={y}
            y2={y}
            className="stroke-white/5"
            strokeWidth={1}
          />
        );
      })}
      <path d={path} fill="none" stroke="#8b5cf6" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={3} fill="#a78bfa" />
      ))}
    </svg>
  );
}
