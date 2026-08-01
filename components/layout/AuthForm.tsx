"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";

function UserIcon() {
  return (
    <svg className="h-4 w-4 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg className="h-4 w-4 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  );
}

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const { t } = useTranslation();
  const router = useRouter();
  const [loading, setLoading] = useState<"form" | "guest" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [remember, setRemember] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading("form");
    const form = new FormData(e.currentTarget);
    const payload: Record<string, string> = {
      email: String(form.get("email") || ""),
      password: String(form.get("password") || ""),
    };
    if (mode === "signup") payload.name = String(form.get("name") || "");

    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => null);
      // #region agent log
      fetch("http://127.0.0.1:7873/ingest/ccf26217-348c-4a08-bd0f-2912974b0d2f", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Debug-Session-Id": "3891af",
        },
        body: JSON.stringify({
          sessionId: "3891af",
          runId: "invalid-login",
          hypothesisId: "F-H",
          location: "AuthForm.tsx:submit",
          message: "Auth attempt result",
          data: {
            mode,
            status: res.status,
            ok: res.ok,
            errorCode: data?.error?.code ?? null,
            errorMessage: data?.error?.message ?? null,
            emailLen: payload.email.length,
            passwordLen: payload.password.length,
            emailHasUpper: /[A-Z]/.test(payload.email),
          },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion
      if (!res.ok) {
        throw new Error(data?.error?.message || t("common.error"));
      }
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(null);
    }
  }

  async function guest() {
    setError(null);
    setLoading("guest");
    try {
      const res = await fetch("/api/auth/guest", { method: "POST" });
      if (!res.ok) throw new Error(t("common.error"));
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(null);
    }
  }

  const title = mode === "login" ? t("nav.login") : t("nav.signup");

  return (
    <div className="auth-glass-card w-full max-w-sm animate-fade-in">
      <h1 className="text-center text-2xl font-bold text-white">{title}</h1>

      <form onSubmit={submit} className="mt-8 space-y-4">
        {mode === "signup" && (
          <div className="auth-pill-input">
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              placeholder={t("auth.name")}
              className="auth-pill-field"
            />
            <span className="auth-pill-icon">
              <UserIcon />
            </span>
          </div>
        )}

        <div className="auth-pill-input">
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder={t("auth.email")}
            className="auth-pill-field"
          />
          <span className="auth-pill-icon">
            <UserIcon />
          </span>
        </div>

        <div className="auth-pill-input">
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={mode === "signup" ? 8 : undefined}
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            placeholder={t("auth.password")}
            className="auth-pill-field"
          />
          <span className="auth-pill-icon">
            <LockIcon />
          </span>
        </div>

        {mode === "login" && (
          <div className="flex items-center justify-between px-1 text-xs text-white/80">
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-white/30 bg-white/10 accent-white"
              />
              {t("auth.rememberMe")}
            </label>
            <button type="button" className="transition hover:text-white">
              {t("auth.forgotPassword")}
            </button>
          </div>
        )}

        {error && (
          <p className="rounded-full border border-rose-400/30 bg-rose-500/15 px-4 py-2 text-center text-xs text-rose-200">
            {error}
          </p>
        )}

        <button type="submit" disabled={loading !== null} className="auth-submit-btn">
          {loading === "form" ? t("common.loading") : title}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-white/80">
        {mode === "login" ? t("auth.noAccount") : t("auth.haveAccount")}{" "}
        <Link
          href={mode === "login" ? "/signup" : "/login"}
          className="font-bold text-white hover:underline"
        >
          {mode === "login" ? t("auth.register") : t("nav.login")}
        </Link>
      </p>

      <div className="mt-4 text-center">
        <button
          type="button"
          onClick={guest}
          disabled={loading !== null}
          className="text-xs text-white/50 transition hover:text-white/80"
        >
          {loading === "guest" ? t("common.loading") : t("actions.tryGuest")}
        </button>
      </div>
    </div>
  );
}
