import { z } from "zod";

export const localeSchema = z.enum(["en", "zh-Hant", "zh-Hans"]);
export const themeSchema = z.enum(["light", "dark", "system"]);
export const examCodeSchema = z.enum(["DSE", "IELTS_ACADEMIC", "IELTS_GENERAL"]);
export const skillSchema = z.enum([
  "reading",
  "writing",
  "listening",
  "speaking",
]);

// ---- Auth ----

export const signupSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  email: z.string().trim().email().max(200),
  password: z.string().min(8).max(200),
});

export const loginSchema = z.object({
  email: z.string().trim().email().max(200),
  password: z.string().min(1).max(200),
});

// ---- Practice query ----

export const practiceQuerySchema = z.object({
  mode: examCodeSchema.optional(),
  skill: skillSchema.optional(),
  paper: z.string().cuid().optional(),
});

// ---- Submissions ----

export const answerInputSchema = z.object({
  questionId: z.string().cuid(),
  // value can be a string (mcq/short) or a matching object
  value: z.union([z.string().max(5000), z.record(z.string().max(500))]),
});

export const submissionSchema = z
  .object({
    paperId: z.string().cuid(),
    skill: skillSchema,
    sessionId: z.string().cuid().optional(),
    timeSpent: z.number().int().min(0).max(60 * 60 * 6).optional(),
    // objective skills
    answers: z.array(answerInputSchema).max(100).optional(),
    // free-text skills
    responseText: z.string().max(20000).optional(),
    audioUrl: z.string().max(1000).optional(),
  })
  .refine(
    (v) =>
      (v.answers && v.answers.length > 0) ||
      (v.responseText && v.responseText.trim().length > 0) ||
      v.audioUrl,
    { message: "A submission must include answers, responseText, or audioUrl" },
  );

// ---- Feedback ----

export const feedbackSchema = z.object({
  submissionId: z.string().cuid(),
});

// ---- Language preference ----

export const languagePrefSchema = z.object({
  locale: localeSchema.optional(),
  theme: themeSchema.optional(),
});

// ---- Admin content ingestion ----

const questionSeedSchema = z.object({
  type: z.enum([
    "mcq",
    "true_false_not_given",
    "matching",
    "short_answer",
    "summary_completion",
  ]),
  order: z.number().int().min(0).default(0),
  prompt: z.string().min(1),
  options: z.any().optional(),
  answerKey: z.any(),
  evidence: z.any().optional(),
  explanation: z.string().optional(),
  points: z.number().int().min(1).max(20).default(1),
  passageRef: z.number().int().optional(),
  audioRef: z.number().int().optional(),
});

export const adminPaperSchema = z.object({
  examCode: examCodeSchema,
  skill: skillSchema,
  title: z.string().min(1),
  year: z.number().int().optional(),
  source: z.enum(["official", "sample", "mock", "custom"]).default("custom"),
  timeLimit: z.number().int().optional(),
  passages: z
    .array(
      z.object({
        title: z.string().optional(),
        body: z.string().min(1),
        order: z.number().int().default(0),
      }),
    )
    .optional(),
  audioAssets: z
    .array(
      z.object({
        url: z.string().min(1),
        transcript: z.string().optional(),
        durationMs: z.number().int().optional(),
        order: z.number().int().default(0),
      }),
    )
    .optional(),
  questions: z.array(questionSeedSchema).optional(),
  writingPrompt: z
    .object({
      taskType: z.string(),
      prompt: z.string().min(1),
      minWords: z.number().int().default(150),
      timeLimit: z.number().int().optional(),
      rubricKey: z.string(),
    })
    .optional(),
  speakingCard: z
    .object({
      part: z.string(),
      prompt: z.string().min(1),
      followUps: z.array(z.string()).optional(),
      prepTime: z.number().int().optional(),
      speakTime: z.number().int().optional(),
      rubricKey: z.string(),
    })
    .optional(),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type SubmissionInput = z.infer<typeof submissionSchema>;
export type AdminPaperInput = z.infer<typeof adminPaperSchema>;
