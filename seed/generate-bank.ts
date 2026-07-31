/**
 * Generate original exam-style practice papers (not official copyrighted papers).
 * DSE-first: large bank for all 4 skills; IELTS kept moderate.
 *
 * Run: npx tsx seed/generate-bank.ts
 * Output: seed/content/bank-generated.json
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "content", "bank-generated.json");

type Exam = "DSE" | "IELTS_ACADEMIC" | "IELTS_GENERAL";
type Skill = "reading" | "writing" | "listening" | "speaking";

/** Hong Kong–relevant DSE themes (Paper 1/2 style topics). */
const DSE_TOPICS = [
  "urban transport in Hong Kong",
  "digital wellbeing among teenagers",
  "climate adaptation in coastal cities",
  "youth volunteering",
  "museum and gallery education",
  "food waste in Hong Kong",
  "work-from-home habits",
  "public libraries",
  "sports in secondary schools",
  "language learning apps",
  "elderly care in the community",
  "creative industries in Hong Kong",
  "water conservation",
  "street markets and local culture",
  "science communication",
  "mental health awareness",
  "heritage conservation",
  "internship programmes",
  "housing affordability",
  "plastic reduction campaigns",
  "online shopping habits",
  "school lunch nutrition",
  "public transport etiquette",
  "part-time jobs for students",
  "social media influencers",
  "outdoor recreation spaces",
  "recycling in estates",
  "exam stress and sleep",
  "Cantonese and English in daily life",
  "community centres",
  "tourism after the pandemic",
  "electric vehicles",
  "after-school tutoring",
  "peer pressure",
  "reading for pleasure",
  "career planning",
  "animal welfare",
  "noise pollution",
  "urban farming",
  "charity fundraising",
];

const IELTS_TOPICS = [
  "urban transport",
  "digital wellbeing",
  "climate adaptation",
  "youth volunteering",
  "museum education",
  "food waste",
  "remote work",
  "public libraries",
  "sports in schools",
  "language learning apps",
  "elderly care",
  "creative industries",
  "water conservation",
  "street markets",
  "science communication",
  "mental health awareness",
  "heritage conservation",
  "internship programmes",
];

function passage(topic: string, n: number): string {
  // Shared facts so the fixed answer key stays valid across passage variants.
  const shared = [
    `Early projects related to ${topic} often begin as small experiments before expanding into city-wide programmes. Supporters argue that better approaches to ${topic} can improve daily life and encourage cooperation between schools, families, and local organisations. Evidence from pilot schemes suggests that when young people are involved early, participation and long-term interest both increase. Critics remain cautious about uneven access, limited budgets, and weak measurement. Educators continue to use this theme because it connects academic skills with real-world issues.`,
  ];
  const variants = [
    [
      `In recent years, discussions about ${topic} have become more common in Hong Kong and across Asia. Researchers note that communities respond differently depending on local needs, funding, and public awareness.`,
      `Despite these debates, students who can summarise arguments, evaluate evidence, and express a balanced view are better prepared for public examinations and for life beyond school. (Practice set ${n}.)`,
    ],
    [
      `A recent survey of secondary students found growing interest in ${topic}. Many respondents said they first learned about the issue through school projects, social media, or family conversations.`,
      `Overall, ${topic} remains a useful theme for examination practice because it invites argument, comparison, and reflection. Practice set ${n} asks you to identify opinions, facts, and implications in a short informational text.`,
    ],
    [
      `Community groups working on ${topic} often ask what change is realistic within one year. Successful teams break large problems into smaller tasks and review progress monthly.`,
      `Young people involved in ${topic} frequently mention confidence as a benefit. Presenting ideas and responding to feedback help them develop communication skills valued in DSE speaking and writing tasks. (Practice set ${n}.)`,
    ],
  ];
  return [...shared, ...variants[n % variants.length]].join("\n\n");
}

function topicsFor(exam: Exam): string[] {
  return exam === "DSE" ? DSE_TOPICS : IELTS_TOPICS;
}

