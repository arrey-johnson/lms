/**
 * Rebuilds "AI For Professionals" with the revised 7-module curriculum.
 * Run: node scripts/seed-ai-professionals-curriculum.mjs
 */
import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, "..", ".env.local");
const env = Object.fromEntries(
  fs
    .readFileSync(envPath, "utf8")
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i), l.slice(i + 1)];
    })
);

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

const COURSE_ID = "cb9eba02-4b40-4853-9b46-049922d7ce4e";

function slides(...items) {
  return items.map((item, order_index) =>
    typeof item === "string"
      ? { title: null, body: item, order_index }
      : { title: item.title || null, body: item.body, order_index }
  );
}

function lessonBlock(lessonTitle, parts) {
  // First slide is the lesson header; remaining are content slides
  return [
    {
      title: lessonTitle,
      body: parts.overview,
    },
    ...parts.slides,
  ];
}

const curriculum = [
  {
    title: "Module 1: AI Foundations for Professionals",
    description:
      "Build a clear mental model of modern AI tools, what they are good at, and how professionals should work with them day to day.",
    slides: slides(
      {
        title: "What this module covers",
        body: `You will learn:
• What generative AI can and cannot do for professional work
• How models like ChatGPT, Claude, and Grok fit into real workflows
• A simple operating model: brief → draft → review → ship
• How to stay in control of quality, accuracy, and tone

By the end, you will know when AI helps, when it slows you down, and how to start every task with a clear brief.`,
      },
      {
        title: "AI as a work partner, not a magic button",
        body: `Treat AI like a fast junior colleague:
• It drafts, explores options, and structures messy thinking
• You set goals, supply context, and approve the final output
• You are accountable for facts, judgment, and professional standards

Mindset shift: stop asking “Can AI do this?” and start asking “What part of this task should AI accelerate?”`,
      },
      {
        title: "Strengths and limits",
        body: `AI is strong at:
• Drafting emails, reports, outlines, and talking points
• Summarizing long material and extracting action items
• Exploring options, frameworks, and counter-arguments
• Turning rough notes into clear structure

AI is weak at:
• Guaranteed factual accuracy without verification
• Knowing your company politics, unspoken constraints, or private context
• Replacing professional judgment on high-stakes decisions

Rule: use AI to accelerate thinking and drafting — never to skip ownership.`,
      },
      {
        title: "A professional workflow you can reuse",
        body: `Use this four-step loop on every task:

1. Brief — goal, audience, constraints, and success criteria
2. Draft — ask AI for a first pass (or 2–3 options)
3. Review — check facts, tone, risk, and completeness
4. Ship — polish and deliver under your name

Prompt skeleton:
“You are helping a [role]. Goal: [outcome]. Audience: [who]. Context: [key facts]. Constraints: [length/tone/format]. Deliver: [exact output].”`,
      },
      {
        title: "Tool landscape (practical view)",
        body: `You do not need every tool. Start with one strong general assistant and expand only when a job requires it.

Common professional stack:
• Chat / writing assistant — drafting, brainstorming, rewriting
• Research / browsing-capable tools — fresher context with sources to verify
• Image / video tools (e.g. Grok video) — visuals and short clips
• Productivity apps — docs, slides, email, task managers

Principle: pick tools that fit your existing workflow, not the other way around.`,
      },
      {
        title: "Now try this yourself",
        body: `Exercise (10 minutes):
1. Pick one real task from your week (email, summary, plan, or slide outline).
2. Write a 5-line brief using Role + Goal + Audience + Context + Constraints.
3. Generate one AI draft.
4. Mark what you would keep, change, or delete before sending.

Save this brief — you will reuse it in later modules.`,
      }
    ),
  },
  {
    title: "Module 2: Prompting That Gets Results",
    description:
      "Learn practical prompt patterns that produce clearer, more usable outputs for professional tasks.",
    slides: slides(
      {
        title: "What this module covers",
        body: `Great prompting is clear instruction, not clever wording.

You will learn:
• The core brief: Role, Context, Goal, Constraints, Format
• How to request structured outputs you can paste into work tools
• Iteration loops that improve quality quickly
• Common prompt failures and how to fix them`,
      },
      {
        title: "The professional prompt formula",
        body: `Use this checklist every time:

1. Role — who the AI should act as
2. Context — what the AI must know
3. Goal — the outcome you need
4. Constraints — length, tone, must-include / must-avoid
5. Format — bullets, table, email, slide outline, JSON, etc.
6. Examples (optional) — one good sample when quality matters

Example:
“Act as a product marketing manager. Context: we launched a mid-market analytics tool. Goal: draft a 120-word LinkedIn post for operations leaders. Tone: practical, not hype. Include one concrete benefit and one soft CTA. Avoid jargon.”`,
      },
      {
        title: "Ask for structure, not just text",
        body: `Professionals need outputs that fit work systems.

Ask for:
• Headings and bullet hierarchy
• Tables (option | pros | cons | recommendation)
• Email with subject + body
• Slide outline: title → 3 bullets → speaker note
• Action list: owner | task | due date

Prompt add-on:
“Return only the deliverable in the format above. No preamble.”`,
      },
      {
        title: "Iterate like an editor",
        body: `First drafts are starting points. Improve with targeted follow-ups:

• “Make this 30% shorter and more concrete.”
• “Rewrite for executives who have 60 seconds.”
• “Keep structure; improve evidence and specificity.”
• “Give me 3 tone variants: formal, direct, warm.”
• “Challenge this recommendation with risks and unknowns.”

Good iteration changes one variable at a time so you stay in control.`,
      },
      {
        title: "Pitfalls to avoid",
        body: `Common failures:
• Vague goals (“make this better”)
• Missing audience
• No constraints (too long / wrong tone)
• Accepting fluent nonsense without checking facts
• Asking for everything in one mega-prompt

Fix: tighten the brief, reduce scope, then iterate.`,
      },
      {
        title: "Now try this yourself",
        body: `Exercise:
1. Take a weak prompt you have used before.
2. Rewrite it with Role + Context + Goal + Constraints + Format.
3. Generate two outputs: original vs rewritten.
4. Note which parts improved (clarity, usefulness, readiness to send).

Keep a “prompt wins” note with your best rewritten version.`,
      }
    ),
  },
  {
    title: "Module 3: AI for Communication & Content",
    description:
      "Use AI to draft clearer emails, updates, reports, and stakeholder-ready content without losing your voice.",
    slides: slides(
      {
        title: "What this module covers",
        body: `Communication is where AI creates immediate value.

You will practice:
• Emails that are clear, polite, and action-oriented
• Status updates and stakeholder summaries
• Content drafts for LinkedIn, newsletters, and internal posts
• Tone control for different audiences`,
      },
      {
        title: "Email workflow",
        body: `Process:
1. Paste your rough notes or voice dump
2. Specify audience, goal, and desired action
3. Ask for a subject line + concise body
4. Edit for relationship nuance and accuracy

Prompt:
“Turn these notes into a professional email.
Audience: [who]
Goal: [what I need them to do]
Tone: [direct / diplomatic]
Length: under 150 words
Include: clear ask + deadline if relevant
Notes: [paste]”`,
      },
      {
        title: "Reports and updates",
        body: `Use AI to structure messy progress into decision-ready writing.

Useful formats:
• What happened → Why it matters → Next steps
• Wins / Risks / Asks
• Executive summary (5 bullets) + detail appendix

Prompt:
“Create an executive update from these notes. Lead with outcomes, then risks, then decisions needed. Keep the summary under 120 words.”`,
      },
      {
        title: "Content with a professional voice",
        body: `For external content:
• Provide 3–5 facts you can stand behind
• State audience and point of view
• Ask for a draft + a tighter alternate
• Remove hype and unverifiable claims

Prompt add-on:
“Write like a credible practitioner. Prefer specifics over adjectives. No exaggerated claims.”`,
      },
      {
        title: "Now try this yourself",
        body: `Exercise:
1. Pick one real email or update you need to send this week.
2. Dump rough notes into AI using the email or executive-update prompt.
3. Edit until it sounds like you.
4. Save the final version and the prompt that produced the best draft.`,
      }
    ),
  },
  {
    title: "Module 4: Research, Analysis & Decision Support",
    description:
      "Use AI to explore options, compare alternatives, and prepare clearer recommendations — with verification built in.",
    slides: slides(
      {
        title: "What this module covers",
        body: `AI can accelerate analysis, but you own the decision.

You will learn:
• How to brief research and comparison tasks
• Decision frameworks AI can populate (and you can challenge)
• Verification habits that reduce hallucination risk
• Turning analysis into a recommendation memo`,
      },
      {
        title: "Research briefing pattern",
        body: `Tell AI:
• Decision you are trying to make
• Options already on the table
• Criteria that matter (cost, speed, risk, quality, compliance)
• What “good enough” evidence looks like

Prompt:
“Help me compare [options] for [decision].
Criteria: [list]
For each option provide: summary, pros, cons, key uncertainties, and a confidence note.
Flag anything that needs source verification.”`,
      },
      {
        title: "Analysis outputs that leaders can use",
        body: `Ask for decision-ready formats:
• Comparison table
• Recommendation + rationale + risks
• “What would change my mind?” section
• Assumptions list

Never accept a recommendation without checking assumptions and unknowns.`,
      },
      {
        title: "Verification checklist",
        body: `Before acting on AI analysis:
1. Which claims are factual vs inferred?
2. What sources should I verify?
3. What context is missing from my company / market?
4. What are the second-order risks?
5. Would I defend this recommendation in a meeting?

If stakes are high, AI drafts the thinking — humans validate the evidence.`,
      },
      {
        title: "Now try this yourself",
        body: `Exercise:
1. Choose a real decision (tool, vendor, process, hire plan, campaign).
2. Run the research briefing prompt.
3. Verify at least two important claims.
4. Write a short recommendation: decision, why, risks, next step.`,
      }
    ),
  },
  {
    title: "Module 5: Productivity, Workflows & Presentations (In-Depth Practical)",
    description:
      "A longer, step-by-step practical section. Follow along and build real workflows you can reuse immediately — from daily systems to meetings, documents, presentations, automation, and prompt libraries.",
    slides: [
      ...lessonBlock("Lesson 5.1: Building Your Personal AI Productivity System", {
        overview: `Audit your current tasks, identify high-leverage opportunities, and set up a simple daily AI workflow you can reuse every workday.

You will leave with:
• A short list of tasks AI should accelerate
• A daily AI routine (morning / during work / end of day)
• A reusable “task intake” prompt`,
        slides: [
          {
            title: "Step 1 — Audit your week",
            body: `List 10 recurring tasks from your real work. For each, mark:
• Time spent (low / medium / high)
• Cognitive load (routine / judgment-heavy)
• AI fit (strong / medium / weak)

Strong AI-fit examples:
• First drafts, summaries, agendas, cleanup, outlining, reformatting

Weak AI-fit examples:
• Final legal sign-off, sensitive people decisions, unverified financial claims`,
          },
          {
            title: "Step 2 — Pick high-leverage opportunities",
            body: `Choose 3 tasks that are:
1. Frequent
2. Time-consuming
3. Draft-friendly

These become your first personal AI workflows.

Examples:
• Meeting prep + follow-up
• Weekly status update
• Presentation outlining
• Inbox triage / reply drafts`,
          },
          {
            title: "Step 3 — Install a simple daily workflow",
            body: `Daily AI system:

Morning (10 min)
• Paste today’s priorities
• Ask AI for a sequenced plan and risks

During work
• Use AI for first drafts only after a clear brief
• Keep a running “context note” for active projects

End of day (5 min)
• Dump leftovers
• Ask AI for tomorrow’s top 3 + unfinished follow-ups

Intake prompt:
“Here is my task list for today: [list].
Role: executive assistant + productivity coach.
Return: prioritized plan, suggested AI-assisted tasks, and what I should do myself.”`,
          },
          {
            title: "Pitfalls & now try this",
            body: `Pitfalls:
• Automating low-value busywork first
• Overbuilding systems you will not open daily
• Letting AI invent priorities you did not approve

Now try this yourself:
1. Do the 10-task audit.
2. Select your top 3 AI-fit tasks.
3. Run the intake prompt on tomorrow’s list.
4. Save your daily system on one page.`,
          },
        ],
      }),
      ...lessonBlock("Lesson 5.2: Meeting Mastery", {
        overview: `Full walkthroughs for pre-meeting briefs, live note capture, action-item extraction, and follow-up emails — with prompts and examples you can copy.`,
        slides: [
          {
            title: "Pre-meeting brief",
            body: `Prompt:
“Create a pre-meeting brief.
Meeting purpose: [goal]
Attendees: [roles]
My objective: [what I need]
Known context: [notes]
Return:
1) 5-bullet brief
2) Likely questions
3) Decisions needed
4) Suggested agenda (timed)”

Expected output: a one-screen brief you can review in 2 minutes.`,
          },
          {
            title: "Live notes → clean record",
            body: `During/after the meeting, paste rough notes.

Prompt:
“Clean these meeting notes.
Separate: Decisions / Action items / Open questions / Key context.
Action items must include owner and due date when possible.
Flag unclear owners as ‘OWNER NEEDED’.
Notes: [paste]”

Expected output: structured notes ready for your docs or CRM.`,
          },
          {
            title: "Follow-up email walkthrough",
            body: `Prompt:
“Write a follow-up email from these cleaned notes.
Tone: professional and concise.
Include: thank-you line, decisions summary, action table, next meeting if relevant.
Audience: [attendees]
Notes: [paste cleaned notes]”

Before/after goal:
• Before: messy bullets
• After: sendable email with clear owners and dates`,
          },
          {
            title: "Pitfalls & now try this",
            body: `Pitfalls:
• AI inventing decisions that were only discussed
• Missing owners/dates
• Follow-ups that are too long to read

Now try this yourself:
Take your last meeting notes through brief → clean notes → follow-up email. Edit facts carefully before sending.`,
          },
        ],
      }),
      ...lessonBlock("Lesson 5.3: Document & Report Workflows", {
        overview: `Turn rough notes into structured reports, update existing documents, and create consistent templates your team can reuse.`,
        slides: [
          {
            title: "Rough notes → structured report",
            body: `Prompt:
“Turn these notes into a professional report.
Audience: [who]
Purpose: [inform / decide / update]
Structure:
1. Executive summary
2. Context
3. Findings
4. Recommendations
5. Next steps
Keep summary under 120 words.
Notes: [paste]”`,
          },
          {
            title: "Update an existing document",
            body: `Prompt:
“Update this document with new information.
Preserve the original structure and voice.
Clearly integrate new facts.
List changes made at the end.
Original: [paste]
New information: [paste]”

Expected output: revised doc + change log for quick review.`,
          },
          {
            title: "Template creation",
            body: `Ask AI to convert a strong finished report into a blank template with placeholders.

Prompt:
“Convert this finished report into a reusable template with [brackets] for variable fields. Keep section guidance in italics.”

Pitfalls:
• Letting AI overwrite critical approved language
• Templates that are too generic to save time`,
          },
          {
            title: "Now try this yourself",
            body: `1. Convert one messy note dump into a structured report.
2. Update an old document with new facts.
3. Turn your best report into a reusable template.
4. Store the template in your team folder.`,
          },
        ],
      }),
      ...lessonBlock("Lesson 5.4: Presentation Creation End-to-End", {
        overview: `Complete process with before/after thinking: research → outline → slide structure → visual suggestions → speaker notes.`,
        slides: [
          {
            title: "Research → outline",
            body: `Prompt:
“Help me build a presentation.
Audience: [who]
Goal: [persuade / inform / train]
Length: [N slides]
Core message: [one sentence]
Source notes: [paste]
Return a slide-by-slide outline with one message per slide.”`,
          },
          {
            title: "Slide structure & visuals",
            body: `Prompt:
“For each slide in this outline provide:
• Slide title
• 3 bullets max
• Visual suggestion (chart, diagram, screenshot, photo concept)
• Speaker note (30–40 seconds)
Avoid dense text.
Outline: [paste]”

Before: wall of text.
After: one idea per slide + talk track.`,
          },
          {
            title: "End-to-end quality check",
            body: `Ask AI:
“Review this deck outline for clarity, redundancy, and missing proof. Suggest cuts and stronger titles.”

Then you:
• Verify every claim
• Add real examples from your work
• Align visuals with brand`,
          },
          {
            title: "Now try this yourself",
            body: `Build a 6–8 slide mini-deck for a real meeting this month using the full pipeline. Timebox to 45 minutes, then refine titles and proof.`,
          },
        ],
      }),
      ...lessonBlock("Lesson 5.5: Simple Automation Patterns", {
        overview: `Recurring tasks, multi-step workflows, and no-code ways to connect AI to tools you already use.`,
        slides: [
          {
            title: "Pattern library",
            body: `Start with these no-code patterns:
1. Recurring summary — weekly notes → status update
2. Triage — inbox/requests → prioritized list + draft replies
3. Transform — form responses → CRM notes / tickets
4. Packaged output — meeting notes → email + task list
5. Multi-step chain — research → outline → draft → QA checklist`,
          },
          {
            title: "Multi-step workflow example",
            body: `Workflow: Weekly stakeholder update
1. Collect notes from the week
2. AI draft: wins / risks / asks
3. Human verify numbers and sensitivities
4. AI tighten for executives
5. Paste into email / slides

Prompt chain tip: keep each step narrow and pass only the previous output forward.`,
          },
          {
            title: "Connecting to existing tools",
            body: `Practical options (no heavy engineering):
• Copy/paste SOPs with saved prompts
• Browser AI side panels in docs/email
• Zapier / Make style automations for repetitive transforms
• Templates in Notion/Docs/Sheets that hold prompt blocks

Rule: automate after the workflow works manually twice.`,
          },
          {
            title: "Pitfalls & now try this",
            body: `Pitfalls:
• Automating inaccurate processes
• Hidden sensitive data in prompts
• Too many tools before one workflow is stable

Now try this yourself:
Pick one recurring weekly task and write a 4-step AI workflow card: trigger → inputs → prompts → output destination.`,
          },
        ],
      }),
      ...lessonBlock("Lesson 5.6: Building Reusable Templates & Prompt Libraries", {
        overview: `Create your own library of prompts and checklists so strong processes become repeatable across your week.`,
        slides: [
          {
            title: "What belongs in your library",
            body: `Save assets that you reuse weekly:
• Prompt templates (email, meetings, decks, research)
• Checklists (QA before send)
• Output formats (tables, agendas, briefs)
• Tone guides for your role/company

Name them clearly:
“Meeting follow-up — owners + dates”
not “prompt 3”.`,
          },
          {
            title: "Template design rules",
            body: `Each template should include:
1. Purpose (one line)
2. Required inputs
3. Prompt body with [brackets]
4. Expected output format
5. 60-second QA checklist

Example QA:
• Facts verified?
• Audience appropriate?
• Ask / next step clear?
• Sensitive info removed?`,
          },
          {
            title: "Now try this yourself",
            body: `Build a mini library of 5 prompts from Modules 3–5.
Store them in one doc with headings and [placeholders].
Use at least two of them on real work within 48 hours and refine wording based on results.`,
          },
        ],
      }),
      ...lessonBlock("Lesson 5.7: Hands-on Practice Lab", {
        overview: `Apply the full workflow to one of your real work tasks and refine it until it is sendable.`,
        slides: [
          {
            title: "Lab brief",
            body: `Choose one real task:
• Meeting cycle (prep → notes → follow-up)
• Report / update
• Presentation outline
• Personal daily productivity system

Requirements:
1. Start with a written brief
2. Use AI for drafting only
3. Verify facts
4. Produce a final artifact you could actually use`,
          },
          {
            title: "Lab steps",
            body: `1. Define success criteria (what “done” looks like)
2. Run your best prompt template
3. Iterate twice with specific edit requests
4. Complete the QA checklist
5. Write a short reflection: what to reuse next time

Deliverable: final artifact + the prompt(s) that worked.`,
          },
          {
            title: "Reflection prompts",
            body: `Answer:
• Where did AI save the most time?
• Where did it create risk or rework?
• Which template deserves a permanent spot in your library?
• What will you standardize for your team?`,
          },
        ],
      }),
    ].map((s, order_index) => ({ ...s, order_index })),
  },
  {
    title: "Module 6: Video Generation with Grok",
    description:
      "A practical module focused on creating professional video content using Grok — from prompt craft to text-to-video, image-to-video, refinement, and real workplace use cases.",
    slides: [
      ...lessonBlock("Lesson 6.1: What Grok Video Generation Can (and Can’t) Do", {
        overview: `Understand capabilities, best professional use cases, and realistic quality expectations before you invest time in production.`,
        slides: [
          {
            title: "Capabilities for professionals",
            body: `Grok video is useful for:
• Short marketing / social clips
• Simple explainers and concept visuals
• Animating product stills or diagrams
• Internal comms snippets and training intros

Best fit: short, focused clips — not feature-length productions.`,
          },
          {
            title: "Limits & quality expectations",
            body: `Expect:
• Occasional artifacts, weird motion, or inconsistent details
• Weaker results with tiny text, complex logos, or precise UI
• Need for iteration and sometimes external editing

Plan for: generate → review → refine prompt → maybe edit outside Grok.`,
          },
          {
            title: "Now try this yourself",
            body: `Write 3 professional video ideas you might actually use (marketing, training, or internal update). For each, note audience, length target, and success criteria.`,
          },
        ],
      }),
      ...lessonBlock("Lesson 6.2: Writing Effective Video Prompts", {
        overview: `Learn prompt structure for text-to-video and image-to-video: subject, action, setting, style, camera, duration, and consistency.`,
        slides: [
          {
            title: "Video prompt structure",
            body: `Include:
1. Subject — who/what is on screen
2. Action — what happens
3. Setting — where / time of day
4. Style — realistic, clean corporate, cinematic, illustrated
5. Camera — wide, close-up, slow pan, static
6. Duration / pacing — short, steady, no rapid cuts if unsupported
7. Constraints — no readable tiny text, avoid clutter

Template:
“[Style] video of [subject] [action] in [setting]. Camera: [shot]. Lighting: [look]. Mood: [tone]. Avoid: [artifacts / text / chaos].”`,
          },
          {
            title: "Consistency tips",
            body: `• Keep one clear subject
• Change one variable per iteration
• Reuse style phrases that worked
• For image-to-video, start from a strong still
• Separate “concept exploration” from “final take” prompts`,
          },
          {
            title: "Now try this yourself",
            body: `Rewrite one vague idea (“make a video about our product”) into a full structured prompt using the template above.`,
          },
        ],
      }),
      ...lessonBlock("Lesson 6.3: Text-to-Video Workflow", {
        overview: `From idea to finished short video for marketing clips, explainers, and social content.`,
        slides: [
          {
            title: "End-to-end workflow",
            body: `1. Define audience + message (one sentence)
2. Write script beat (5–8 seconds of action)
3. Draft structured prompt
4. Generate 2–3 variations
5. Pick the best; refine style/camera
6. Add captions/branding in your editor if needed`,
          },
          {
            title: "Example brief",
            body: `Message: “Our analytics dashboard helps ops leads spot delays faster.”
Beat: clean office → dashboard highlight motion → confident team moment
Style: modern corporate, soft light, realistic
Avoid: unreadable UI text, chaotic transitions

Iterate until the story is clear without sound.`,
          },
          {
            title: "Now try this yourself",
            body: `Produce one 5–10 second text-to-video concept for a real offering or internal initiative. Save prompt + best take notes.`,
          },
        ],
      }),
      ...lessonBlock("Lesson 6.4: Image-to-Video Workflow", {
        overview: `Animate stills, product shots, diagrams, or brand assets with controlled motion.`,
        slides: [
          {
            title: "When image-to-video wins",
            body: `Use it when you already have:
• Product photography
• Diagrams / process maps
• Brand illustrations
• Event photos

Goal: subtle, professional motion — not extreme morphing.`,
          },
          {
            title: "Prompting from a still",
            body: `Describe:
• What should move
• What must stay stable (logo, product shape, text areas)
• Camera move (slow push-in, parallax, gentle pan)
• Duration / energy

Example:
“Animate this product still with a slow push-in and soft light shift. Keep product shape and label stable. No warping. Clean corporate look.”`,
          },
          {
            title: "Now try this yourself",
            body: `Choose one still from your work. Write an image-to-video prompt with explicit “keep stable” instructions, then note what broke on first try and how you would refine it.`,
          },
        ],
      }),
      ...lessonBlock("Lesson 6.5: Practical Professional Use Cases", {
        overview: `Apply Grok video to presentations, training snippets, social proof, internal communications, and content marketing.`,
        slides: [
          {
            title: "Use-case playbook",
            body: `• Presentations — opening hook or section transition clips
• Training — 10-second concept illustrations
• Social proof — short customer-story mood clips (with approval)
• Internal comms — town-hall teaser or change-initiative intro
• Content marketing — product atmosphere clips for LinkedIn/web

Always pair video with a clear message and CTA elsewhere (caption, slide, email).`,
          },
          {
            title: "Now try this yourself",
            body: `Pick one use case from the playbook and storyboard 3 beats on paper (start / middle / end) before generating anything.`,
          },
        ],
      }),
      ...lessonBlock("Lesson 6.6: Refinement, Iteration & Combining with Other Tools", {
        overview: `Improve results, handle common issues, and know when to finish the job in an external editor.`,
        slides: [
          {
            title: "Iteration checklist",
            body: `If results disappoint:
• Simplify the scene
• Strengthen subject + action
• Reduce conflicting style terms
• Lock camera (static) before adding motion
• Regenerate with one change only

Common issues: warped hands/logos, flicker, unreadable text, random objects.`,
          },
          {
            title: "Combine with other tools",
            body: `Often best workflow:
Grok (generate motion) → editor (trim, captions, logo, music) → channel publish

Use external editing when you need brand packaging, precise timing, or multi-clip sequences.`,
          },
          {
            title: "Now try this yourself",
            body: `Take one weak output and run 3 controlled iterations. Document which single change improved quality most.`,
          },
        ],
      }),
      ...lessonBlock("Lesson 6.7: Practice Lab", {
        overview: `Create 2–3 short videos for a real professional need and package them with prompts and notes.`,
        slides: [
          {
            title: "Lab requirements",
            body: `Create 2–3 short clips for one real need (campaign, training, launch, or internal update).

For each clip deliver:
• Objective
• Prompt used
• What worked / what failed
• Next refinement

Quality bar: someone unfamiliar should understand the idea silently.`,
          },
          {
            title: "Lab wrap-up",
            body: `Select your best clip and write a 5-line production note:
audience, message, prompt pattern to reuse, editing steps, and where you will publish or present it.`,
          },
        ],
      }),
    ].map((s, order_index) => ({ ...s, order_index })),
  },
  {
    title: "Module 7: Responsible Use, Impact & Next Steps",
    description:
      "Ethics, verification, measuring value, and a 30-day plan to make AI a durable professional advantage.",
    slides: slides(
      {
        title: "What this module covers",
        body: `You will finish the course with:
• Responsible-use principles for professional settings
• A verification habit for high-impact outputs
• Simple ways to measure time saved and quality gained
• A 30-day practice plan`,
      },
      {
        title: "Responsible use principles",
        body: `1. Transparency where required — know when to disclose AI assistance
2. Privacy — do not paste secrets, personal data, or confidential material into tools that are not approved
3. Fairness — watch for biased or exclusionary language
4. Accountability — you own what you send
5. Respect IP and brand — follow company policy on assets and claims`,
      },
      {
        title: "Verification before high-impact sends",
        body: `Use a lightweight gate for client, executive, or public outputs:
• Facts checked against a trusted source
• Numbers recomputed or confirmed
• Names, dates, and commitments accurate
• Tone appropriate for relationship and culture
• No confidential leakage

If you cannot verify it, do not ship it.`,
      },
      {
        title: "Measure impact simply",
        body: `Track for 2 weeks:
• Task type
• Minutes saved (estimate)
• Quality (worse / same / better)
• Risk flags caught in review

Look for patterns: which workflows deserve templates and which need more human control.`,
      },
      {
        title: "Your 30-day plan",
        body: `Days 1–7: Install daily intake + 2 communication templates
Days 8–14: Run meeting mastery on every key meeting
Days 15–21: Build one presentation and one report with the full pipeline
Days 22–27: Create 2 short Grok videos for a real need
Days 28–30: Review metrics, refine your prompt library, share one win with your team

Success = reusable system, not one-off novelty.`,
      },
      {
        title: "Course close",
        body: `You now have a practical operating system for professional AI use:
foundations → prompting → communication → analysis → deep productivity workflows → Grok video → responsible scale-up.

Next step: pick one workflow from Module 5 and one clip goal from Module 6, and execute them on real work this week.`,
      }
    ),
  },
];

