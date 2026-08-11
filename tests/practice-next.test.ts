import { describe, it, expect } from "vitest";
import { chooseRandomUnused } from "@/lib/services/practice";

describe("chooseRandomUnused", () => {
  it("returns null when there are no papers", () => {
    expect(chooseRandomUnused([], [])).toBeNull();
  });

  it("picks only from unused papers while some remain", () => {
    const all = ["a", "b", "c"];
    const completed = ["a"];
    const picks = new Set<string>();
    for (let i = 0; i < 20; i++) {
      const pick = chooseRandomUnused(all, completed, () => i / 20);
      expect(pick).not.toBe("a");
      if (pick) picks.add(pick);
    }
    expect([...picks].every((id) => id === "b" || id === "c")).toBe(true);
  });

  it("resets the pool when every paper is completed", () => {
    const all = ["a", "b"];
    const completed = ["a", "b"];
    const pick = chooseRandomUnused(all, completed, () => 0);
    expect(pick).toBe("a");
    const pick2 = chooseRandomUnused(all, completed, () => 0.99);
    expect(pick2).toBe("b");
  });
});
