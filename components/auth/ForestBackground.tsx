/** Starry forest night sky — full-viewport auth background. */
export function ForestBackground() {
  const stars = Array.from({ length: 80 }, (_, i) => ({
    id: i,
    left: `${(i * 17 + 7) % 100}%`,
    top: `${(i * 23 + 3) % 55}%`,
    size: i % 5 === 0 ? 3 : i % 3 === 0 ? 2 : 1,
    opacity: 0.3 + (i % 7) * 0.1,
  }));

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
      {/* Sky gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#1a0a3e] via-[#3b1a6e] to-[#6b2fa0]" />

      {/* Stars */}
      {stars.map((s) => (
        <span
          key={s.id}
          className="absolute rounded-full bg-white"
          style={{
            left: s.left,
            top: s.top,
            width: s.size,
            height: s.size,
            opacity: s.opacity,
          }}
        />
      ))}

      {/* Distant mountains */}
      <svg
        className="absolute bottom-[28%] left-0 w-full opacity-40"
        viewBox="0 0 1440 200"
        preserveAspectRatio="none"
        fill="#1a0535"
      >
        <path d="M0,200 L0,120 Q180,60 360,100 T720,80 T1080,110 T1440,70 L1440,200 Z" />
        <path d="M0,200 L0,150 Q240,100 480,130 T960,110 T1440,140 L1440,200 Z" opacity="0.6" />
      </svg>

      {/* Pine tree layers */}
      <svg
        className="absolute bottom-0 left-0 w-full"
        viewBox="0 0 1440 320"
        preserveAspectRatio="none"
      >
        {/* Back trees */}
        <g fill="#1f0d42" opacity="0.7">
          <polygon points="80,320 100,200 120,320" />
          <polygon points="200,320 230,170 260,320" />
          <polygon points="400,320 430,190 460,320" />
          <polygon points="600,320 640,160 680,320" />
          <polygon points="900,320 940,180 980,320" />
          <polygon points="1100,320 1140,150 1180,320" />
          <polygon points="1300,320 1340,200 1380,320" />
        </g>
        {/* Mid trees */}
        <g fill="#160830" opacity="0.85">
          <polygon points="0,320 30,140 60,320" />
          <polygon points="150,320 190,120 230,320" />
          <polygon points="350,320 390,100 430,320" />
          <polygon points="520,320 570,130 620,320" />
          <polygon points="750,320 800,110 850,320" />
          <polygon points="1000,320 1050,140 1100,320" />
          <polygon points="1250,320 1300,120 1350,320" />
          <polygon points="1400,320 1430,160 1460,320" />
        </g>
        {/* Front trees */}
        <g fill="#0d0520">
          <polygon points="-20,320 40,80 100,320" />
          <polygon points="280,320 340,60 400,320" />
          <polygon points="680,320 750,50 820,320" />
          <polygon points="1050,320 1120,70 1190,320" />
          <polygon points="1350,320 1410,90 1470,320" />
        </g>
        {/* Ground */}
        <rect x="0" y="300" width="1440" height="20" fill="#0a0318" />
      </svg>

      {/* Horizon glow */}
      <div
        className="absolute bottom-[26%] left-0 right-0 h-32"
        style={{
          background: "linear-gradient(to top, rgba(107,47,160,0.5), transparent)",
        }}
      />
    </div>
  );
}
