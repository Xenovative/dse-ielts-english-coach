"use client";

import Balatro from "./Balatro";

/** Full-viewport Balatro shader background for the landing page. */
export function LandingBackground() {
  return (
    <div
      className="pointer-events-none fixed inset-0 -z-10 h-[100dvh] w-screen overflow-hidden bg-[#0a0a0f]"
      aria-hidden
    >
      <Balatro
        isRotate={false}
        mouseInteraction={true}
        pixelFilter={700}
        color1="#5B21B6"
        color2="#004E89"
        color3="#050508"
        lighting={0.22}
        contrast={4.2}
      />
      <div className="absolute inset-0 bg-black/35" />
    </div>
  );
}
