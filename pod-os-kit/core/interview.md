# The Interview

One question at a time, never batched, each via the structured question tool. Carry answers forward. Write nothing until the final confirm. Between questions, run cheap background lookups to prefill the next one.

## The Plain-Language Contract

Ask about outcomes, not mechanisms. Never name a subsystem before explaining it in one plain sentence. A trailing parenthetical with the internal name is allowed for power users.

| Internal term | Say to the user |
|---|---|
| Engine | A scheduled agent run (a routine that runs itself) |
| Morning Run | The agent that prepares your day before you wake up |
| Evening Engine | The agent that closes out your day and preps tomorrow |
| Weekly Prep | The weekend agent that sets up your week |
| Sentinel | A silent watchdog that only speaks if the system breaks |
| Wake-up | The schedule that triggers an agent run |
| Banner / Frame | The live dashboard pinned to the top of the Pod |
| Capture | The box in the dashboard where you type anything on your mind |
| My Plate | Everything you currently owe, in one list |
| Waiting On | Things you are blocked on from other people |
| Relay | Internal plumbing keeping schedules alive; the user never needs this word |

## Questions

**Q1 - Identity (first step, instantly).** "You're {{NAME}}, {{TITLE_GUESS}} at {{COMPANY}} - correct?" Options: Yes, that's me / Right person, wrong title / Let me correct the details.

**Q2 - How much system?** Simple (Recommended to start) / Standard / Full, each explained in one breath (see README mode table for the plain wording). Then: "For you, or setting it up for someone else?" If proxy, apply the proxy protocol throughout.

**Q3 - What kind of work?** "What should your Pod OS be built around?" Options map to role packs: Sales (AE/SDR/CSM/SE/leader) / Marketing / Ops or PM / AI Ops / Recruiting / Product or Engineering / Support or CX / Analyst / Founder or Exec / A team or project (shared OS) / Something else. Fetch ONLY the matching `roles/*.md` pack. For "Something else", use the generic defaults in `roles/_generic.md`.

**Q4 - The proposal screen (the most important step).** Using the role pack plus what you researched (their calendar density, Slack channels, title), present ONE screen:
- Proposed tabs (from the pack, e.g. "Today · My Plate · Waiting On · Inbox · News")
- Proposed schedule (morning time, evening time if Standard+, timezone prefilled)
- Proposed Slack channel for the daily brief
- Proposed watch list ("these look like your key {{accounts/projects/campaigns}}")
Options: Build exactly this (Recommended) / Adjust the tabs / Adjust the schedule / Adjust several things. Only re-ask what they name. multiSelect for tab adjustments.

**Q5 - Where your work lives.** Present as a confirmation from research: "I found {{N}} open {{items}} under your name in {{SYSTEM}} - is that your book?" Store the system-of-record IDs (owner ID, portal/board ID, or pack equivalent).

**Q6 - Slack channel.** Detect channels the bot can post to and offer them, including "create a fresh personal channel". Simple needs one channel; Standard/Full may split daily brief vs agent logs (offer to use one for both).

**Q7 - Capture markers + task cap.** Explain capture in two sentences, confirm the default markers (plain = inbox, `!` = instant task, `?` = task + calendar block) and the open-task cap (10 recommended). This is also where you state the sacred rule: "Your words are never rewritten; agents only annotate."

> SIMPLE MODE EXIT: one-screen summary, Build it / Adjust one thing. Then install and stop.

**Q8 - Targets** (Standard+). Confirmation style: detected quota / hires / launch dates / KPIs per role pack. The system of record's "done" state is the source of truth; self-reported numbers are dated baselines only.

**Q9 - Watch topics** (Standard+). multiSelect from the role pack's topic catalog, preselected per pack.

**Q10 - Brief personality** (Standard+). multiSelect: weather / audio briefing / a daily fun image / keep it all business.

**Q11 - Coverage** (Standard+). Morning + evening + watchdog (Standard default) / Add the weekend setup (Full default) / Morning only for now.

**Q12 - Confirm + build.** One-screen summary of everything derived. Build it / Adjust one thing. On build, execute the install order in SETUP.md, then verify, then orient.

**Q13 - Proactive moves (Full only).** "Each morning, want 3-5 suggested next moves with graded options (A bold / B balanced / C patient) you approve with a one-line Slack reply like '1B 2 skip'? Nothing runs without your reply; drafts are never auto-sent." Confirm daily caps (5 new / 8 in thread).

## Question hygiene

- Target: Simple mode completes in 7 questions or fewer, including the proposal screen.
- If a background lookup fails, ask with what you have and mark the rest "I'll detect this next."
- Group ALL undetectable free-text gaps into ONE question.
- Every recommended option is literally marked "(Recommended)".
