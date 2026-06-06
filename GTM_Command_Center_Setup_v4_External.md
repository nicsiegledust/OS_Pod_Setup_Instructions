# GTM Command Center — Pod Setup Playbook v4 (External Edition)

A single, self-contained playbook that turns a Dust Pod into a GTM Command Center for one sales rep. Run it ONCE per Pod. It interviews the rep, seeds the file system, installs the playbooks and specs, builds and pins a live glass banner, then wires three scheduled engines (Morning Run, Nightly Review, Weekly Prep) on recurring wake-ups with automatic renewal.

**Audience:** any sales rep (AE, SDR, CSM, SE, sales leader) at any company using Dust. Everything company-specific in this document is a `{{PLACEHOLDER}}` that the setup interview discovers and fills. Nothing here assumes a particular CRM portal, Slack workspace, data warehouse, or account list.

**Lineage:** v2 (single morning engine, interview model) → v3 (wake-up relay, playbooks/specs layout, STALE heartbeat, retention) → **v4** adds: the pinned glass banner + its design system, image asset rules, a verified contact-photo registry, champion and outbound-tracker state files, engine liveness watchdogs (engines watch each other), an expanded day-type catalog (incl. QUARTER CLOSE and CONFERENCE DAY), a Sunday Slack weekly preview (and removal of the failed "week mode" banner experiment), the verified-stage-ID method for CRM pipelines, the usage workspace-mapping pattern, and a hard Speed Protocol for the setup interview itself.

No em dashes anywhere in output. Be calm, fast, confirmatory. Prefill from context so the rep mostly clicks rather than types.

---

## How to run this

This file is portable. Two equivalent ways to use it:

1. **Generic assistant:** drop this `.md` into a fresh Pod and tell the assistant "set up this Pod using this file." It executes top to bottom.
2. **Dedicated setup agent:** paste this file as the agent's instructions.

### Tools and skills required (verify silently; if one is missing, say so when it first matters, do not block the interview)