function readingPaper(exam: Exam, index: number, topic: string) {
  const label =
    exam === "DSE"
      ? `DSE Reading Practice ${index} — ${titleCase(topic)}`
      : exam === "IELTS_ACADEMIC"
        ? `IELTS Academic Reading Practice ${index} — ${titleCase(topic)}`
        : `IELTS General Reading Practice ${index} — ${titleCase(topic)}`;

  const body = passage(topic, index);
  return {
    examCode: exam,
    skill: "reading" as Skill,
    title: label,
    year: 2024 + (index % 2),
    source: "mock" as const,
    timeLimit: exam === "DSE" ? 5400 : 3600,
    passages: [{ title: titleCase(topic), body, order: 0 }],
    questions: [
      {
        type: "mcq",
        order: 0,
        prompt: `According to the passage, early projects related to ${topic} often:`,
        options: [
          { id: "A", label: "begin as large city-wide programmes" },
          { id: "B", label: "begin as small experiments before expanding" },
          { id: "C", label: "are always funded by private companies" },
          { id: "D", label: "are rejected by schools" },
        ],
        answerKey: "B",
        explanation: "The passage says early projects often begin as small experiments before expanding.",
        points: 1,
        passageRef: 0,
      },
      {
        type: "true_false_not_given",
        order: 1,
        prompt: `Supporters claim that better approaches to ${topic} can improve daily life.`,
        answerKey: "True",
        explanation: "Supporters argue it can improve daily life and create learning opportunities.",
        points: 1,
        passageRef: 0,
      },
      {
        type: "true_false_not_given",
        order: 2,
        prompt: "All pilot schemes have already solved the problem completely.",
        answerKey: "False",
        explanation: "Critics warn of limited lasting change and measurement problems; nothing says the problem is solved.",
        points: 1,
        passageRef: 0,
      },
      {
        type: "true_false_not_given",
        order: 3,
        prompt: "The Hong Kong government has banned discussion of this topic in schools.",
        answerKey: "Not Given",
        explanation: "The passage does not mention any government ban.",
        points: 1,
        passageRef: 0,
      },
      {
        type: "short_answer",
        order: 4,
        prompt: "Name ONE group, besides schools, that may cooperate on this issue.",
        answerKey: ["families", "family", "local organisations", "local organizations", "organisations", "organizations"],
        explanation: "The passage mentions cooperation between schools, families, and local organisations.",
        points: 1,
        passageRef: 0,
      },
      {
        type: "mcq",
        order: 5,
        prompt: "Why do educators continue to use this theme in class?",
        options: [
          { id: "A", label: "It replaces the need for examinations" },
          { id: "B", label: "It connects academic skills with real-world issues" },
          { id: "C", label: "It guarantees higher exam grades automatically" },
          { id: "D", label: "It is required by every university" },
        ],
        answerKey: "B",
        explanation: "Educators use it because it connects academic skills with real-world issues.",
        points: 1,
        passageRef: 0,
      },
      {
        type: "summary_completion",
        order: 6,
        prompt: `Complete the summary with ONE word from the passage: Critics worry about uneven access, limited ______, and weak measurement.`,
        answerKey: ["budgets", "budget"],
        explanation: "The passage mentions 'limited budgets'.",
        points: 1,
        passageRef: 0,
      },
      {
        type: "short_answer",
        order: 7,
        prompt: "According to the passage, what increases when young people are involved early?",
        answerKey: [
          "participation and long-term interest",
          "participation",
          "long-term interest",
          "interest",
        ],
        explanation: "When young people are involved early, participation and long-term interest both increase.",
        points: 1,
        passageRef: 0,
      },
    ],
  };
}

