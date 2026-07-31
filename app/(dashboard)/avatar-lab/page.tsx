"use client";

import dynamic from "next/dynamic";
import { useTranslation } from "react-i18next";
import { DEFAULT_AVATAR_URL } from "@/components/talking-avatar/Avatar3DLoader";

const Avatar3DLoader = dynamic(
  () =>
    import("@/components/talking-avatar/Avatar3DLoader").then(
      (m) => m.Avatar3DLoader,
    ),
  {
    ssr: false,
    loading: () => (
      <p className="py-16 text-center text-sapphire-muted">Loading 3D avatar lab…</p>
    ),
  },
);

/**
 * Phase 1 verification page — load Ready Player Me GLB and inspect blendshapes.
 * Visit: /avatar-lab
 */
export default function AvatarLabPage() {
  const { t } = useTranslation();

  return (
    <div className="mx-auto max-w-3xl space-y-6 animate-fade-in">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-sky-400">
          Phase 1
        </p>
        <h1 className="text-2xl font-bold text-white">
          {t("avatar.labTitle", "3D Avatar Lab")}
        </h1>
        <p className="mt-2 text-sm text-sapphire-text-dim">
          {t(
            "avatar.labIntro",
            "Drop your free Ready Player Me file at public/avatars/coach.glb, then refresh this page. The console and panel below list every blendshape so we can confirm Oculus visemes before lip sync (Phase 2).",
          )}
        </p>
        <p className="mt-2 text-xs text-sapphire-muted">
          Expected URL: <code className="text-sky-300">{DEFAULT_AVATAR_URL}</code>
        </p>
      </div>

      <Avatar3DLoader url={DEFAULT_AVATAR_URL} height={420} showReport />
    </div>
  );
}
