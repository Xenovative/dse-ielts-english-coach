import { describe, it, expect } from "vitest";
import {
  percentToDseLevel,
  percentToIeltsBand,
  percentToScaled,
  weightedOverall,
  getRubric,
} from "@/lib/rubrics";

describe("DSE level mapping", () => {
  it("maps high percentages to top levels", () => {
    expect(percentToDseLevel(95)).toBe("Level 5**");
    expect(percentToDseLevel(83)).toBe("Level 5*");
    expect(percentToDseLevel(75)).toBe("Level 5");
  });
  it("maps low percentages to lower levels", () => {
    expect(percentToDseLevel(60)).toBe("Level 3");
    expect(percentToDseLevel(10)).toBe("Level 1");
    expect(percentToDseLevel(0)).toBe("Level 1");
  });
  it("clamps out-of-range input", () => {
    expect(percentToDseLevel(150)).toBe("Level 5**");
    expect(percentToDseLevel(-20)).toBe("Level 1");
  });
});

describe("IELTS band mapping", () => {
  it("maps to nearest 0.5 band", () => {
    expect(percentToIeltsBand(100)).toBe("Band 9.0");
    expect(percentToIeltsBand(0)).toBe("Band 0.0");
    expect(percentToIeltsBand(50)).toBe("Band 4.5");
  });
});

describe("percentToScaled dispatch", () => {
  it("uses DSE scale for DSE", () => {
    expect(percentToScaled("DSE", 90)).toContain("Level");
  });
  it("uses band scale for IELTS", () => {
    expect(percentToScaled("IELTS_ACADEMIC", 90)).toContain("Band");
    expect(percentToScaled("IELTS_GENERAL", 70)).toContain("Band");
  });
});

describe("weightedOverall", () => {
  it("computes an equally-weighted average", () => {
    const rubric = getRubric("ielts_writing_academic")!;
    const result = weightedOverall(rubric, {
      taskResponse: 80,
      coherence: 60,
      lexical: 70,
      grammar: 90,
    });
    expect(result).toBe(75);
  });
  it("respects unequal weights (DSE writing)", () => {
    const rubric = getRubric("dse_writing")!;
    const result = weightedOverall(rubric, {
      content: 100,
      language: 0,
      organization: 50,
    });
    expect(result).toBe(50);
  });
});