function writingPaper(exam: Exam, index: number, topic: string) {
  if (exam === "DSE") {
    return {
      examCode: exam,
      skill: "writing" as Skill,
      title: `DSE Writing Practice ${index} — ${titleCase(topic)}`,
      source: "mock" as const,
      timeLimit: 5400,
      writingPrompt: {
        taskType: "dse_long",
        prompt: `Your school magazine is collecting student views on ${topic}. Write an article for the magazine. Discuss why the issue matters to young people in Hong Kong, give examples, and suggest what schools or the community could do. Write about 400 words.`,
        minWords: 400,
        timeLimit: 5400,
        rubricKey: "dse_writing",
      },
    };
  }
  if (exam === "IELTS_ACADEMIC") {
    return {
      examCode: exam,
      skill: "writing" as Skill,
      title: `IELTS Academic Writing Practice ${index} — ${titleCase(topic)}`,
      source: "mock" as const,
      timeLimit: 2400,
      writingPrompt: {
        taskType: "task2",
        prompt: `Some people believe that investment in ${topic} should be led by governments, while others think individuals and private organisations should take more responsibility. Discuss both views and give your own opinion. Write at least 250 words.`,
        minWords: 250,
        timeLimit: 2400,
        rubricKey: "ielts_writing_academic",
      },
    };
  }
  const letterTopics = [
    `You attended a community talk about ${topic} and want more information.`,
    `You are unhappy with a service related to ${topic} in your neighbourhood.`,
    `You want to volunteer in a project connected to ${topic}.`,
  ];
  return {
    examCode: exam,
    skill: "writing" as Skill,
    title: `IELTS General Writing Practice ${index} — ${titleCase(topic)}`,
    source: "mock" as const,
    timeLimit: 1200,
    writingPrompt: {
      taskType: "task1",
      prompt: `${letterTopics[index % letterTopics.length]} Write a letter. Explain the situation, describe what you need, and say what action you would like. Write at least 150 words.`,
      minWords: 150,
      timeLimit: 1200,
      rubricKey: "ielts_writing_general",
    },
  };
}

function ieltsListeningPaper(exam: Exam, index: number, topic: string) {
  const slug = `${exam.toLowerCase().replace(/_/g, "-")}-l-${String(index).padStart(2, "0")}`;
  const transcript = [
    `Organiser: Welcome. Today we will talk about ${topic} and how students can get involved.`,
    `Participant: Thank you. I am interested, but I am not sure where to start.`,
    `Organiser: A good first step is to join a short workshop next Saturday at 10 a.m. in the community centre.`,
    `Participant: Do I need to register online?`,
    `Organiser: Yes. Registration closes on Friday, and the workshop is free for secondary students.`,
    `Participant: Will there be any follow-up activities after the workshop?`,
    `Organiser: Yes. Successful participants can join a four-week project and receive a certificate.`,
  ].join("\n");

  return {
    examCode: exam,
    skill: "listening" as Skill,
    title:
      exam === "IELTS_ACADEMIC"
        ? `IELTS Academic Listening Practice ${index} — ${titleCase(topic)}`
        : `IELTS General Listening Practice ${index} — ${titleCase(topic)}`,
    source: "mock" as const,
    timeLimit: 1800,
    audioAssets: [{ url: `/audio/${slug}.mp3`, transcript, durationMs: 240000, order: 0 }],
    questions: [
      {
        type: "mcq",
        order: 0,
        prompt: "What is the main topic of the conversation?",
        options: [
          { id: "A", label: titleCase(topic) },
          { id: "B", label: "University admissions only" },
          { id: "C", label: "Sports competition rules" },
          { id: "D", label: "Hotel bookings" },
        ],
        answerKey: "A",
        explanation: `The speakers discuss ${topic}.`,
        points: 1,
        audioRef: 0,
      },
      {
        type: "short_answer",
        order: 1,
        prompt: "When is the workshop?",
        answerKey: ["saturday", "next saturday", "saturday at 10 a.m.", "10 a.m.", "10am"],
        explanation: "The workshop is next Saturday at 10 a.m.",
        points: 1,
        audioRef: 0,
      },
      {
        type: "short_answer",
        order: 2,
        prompt: "Where will the workshop be held?",
        answerKey: ["community centre", "community center", "the community centre"],
        explanation: "It will be held in the community centre.",
        points: 1,
        audioRef: 0,
      },
      {
        type: "true_false_not_given",
        order: 3,
        prompt: "Registration closes on Friday.",
        answerKey: "True",
        explanation: "Registration closes on Friday.",
        points: 1,
        audioRef: 0,
      },
      {
        type: "mcq",
        order: 4,
        prompt: "Who can attend the workshop for free?",
        options: [
          { id: "A", label: "Only university professors" },
          { id: "B", label: "Secondary students" },
          { id: "C", label: "Tourists only" },
          { id: "D", label: "Primary students under 8 only" },
        ],
        answerKey: "B",
        explanation: "It is free for secondary students.",
        points: 1,
        audioRef: 0,
      },
      {
        type: "short_answer",
        order: 5,
        prompt: "How long is the follow-up project?",
        answerKey: ["four weeks", "4 weeks", "four-week", "a four-week project"],
        explanation: "Successful participants can join a four-week project.",
        points: 1,
        audioRef: 0,
      },
    ],
  };
}