**Tools:** Ask User Question, Pod file read/write, pod_manager (create_conversation, edit_information), Wake-ups, calendar (Google Calendar or Outlook), CRM (HubSpot, Salesforce, or Attio), Slack + a Slack Bot integration (for posting as a bot to the rep's channel), email (Gmail or Outlook, for overnight unread scanning), image generation (weather animal), speech generation (audio briefing), and a usage/analytics source if the rep sells a product with telemetry (e.g. a Snowflake warehouse).

**Skill naming rule:** if your workspace maintains a canonical skill family (e.g. a `[GTM]`-prefixed set), reference skills in playbooks by family prefix + purpose, never by hardcoded skill IDs or exact names; names rotate. If a referenced skill is missing at runtime, find the closest family match, degrade gracefully (skip the step with a note), and record the rename in STATUS.md.

**Skills:** a Frames/interactive-content skill (REQUIRED: frame files can only be created and edited through interactive content tools, never by writing .tsx to disk), a design-language skill if available, and a data-warehouse query skill if usage data exists.

---

## PART 0 — The Speed Protocol (non-negotiable)

Real-run feedback: a previous setup spent many minutes gathering data before asking anything, and the rep sat watching a spinner. Never again. Hard rules for the executing agent:

1. **Question 1 fires within the FIRST agent step.** Before ANY heavy data gathering (no CRM pulls, no calendar scans, no warehouse queries), ask Question 1 using ONLY instantly available context: the user's name and email from the conversation context, and the company inferred from the email domain.
2. **Maximum ~30 seconds of work before Question 1.** If you cannot resolve a value instantly, ask with what you have and mark the rest "I'll detect this next."
3. **Question 1 is always identity confirmation:** "You're {{REP_NAME}}, {{REP_TITLE_GUESS}} at {{COMPANY}} — correct?" Options: `Yes, that's me` / `Right person, wrong title` / `Let me correct the details`.
4. **Enrich AFTER or in PARALLEL.** Title, CRM owner ID, quota guess, territory, manager: pull these from the CRM and directory between questions, while the rep reads the next question.
5. **Present findings as confirmations, not blank questions.** Wrong: "What is your quota?" Right: "Your CRM rollup suggests a {{QUOTA_GUESS}} annual quota — use that?" with options `Correct` / `Close, let me adjust` / `Way off, I'll type it`.
6. **Every decision point in this playbook uses the Ask User Question tool** with structured options (2-4 choices, recommended option marked). Free text only for values that cannot be enumerated (quota numbers, account names), and even then grouped into one question.

---

## PART 1 — The Interview

One question at a time, never batched, each via Ask User Question. Carry answers forward. Write nothing until the final confirm step. Between questions, run the cheap background lookups for the next prefill.

**Q1 — Identity (per the Speed Protocol, first step, instantly).** Confirm name, title, company. Store: `{{REP_NAME}}`, `{{REP_EMAIL}}`, `{{REP_TITLE}}`, `{{COMPANY}}`.

**Q2 — Role pack.** "Which best describes how you sell?" Options: Account Executive (Recommended if title matches) / SDR-BDR / Customer Success Manager / Sales Engineer or Leader. The pack preselects the interest catalog weights. Nothing is locked.

**Q3 — Timezone + run window.** Prefill timezone from profile. "Your engines will run on weekdays. Morning run at which local time?" Options: 4:00 AM (Recommended: done before you wake) / 6:00 AM / 7:00 AM / Custom. Also fixes Nightly Review at 8:00 PM and Weekly Prep Sunday 7:00 PM unless the rep objects in Q12.

**Q4 — CRM confirmation (prefilled in parallel).** By now the background lookup should have the rep's CRM owner ID and open-deal count. "I found {{N_DEALS}} open deals under owner ID {{CRM_OWNER_ID}} — is that your book?" Options: `Yes` / `Wrong owner, let me check` / `My CRM isn't connected yet`. Store `{{CRM_OWNER_ID}}`, `{{CRM_PORTAL_ID}}` (HubSpot portal / Salesforce instance / Attio workspace).

**Q5 — Quota + fiscal calendar.** Confirmation style: present the detected or estimated annual quota and quarter dates. Store `{{ANNUAL_QUOTA}}`, fiscal quarter boundaries, forecast cadence (e.g. Monday forecast call). BLOCKING: quota and named accounts (Q6) are required before STATUS.md can say "complete"; group any undetectable gaps into ONE free-text question.

**Q6 — Named accounts + tiers.** Present the top accounts by open pipeline + recent activity from the CRM pull: "These look like your key accounts: {{LIST}}. Mark the Tier 1 set (the accounts you'd cold-call a CEO for)." multiSelect. Store as `namedAccounts.tier1[]` and `nurture[]` in gtm-intel.

**Q7 — Interests (multiSelect).** "What should your Command Center watch every morning?" Options from the topics catalog, preselected per role pack: Deal movement & risk / Pipeline generation & outbound / Meetings & prep / Multithreading & exec alignment / Account news / Product usage & adoption / Post-call follow-up / Internal updates. Then weight the top 4-5 (one question each, max 5, recommend the pack weight).

**Q8 — Channels.** "Where should the daily brief go?" Detect candidate Slack channels the bot can post to. Need TWO channels: a personal daily-prep channel `{{DAILY_CHANNEL_ID}}` (brief + audio + weather) and an agent-logs channel `{{AGENT_LOGS_CHANNEL_ID}}` (meeting prep threads, call analysis). Offer to use one channel for both. Then: "Map key accounts to their Slack channels (internal + shared external)" as one grouped free-text question, skippable.

**Q9 — Usage data.** "Does your product have usage telemetry I can pull per customer (e.g. a warehouse table of active users)?" Options: `Yes, warehouse connected (Recommended)` / `Yes, but not connected yet` / `No usage data`. If yes: capture `{{USAGE_TABLE}}` (the fact table), the user-count definition, and START THE WORKSPACE MAPPING (Appendix C): for each banner account, resolve the customer's tenant/workspace ID once, store it in gtm-intel `workspaceMapping`, and never re-derive by name search (name search produces false positives).

**Q10 — Brief personality.** multiSelect: Local weather / City vibe line / Daily weather animal image (fun) / Audio briefing / Keep it all business. Store flags in profile + notifications.

**Q11 — Outbound stack.** "How do you run outbound?" Options: `Sequencer for volume + manual for execs (Recommended)` / `All sequencer` / `All manual` / `No outbound`. If a sequencer (Lemlist, Outreach, Salesloft) is connected, capture campaign scope. Manual lane gets the outbound-tracker state file (Part 2).

**Q12 — Engines opt-in.** "Three engines: Morning Run (weekdays {{TIME}}), Nightly Review (weekdays 8 PM: closes the day, analyzes calls, preps tomorrow's meetings), Weekly Prep (Sunday 7 PM: week setup + Slack weekly preview). Wire all three?" Options: `All three (Recommended)` / `Morning only for now` / `Morning + Nightly`.

**Q13 — Task cap.** 3 / 5 (Recommended) / 7 / No cap.

**Q14 — Confirm + build.** One-screen summary of everything derived. Options: `Build it` / `Let me adjust one thing`. On adjust, re-ask only the named step. On build, perform ALL writes in Parts 2-5, then run the smoke test (Part 7) and report.

---

## PART 2 — File System Seed

Create this layout (templates in Appendix A; do not overwrite files that already exist):

```
README.md            <- the canonical map; every agent reads this FIRST
STATUS.md            <- setup status + changelog of structural changes
{{Banner}}.tsx       <- pinned glass banner frame (created in Part 4, via interactive content tools ONLY)
dashboard_data.json  <- the banner's data file (refreshed daily by the Morning Run)

playbooks/           <- step-by-step instructions agents EXECUTE
  morning-run.md  nightly-review.md  weekly-prep.md
  banner-refresh.md  meeting-prep.md  call-analysis.md
  wakeup-relay.md  toolset-manifest.json
  (optional satellites: deal-setup.md, multithread.md, deal-heartbeat.md, inbound-leads.md)

specs/               <- output contracts (read, never executed)
  banner-design-system.md  frame-rules.md  north-star.md
  daily-log-schema.md  daily-frame-spec.md  frame-template.tsx
  dedup-gates.md  weather-animal.md (optional)

my-context/          <- who the rep is
  profile.json  gtm-intel.json  contact-cards.json
  (optional doctrine: sales-philosophy.md, icp.md, outbound-strategy.md)

what-i-watch/        <- topics.json  data-sources.json  role-presets.json
how-i-work/          <- schedule.json  tasks.json  notifications.json  day-types.json

logs/                <- everything the system produces
  latest.json  YYYY-MM-DD.json  eod/  weekly/  prep/  details/  archive/
  handoff-status.json  research-log.json  champions.json  outbound-tracker.json
```

**The five rules baked into README.md (verbatim, these are load-bearing):**
1. **Single-writer rule.** The Morning Run is the only scheduled writer of the daily frame, North Star, tasks, banner data, and daily log.
2. **Config lives in JSON, behavior lives in playbooks, contracts live in specs.** Never hardcode values (wake-up IDs, quota, channel IDs) inside playbooks; reference the JSON file that owns them.
3. **The banner is data-driven.** Daily runs update `dashboard_data.json` only, never the banner .tsx.
4. **Every engine ends every run with the relay check** (`playbooks/wakeup-relay.md`).
5. **Retention:** weather/audio 7 days, archived frames + prep files 30 days, dated logs 90 days. The Morning Run cleanup step enforces this. Never delete `latest.json`, `handoff-status.json`, state registries, or `dashboard_data.json`.

**New-in-v4 state registries (seed empty, templates in Appendix A):**
- `my-context/contact-cards.json` — the single contact photo/identity registry, keyed by email. Photo contract: stable public URL or ~96px JPEG data URI ONLY. BANNED: signed CDN URLs that expire silently (e.g. `media.licdn.com/...`) and platform-internal file links that are auth-gated for external viewers. Fetch a photo once, convert to data URI, cache forever.
- `logs/champions.json` — champion roster under a strict test (champion = power AND influence, not just friendliness). Entries carry `heartbeatValidated: false` until a scheduled heartbeat run confirms them.
- `logs/outbound-tracker.json` — manual exec-lane outbound state per contact (motion, status, touches, bump schedule: +4 business days, then +7, max 2 bumps, then parked).
- `logs/research-log.json` — cooldown stamps for intelligence signals so the same news is never re-posted (URL 14d, headline 7d dedup).
- `logs/handoff-status.json` — wake-up relay state per engine (lastRun, fireCount, successor status).
- `logs/inbound-leads.csv` — Pod-native queryable inbound lead log, one row per lead (date, contact, company, source, score, status, next action). CSV on purpose: append-mostly flat rows you want to filter and count.
- `logs/pipeline-history.csv` — one row per day (total open, deal count, closed won YTD/QTD, per-stage USD, attainment %). Appended by the Morning Run; exempt from retention; feeds 90-day trend charts. The rule of thumb: nested machine-edited state stays JSON, flat append-mostly history becomes CSV.

---

## PART 3 — Playbooks and Specs Install

Write the engine playbooks from the templates in Appendix A, filling `{{PLACEHOLDERS}}` from the interview. The three engines:

### Morning Run (weekdays, rep-chosen time)
Step order is the contract: **0** preconditions (read README + config) → **0.5** Engine Liveness Watchdog → **1** pull the day's data (calendar, CRM deals, email unreads, prep files from last evening, usage telemetry) + compute deltas vs yesterday's log → **1.5** optional weather animal → **1.75** inbound leads sweep (see below) → **2** decide priorities (day-type weight boosts) → **2.5** refresh `dashboard_data.json` per `playbooks/banner-refresh.md` → **3** regenerate the daily frame (via interactive content tools) → **3.5** retention cleanup → **4** North Star calendar event (preserve the rep's THINKING ABOUT scratchpad verbatim) → **4.5** daily log to `logs/latest.json` + dated copy + one `pipeline-history.csv` row → **5** tasks (capped) → **6** Slack brief (threaded: bold one-liner parent, full brief in thread) → **6.5** Friday weekly rollup → **7** optional audio briefing → **7.5** detect-and-spawn satellites → **8** wake-up relay.

### Nightly Review (weekdays 8 PM)
Watchdog (did the Morning Run write today's `latest.json`?) → inbound leads delta sweep (only leads posted since the morning sweep) → EOD reconciliation into `logs/eod/YYYY-MM-DD.json` (completed tasks, carry-overs, commitments captured, tomorrow seeds) → call analysis of today's transcripts (update CRM, draft follow-ups) → meeting prep for the next business day into `logs/prep/` (skip Friday; Sunday covers Monday) → relay.

### Weekly Prep (Sunday 7 PM)
Watchdog (Friday's latest.json + eod file exist?) → refresh `dashboard_data.json` in the STANDARD daily format (**there is no special "week mode"**: the banner keeps the identical structure 7 days a week; the v4 banner's full-week calendar already shows the coming week, and a Sunday refresh simply flips the badge to LIVE with Monday loaded) → `logs/weekly/YYYY-Www.json` → up to 5 high-quality week tasks → **Sunday Slack weekly preview** to `{{DAILY_CHANNEL_ID}}` via the Slack Bot, threaded format: parent `🗓️ Week of <Mon date> — <N> external meetings, <M> deals in play, must-win: <top outcome>`, thread = must-win outcomes (max 3), week at a glance per weekday, Monday spotlight, risks to watch, open loops → Monday meeting prep → relay.

### Engine Liveness Watchdogs (v4, install in all three playbooks)
The engines watch each other; the morning Slack post is the system's dead-man switch:
- Morning Run checks: yesterday's `logs/eod/` file exists (Tue-Fri); this week's `logs/weekly/` file exists (Mondays); no engine in `handoff-status.json` has fireCount >= 30 with handoffComplete=false. Misses become a ⚠️ line in the Slack post, never a silent skip.
- Nightly checks: today's `latest.json` exists (Morning Run alive).
- Weekly checks: Friday's `latest.json` + eod file exist.
- Every engine self-reports `lastRun` + `fireCount` into `logs/handoff-status.json` at the START of its run, not only at the relay step.

### Day types (`how-i-work/day-types.json`)
Rules evaluate in order, FIRST MATCH WINS, so order by specificity, urgent conditions first:
1. `last_5_business_days_of_quarter` → **QUARTER CLOSE** (max deal urgency: lead with the close list and the exact next action per deal, demote everything else)
2. `last_business_day_of_month` → MONTH CLOSE
3. `conference_or_event_day` → **CONFERENCE DAY** (calendar has an all-day event or title matching conference/summit/expo/offsite/dinner; lead with who to meet, the 2-3 conversations to manufacture, logistics, what NOT to spend time on)
4. `day_before_big_meeting` → GAME DAY
5. `external_meeting_count>=5` → HEAVY CALENDAR
6. `first_business_day_of_month` → MONTH OPEN
7. `Monday` → FORECAST MONDAY
8. `Friday` → WEEK CLOSE
9. `no_external_meetings` → BUILD DAY
10. `default` → **LIVE** (always last)

Each rule carries a `weight_boost` map applied to interest weights before priority scoring, and a `badge` shown in the frame header.

### Detect-and-spawn pattern (optional satellites)
Cheap detection lives in an engine step; heavy work runs in spawned Pod conversations ("Deal Setup - {Company}", "Multithread - {date}", "Deal Heartbeat - {date}"). Idempotency guards: a CRM completion note per deal, once-per-day titled-conversation checks, and shared dedup gates in `specs/dedup-gates.md`. Inbound leads pattern (v4): the default is NO standalone agent. The Morning Run does a full 48h sweep and the Nightly Review does a same-day delta sweep, giving ~half-business-day worst-case latency from two engines you already run. Only if true intraday speed-to-lead is required, add a thin standalone agent on a builder trigger (no 32-fire limit) pointing to the same playbook; behavior always lives in the playbook, never in agent prompts. Two source-channel modes: **full flow** (assigned leads: dedup → enrichment → ICP score → CRM write → email DRAFT, never auto-sent → CSV row → notification) and **log-only** (channels whose leads already enter an automatic marketing sequence: capture a CSV row + a one-line ping, and NEVER draft, sequence, enrich, or follow up; double-touching an auto-sequenced lead is how reps spam prospects).

---

## PART 4 — The Banner

The Pod's pinned frame is a compact "glass" dashboard: pipeline tile (stage bars + deal list popover with CRM deep links), full-week calendar (day pills, meeting-prep popovers with attendee cards), top-accounts usage tile (6-month MAU trend), tasks tile, and a rotating signal ticker. Build it ONCE at setup; after that it is never edited on daily runs.

### Build steps
1. Write `specs/banner-design-system.md` from the Appendix A template (glass tokens, tile grid, the height contract: pick a fixed height around **268px desktop / 296px mobile, NO vertical scrolling, ever**; new information rides existing surfaces: ticker, chips, popovers).
2. Generate the banner TSX **via the interactive content / Frames tooling** against that spec, reading `dashboard_data.json` and `how-i-work/notifications.json` from Pod paths at render time. Include: a LIVE/STALE badge driven by `dashboard_data.json.lastRefreshed` (STALE when older than ~26h, so silent refresh failures are visible; note: with weekday-only engines the badge legitimately shows STALE on Saturdays until the Sunday refresh), an overnight pipeline delta chip (renders only when nonzero), and computed ticker lines (quarter pacing from quota/4 + closeDates, deals closing ≤30d, next best action).
3. Pin it: `pod_manager edit_information pinnedFramePath`.
4. Seed `dashboard_data.json` with a first manual refresh so the banner never renders empty.

### The data contract (`playbooks/banner-refresh.md`)
The Morning Run (and Sunday Weekly Prep) write ALL of:
- `pipeline`: `totalOpen`, `closedWonYTD`, `closedWonQTD`, `annualQuota`, `stages[] {short, stageName, value, count, color}`, `deals[] {name, company, domain, amount, stage, close, closeDate, dealId, crmUrl}`, `deltaOvernight`
- `calendar`: `weekOf`, `weekMeetings[]` (Mon-Fri, `isToday` correct), `events[] {day, start, end, label, type, domain, detail{why, objective, ask, talkingPoints[≤3], risks[≤2], attendees[], crmCompanyUrl?, websiteUrl?}}` distilled from the evening prep files; omit unknown URLs rather than guess
- `usage`: `mauMonths` (6 labels newest-first, index 0 = current month-to-date), `rows[] {label, domain, mau[6], arr, note}` (null entries for missing months, never fabricated)
- `signals[] {company, domain, type, priority, text ≤140 chars, action, source}`, `tasks[] {text, priority, account, due?}`, `quota`, `accounts`, `nextBestAction` (≤90 chars, omit rather than fabricate), `lastRefreshed` (current UTC ISO, NEVER copied forward)

### Verified-stage-ID method (v4, CRM-agnostic)
Never trust stage labels guessed from memory or fuzzy matching. Verify the pipeline's internal stage IDs ONCE at setup and freeze them in a table inside `banner-refresh.md`:
- **HubSpot:** read the auto-generated `hs_v2_date_entered_<stageId>` property labels (e.g. `Date entered "Product validation (Prospect pipeline)"`); each label binds a stage ID to its human name and pipeline. Record the mapping `{{STAGE_ID}} → {{STAGE_NAME}}` for every open stage plus the closed-won/closed-lost IDs to EXCLUDE.
- **Salesforce:** query `OpportunityStage` (ApiName, MasterLabel, IsClosed, IsWon).
- **Attio:** read the status attribute options on the deal object.
If a deal ever shows an unmapped stage ID, flag it in system_notes rather than guessing.

### Image asset rules (`specs/frame-rules.md`, applies to ALL frames in the Pod)
- **Company logos:** never search, never cache; compute the URL `https://img.logo.dev/{domain}?token={{LOGO_DEV_TOKEN}}` (get a free publishable token at logo.dev; it is public and stable). Hide on load error.
- **Contact photos:** ONLY from `my-context/contact-cards.json`. Allowed: stable public URL or ~96px JPEG data URI. Banned: expiring signed CDN URLs and auth-gated internal file links. A frame that "looks fine when I'm logged in" is not verification.
- **Missing assets degrade**, never block: initials avatar, gray placeholder.

---

## PART 5 — Engines and Wake-ups

### Platform facts (verified against Dust source, June 2026)
- A recurring (cron) wake-up auto-expires after **32 fires** (`MAX_WAKE_UP_FIRES = 32`). Weekday cadence = ~6.5 weeks of life; weekly cadence = ~32 weeks.
- Each conversation holds at most **1 active wake-up**.
- Every wake-up message includes `fireCount: X / 32`; the final fire carries an expiry warning.

### Wiring (per engine the rep opted into)
1. Create the engine conversation via `pod_manager create_conversation` (titles: "Morning Run Engine", "Nightly Review Engine", "Weekly Prep Engine"), agentName = the chosen runner. Kickoff message = "Each time you are invoked here, execute `playbooks/<engine>.md` top to bottom, then run `playbooks/wakeup-relay.md`." Keep the wake-up reason MINIMAL and defer to the playbook files; long reasons drift from the source of truth.
2. Inside each conversation, schedule exactly ONE recurring wake-up with the UTC-equivalent cron of the rep's local times (e.g. 4:00 AM ET weekdays = `0 8/9 * * MON-FRI` depending on DST; compute, do not guess). Before creating, list wake-ups and cancel any prior setup duplicates.
3. Record every conversation ID + wake-up ID in `how-i-work/schedule.json` (the SINGLE source of truth for canonical IDs; playbooks must never hardcode them) and seed each engine's entry in `logs/handoff-status.json`.
4. **Verify live, do not assume:** post a probe in each engine conversation asking the runner to confirm its wake-up exists and report `fireCount`. Stamp `lastVerified` in `handoff-status.json`.

### The Wake-Up Relay (`playbooks/wakeup-relay.md`, final step of EVERY run)
- fireCount < 26: update your engine's entry in `handoff-status.json` (lastRun, fireCount, status healthy). Done.
- fireCount >= 26: create a successor conversation ("{Engine} - {Month YYYY}") whose only job is to (1) schedule its own identical wake-up and (2) write `successor.confirmed: true` + its IDs into `handoff-status.json`. The ~6 remaining fires are the retry window; never assume one attempt succeeded.
- Only after `successor.confirmed` is true: update `schedule.json` canonical IDs, cancel your own wake-up, mark `handoffComplete`.
- NEVER create a second wake-up in your own conversation; NEVER cancel your own wake-up before the successor is confirmed.

---

## PART 6 — Verification Checklist (run before declaring setup complete)

- [ ] Every file referenced by README.md or any playbook exists; every existing file appears in README's folder map.
- [ ] All .json files parse. `STATUS.md` records the setup date and rep identity.
- [ ] `schedule.json` IDs match `handoff-status.json` IDs match the live wake-ups (probe-verified, `lastVerified` stamped).
- [ ] Banner pinned; `dashboard_data.json` seeded; badge reads LIVE; no vertical scroll at the contract height; every deal row deep-links to the CRM record.
- [ ] Stage-ID table verified via the CRM's own metadata (not guessed) and frozen in `banner-refresh.md`.
- [ ] Usage workspace mapping covers every banner account or marks it `mau: null` honestly.
- [ ] `contact-cards.json`, `champions.json`, `outbound-tracker.json`, `research-log.json` exist with valid skeletons.
- [ ] day-types.json rules are in specificity order (QUARTER CLOSE first, `default` LIVE last).
- [ ] Slack Bot can actually post to `{{DAILY_CHANNEL_ID}}` and `{{AGENT_LOGS_CHANNEL_ID}}` (send a test message).
- [ ] No legacy scheduled agents still write to the same surfaces (retire or repoint them; document in STATUS.md).

## PART 7 — Smoke Test

1. **Manual mini morning run:** in the Morning Run conversation, ask the runner to execute Steps 0-2.5 only (data pull + priorities + banner refresh). Confirm `dashboard_data.json.lastRefreshed` updates and the banner re-renders with real deals and this week's meetings.
2. **Banner STALE test:** temporarily set `lastRefreshed` back 30h; confirm the badge flips STALE; restore.
3. **Nightly dry run:** ask the Nightly conversation to write a `logs/eod/` file from today's state (it should stamp `"playbook": "playbooks/nightly-review.md"`).
4. **Relay dry-read:** ask each engine to read `wakeup-relay.md` and state, in one sentence, what it will do at fireCount 26. Wrong answer = fix the kickoff message now.
5. **Watchdog test:** rename `logs/latest.json` for a minute and confirm the Nightly watchdog would flag the miss (dry-read), then restore.
6. Report results in STATUS.md.

## PART 8 — First-Week Expectations

- **Day 1 (first weekday):** the 4 AM run posts the first full brief. Expect 1-2 `system_notes` gaps (a missing domain, an unmapped account). Fix config, not playbooks.
- **First Friday:** weekly rollup section appears in the brief; champion heartbeat validates `champions.json` entries.
- **First Sunday:** Weekly Prep posts the weekly preview to Slack and flips the banner LIVE for Monday.
- **Week 1 hygiene:** confirm retired/legacy agents stopped posting; confirm retention cleanup ran; skim `handoff-status.json` once.
- **Weeks 5-7:** the first relay handoffs occur automatically around fireCount 26. The morning Slack post is the dead-man switch: if it ever goes silent, check `logs/handoff-status.json` first.

---

## Lessons-learned guardrails (hard-won, do not relearn these)

1. **Frame files are edited ONLY through the interactive content / Frames tools.** Frames render from a versioned store; writing the .tsx to Pod disk does NOT update what users see. Interactive edits sync back to disk, not the other way around.
2. **The banner is JSON-only on daily runs.** Layout changes are rare, deliberate, and go through the design spec + interactive tools.
3. **Wake-ups are mortal (32 fires).** The relay protocol plus watchdogs is what keeps the system alive. Never hardcode wake-up IDs in playbooks.
4. **Never fail silently.** Every gap goes to `system_notes` and, when human action is needed, ONE Pod task.
5. **Confirmations beat questions.** Both in the setup interview and in daily briefs: present detected values to correct, not blanks to fill.
6. **Verify IDs against the system of record once, then freeze them** (stage IDs via CRM metadata, workspace IDs via the warehouse, channel IDs via a test post). Fuzzy name matching is how dashboards lie.
7. **Retention is part of the system.** Unbounded artifact growth makes Pods unusable; the Morning Run cleanup step is not optional.
8. **No week mode.** One banner structure, 7 days a week. Special-cased layouts rot.

---

# APPENDIX A — Seed templates (write verbatim, fill {{placeholders}})

## --- logs/handoff-status.json ---
```json
{
  "schemaVersion": "handoff_status.v1",
  "note": "Single source of truth for wake-up relay state per engine. Updated by each engine on every fire per playbooks/wakeup-relay.md. Canonical IDs live in how-i-work/schedule.json.",
  "updatedAt": null,
  "engines": {
    "morningRun":   { "conversationId": null, "wakeUpId": null, "cron": "{{MORNING_CRON}}", "playbook": "playbooks/morning-run.md",   "lastRun": null, "fireCount": 0, "status": "pending", "successor": { "created": false, "confirmed": false, "conversationId": null, "wakeUpId": null }, "handoffComplete": false, "lastVerified": null },
    "nightlyReview":{ "conversationId": null, "wakeUpId": null, "cron": "{{NIGHTLY_CRON}}", "playbook": "playbooks/nightly-review.md","lastRun": null, "fireCount": 0, "status": "pending", "successor": { "created": false, "confirmed": false, "conversationId": null, "wakeUpId": null }, "handoffComplete": false, "lastVerified": null },
    "weeklyPrep":   { "conversationId": null, "wakeUpId": null, "cron": "{{WEEKLY_CRON}}",  "playbook": "playbooks/weekly-prep.md",   "lastRun": null, "fireCount": 0, "status": "pending", "successor": { "created": false, "confirmed": false, "conversationId": null, "wakeUpId": null }, "handoffComplete": false, "lastVerified": null }
  }
}
```

## --- my-context/contact-cards.json ---
```json
{
  "_note": "Single verified contact registry, keyed by email. photo: stable public URL or ~96px JPEG data URI ONLY. BANNED: expiring signed CDN URLs (e.g. media.licdn.com) and auth-gated internal file links. Fetch once, cache forever. Never guess emails, titles, or LinkedIn URLs; omit instead.",
  "updated": null,
  "contacts": {}
}
```

## --- logs/champions.json ---
```json
{
  "schemaVersion": "champions.v1",
  "note": "Champion roster. Strict test: champion = power AND influence. Status values: champion, influence_only, power_only, developing. heartbeatValidated flips true only when a scheduled heartbeat run confirms the relationship.",
  "updatedAt": null,
  "people": []
}
```
Entry shape: `{ "name", "email", "company", "title", "linkedin", "status", "declaredBy", "heartbeatValidated": false, "note" }`

## --- logs/outbound-tracker.json ---
```json
{
  "schemaVersion": "outbound_tracker.v1",
  "note": "Manual exec-lane outbound state per contact. Volume lane lives in the sequencer; this file tracks hand-crafted Tier 1 outreach only.",
  "updatedAt": null,
  "cadence": { "firstBumpBusinessDays": 4, "secondBumpBusinessDays": 7, "maxBumps": 2, "afterMaxBumps": "parked", "bumpStyle": "reply in the existing thread" },
  "contacts": []
}
```
Contact shape: `{ "email", "name", "company", "tier", "motion", "status": "drafted|sent|bumped_1|bumped_2|replied|meeting_booked|parked", "touches": [], "nextActionDate", "thread" }`

## --- logs/research-log.json ---
```json
{
  "schemaVersion": "research_log.v1",
  "note": "Cooldown state ONLY for intelligence signals (URL dedup 14d, headline dedup 7d, per-type cooldowns). Signals themselves live as CRM notes.",
  "updatedAt": null,
  "companies": {}
}
```

## --- my-context/gtm-intel.json (skeleton) ---
```json
{
  "schemaVersion": "gtm_intel.v2",
  "note": "Single source for quota, accounts, tiers, at-risk rules, competitors, and the usage workspace mapping. Edit here, never in playbooks.",
  "quota": { "annual": "{{ANNUAL_QUOTA}}", "attainmentYTD": null, "fiscalQuarter": { "start": null, "end": null, "forecastCadence": null } },
  "namedAccounts": { "tier1": [], "nurture": [] },
  "atRiskRules": ["{{AT_RISK_DEFINITION}}"],
  "competitors": [],
  "workspaceMapping": {
    "_note": "domain -> customer tenant/workspace ID in the usage warehouse. Resolve ONCE at setup, verify, freeze. NEVER re-derive by company-name search (false positives). Missing account => mau: null + system_notes, never a guess."
  }
}
```

## --- how-i-work/notifications.json (skeleton) ---
```json
{
  "personalDailyPrep": { "channelId": "{{DAILY_CHANNEL_ID}}", "channelName": "{{DAILY_CHANNEL_NAME}}", "postAs": "bot", "format": "threaded", "parentFormat": "Daily Prep — [Weekday, Month Day] ⤵️" },
  "agentLogs": { "channelId": "{{AGENT_LOGS_CHANNEL_ID}}", "channelName": "{{AGENT_LOGS_CHANNEL_NAME}}", "postAs": "bot", "format": "threaded", "usedBy": ["playbooks/meeting-prep.md", "playbooks/call-analysis.md"] },
  "audioBriefing": { "enabled": true, "voice": "warm professional", "length": "comprehensive" },
  "accountChannels": {},
  "globalChannels": {},
  "priorityKeywords": ["renewal", "expansion", "champion", "blocker", "procurement", "POC", "competitor"]
}
```

## --- how-i-work/day-types.json ---
Use the 10 rules from Part 3, in that exact order, each as `{ "condition", "badge", "weight_boost": {}, "note" }`, with the note field carrying the framing guidance (what the frame should lead with on that day type).

## --- how-i-work/schedule.json (skeleton) ---
```json
{
  "schedule": { "frequency": "daily", "localTime": "{{MORNING_TIME}}", "timezone": "{{TIMEZONE}}" },
  "canonicalDailyWakeup": null,
  "canonicalDailyConversationId": null,
  "dailyWakeupCron": "{{MORNING_CRON}}",
  "orchestration": "single_wakeup_runs_all_daily_work",
  "nightlyNorthStarWakeup": { "cron": "{{NIGHTLY_CRON}}", "playbook": "playbooks/nightly-review.md", "wakeUpId": null },
  "weeklyPrepWakeup": { "cron": "{{WEEKLY_CRON}}", "playbook": "playbooks/weekly-prep.md", "wakeUpId": null },
  "wakeupRelay": { "protocol": "playbooks/wakeup-relay.md", "maxFiresPerWakeup": 32, "maxActiveWakeupsPerConversation": 1, "handoffThresholdFireCount": 26, "handoffLog": "logs/handoff-status.json" },
  "dailyWakeupReasonPolicy": "Minimal reason only. The wake-up must defer to current Pod files to avoid instruction drift."
}
```

## --- playbooks/wakeup-relay.md ---
Copy the protocol from Part 5 verbatim into its own file, with the heading "# Wake-Up Relay Protocol" and the platform facts block. This file is shared by all engines.

## --- playbooks/banner-refresh.md ---
Write from the Part 4 data contract, plus: the frozen verified stage-ID table (Appendix B method), the contact enrichment rules (registry first, CRM second, never guess), the domain map for logos, a validation step (each unfillable field = null + system_notes + at most one Pod task), and the heartbeat rule (always set `lastRefreshed` fresh on success; badge logic lives in the frame).

## --- Engine playbooks (morning-run.md, nightly-review.md, weekly-prep.md) ---
Write from the Part 3 step lists, expanding each step into explicit instructions for YOUR stack (CRM object names, calendar tool, channel IDs referenced via notifications.json). Every engine playbook ends with the same two sections: "Final step — Wake-Up Relay" and "Engine Liveness Watchdog". Keep behavior in these files and values in the JSON configs; that separation is what lets you tune the system without touching prompts or wake-ups.

# APPENDIX B — Verified-stage-ID worksheet (HubSpot example)

1. List the rep's open deals with `dealstage` raw values: you get internal IDs like `987654321`.
2. For each ID, read the portal's property metadata for `hs_v2_date_entered_<stageId>`; its label embeds the human name and pipeline, e.g. `Date entered "Opportunity discovery (Prospect pipeline)"`.
3. Freeze the table in `banner-refresh.md`:

| Stage ID | Label | Pill color | In open pipeline? |
|---|---|---|---|
| {{STAGE_ID_1}} | {{STAGE_1_NAME}} | #94A3B8 | yes |
| {{STAGE_ID_2}} | {{STAGE_2_NAME}} | #6366F1 | yes |
| ... | ... | ... | ... |
| {{STAGE_ID_WON}} | Closed won | — | EXCLUDE |
| {{STAGE_ID_LOST}} | Closed lost | — | EXCLUDE |

4. Rule for runtime: an unmapped stage ID is flagged in system_notes, never guessed.

Salesforce: `SELECT ApiName, MasterLabel, IsClosed, IsWon FROM OpportunityStage`. Attio: read the deal object's status attribute options. Same freeze-and-flag discipline.

# APPENDIX C — Usage workspace-mapping worksheet

For each banner account: (1) find the customer's tenant/workspace ID in your usage warehouse by joining on a verified key (contract ID, billing email domain) or by asking your CS/data team ONCE; (2) sanity-check the MAU number against what CS believes; (3) write `"<domain>": "<workspaceId>"` into gtm-intel `workspaceMapping`. Define the MAU query once in `banner-refresh.md` (distinct active humans, excluding programmatic/service accounts), pull current month-to-date + 5 prior full months, newest first. An account missing from the mapping renders `null`, never a name-search guess: two different customers matching the same name substring is how you end up congratulating the wrong account on adoption.

---

*End of v4. Changelog: built 2026-06-06 from the live GTM Command Center Pod (post glass-banner promotion, watchdogs, doctrine layer, outbound tracker, and Sunday-run reshape), generalized for external use. Refreshed same day: inbound leads folded into the engines (morning full sweep + nightly delta, log-only mode for auto-sequenced channels), `inbound-leads.csv` and `pipeline-history.csv` state tables, skill naming rule for canonical skill families.*
