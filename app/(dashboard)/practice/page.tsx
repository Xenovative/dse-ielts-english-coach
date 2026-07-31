"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { PracticeLibrary } from "@/components/practice/PracticeLibrary";
import { PracticeRunner } from "@/components/practice/PracticeRunner";

function PracticeContent() {
  const params = useSearchParams();
  const paperId = params.get("paper");
  return paperId ? <PracticeRunner paperId={paperId} /> : <PracticeLibrary />;
}

export default function PracticePage() {
  return (
    <Suspense fallback={<p className="py-12 text-center text-sapphire-muted">…</p>}>
      <PracticeContent />
    </Suspense>
  );
}
