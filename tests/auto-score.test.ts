import { describe, it, expect } from "vitest";
import { scoreObjective } from "@/lib/rubrics/auto-score";
import { toJson } from "@/lib/utils/json";

const questions = [
  { id: "q1", type: "mcq" as const, answerKey: toJson("B"), points: 1 },
  {
    id: "q2",
    type: "true_false_not_given" as const,
    answerKey: toJson("Not Given"),
    points: 1,
  },
  {
    id: "q3",
    type: "short_answer" as const,
    answerKey: toJson(["community groups", "community group"]),
    points: 1,
  },
  {
    id: "q4",
    type: "matching" as const,
    answerKey: toJson({ A: "repairs tissue", B: "processes emotions" }),
    points: 2,
  },
];

describe("scoreObjective", () => {
  it("scores a perfect set", () => {
    const result = scoreObjective(questions, {
      q1: "B",
      q2: "Not Given",
      q3: "Community Groups.",
      q4: { A: "repairs tissue", B: "processes emotions" },
    });
    expect(result.earnedPoints).toBe(5);
    expect(result.totalPoints).toBe(5);
    expect(result.percent).toBe(100);
    expect(Object.keys(result.wrongByType)).toHaveLength(0);
  });

  it("is case/whitespace/punctuation insensitive for short answers", () => {
    const result = scoreObjective([questions[2]], { q3: "  community group  " });
    expect(result.percent).toBe(100);
  });

  it("marks wrong answers and tracks wrong types", () => {
    const result = scoreObjective(questions, {
      q1: "A",
      q2: "True",
      q3: "restaurants",
      q4: { A: "wrong", B: "processes emotions" },
    });
    expect(result.earnedPoints).toBe(0);
    expect(result.percent).toBe(0);
    expect(result.wrongByType.mcq).toBe(1);
    expect(result.wrongByType.matching).toBe(1);
  });

  it("handles missing responses gracefully", () => {
    const result = scoreObjective(questions, {});
    expect(result.earnedPoints).toBe(0);
    expect(result.percent).toBe(0);
  });
});