/**
 * DSE Paper 3 Part A–style mock: 4 listening tasks, denser note/table items,
 * longer multi-section recording (exam-style practice, not an official paper).
 */
function dseListeningPaper(index: number, topic: string) {
  const slug = `dse-l-${String(index).padStart(2, "0")}`;
  const theme = titleCase(topic);
  const day = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"][index % 5];
  const dateNum = 3 + (index % 20);
  const month = ["March", "April", "May", "June", "July"][index % 5];
  const room = 100 + index;
  const fee = 20 + (index % 5) * 5;
  const members = 80 + index * 3;
  const hotline = `2345 ${1000 + index}`;
  const bus = ["1A", "6C", "11D", "15M", "26X"][index % 5];
  const expert = ["Dr Chan", "Ms Li", "Mr Wong", "Dr Patel", "Ms Cheung"][index % 5];
  const school = ["Riverside College", "Harbour Secondary", "Peakview School", "East Kowloon College", "New Territories Academy"][index % 5];

  const transcript = [
    `Narrator: Paper 3 Part A. Task 1. You will hear a school announcement about a community project on ${topic}.`,
    `Teacher: Good morning, students. This is an announcement about our new project on ${topic}. The launch meeting will be held on ${day}, the ${dateNum} of ${month}, at 3:30 p.m. in Room ${room}.`,
    `Teacher: All Form Four and Form Five students are welcome. Please bring a notebook and your student card. The meeting will last about forty-five minutes.`,
    `Teacher: If you cannot attend, email the civic education team by 5 p.m. on the day before the meeting. That is all for Task 1.`,
    `Narrator: Task 2. You will hear a short interview with a community organiser.`,
    `Interviewer: Thank you for joining us. Can you explain why ${topic} matters to young people in Hong Kong?`,
    `Organiser: Of course. Many teenagers feel the issue is distant until they see local examples. Last year, our programme reached ${members} students from twelve schools.`,
    `Interviewer: How can a student join for the first time?`,
    `Organiser: The easiest way is to attend a free orientation workshop. It costs nothing for secondary students, but adults pay ${fee} dollars. Workshops run every Saturday morning at the district community centre.`,
    `Interviewer: Is there a hotline for parents?`,
    `Organiser: Yes. Parents can call ${hotline} between 9 a.m. and 6 p.m. on weekdays. We also recommend taking bus ${bus} to the centre if they are coming from Kowloon.`,
    `Narrator: Task 3. You will hear three students discussing a radio programme about ${topic}.`,
    `Student A: I thought the radio programme was useful, but it was a bit fast at the beginning.`,
    `Student B: Same here. I liked the part where ${expert} explained the three main challenges: funding, time, and public awareness.`,
    `Student C: For me, the most interesting point was that schools can start small. ${school} only began with eight volunteers and later expanded.`,
    `Student A: Do you agree that the government should give every school a fixed grant?`,
    `Student B: Not necessarily. I think matching funds work better, so schools must plan carefully.`,
    `Student C: I agree with B. Also, students should collect simple data before asking for money.`,
    `Narrator: Task 4. You will hear part of a talk by ${expert} on practical next steps.`,
    `Expert: Good afternoon. In this final section, I will outline three practical next steps for school clubs working on ${topic}.`,
    `Expert: Step one: form a team of at least five members and choose one measurable goal for the term.`,
    `Expert: Step two: design a short survey with no more than ten questions, and collect answers from at least fifty classmates.`,
    `Expert: Step three: present your findings in a five-minute briefing to the student council before the mid-term holiday.`,
    `Expert: Remember, the best projects connect classroom English skills with real community needs. Thank you for listening.`,
  ].join("\n");

  let order = 0;
  const q = (
    partial: Omit<
      {
        type: string;
        prompt: string;
        options?: { id: string; label: string }[];
        answerKey: unknown;
        explanation: string;
        points?: number;
      },
      never
    >,
  ) => ({
    ...partial,
    order: order++,
    points: partial.points ?? 1,
    audioRef: 0,
  });

  const questions = [
    // Task 1 — note sheet / details
    q({
      type: "short_answer",
      prompt: `Task 1 — Note sheet: Project theme`,
      answerKey: [topic, theme.toLowerCase(), theme],
      explanation: `The announcement is about a project on ${topic}.`,
    }),
    q({
      type: "short_answer",
      prompt: "Task 1 — Day of the launch meeting",
      answerKey: [day, day.toLowerCase()],
      explanation: `The meeting is on ${day}.`,
    }),
    q({
      type: "short_answer",
      prompt: "Task 1 — Date of the launch meeting (e.g. 12 March)",
      answerKey: [
        `${dateNum} of ${month}`,
        `${dateNum} ${month}`,
        `${dateNum} ${month.toLowerCase()}`,
        `the ${dateNum} of ${month}`,
      ],
      explanation: `The date is the ${dateNum} of ${month}.`,
    }),
    q({
      type: "short_answer",
      prompt: "Task 1 — Start time",
      answerKey: ["3:30 p.m.", "3:30pm", "3.30 p.m.", "15:30", "3:30"],
      explanation: "The meeting starts at 3:30 p.m.",
    }),
    q({
      type: "short_answer",
      prompt: "Task 1 — Room number",
      answerKey: [String(room), `Room ${room}`, `room ${room}`],
      explanation: `It is held in Room ${room}.`,
    }),
    q({
      type: "mcq",
      prompt: "Task 1 — Who is especially welcome?",
      options: [
        { id: "A", label: "Only Form One students" },
        { id: "B", label: "Form Four and Form Five students" },
        { id: "C", label: "Parents only" },
        { id: "D", label: "Teachers from other schools only" },
      ],
      answerKey: "B",
      explanation: "Form Four and Form Five students are welcome.",
    }),
    q({
      type: "short_answer",
      prompt: "Task 1 — Two things students should bring (any order)",
      answerKey: [
        "notebook and student card",
        "a notebook and your student card",
        "notebook and student card",
        "student card and notebook",
      ],
      explanation: "Bring a notebook and student card.",
    }),
    q({
      type: "true_false_not_given",
      prompt: "Task 1 — The meeting will last about forty-five minutes.",
      answerKey: "True",
      explanation: "The teacher says it will last about forty-five minutes.",
    }),

    // Task 2 — interview details / table-style items
    q({
      type: "short_answer",
      prompt: "Task 2 — Number of students reached last year",
      answerKey: [String(members), `${members} students`],
      explanation: `The programme reached ${members} students.`,
    }),
    q({
      type: "short_answer",
      prompt: "Task 2 — Number of schools involved last year",
      answerKey: ["12", "twelve", "12 schools", "twelve schools"],
      explanation: "Students came from twelve schools.",
    }),
    q({
      type: "mcq",
      prompt: "Task 2 — Cost of the orientation workshop for secondary students",
      options: [
        { id: "A", label: "Free" },
        { id: "B", label: `$${fee}` },
        { id: "C", label: "$200" },
        { id: "D", label: "Not mentioned" },
      ],
      answerKey: "A",
      explanation: "It costs nothing for secondary students.",
    }),
    q({
      type: "short_answer",
      prompt: "Task 2 — Fee for adults (number only is OK)",
      answerKey: [String(fee), `$${fee}`, `${fee} dollars`],
      explanation: `Adults pay ${fee} dollars.`,
    }),
    q({
      type: "short_answer",
      prompt: "Task 2 — When workshops run",
      answerKey: [
        "every saturday morning",
        "saturday morning",
        "every Saturday morning",
        "Saturday mornings",
      ],
      explanation: "Workshops run every Saturday morning.",
    }),
    q({
      type: "short_answer",
      prompt: "Task 2 — Parent hotline",
      answerKey: [hotline, hotline.replace(" ", ""), `call ${hotline}`],
      explanation: `The hotline is ${hotline}.`,
    }),
    q({
      type: "short_answer",
      prompt: "Task 2 — Suggested bus route from Kowloon",
      answerKey: [bus, `bus ${bus}`, `Bus ${bus}`],
      explanation: `Bus ${bus} is recommended.`,
    }),

    // Task 3 — opinions / main ideas
    q({
      type: "mcq",
      prompt: "Task 3 — What did Student A say about the radio programme opening?",
      options: [
        { id: "A", label: "It was too slow" },
        { id: "B", label: "It was a bit fast" },
        { id: "C", label: "It had no music" },
        { id: "D", label: "It was in Cantonese only" },
      ],
      answerKey: "B",
      explanation: "Student A said it was a bit fast at the beginning.",
    }),
    q({
      type: "summary_completion",
      prompt: `Task 3 — Complete: ${expert} explained three challenges: funding, time, and public ______.`,
      answerKey: ["awareness"],
      explanation: "The three challenges include public awareness.",
    }),
    q({
      type: "short_answer",
      prompt: "Task 3 — School that began with only eight volunteers",
      answerKey: [school, school.toLowerCase()],
      explanation: `${school} began with eight volunteers.`,
    }),
    q({
      type: "true_false_not_given",
      prompt: "Task 3 — Student B thinks every school should receive a fixed government grant.",
      answerKey: "False",
      explanation: "Student B prefers matching funds, not necessarily a fixed grant.",
    }),
    q({
      type: "mcq",
      prompt: "Task 3 — What does Student C suggest before asking for money?",
      options: [
        { id: "A", label: "Buy new equipment first" },
        { id: "B", label: "Collect simple data" },
        { id: "C", label: "Cancel the radio programme" },
        { id: "D", label: "Invite celebrities only" },
      ],
      answerKey: "B",
      explanation: "Student C says students should collect simple data first.",
    }),

    // Task 4 — talk / next steps
    q({
      type: "short_answer",
      prompt: "Task 4 — Minimum team size in step one",
      answerKey: ["5", "five", "at least five", "at least 5", "five members"],
      explanation: "Form a team of at least five members.",
    }),
    q({
      type: "short_answer",
      prompt: "Task 4 — Maximum number of survey questions in step two",
      answerKey: ["10", "ten", "no more than ten", "no more than 10"],
      explanation: "The survey should have no more than ten questions.",
    }),
    q({
      type: "short_answer",
      prompt: "Task 4 — Minimum number of classmates to survey",
      answerKey: ["50", "fifty", "at least fifty", "at least 50"],
      explanation: "Collect answers from at least fifty classmates.",
    }),
    q({
      type: "mcq",
      prompt: "Task 4 — Where should findings be presented in step three?",
      options: [
        { id: "A", label: "To the student council" },
        { id: "B", label: "To a TV station only" },
        { id: "C", label: "To primary schools overseas only" },
        { id: "D", label: "Nowhere; keep them private" },
      ],
      answerKey: "A",
      explanation: "Present findings to the student council.",
    }),
    q({
      type: "true_false_not_given",
      prompt: "Task 4 — The briefing should last five minutes.",
      answerKey: "True",
      explanation: "The expert mentions a five-minute briefing.",
    }),
  ];

  return {
    examCode: "DSE" as Exam,
    skill: "listening" as Skill,
    title: `DSE Paper 3 Part A Practice ${index} — ${theme}`,
    source: "mock" as const,
    // Part A–style practice block (full Paper 3 is ~2 hours including Part B writing)
    timeLimit: 3600,
    audioAssets: [
      {
        url: `/audio/${slug}.mp3`,
        transcript,
        durationMs: 600000,
        order: 0,
      },
    ],
    questions,
  };
}

