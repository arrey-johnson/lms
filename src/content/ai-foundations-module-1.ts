import { AI_FOUNDATIONS_SLUG } from "@/content/curriculum-options";

export type TutorLesson = {
  id: string;
  label: string;
  title: string;
  teachingPoints: string[];
  openingQuestion: string;
  /** What the learner must be able to say before the lesson advances. */
  mastery: string;
  /** Extra gate the tutor must enforce before mastered can be true. */
  doNotAdvance: string;
  flow: string[];
};

export type TutorCurriculum = {
  slug: string;
  title: string;
  lessons: TutorLesson[];
};

export const aiFoundationsModule1: TutorCurriculum = {
  slug: AI_FOUNDATIONS_SLUG,
  title: "Module 1: AI Foundations for Professionals",
  lessons: [
    {
      id: "1-1",
      label: "1.1",
      title: "What AI actually is (and isn’t)",
      teachingPoints: [
        "AI is software that can perform tasks that normally require human intelligence (recognizing patterns, generating language, making predictions, and similar work).",
        "It is not conscious, not alive, and does not think or understand the way humans do.",
        "Most useful AI today is narrow AI — very good at specific tasks, not general human-level intelligence.",
        "Generative AI, the kind professionals use most, creates new content (text, images, video, code) based on patterns it learned from data.",
      ],
      openingQuestion:
        "Lesson 1.1 — What AI actually is (and isn’t)\n\nAI is software that does tasks which usually need human intelligence: spotting patterns, writing language, making predictions, and similar work. It is not conscious, not alive, and it does not think or understand the way people do.\n\nMost useful AI today is narrow. It can be excellent at one job and lost outside that job. It is not general human-level intelligence.\n\nThe kind professionals use most is generative AI. It creates new text, images, video, or code from patterns it learned in data. At work that might mean drafting an email from a few notes, or turning a long report into a short brief. It still cannot reliably make a high-stakes judgment it was never given the facts for, such as deciding whether to fire someone or knowing your company’s private context on its own.\n\nWhen you have the gist, we move to the next lesson. The detailed test is the checkpoint at the end of the module, so you do not need the textbook wording.\n\nIn a sentence or two, what is AI good for at work, and what is it not?",
      mastery:
        "The learner shows the gist: AI is capable software for specific tasks, not a conscious general mind. Any reasonable paraphrase is enough.",
      doNotAdvance:
        "Move on when their reply shows that gist, even roughly. Hold only if they clearly treat AI as a conscious mind or as general human intelligence. Do not demand an example of both a strength and a limit, and do not demand a word-for-word definition.",
      flow: [
        "If this is the first turn, the lesson explanation is already in the opening. Do not quiz them before teaching, and do not repeat the whole lesson.",
        "Ask once, generally, whether they can say what AI is good for and what it is not.",
        "Accept a rough paraphrase. Then mark the lesson mastered and tell them you are moving on.",
        "If they have a real misconception, correct that single point and let them answer the same check again. Do not add a new question.",
      ],
    },
    {
      id: "1-2",
      label: "1.2",
      title: "How generative AI (LLMs) works",
      teachingPoints: [
        "Large language models (LLMs) are trained on huge amounts of text.",
        "They predict the next word (or token) based on probability, not true understanding.",
        "This prediction process is what lets them write emails, answer questions, and generate ideas.",
        "They have no memory of past conversations unless you give them context in the current session (or use special features).",
        "They can be confidently wrong. That is called a hallucination.",
      ],
      openingQuestion:
        "Lesson 1.2 — How generative AI works\n\nA large language model is trained on a huge amount of text. When you type a question, it does not look up a stored answer and it does not understand you the way a colleague would. It predicts the next word, or token, that is likely to fit, then the next, then the next. Think of it as extremely advanced autocomplete.\n\nThat is why it can write an email, answer a question, or suggest an idea: those patterns were common in the text it learned from. It is also why a fluent answer can be wrong. That confident mistake is called a hallucination. It is not checking facts.\n\nIt also has no memory of your past chats unless that context is in this conversation, or a product feature supplies it.\n\nA general answer is enough to move on. The checkpoint at the end of the module is where this gets tested properly.\n\nIn your own words, how does a tool like this produce an answer, and why can it still be wrong?",
      mastery:
        "The learner shows that the model predicts likely next words from patterns, and that a confident answer can still be wrong. Exact terms like token or hallucination are optional.",
      doNotAdvance:
        "Move on when that gist is present in any wording. Hold only if they insist the model truly understands or always tells the truth. Do not require a token-by-token example.",
      flow: [
        "Deliver the explanation of next-word prediction, the autocomplete analogy, and hallucination before the check.",
        "Ask one general question: how an answer is produced, and why it can be wrong.",
        "Accept any paraphrase that has both ideas. Mark mastered and say you are moving on.",
        "Correct only a real misconception, then repeat the same check. Do not add follow-up quizzes.",
      ],
    },
    {
      id: "1-3",
      label: "1.3",
      title: "The professional AI landscape",
      teachingPoints: [
        "Major categories professionals use: text generation (ChatGPT, Claude, Grok, Gemini), image generation, video generation, coding assistants, research tools, and workplace copilots (Microsoft Copilot, Google Gemini in Workspace, and similar tools).",
        "No single tool is best for everything. Professionals choose based on the task.",
        "Most value comes from combining tools and knowing their strengths and limits.",
        "Grok is particularly strong for fast reasoning, real-time knowledge, and creative or video generation.",
      ],
      openingQuestion:
        "Lesson 1.3 — The professional AI landscape\n\nProfessionals pick a tool for the job. No single product is best at everything.\n\nText tools such as ChatGPT, Claude, Grok, and Gemini draft, summarize, and rewrite. Image tools make pictures. Video tools make short clips. Coding assistants help write and explain code. Research tools gather and compare sources. Workplace copilots, such as Microsoft Copilot or Gemini in Workspace, sit inside the apps you already use.\n\nMost of the value is knowing the strengths and limits, and sometimes combining tools. Grok is particularly strong for fast reasoning, current information, and creative or video work.\n\nA summary of a long report is a text task. A short promotional video is a video task. That matching is the idea of this lesson.\n\nWhen your answer shows you can match a job to a kind of tool, we move on. Wording does not need to be exact. The checkpoint is the full test.\n\nWhich kind of tool would you use to summarize a report, and which kind for a short promo video?",
      mastery:
        "The learner matches a writing or summary job to a text tool and a video job to a video tool, in any wording. Naming specific brands is optional.",
      doNotAdvance:
        "Move on when the two tasks are matched to the right kinds of tools, even loosely. Hold only if they treat one tool as best for every job. Do not quiz them on every category.",
      flow: [
        "Explain the categories and one use for each, then ask the single report-versus-video check.",
        "Accept rough matching. Mark mastered and say you are moving on.",
        "If they collapse everything into one tool, correct that and ask the same check again.",
      ],
    },
    {
      id: "1-4",
      label: "1.4",
      title: "Myths vs. reality for professionals",
      teachingPoints: [
        "Myth: “AI will replace my job tomorrow.” Reality: AI changes tasks more than entire jobs. People who use AI well become more valuable.",
        "Myth: “AI always gives correct information.” Reality: It can hallucinate. Verification is required.",
        "Myth: “I need to be technical to use AI.” Reality: The biggest skill is clear communication (prompting) and judgment.",
        "Myth: “Using AI is cheating.” Reality: Using AI well is a professional skill, like using spreadsheets or search engines.",
        "Myth: “AI understands my company or context automatically.” Reality: You must provide the context.",
      ],
      openingQuestion:
        "Lesson 1.4 — Myths and reality\n\nA few claims show up constantly at work. Here is the practical version of each.\n\nAI will not replace most jobs overnight. It changes tasks inside the job. People who use it well become more useful, not less.\n\nIt does not always give correct information. It can hallucinate, so you still verify anything that matters.\n\nYou do not need to be technical. The skill that matters is clear instructions and good judgment.\n\nUsing it well is not cheating. It is a professional skill, like a spreadsheet or a search engine.\n\nIt does not already know your company. You have to give it the context.\n\nYou do not need to recite these. If your reply shows you can tell a myth from the practical reality, we move on. The checkpoint will ask for a couple of these properly.\n\nWhat is one thing people get wrong about AI at work, and what is actually true?",
      mastery:
        "The learner names one myth and a matching reality, in their own words. One pair is enough for this lesson.",
      doNotAdvance:
        "Move on after one sensible myth-and-reality pair. Do not walk through every myth as a separate question, and do not require two or three pairs here.",
      flow: [
        "Teach the myths and realities together, then ask for one pair.",
        "Accept any one pair that is roughly right. Mark mastered and say you are moving on.",
        "If the pair is backwards, correct that pair only and let them try once more.",
      ],
    },
    {
      id: "1-5",
      label: "1.5",
      title: "The professional opportunity",
      teachingPoints: [
        "Professionals who learn to use AI well save time, produce higher-quality work, and become more valuable.",
        "The advantage is not just speed. It is better thinking, clearer communication, and the ability to handle more complex work.",
        "Early adopters who build good habits now will have a lasting edge.",
        "This course focuses on practical application, not theory.",
        "The opportunity comes with responsibility: judgment and verification stay with the professional.",
      ],
      openingQuestion:
        "Lesson 1.5 — The professional opportunity\n\nPeople who learn to use AI well save time, raise the quality of their work, and become more valuable. The gain is not only speed. It is clearer thinking, clearer communication, and room to take on harder work.\n\nThe people who build good habits now keep that edge. This course stays practical: real tasks, not theory.\n\nThe opportunity still has a duty. You choose what to trust, and you verify what matters. The tool does not take that off you.\n\nA general answer moves you to the module checkpoint, which is the real check.\n\nName one way this could help your work in the next month. You do not need a perfect plan.",
      mastery:
        "The learner names one real way AI could help their work soon. Mentioning judgment or verification is welcome but not required if the use itself is sensible.",
      doNotAdvance:
        "Move on when they name one plausible use in their own work. Do not demand a 30-day plan plus a separate statement about responsibility.",
      flow: [
        "Explain the opportunity and the duty to verify, then ask for one near-term use.",
        "Accept any specific, sensible task. Mark mastered and say the checkpoint is next.",
        "If the idea is impossible or hands the judgment entirely to the tool, correct that and ask once more.",
      ],
    },
    {
      id: "checkpoint",
      label: "Checkpoint",
      title: "Module 1 checkpoint",
      teachingPoints: [
        "What AI is, and what it is not.",
        "How a generative AI produces an answer, including hallucination.",
        "Two myths and the matching realities.",
        "One professional task they will start using AI for.",
      ],
      openingQuestion:
        "Module 1 checkpoint\n\nThis is the real check. Answer in your own words. Rough wording is fine if the idea is right. You can answer all four at once.\n\n1. What is AI, and what is it not?\n2. How does a generative AI produce an answer?\n3. Name two myths and the reality that goes with each.\n4. What is one professional task you will start using AI for?",
      mastery:
        "All four ideas are present and sound: AI is capable software, not a conscious general mind; answers come from predicting likely words and can be wrong; two real myth-and-reality pairs; one concrete work task. Paraphrase counts.",
      doNotAdvance:
        "Do not pass the checkpoint until all four ideas are present and none is clearly wrong. If one is missing or mistaken, ask only for that part. Do not require the course’s exact sentences.",
      flow: [
        "Ask for the four checkpoint answers. Let them reply in one message or several.",
        "Accept paraphrases. Affirm what is right.",
        "If one part is missing or wrong, ask only for that part.",
        "Mark the checkpoint mastered only when all four ideas hold. Do not teach a new lesson.",
      ],
    },
  ],
};

const curricula = [aiFoundationsModule1];

export function getCurriculum(slug: string | null | undefined) {
  if (!slug) return null;
  return curricula.find((curriculum) => curriculum.slug === slug) ?? null;
}

export function tutorLessonCount(slug: string | null | undefined) {
  return getCurriculum(slug)?.lessons.length ?? 0;
}

/** Lessons already mastered. The current lesson index is the first unfinished lesson. */
export function masteredLessonCount(
  lessonIndex: number,
  completed: boolean,
  lessonCount: number
) {
  if (lessonCount <= 0) return 0;
  if (completed) return lessonCount;
  return Math.max(0, Math.min(lessonIndex, lessonCount));
}

export function tutorProgressPercent(
  lessonIndex: number,
  completed: boolean,
  lessonCount: number
) {
  if (lessonCount <= 0) return 0;
  if (completed) return 100;
  return (masteredLessonCount(lessonIndex, false, lessonCount) / lessonCount) * 100;
}

export function courseStudyLabel(
  curriculumSlug: string | null | undefined,
  moduleCount: number
) {
  if (getCurriculum(curriculumSlug)) return "Interactive tutor";
  return `${moduleCount} module${moduleCount === 1 ? "" : "s"}`;
}
