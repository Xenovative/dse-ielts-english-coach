"use client";

import {
  Component,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Canvas } from "@react-three/fiber";
import { Bounds, Environment, OrbitControls, useGLTF } from "@react-three/drei";
import type { Group } from "three";
import {
  collectMorphTargets,
  logMorphTargetVerification,
  type MorphTargetReport,
  summarizeVisemes,
} from "@/components/talking-avatar/morphTargets";

/** Default free Ready Player Me GLB path (Phase 1). */
export const DEFAULT_AVATAR_URL = "/avatars/coach.glb";

function AvatarModel({
  url,
  onReports,
}: {
  url: string;
  onReports: (reports: MorphTargetReport[]) => void;
}) {
  const gltf = useGLTF(url);
  const scene = gltf.scene as Group;

  useEffect(() => {
    const reports = collectMorphTargets(scene);
    onReports(reports);
    logMorphTargetVerification(reports);
  }, [scene, onReports]);

  const cloned = useMemo(() => scene.clone(true), [scene]);

  return (
    <Bounds fit clip observe margin={1.2}>
      <primitive object={cloned} />
    </Bounds>
  );
}

class CanvasErrorBoundary extends Component<
  { children: ReactNode; onError: (message: string) => void },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    this.props.onError(error.message || "Failed to load avatar GLB");
  }

  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

/**
 * Phase 1 loader: loads a Ready Player Me GLB and verifies viseme blendshapes.
 * Lip-sync / TalkingHead wiring comes in Phase 2 after you drop in coach.glb.
 */
export function Avatar3DLoader({
  url = DEFAULT_AVATAR_URL,
  height = 360,
  showReport = true,
}: {
  url?: string;
  height?: number;
  showReport?: boolean;
}) {
  const [reports, setReports] = useState<MorphTargetReport[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const summary = reports ? summarizeVisemes(reports) : null;

  const onReports = useCallback((r: MorphTargetReport[]) => {
    setReports(r);
    setError(null);
  }, []);

  const onError = useCallback((message: string) => {
    setError(
      `${message} — Place your Ready Player Me file at public/avatars/coach.glb and refresh.`,
    );
    setReports(null);
  }, []);

  return (
    <div className="space-y-3">
      <div
        className="overflow-hidden rounded-3xl border border-sapphire-border bg-[#0b1020]"
        style={{ height }}
      >
        <CanvasErrorBoundary onError={onError}>
          <Canvas
            camera={{ position: [0, 1.4, 2.2], fov: 35 }}
            gl={{ antialias: true, alpha: true }}
            onCreated={({ gl }) => {
              gl.setClearColor(0x000000, 0);
            }}
          >
            <ambientLight intensity={0.7} />
            <directionalLight position={[2, 4, 3]} intensity={1.1} />
            <directionalLight position={[-3, 2, -2]} intensity={0.35} />
            <Suspense fallback={null}>
              <AvatarModel url={url} onReports={onReports} />
              <Environment preset="city" />
            </Suspense>
            <OrbitControls
              enablePan={false}
              minDistance={1.2}
              maxDistance={4}
              target={[0, 1.35, 0]}
            />
          </Canvas>
        </CanvasErrorBoundary>
      </div>

      {error && <p className="text-sm text-rose-300">{error}</p>}

      {!reports && !error && (
        <p className="text-sm text-sapphire-muted">
          Loading avatar from <code className="text-sky-300">{url}</code>…
          If this hangs, place your GLB at{" "}
          <code className="text-sky-300">public/avatars/coach.glb</code>.
        </p>
      )}

      {showReport && summary && (
        <div className="rounded-2xl border border-sapphire-border bg-sapphire-card/80 p-4 text-sm text-sapphire-text-dim">
          <p className="font-semibold text-white">Blendshape verification</p>
          <p className="mt-1">
            Total morphs: <span className="text-white">{summary.totalMorphs}</span>
            {" · "}
            Oculus visemes:{" "}
            <span className="text-white">
              {summary.oculusFound.length}/15
            </span>
          </p>
          {summary.readyForLipsync ? (
            <p className="mt-2 text-emerald-300">
              Ready for lip sync — all Oculus visemes found. Open the browser
              console for the full morph list.
            </p>
          ) : (
            <p className="mt-2 text-amber-200">
              Missing visemes:{" "}
              {summary.oculusMissing.join(", ") || "(none listed)"}. Re-download
              from Ready Player Me with face blendshapes enabled.
            </p>
          )}
          <details className="mt-3">
            <summary className="cursor-pointer text-sky-300">
              Show morph names
            </summary>
            <ul className="mt-2 max-h-48 space-y-2 overflow-y-auto text-xs">
              {(reports ?? []).map((r) => (
                <li key={r.meshName}>
                  <span className="font-semibold text-white">{r.meshName}</span>{" "}
                  ({r.count})
                  <p className="break-all text-sapphire-muted">
                    {r.names.join(", ")}
                  </p>
                </li>
              ))}
            </ul>
          </details>
        </div>
      )}
    </div>
  );
}
