"use client";

import { useEffect, useMemo, useState } from "react";

/**
 * AI exam coach avatar with amplitude-driven lip sync.
 * Mouth shape reacts to `mouthOpen` (0–1) from a Web Audio analyser.
 */
export function TalkingAvatar({
  mouthOpen = 0,
  speaking = false,
  name = "Coach Mira",
  subtitle,
  size = "md",
}: {
  mouthOpen?: number;
  speaking?: boolean;
  name?: string;
  subtitle?: string;
  size?: "sm" | "md" | "lg";
}) {
  const [blink, setBlink] = useState(false);
  const open = Math.max(0, Math.min(1, mouthOpen));

  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      timer = setTimeout(() => {
        if (!alive) return;
        setBlink(true);
        setTimeout(() => {
          if (!alive) return;
          setBlink(false);
          schedule();
        }, 140);
      }, 2400 + Math.random() * 3200);
    };
    schedule();
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, []);

  const dims = size === "lg" ? 220 : size === "sm" ? 140 : 180;
  const mouthH = 4 + open * 22;
  const mouthW = 36 + open * 10;
  const jawY = open * 6;
  const browLift = speaking ? -1.5 : 0;

  const glow = useMemo(
    () => (speaking ? "0 0 40px rgba(56, 189, 248, 0.35)" : "0 0 24px rgba(15, 23, 42, 0.4)"),
    [speaking],
  );

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="relative"
        style={{ width: dims, height: dims, filter: `drop-shadow(${glow})` }}
      >
        {/* Ambient ring */}
        <div
          className={`absolute inset-[-6%] rounded-full border border-sky-400/20 ${
            speaking ? "animate-pulse" : ""
          }`}
          style={{
            background:
              "radial-gradient(circle at 35% 25%, rgba(125,211,252,0.18), transparent 55%)",
          }}
        />

        <svg
          viewBox="0 0 200 200"
          width={dims}
          height={dims}
          className="relative z-10"
          aria-hidden
        >
          <defs>
            <linearGradient id="skin" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#f6d7c3" />
              <stop offset="55%" stopColor="#e8b996" />
              <stop offset="100%" stopColor="#d9a07a" />
            </linearGradient>
            <linearGradient id="hair" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>
            <linearGradient id="shirt" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0ea5e9" />
              <stop offset="100%" stopColor="#0369a1" />
            </linearGradient>
            <radialGradient id="cheek" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(244,114,182,0.35)" />
              <stop offset="100%" stopColor="rgba(244,114,182,0)" />
            </radialGradient>
          </defs>

          {/* Shoulders / blouse */}
          <ellipse cx="100" cy="188" rx="72" ry="28" fill="url(#shirt)" />
          <path
            d="M55 175 Q100 155 145 175 L150 200 L50 200 Z"
            fill="url(#shirt)"
            opacity="0.95"
          />
          <circle cx="100" cy="168" r="7" fill="#e0f2fe" opacity="0.9" />

          {/* Neck */}
          <rect x="88" y="128" width="24" height="28" rx="8" fill="url(#skin)" />

          {/* Hair back */}
          <ellipse cx="100" cy="78" rx="62" ry="68" fill="url(#hair)" />

          {/* Head */}
          <g style={{ transform: `translateY(${jawY * 0.15}px)` }}>
            <ellipse cx="100" cy="88" rx="52" ry="58" fill="url(#skin)" />

            {/* Hair bangs */}
            <path
              d="M48 78 Q55 40 100 38 Q145 40 152 78 Q140 55 100 52 Q60 55 48 78 Z"
              fill="url(#hair)"
            />
            <path
              d="M45 95 Q38 70 55 48 Q70 70 62 100 Z"
              fill="url(#hair)"
            />
            <path
              d="M155 95 Q162 70 145 48 Q130 70 138 100 Z"
              fill="url(#hair)"
            />

            {/* Cheeks */}
            <circle cx="68" cy="100" r="12" fill="url(#cheek)" />
            <circle cx="132" cy="100" r="12" fill="url(#cheek)" />

            {/* Brows */}
            <path
              d={`M70 ${72 + browLift} Q82 ${66 + browLift} 92 ${72 + browLift}`}
              stroke="#334155"
              strokeWidth="3"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d={`M108 ${72 + browLift} Q118 ${66 + browLift} 130 ${72 + browLift}`}
              stroke="#334155"
              strokeWidth="3"
              strokeLinecap="round"
              fill="none"
            />

            {/* Eyes */}
            <g>
              <ellipse
                cx="80"
                cy="86"
                rx="9"
                ry={blink ? 1.2 : 8}
                fill="#fff"
              />
              <ellipse
                cx="120"
                cy="86"
                rx="9"
                ry={blink ? 1.2 : 8}
                fill="#fff"
              />
              {!blink && (
                <>
                  <circle cx="81" cy="87" r="4.2" fill="#0f172a" />
                  <circle cx="121" cy="87" r="4.2" fill="#0f172a" />
                  <circle cx="83" cy="85" r="1.4" fill="#fff" />
                  <circle cx="123" cy="85" r="1.4" fill="#fff" />
                </>
              )}
            </g>

            {/* Nose */}
            <path
              d="M100 90 Q104 102 98 106"
              stroke="#c48a6a"
              strokeWidth="2.2"
              fill="none"
              strokeLinecap="round"
            />

            {/* Mouth — lip sync */}
            <g transform={`translate(0 ${jawY})`}>
              {/* Upper lip */}
              <ellipse
                cx="100"
                cy={118}
                rx={mouthW / 2}
                ry={Math.max(2.5, 5 - open * 2)}
                fill="#b4535a"
              />
              {/* Oral cavity */}
              <ellipse
                cx="100"
                cy={120 + open * 2}
                rx={(mouthW / 2) * 0.82}
                ry={mouthH / 2}
                fill="#4c0519"
              />
              {/* Teeth when open */}
              {open > 0.18 && (
                <rect
                  x={100 - mouthW * 0.28}
                  y={116 + open}
                  width={mouthW * 0.56}
                  height={Math.min(6, mouthH * 0.28)}
                  rx="1.5"
                  fill="#f8fafc"
                  opacity={Math.min(1, open * 1.4)}
                />
              )}
              {/* Lower lip */}
              <ellipse
                cx="100"
                cy={120 + mouthH * 0.55}
                rx={mouthW / 2}
                ry={Math.max(3, 4.5 + open * 2)}
                fill="#9f1239"
              />
              {/* Soft smile corners when idle */}
              {open < 0.08 && (
                <path
                  d="M82 118 Q100 126 118 118"
                  stroke="#9f1239"
                  strokeWidth="3"
                  fill="none"
                  strokeLinecap="round"
                />
              )}
            </g>
          </g>
        </svg>

        {speaking && (
          <div className="absolute -bottom-1 left-1/2 flex -translate-x-1/2 gap-1">
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                className="avatar-eq-bar inline-block w-1 rounded-full bg-sky-400"
                style={{
                  height: 6 + open * 14 + (i % 2) * 4,
                  animationDelay: `${i * 0.08}s`,
                }}
              />
            ))}
          </div>
        )}
      </div>

      <div className="text-center">
        <p className="text-sm font-semibold text-white">{name}</p>
        {subtitle && (
          <p className="text-xs text-sapphire-muted">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
