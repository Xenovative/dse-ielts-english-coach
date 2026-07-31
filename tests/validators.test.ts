import { describe, it, expect } from "vitest";
import {
  signupSchema,
  submissionSchema,
  adminPaperSchema,
} from "@/lib/validators";

describe("signupSchema", () => {
  it("accepts a valid signup", () => {
    const r = signupSchema.safeParse({
      email: "a@b.com",
      password: "password123",
      name: "Al",
    });
    expect(r.success).toBe(true);
  });
  it("rejects short passwords", () => {
    const r = signupSchema.safeParse({ email: "a@b.com", password: "short" });
    expect(r.success).toBe(false);
  });
  it("rejects invalid emails", () => {
    const r = signupSchema.safeParse({ email: "nope", password: "password123" });
    expect(r.success).toBe(false);
  });
});

describe("submissionSchema", () => {
  it("requires at least one form of response", () => {
    const r = submissionSchema.safeParse({
      paperId: "clx000000000000000000000",
      skill: "reading",
    });
    expect(r.success).toBe(false);
  });
  it("accepts objective answers", () => {
    const r = submissionSchema.safeParse({
      paperId: "clx000000000000000000000",
      skill: "reading",
      answers: [{ questionId: "clx000000000000000000001", value: "B" }],
    });
    expect(r.success).toBe(true);
  });
  it("accepts writing text", () => {
    const r = submissionSchema.safeParse({
      paperId: "clx000000000000000000000",
      skill: "writing",
      responseText: "My essay response.",
    });
    expect(r.success).toBe(true);
  });
});

describe("adminPaperSchema", () => {
  it("validates a minimal reading paper", () => {
    const r = adminPaperSchema.safeParse({
      examCode: "DSE",
      skill: "reading",
      title: "Test",
      questions: [
        {
          type: "mcq",
          prompt: "Q?",
          answerKey: "A",
          options: [{ id: "A", label: "x" }],
        },
      ],
    });
    expect(r.success).toBe(true);
  });
  it("rejects an unknown exam code", () => {
    const r = adminPaperSchema.safeParse({
      examCode: "TOEFL",
      skill: "reading",
      title: "Test",
    });
    expect(r.success).toBe(false);
  });
});