function listeningPaper(exam: Exam, index: number, topic: string) {
  if (exam === "DSE") return dseListeningPaper(index, topic);
  return ieltsListeningPaper(exam, index, topic);
}

function speakingPaper(exam: Exam, index: number, topic: string) {
  const isDse = exam === "DSE";
  return {
    examCode: exam,
    skill: "speaking" as Skill,
    title: isDse
      ? `DSE Speaking Practice ${index} — ${titleCase(topic)}`
      : exam === "IELTS_ACADEMIC"
        ? `IELTS Speaking Practice ${index} — ${titleCase(topic)}`
        : `IELTS General Speaking Practice ${index} — ${titleCase(topic)}`,
    source: "mock" as const,
    timeLimit: isDse ? 600 : 720,
    speakingCard: {
      part: isDse ? "individual" : index % 2 === 0 ? "part2" : "part3",
      prompt: isDse
        ? `You have one minute to prepare. Then speak for about two minutes on this topic: "${titleCase(topic)} in Hong Kong". You may talk about: why it matters to young people, an example from daily life, and what could be improved.`
        : `Describe an experience or opinion related to ${topic}. You should say: what it is, why it is important, how it affects people, and explain how you feel about it.`,
      followUps: [
        `Do you think schools should teach more about ${topic}? Why?`,
        `How might this issue change in the next ten years?`,
        `What can individuals do to make a positive difference?`,
      ],
      prepTime: isDse ? 60 : 60,
      speakTime: isDse ? 120 : 120,
      rubricKey: isDse ? "dse_speaking" : "ielts_speaking",
    },
  };
}

