# CEO OS — Pod Setup (setup.md)

**AGENT: START HERE.** This file spins up a new **CEO OS Pod** for a company, wired to the
`CEO_OS_Banner_Template.tsx` Frame (which ships alongside this file). It is the successor to
Command_Center_Setup_v8: same philosophy (interview first, wire second, drafts-only always),
but the banner is no longer built from scratch — it is **instantiated from the template** by
replacing `{{TOKENS}}`.

Reference implementation: the **NS CEO OS Pod** (banner `PodBanner.tsx`, engines under
`engines/`, function under `functions/exec-action/`, state under `state/` and `me/`).

---

## Rules of engagement

1. **Every question in Phase 1 MUST go through the `ask_user_question` tool.** One question
   per call, with concrete options where possible. Never dump a wall of questions in plain text.
2. **Speed protocol:** before asking anything, try to answer it yourself (company data, Slack,
   HiBob, calendar, memory). Only ask what you cannot reliably infer; confirm inferences in
   batches ("I found X, Y, Z — correct?") instead of asking from zero.
3. **Drafts only, forever.** Nothing this Pod builds ever sends email, posts to Slack as the
   CEO, or accepts/declines meetings without an explicit thumbs-up. The one exception:
   engines may post to the OS's own private channel.
4. **The banner is the product.** If a step doesn't make the banner more useful tomorrow
   morning, skip it.

---

## Phase 0 — Preflight

1. Confirm you are running inside a Pod, or can create one (`pod_manager`). If no target Pod
   exists yet, create one named `<Company> CEO OS` (private; only the CEO + operator).
2. Confirm tool access: Pod files (read/write), Pod functions, wake-ups/schedules, Slack
   (read + post-to-one-channel), Calendar (read), Gmail (read + draft only).
3. Locate the template Frame source `CEO_OS_Banner_Template.tsx`. If it is not in the Pod,
   ask the user to attach it or point to the conversation that contains it.

## Phase 1 — Interview (via `ask_user_question`, in this order)

**Q1. Who is this OS for?** CEO's full name + Slack ID. Options: "It's for me" / "I'm setting
it up for someone else". → `{{CEO_NAME}}`, `{{CEO_FIRST}}`, `{{CEO_INITIALS}}`, `{{CEO_SLACK_ID}}`.

**Q2. Who operates it?** The person who runs setup and triages on the CEO's behalf (chief of
staff / EA / the CEO themself). → `{{OPERATOR_*}}` tokens. If there is an EA who takes
delegations, get their first name → `{{EA_NAME}}`; otherwise set it to the operator.

**Q3. Company.** Full name, short name, Slack workspace subdomain, current planning year.
→ `{{COMPANY}}`, `{{COMPANY_SHORT}}`, `{{SLACK_WORKSPACE}}`, `{{YEAR}}`.

**Q4. The OS channel.** A private Slack channel the engines may post to (create one like
`#<ceo>_ceo_os` if none exists). Get its channel ID. → `{{OS_CHANNEL}}`, `{{OS_CHANNEL_ID}}`.

**Q5. Company priorities.** Ask for up to 8 priorities, each with: pillar (TEAM / PRODUCT /
BUSINESS / COMPANY or their own words), one-line text, sherpa (owner) name + Slack ID, and
the Slack channel where that priority lives. Also ask where priorities are documented (doc
URL, hub URL, optional priorities Pod). → `{{CPn_*}}`, `{{CP_DOC_URL}}`, `{{CP_HUB_URL}}`,
`{{CP_POD_URL}}`. The template ships 4 CP rows — add/remove rows in `PRIORITIES` to match.

**Q6. Numbers.** The 3–5 metrics the CEO actually checks (ARR, NRR, burn, headcount, NPS…)
and where they live. → `{{METRIC_1..4}}` labels (values stay `null` until an engine fills them).

**Q7. Rituals.** Recurring outputs the OS should draft (e.g. Monday priorities note, Friday
accountability run, monthly CP review). Get name / day / output for at least two.
→ `{{RITUAL_n_*}}`.