async function main() {
  const { data: course, error: courseErr } = await supabase
    .from("courses")
    .select("id, title")
    .eq("id", COURSE_ID)
    .single();
  if (courseErr || !course) {
    throw new Error(courseErr?.message || "Course not found");
  }
  console.log(`Rebuilding curriculum for: ${course.title}`);

  // Remove old modules (slides cascade)
  const { error: delErr } = await supabase
    .from("modules")
    .delete()
    .eq("course_id", COURSE_ID);
  if (delErr) throw new Error(`Delete modules failed: ${delErr.message}`);
  console.log("Cleared previous modules");

  for (let i = 0; i < curriculum.length; i++) {
    const mod = curriculum[i];
    const { data: inserted, error: modErr } = await supabase
      .from("modules")
      .insert({
        course_id: COURSE_ID,
        title: mod.title,
        description: mod.description,
        order_index: i,
      })
      .select("id")
      .single();
    if (modErr) throw new Error(`Insert module failed: ${modErr.message}`);

    const rows = mod.slides.map((s) => ({
      module_id: inserted.id,
      title: s.title,
      body: s.body,
      order_index: s.order_index,
    }));

    const { error: slideErr } = await supabase.from("slides").insert(rows);
    if (slideErr) throw new Error(`Insert slides failed: ${slideErr.message}`);
    console.log(`✓ ${mod.title} (${rows.length} slides)`);
  }

  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
