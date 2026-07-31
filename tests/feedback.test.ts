import { describe, it, expect } from "vitest";
import { computeDeterministicScore } from "@/lib/llm/deterministic-score";
import { MockFeedbackProvider } from "@/lib/llm/mock-provider";
import { countWords, sanitizeText } from "@/lib/utils/text";

const strongEssay =
  "Education plays a crucial role in shaping society. Firstly, universities should provide rigorous academic skills, because critical thinking underpins innovation. However, they must also prepare students for the workplace. For example, internships bridge theory and practice. Moreover, employers increasingly value communication and teamwork. In conclusion, a balanced approach benefits both students and the economy, therefore institutions should integrate both goals thoughtfully and consistently.";

describe("computeDeterministicScore", () => {
  it("is deterministic (same input → same score)", () => {
    const req = {
      examCode: "IELTS_ACADEMIC" as const,
      skill: "writing" as const,
      rubricKey: "ielts_writing_academic",
      responseText: strongEssay,
      taskPrompt: "Discuss whether universities should prepare students for the workplace.",
      minWords: 50,
    };
    const a = computeDeterministicScore(req);
    const b = computeDeterministicScore(req);
    expect(a.overallPercent).toBe(b.overallPercent);
    expect(a.subScores).toEqual(b.subScores);
  });

  it("rewards longer, more varied, connected writing", () => {
    const base = {
      examCode: "IELTS_ACADEMIC" as const,
      skill: "writing" as const,
      rubricKey: "ielts_writing_academic",
      taskPrompt: "Discuss universities and the workplace.",
      minWords: 50,
    };
    const strong = computeDeterministicScore({ ...base, responseText: strongEssay });
    const weak = computeDeterministicScore({ ...base, responseText: "I like school. School good." });
    expect(strong.overallPercent).toBeGreaterThan(weak.overallPercent);
  });

  it("produces IELTS band and DSE level scales correctly", () => {
    const ielts = computeDeterministicScore({
      examCode: "IELTS_ACADEMIC",
      skill: "writing",
      rubricKey: "ielts_writing_academic",
      responseText: strongEssay,
      taskPrompt: "prompt",
      minWords: 50,
    });
    const dse = computeDeterministicScore({
      examCode: "DSE",
      skill: "writing",
      rubricKey: "dse_writing",
      responseText: strongEssay,
      taskPrompt: "prompt",
      minWords: 50,
    });
    expect(ielts.scaledScore).toContain("Band");
    expect(dse.scaledScore).toContain("Level");
  });
});

describe("MockFeedbackProvider", () => {
  it("returns the structured feedback contract", async () => {
    const provider = new MockFeedbackProvider();
    const fb = await provider.generate({
      examCode: "IELTS_ACADEMIC",
      skill: "writing",
      rubricKey: "ielts_writing_academic",
      responseText: strongEssay,
      taskPrompt: "Discuss universities and the workplace.",
      minWords: 50,
    });
    expect(fb.provider).toBe("mock");
    expect(typeof fb.overallScore).toBe("number");
    expect(fb.scaledScore).toContain("Band");
    expect(Array.isArray(fb.strengths)).toBe(true);
    expect(Array.isArray(fb.nextSteps)).toBe(true);
    expect(fb.nextSteps.length).toBeGreaterThan(0);
  });
});

describe("text utils", () => {
  it("counts latin words and CJK characters", () => {
    expect(countWords("hello world")).toBe(2);
    expect(countWords("你好世界")).toBe(4);
    expect(countWords("hello 世界")).toBe(3);
  });
  it("sanitizes control characters and trims", () => {
    expect(sanitizeText("  hi\u0000there  ")).toBe("hithere");
  });
});
