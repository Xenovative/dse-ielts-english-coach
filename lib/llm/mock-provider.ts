import type { StructuredFeedback } from "@/lib/types";
import { computeDeterministicScore } from "./deterministic-score";
import type { FeedbackProvider, FeedbackRequest } from "./types";

/**
 * Deterministic mock provider. Requires no API key and runs fully offline.
 * Scores come from the shared deterministic engine; prose is templated from the
 * measured signals so it "explains, not hallucinates". Prose is localized to
 * the learner's interface language (en / zh-Hant / zh-Hans).
 */

interface MockPhrases {
  lengthMet: (words: number) => string;
  lengthShortIssue: (words: number, min: number) => string;
  lengthShortSuggestion: string;
  lengthShortNextStep: string;
  shortResponseExcerpt: string;
  linkingGood: string;
  structureExcerpt: string;
  fewConnectivesIssue: string;
  fewConnectivesSuggestion: string;
  signpostingCorrection: string;
  vocabVaried: string;
  wordChoiceExcerpt: string;
  vocabRepetitiveIssue: string;
  vocabRepetitiveSuggestion: string;
  vocabNextStep: string;
  taskFocusExcerpt: string;
  offTopicIssue: string;
  offTopicSuggestion: string;
  onTopic: string;
  defaultNextStep: string;
  genuineAttempt: string;
  improvedSuffix: string;
}

const PHRASES: Record<string, MockPhrases> = {
  en: {
    lengthMet: (words) => `You met the length expectation (${words} words).`,
    lengthShortIssue: (words, min) =>
      `The response is under the recommended length (${words}/${min} words).`,
    lengthShortSuggestion: "Develop each point with an example or explanation.",
    lengthShortNextStep: "Practice extending ideas with supporting details.",
    shortResponseExcerpt: "(short response)",
    linkingGood: "Good use of linking words to connect ideas.",
    structureExcerpt: "(overall structure)",
    fewConnectivesIssue: "Few cohesive devices were detected.",
    fewConnectivesSuggestion:
      "Use connectives like 'however', 'therefore', 'for example' to guide the reader.",
    signpostingCorrection:
      "Add signposting: 'Firstly, ... Secondly, ... In conclusion, ...'",
    vocabVaried: "Varied vocabulary with limited repetition.",
    wordChoiceExcerpt: "(word choice)",
    vocabRepetitiveIssue: "Vocabulary is somewhat repetitive.",
    vocabRepetitiveSuggestion: "Introduce synonyms and topic-specific terms.",
    vocabNextStep: "Build a topic word bank before writing.",
    taskFocusExcerpt: "(task focus)",
    offTopicIssue: "The response may not fully address the prompt.",
    offTopicSuggestion:
      "Reread the task and mirror its key requirements directly.",
    onTopic: "The response stays on topic with the task prompt.",
    defaultNextStep: "Keep practicing timed responses to build consistency.",
    genuineAttempt: "A genuine attempt was made.",
    improvedSuffix:
      "Moreover, this point can be strengthened with a concrete example, and a clear concluding sentence would round off the argument.",
  },
  "zh-Hant": {
    lengthMet: (words) => `你達到了字數要求（${words} 字）。`,
    lengthShortIssue: (words, min) =>
      `回應未達建議字數（${words}/${min} 字）。`,
    lengthShortSuggestion: "為每個論點加上例子或解釋來擴展內容。",
    lengthShortNextStep: "練習用支持性細節延伸論點。",
    shortResponseExcerpt: "（回應過短）",
    linkingGood: "善用連接詞串連想法。",
    structureExcerpt: "（整體結構）",
    fewConnectivesIssue: "偵測到的銜接手段較少。",
    fewConnectivesSuggestion:
      "使用 'however'、'therefore'、'for example' 等連接詞引導讀者。",
    signpostingCorrection:
      "加入路標語：'Firstly, ... Secondly, ... In conclusion, ...'",
    vocabVaried: "詞彙多樣，重複較少。",
    wordChoiceExcerpt: "（用詞）",
    vocabRepetitiveIssue: "詞彙略為重複。",
    vocabRepetitiveSuggestion: "加入同義詞和與主題相關的詞彙。",
    vocabNextStep: "寫作前先建立主題詞彙庫。",
    taskFocusExcerpt: "（切題程度）",
    offTopicIssue: "回應可能未完全回應題目要求。",
    offTopicSuggestion: "重讀題目，直接對應其關鍵要求。",
    onTopic: "回應緊扣題目要求。",
    defaultNextStep: "繼續進行限時練習，建立穩定表現。",
    genuineAttempt: "已作出認真嘗試。",
    improvedSuffix:
      "此外，這一論點可用具體例子加強，並以清晰的總結句收尾。",
  },
  "zh-Hans": {
    lengthMet: (words) => `你达到了字数要求（${words} 字）。`,
    lengthShortIssue: (words, min) =>
      `回答未达到建议字数（${words}/${min} 字）。`,
    lengthShortSuggestion: "为每个论点加上例子或解释来扩展内容。",
    lengthShortNextStep: "练习用支持性细节延伸论点。",
    shortResponseExcerpt: "（回答过短）",
    linkingGood: "善用连接词串联想法。",
    structureExcerpt: "（整体结构）",
    fewConnectivesIssue: "检测到的衔接手段较少。",
    fewConnectivesSuggestion:
      "使用 'however'、'therefore'、'for example' 等连接词引导读者。",
    signpostingCorrection:
      "加入路标语：'Firstly, ... Secondly, ... In conclusion, ...'",
    vocabVaried: "词汇多样，重复较少。",
    wordChoiceExcerpt: "（用词）",
    vocabRepetitiveIssue: "词汇略显重复。",
    vocabRepetitiveSuggestion: "加入同义词和与主题相关的词汇。",
    vocabNextStep: "写作前先建立主题词汇库。",
    taskFocusExcerpt: "（切题程度）",
    offTopicIssue: "回答可能未完全回应题目要求。",
    offTopicSuggestion: "重读题目，直接对应其关键要求。",
    onTopic: "回答紧扣题目要求。",
    defaultNextStep: "继续进行限时练习，建立稳定表现。",
    genuineAttempt: "已作出认真尝试。",
    improvedSuffix:
      "此外，这一论点可用具体例子加强，并以清晰的总结句收尾。",
  },
};