**Q8. Mode.** Offer three options:
- **Simple** — banner + morning engine only.
- **Standard (recommended)** — banner + morning & EOD engines + exec-action function.
- **Full** — Standard + watchdog engine + calendar/email sweeps + CP monthly review.

## Phase 2 — Wire the Pod

Create this structure (mirror the NS CEO OS Pod):

```
pod-<POD_ID>/
  pod-instructions.md        # how conversations in this Pod behave (drafts-only rule!)
  dashboard_data.json        # engine-owned; the banner reads this
  me/people.json             # { people: { "<SLACK_ID>": { name, first, initials, slackId, color, avatarUrl } } }
  state/                     # engine working state (asks ledger, poke ledger, seen-items)
  state/wakeups.json         # engine-owned wakeup registry the banner's Wakeups pill reads
  engines/
    morning/instructions.md  # runs each weekday ~7:00 local: sweep Slack/calendar/email → rewrite dashboard_data.json
    eod/instructions.md      # runs ~18:30: sweep commitments, mark slipped, prep tomorrow
    watchdog/instructions.md # (Full mode) hourly: urgent asks, stale queue, calendar changes
  functions/exec-action/     # pod function the banner buttons call
  run/                       # engine run logs
```

**dashboard_data.json contract** (what the banner reads — see the `Dash` type in the template):
`updated`, `build_phase`, `talked_about[]`, `action_items[]`, `pokes[]`, `pulses[]`,
`rituals[]`, `rituals_due_today[]`, `time_blocks[]`, `tasks[]`, `calendar_events[]`,
`calendar_date`, `metrics[]`, `news[]` (source: `"dust"` = internal, `"world"` = external),
`week_ahead[]`, `ceo_asks[]`, `wakeups[]` (optional mirror of `state/wakeups.json`).
Items keep stable `id`s across runs so triage state survives.