function titleCase(s: string) {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

function buildBank() {
  const papers: unknown[] = [];

  // DSE-first: large bank for every module
  const plans: { exam: Exam; reading: number; writing: number; listening: number; speaking: number }[] = [
    { exam: "DSE", reading: 25, writing: 25, listening: 20, speaking: 20 },
    { exam: "IELTS_ACADEMIC", reading: 5, writing: 5, listening: 4, speaking: 4 },
    { exam: "IELTS_GENERAL", reading: 5, writing: 5, listening: 4, speaking: 4 },
  ];

  for (const plan of plans) {
    const topics = topicsFor(plan.exam);
    for (let i = 1; i <= plan.reading; i++) {
      papers.push(readingPaper(plan.exam, i, topics[(i - 1) % topics.length]));
    }
    for (let i = 1; i <= plan.writing; i++) {
      papers.push(writingPaper(plan.exam, i, topics[(i + 3) % topics.length]));
    }
    for (let i = 1; i <= plan.listening; i++) {
      papers.push(listeningPaper(plan.exam, i, topics[(i + 7) % topics.length]));
    }
    for (let i = 1; i <= plan.speaking; i++) {
      papers.push(speakingPaper(plan.exam, i, topics[(i + 11) % topics.length]));
    }
  }

  return papers;
}

const bank = buildBank();
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(bank, null, 2));
console.log(`Wrote ${bank.length} papers → ${OUT}`);

const counts: Record<string, number> = {};
for (const p of bank as { examCode: string; skill: string }[]) {
  const k = `${p.examCode}:${p.skill}`;
  counts[k] = (counts[k] ?? 0) + 1;
}
console.log(counts);