export class MockFeedbackProvider implements FeedbackProvider {
  readonly name = "mock";

  async generate(req: FeedbackRequest): Promise<StructuredFeedback> {
    const det = computeDeterministicScore(req);
    const { signals, subScores, overallPercent, scaledScore } = det;
    const text = req.responseText.trim();
    const p = PHRASES[req.locale ?? "en"] ?? PHRASES.en;

    const strengths: string[] = [];
    const mistakes: StructuredFeedback["mistakes"] = [];
    const corrections: string[] = [];
    const nextSteps: string[] = [];

    if (signals.wordCount >= (req.minWords ?? 150)) {
      strengths.push(p.lengthMet(signals.wordCount));
    } else {
      mistakes.push({
        excerpt: text.slice(0, 80) || p.shortResponseExcerpt,
        issue: p.lengthShortIssue(signals.wordCount, req.minWords ?? 150),
        suggestion: p.lengthShortSuggestion,
        category: "task",
      });
      nextSteps.push(p.lengthShortNextStep);
    }

    if (signals.connectiveCount >= 3) {
      strengths.push(p.linkingGood);
    } else {
      mistakes.push({
        excerpt: p.structureExcerpt,
        issue: p.fewConnectivesIssue,
        suggestion: p.fewConnectivesSuggestion,
        category: "coherence",
      });
      corrections.push(p.signpostingCorrection);
    }

    if (signals.uniqueRatio >= 0.55) {
      strengths.push(p.vocabVaried);
    } else {
      mistakes.push({
        excerpt: p.wordChoiceExcerpt,
        issue: p.vocabRepetitiveIssue,
        suggestion: p.vocabRepetitiveSuggestion,
        category: "vocabulary",
      });
      nextSteps.push(p.vocabNextStep);
    }

    if (signals.keywordOverlap < 0.2) {
      mistakes.push({
        excerpt: p.taskFocusExcerpt,
        issue: p.offTopicIssue,
        suggestion: p.offTopicSuggestion,
        category: "task",
      });
    } else {
      strengths.push(p.onTopic);
    }

    if (nextSteps.length === 0) {
      nextSteps.push(p.defaultNextStep);
    }

    const improvedVersion =
      text.length > 0
        ? `${text.split(/[.!?]/)[0]?.trim() || text.slice(0, 60)}. ${p.improvedSuffix}`
        : undefined;

    return {
      overallScore: overallPercent,
      scaledScore,
      subScores,
      strengths: strengths.length ? strengths : [p.genuineAttempt],
      mistakes,
      corrections,
      improvedVersion,
      nextSteps,
      provider: this.name,
    };
  }
}