**exec-action function contract** (what the banner buttons call): actions include
`triage`, `undo`, `capture`, `steer`, `prep_meeting`, `delegate_ea`, `poke`, `ask_done`,
`ask_remind`, `feedback`, and `wakeups` (returns `{ ok, wakeups: WakeupEngine[] }` read
from `state/wakeups.json` for the banner's Wakeups overlay). Response body must be JSON:
`{ ok: boolean, posted: boolean, version: <EXPECTED_FN_VERSION> }` — `posted:false` means
the action was queued to `state/` for the next engine run instead of posted to Slack.
Keep `EXPECTED_FN_VERSION` in the banner in sync with the deployed bundle.

**Wakeups indicator:** the banner's top bar shows a Wakeups pill (sunrise icon) with a
hover/click overlay listing each engine: health dot (green / amber / red), schedule, fire
count vs the 32-fire relay quota (amber at 26+ = time to hand off to a successor wakeup),
last run, and an Open link to the engine conversation. Wire it by filling
`CEO_OS_WAKEUP_DEFS` in the banner: `{{MORNING_WAKEUP_ID}}` / `{{EOD_WAKEUP_ID}}` (the
wake-up IDs from scheduling), the engine conversation IDs, `{{MORNING_SCHEDULE}}` /
`{{EOD_SCHEDULE}}` (human-readable), and `{{DUST_WORKSPACE_URL}}`
(`https://app.dust.tt/w/<workspaceId>`). Each engine run must update its entry in
`state/wakeups.json` (`fireCount`, `fireQuota`, `lastRun`, `lastStatus`), and exec-action
must serve it via the `wakeups` action. Add a row to `CEO_OS_WAKEUP_DEFS` for every extra
engine (watchdog, etc.) in Full mode.

**Schedules (wake-ups):** morning engine weekdays ~7:00, EOD ~18:30, watchdog hourly
9:00–19:00 (Full mode only). Every engine run ends by rewriting `dashboard_data.json`
and logging to `run/`.

## Phase 3 — Instantiate the banner

**Template source:** the ready-to-fill banner lives alongside this doc in the repo:
[`CEO_OS_Banner_Template.tsx`](https://github.com/nicsiegledust/OS_Pod_Setup_Instructions/blob/main/CEO_OS_Banner_Template.tsx)
- Copy it into the new Pod, replace every `{{TOKEN}}` (search for `{{`), then flip
  `DEMO_MODE` to `false` and `POD_WIRED` to `true` once the engines + exec-action exist.

1. Copy `CEO_OS_Banner_Template.tsx` into the new Pod.
2. Replace every `{{TOKEN}}` using the table below (plain find-and-replace; all tokens live
   in string literals, so the file compiles before AND after substitution).
3. Adjust `PRIORITIES` row count, `SEED` examples, `CHANNEL_IDS`, and `SHERPA_SLACK` to the
   interview answers. Keep the CEO's `avatarUrl` — swap in the real photo URL if the user
   provides one (the template ships with Gabriel's photo as the default; Nic likes it).
4. When (and only when) the Pod files and the exec-action function are live, flip:
   - `const POD_WIRED = false;` → `true` (banner switches from SEED to live pod files)
   - `const DEMO_MODE = true;` → `false` (buttons call the real function)
5. **Icon convention:** any action button meaning "the system/agent does it" uses the
   Dust square logo image, never a robot icon:
   `https://dust.tt/static/landing/logos/dust/Dust_LogoSquare.png` rendered as a small
   `<img>` (~11-12px, `borderRadius: 2`, `verticalAlign: middle`). The template ships a
   `DustLogo` component for this - reuse it for any new agent-flavored buttons.
6. Publish the Frame from the Pod and **pin it as the Pod banner** (use the Pod Banner Frame
   Sizer skill for sizing/pinning QA).
7. Acceptance: banner renders with the CEO's name + avatar, CP rail matches the interview,
   one triage action round-trips through exec-action, the Wakeups pill lists every
   scheduled engine with a real last-run time, and the next morning-engine run
   replaces the seed content.

## Token reference

| Token | Meaning |
|---|---|
| `{{POD_ID}}` | New Pod's ID (`vlt_…`) |
| `{{COMPANY}}` / `{{COMPANY_SHORT}}` / `{{YEAR}}` | Company full name, short label (news tab), planning year |
| `{{CEO_NAME}}` / `{{CEO_FIRST}}` / `{{CEO_INITIALS}}` / `{{CEO_SLACK_ID}}` | The OS owner |
| `{{OPERATOR_NAME}}` / `{{OPERATOR_FIRST}}` / `{{OPERATOR_INITIALS}}` / `{{OPERATOR_SLACK_ID}}` | Whoever operates the OS |
| `{{EA_NAME}}` | EA who receives "Delegate" handoffs |
| `{{OS_CHANNEL}}` / `{{OS_CHANNEL_ID}}` | Private OS Slack channel |
| `{{SLACK_WORKSPACE}}` | Slack subdomain (`<x>.slack.com`) |
| `{{CP_DOC_URL}}` / `{{CP_HUB_URL}}` / `{{CP_POD_URL}}` | Where priorities are documented |
| `{{CPn_PILLAR}}` / `{{CPn_TEXT}}` / `{{CPn_OWNER}}` / `{{CPn_OWNER_SLACK_ID}}` / `{{CPn_CHANNEL}}` / `{{CPn_CHANNEL_ID}}` | Priority rows (n = 1..4, extend as needed) |
| `{{METRIC_1..4}}` | Metric labels for the Numbers card |
| `{{RITUAL_n_NAME}}` / `{{RITUAL_n_DAY}}` / `{{RITUAL_n_OUTPUT}}` | Ritual definitions |

## Hard guarantees (copy into pod-instructions.md verbatim)

1. Drafts only — no send, no post-as-CEO, no meeting accept/decline without explicit approval.
2. Engines may post only to `#{{OS_CHANNEL}}`.
3. Engine-owned fields (`status` on priorities, everything in `dashboard_data.json`) are never
   hand-edited; fix the engine instead.
4. If Slack posting fails, actions queue to `state/` (`posted: false`) — never silently drop.
5. The banner never fabricates data: empty sections show their built-in empty states.
