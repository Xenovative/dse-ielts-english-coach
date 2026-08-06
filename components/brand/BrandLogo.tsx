"use client";

import Link from "next/link";

type Variant = "lockup" | "lockupHorizontal" | "mark";
type Tone = "black" | "white" | "auto";

const SRC: Record<Variant, Record<"black" | "white", string>> = {
  lockup: {
    black: "/brand/learn-lockup-black.svg",
    white: "/brand/learn-lockup-white.svg",
  },
  lockupHorizontal: {
    black: "/brand/learn-lockup-horizontal-black.svg",
    white: "/brand/learn-lockup-horizontal-white.svg",
  },
  mark: {
    black: "/brand/learn-mark-black.svg",
    white: "/brand/learn-mark-white.svg",
  },
};

/**
 * Official system brand mark + “English Coach” wordmark.
 * Use tone="white" on always-dark chrome (sidebar, auth, marketing).
 * Use tone="auto" for surfaces that follow light/dark theme.
 */
export function BrandLogo({
  variant = "mark",
  tone = "auto",
  href,
  className = "",
  imgClassName = "",
  priority = false,
  showWordmark = true,
}: {
  variant?: Variant;
  tone?: Tone;
  /** Wrap in a link when set. */
  href?: string;
  className?: string;
  imgClassName?: string;
  priority?: boolean;
  /** Show “English Coach” next to the mark (default true for mark). */
  showWordmark?: boolean;
}) {
  const blackSrc = SRC[variant].black;
  const whiteSrc = SRC[variant].white;
  const withWordmark = showWordmark && variant === "mark";

  const sizeClass =
    imgClassName.trim().length > 0
      ? ""
      : variant === "mark"
        ? "h-9 w-9"
        : variant === "lockupHorizontal"
          ? "h-10 w-auto max-w-[12rem] sm:h-11 sm:max-w-[14rem]"
          : "h-14 w-auto max-w-[8rem] sm:h-16 sm:max-w-[9.5rem]";

  const sharedImgClass = `object-contain object-left ${sizeClass} ${imgClassName}`.trim();

  const wordmarkClass =
    tone === "white"
      ? "text-white"
      : tone === "black"
        ? "text-neutral-900"
        : "text-neutral-900 dark:text-white";

  const img = (
    <>
      {tone === "auto" ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={blackSrc}
            alt=""
            className={`block dark:hidden ${sharedImgClass}`}
            decoding="async"
            fetchPriority={priority ? "high" : "auto"}
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={whiteSrc}
            alt=""
            className={`hidden dark:block ${sharedImgClass}`}
            decoding="async"
            fetchPriority={priority ? "high" : "auto"}
          />
        </>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={tone === "white" ? whiteSrc : blackSrc}
          alt=""
          className={`block ${sharedImgClass}`}
          decoding="async"
          fetchPriority={priority ? "high" : "auto"}
        />
      )}
      {withWordmark && (
        <span
          className={`${
            className.includes("flex-col") ? "mt-1 ml-0 text-center" : "ml-2"
          } text-sm font-bold tracking-wide sm:text-[15px] ${wordmarkClass}`}
        >
          English Coach
        </span>
      )}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={`inline-flex items-center ${className}`}
        aria-label="English Coach home"
      >
        {img}
      </Link>
    );
  }

  return (
    <span
      className={`inline-flex items-center ${className}`}
      aria-label="English Coach"
    >
      {img}
    </span>
  );
}
