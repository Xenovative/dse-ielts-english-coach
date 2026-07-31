import type { Object3D } from "three";
import { Mesh } from "three";

export type MorphTargetReport = {
  meshName: string;
  count: number;
  names: string[];
};

const OCULUS_VISEMES = [
  "viseme_sil",
  "viseme_PP",
  "viseme_FF",
  "viseme_TH",
  "viseme_DD",
  "viseme_kk",
  "viseme_CH",
  "viseme_SS",
  "viseme_nn",
  "viseme_RR",
  "viseme_aa",
  "viseme_E",
  "viseme_I",
  "viseme_O",
  "viseme_U",
] as const;

/**
 * Walk a loaded GLB scene and collect every morph target / blendshape name.
 * Used in Phase 1 to verify Ready Player Me visemes are present.
 */
export function collectMorphTargets(root: Object3D): MorphTargetReport[] {
  const reports: MorphTargetReport[] = [];
  root.traverse((obj) => {
    if (!(obj instanceof Mesh)) return;
    const dict = obj.morphTargetDictionary;
    if (!dict) return;
    const names = Object.keys(dict).sort();
    reports.push({
      meshName: obj.name || "(unnamed mesh)",
      count: names.length,
      names,
    });
  });
  return reports;
}

export function summarizeVisemes(reports: MorphTargetReport[]) {
  const all = new Set(reports.flatMap((r) => r.names));
  const found = OCULUS_VISEMES.filter((v) => all.has(v));
  const missing = OCULUS_VISEMES.filter((v) => !all.has(v));
  const arkitSample = [...all].filter(
    (n) =>
      n.startsWith("mouth") ||
      n.startsWith("jaw") ||
      n.startsWith("eyeBlink") ||
      n.startsWith("brow"),
  );
  return {
    totalMorphs: all.size,
    oculusFound: found,
    oculusMissing: missing,
    arkitSample: arkitSample.slice(0, 30),
    readyForLipsync: missing.length === 0,
  };
}

/** Pretty console dump for Phase 1 verification. */
export function logMorphTargetVerification(reports: MorphTargetReport[]) {
  const summary = summarizeVisemes(reports);
  // eslint-disable-next-line no-console
  console.group("[avatar3d] morph target / blendshape verification");
  // eslint-disable-next-line no-console
  console.log("meshes with morphs:", reports.length);
  for (const r of reports) {
    // eslint-disable-next-line no-console
    console.log(`  • ${r.meshName}: ${r.count} morphs`, r.names);
  }
  // eslint-disable-next-line no-console
  console.log("Oculus visemes found:", summary.oculusFound);
  // eslint-disable-next-line no-console
  console.log("Oculus visemes missing:", summary.oculusMissing);
  // eslint-disable-next-line no-console
  console.log("ARKit-like sample:", summary.arkitSample);
  // eslint-disable-next-line no-console
  console.log(
    summary.readyForLipsync
      ? "✅ Avatar looks lip-sync ready (all 15 Oculus visemes present)."
      : "⚠️ Some Oculus visemes are missing — re-export from Ready Player Me with Face blendshapes enabled.",
  );
  // eslint-disable-next-line no-console
  console.groupEnd();
  return summary;
}
