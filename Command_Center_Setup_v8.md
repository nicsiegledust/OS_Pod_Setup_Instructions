# Command Center - Pod Setup Playbook v8

> **AGENT: START HERE.** This is the v8 setup and architecture guide for a Dust Command Center OS. If this file is dropped into a fresh Pod, begin with the identity question in Part 1. Do not summarize the file first. If you are in a read-only context or not inside a Pod, reply with exactly: `Drop me into a fresh Pod and say: set up this Pod using this file.`

> **Snapshot date: 2026-06-15.** v8 supersedes v7. v7 installed a strong personal Command Center. v8 installs an OS network: Personal OS, Team OS, HQ OS, and optional Account Pods, connected by explicit data contracts.

## What changed in v8

v7 treated the Command Center primarily as one Pod with scheduled agents, playbooks, state files, and a pinned dashboard. That remains useful, but the live system has evolved. The current architecture is a layered operating system:

| Layer | Purpose | Canonical examples |
|---|---|---|
| Personal OS | One person's daily prep, commitments, calendar, tasks, account attention, and decision loop | `🪿 Nic OS` |
| Team OS | One function's goals, commitments, asks, decisions, risks, and operating pulse | `ns_ Sales OS`, `ns_ Product OS`, `ns_ CS OS`, `ns_ SE OS`, `ns_ Marketing OS`, `ns_ Talent OS`, `ns_ People OS` |
| HQ OS | Company-level exception router and priority pulse, not a duplicate of every team | `ns_ HQ OS` |
| Account OS | One customer or prospect's account intelligence, relationship map, and account pulse | `🏢 1Password`, account Pods |

The v8 rule is simple: **Pods can evolve independently, but files that cross Pod boundaries must obey contracts.**

JSON is the canonical machine-state format. Markdown explains the system to humans. JSON Schema, TypeScript, or Zod should enforce the contract before a heartbeat writes state or a router consumes it.

## Non-negotiable principles

1. **One layer owns each fact.** HQ does not rewrite Team OS truth. Team OS does not rewrite Personal OS tasks. Personal OS does not become the company source of truth.
2. **Every cross-Pod file has a contract.** A file path is not enough. The contract includes schema version, producer, consumer, allowed states, lineage, and validation.
3. **Promotion is explicit.** Moving a personal or team item up a layer requires promotion metadata. It is never just copied into a new file with no lineage.
4. **Stable IDs beat date-stamped IDs.** Dates belong in timestamps. IDs should survive daily refreshes and Dustweek rollovers when the underlying item is the same.
5. **State and health are different.** `state` describes workflow. `rag` describes health. Do not encode health as a workflow state.
6. **Human specs are not validators.** Markdown is useful, but every heartbeat should validate JSON before writing and every router should validate before consuming.
7. **No hidden write authority.** Each runtime file has exactly one writer. Other agents may read it, propose changes, or create tasks, but not silently mutate it.
8. **Sensitive detail stays at the lowest safe layer.** Talent, People, support, and personal details should be aggregated or sanitized before moving to Team or HQ.
9. **Frames are views, not databases.** A pinned banner reads state files. It does not define the data contract.
10. **Archive is never active.** Agents ignore `archive/` and `backups/` unless explicitly asked for history or rollback.

## Plain-language contract

When asking a user setup questions, ask about outcomes before mechanisms.

| Internal term | Plain phrase |
|---|---|
| Pod | Shared workspace for this operating system |
| Engine | Scheduled agent run |
| Wake-up | Schedule that triggers an engine |
| Heartbeat | Recurring review that refreshes state and posts a pulse |
| Relay | Internal schedule renewal, hidden from the user |
| Frame | Live dashboard pinned to the Pod |
| Ledger | Structured list of goals, commitments, asks, decisions, and risks |
| Promotion | Raising an item to a broader layer because it needs visibility or help |
| Source of truth | The place that owns the fact |
| Contract | The shape and rules a machine-readable file must obey |

## Modes

v8 keeps the Simple, Standard, and Full installation modes, but clarifies which OS layers are installed.

| Mode | Installs | Best for |
|---|---|---|
| Simple | Personal OS morning engine only | A user who wants one daily Slack brief |
| Standard | Personal OS with evening review, watchdog, banner, and durable state | A person using Dust as their daily operating system |
| Full | Personal OS plus optional Team OS or Account OS bindings | A user whose work should feed team or company operating rhythms |
| Team OS | Team heartbeat, team ledger, team banner, HQ promotion path | A functional team |
| HQ OS | Company router, asks board, priority pulse, org status banner | Leadership or company operating pulse |
| Account OS | Account intelligence and account pulse into Team OS | Strategic accounts |

## Part 0 - Speed protocol

Question 1 must happen in the first agent step. Do not run CRM, warehouse, calendar, or Slack sweeps before identity confirmation.

Ask:

**You are {{USER_NAME}}, {{ROLE_GUESS}} at {{COMPANY_GUESS}}, correct?**

Options:

- `Yes, that is me`
- `Right person, wrong title`
- `Let me correct the details`

After that, enrich in the background and present findings as confirmations, not blank questions.

## Part 1 - Interview

Ask one question at a time using structured options when possible.

### Q1 - Identity

Confirm name, email, company, and role. Store in `me/profile.json` for Personal OS or `team/profile.json` for Team OS.

### Q2 - What kind of OS are we building?

Options:

- `Personal OS`
- `Team OS`
- `HQ OS`
- `Account OS`
- `Personal + Team`
- `Team + HQ`

If the user is setting it up for someone else, record the operator separately from the owner.

### Q3 - What work should this center around?

Options:

- `Sales or GTM`
- `Customer Success or Support`
- `Product or Engineering`
- `Marketing`
- `Talent or People`
- `Finance or Ops`
- `Founder or Exec`
- `Other`

The role pack determines default sources, priorities, and safety rules.

### Q4 - Where does official work live?

Confirm the system of record. Examples: HubSpot, Salesforce, Attio, Ashby, Linear, Jira, Plain, Zendesk, Google Calendar, Gmail, Outlook, GitHub.

### Q5 - Where should the daily message land?

Confirm Slack channel or equivalent. For Personal OS, prefer a personal daily channel. For Team OS, use the Team OS channel. For HQ OS, use the HQ OS channel.

### Q6 - What should be watched?

Confirm entities. For Personal OS, these may be accounts, candidates, projects, initiatives, or workstreams. For Team OS, these are team goals, commitments, source channels, dashboards, and recurring meetings. For HQ OS, these are Team OS ledgers and company priorities.

### Q7 - How much automation is allowed?

Default guarantees:

- Draft emails only, never send automatically.
- Never move CRM stages without explicit approval.
- Never book meetings without explicit approval.
- Never expose private HR, candidate, or sensitive personal detail to a broader layer.

### Q8 - Should this connect to other OS layers?

Options:

- `No, keep standalone`
- `Read higher-level priorities only`
- `Emit team-visible items`
- `Full Personal-Team-HQ contract`

This question is new in v8. Do not silently wire cross-Pod flows.

## Part 2 - Canonical Pod file layout

### Personal OS layout

```text
README.md
STATUS.md
me/
  profile.json
  context/
    priorities.json
    top-targets.json
    work-style.md
  watch/
    team-os-signals.json
state/
  handoff-status.json
  daily-runs/
    latest.json
    YYYY-MM-DD.json
  commitments.json        # optional legacy or export, Pod tasks may be canonical
  account-attention.json
  task-visibility.json
run/
  playbooks/
    morning-run.md
    evening-review.md
    weekly-prep.md
    cleanup.md
    wakeup-relay.md
  specs/
    personal-os.contract.md
    daily-run-schema.md
    priority-source-of-truth.md
    dedup-gates.md
work/
  meetings/
  notes/
  deals/
archive/
```

### Team OS layout

```text
README.md
STATUS.md
north-star.md
pulse/
  goals-ledger.json
  command-center.json
  source-health.json
  roster.json
system/
  handoff-status.json
  runs/
    YYYY-MM-DD.md
playbooks/
  heartbeat-run.md
  wakeup-relay.md
specs/
  team-os-ledger.contract.md
  reporting-spec.md
  banner-data-spec.md
  privacy-spec.md
frames/
archive/
```

### HQ OS layout

```text
README.md
STATUS.md
people/
  people.json
pulse/
  goals-ledger.json
  asks-board.json
  org-status-banner.json
  priority-pulse.json
system/
  handoff-status.json
  report-history.md
logs/
  daily/
playbooks/
  daily-hq-pulse.md
  wakeup-relay.md
specs/
  hq-commitment-router.md
  goals-ledger-spec.md
  banner-data-spec.md
  daily-pulse-spec.md
  company-priorities.md
archive/
```

### Account OS layout

```text
README.md
STATUS.md
state/
  account-pulse.json
  commitments.json
  stakeholders.json
  account-attention.json
intel/
  YYYY-MM-DD-account-intel.md
pulse/
  latest.json
  YYYY-DWNNN-account-pulse.json
playbooks/
  account-heartbeat.md
  sales-os-emitter.md
frames/
archive/
```

## Part 3 - Contract registry

Every OS Pod should include a small contract registry in `README.md`.

```json
{
  "contracts": [
    {
      "path": "pulse/goals-ledger.json",
      "contract": "team_os_goals_ledger_v2",
      "schemaVersion": 2,
      "writer": "Team OS heartbeat",
      "consumers": ["Team OS banner", "HQ OS router"],
      "validator": "contracts/team-os-goals-ledger.schema.json"
    }
  ]
}
```

## Part 4 - Shared ledger contract

`pulse/goals-ledger.json` is the hard contract between Team OS and HQ OS. It should have exactly these top-level concepts:

```json
{
  "schemaVersion": 2,
  "contract": "team_os_goals_ledger_v2",
  "pod": {
    "id": "vlt_...",
    "name": "ns_ Sales OS",
    "layer": "team_os",
    "unit": "sales"
  },
  "dustweek": 198,
  "updatedAt": "2026-06-15T11:00:00Z",
  "goals": [],
  "commitments": [],
  "asks": [],
  "decisions": [],
  "risks": []
}
```

Every item in those arrays uses the same base item shape:

```json
{
  "id": "commit-sales-epsor-finance-menu",
  "type": "commitment",
  "text": "Finalize Epsor finance and pricing menu",
  "dri": {
    "name": null,
    "slackUserId": null,
    "status": "owner_tbd"
  },
  "due": "2026-06-12",
  "state": "open",
  "rag": "red",
  "cpTags": ["CP4"],
  "source": {
    "podId": "vlt_...",
    "path": "pulse/goals-ledger.json",
    "channelId": "C...",
    "url": "https://..."
  },
  "evidence": [
    {
      "type": "slack_permalink",
      "url": "https://..."
    }
  ],
  "lineage": {
    "originLayer": "team_os",
    "originPodId": "vlt_...",
    "originItemId": "commit-sales-epsor-finance-menu",
    "createdAt": "2026-06-12T11:00:00Z",
    "lastTouchedAt": "2026-06-15T11:00:00Z"
  },
  "promotion": {
    "eligible": true,
    "criteria": ["owner_tbd", "overdue", "cross_functional"],
    "targetLayer": "hq_os",
    "hqAskId": null,
    "personalCommitmentId": null,
    "promotedAt": null,
    "acceptedAt": null
  }
}
```

Allowed `state` values:

- `open`
- `in_progress`
- `waiting`
- `scheduled`
- `done`
- `deferred`
- `killed`

Allowed `rag` values:

- `green`
- `amber`
- `red`
- `unknown`

Do not use `overdue`, `blocked`, `decided`, or `due_today_red` as workflow states. Represent those as due dates, `rag`, or tags.

## Part 5 - Promotion rules

Promotion does not copy an item blindly. It creates a linked route from one layer to another.

### Personal OS to Team OS

Promote when a personal task or commitment:

- affects a team goal
- creates a cross-functional ask
- represents a customer or candidate milestone the team should know about
- is explicitly marked `team-visible`

### Team OS to HQ OS

Promote when a team item is:

- cross-functional
- owner TBD
- older than 5 days without movement
- due within 48 hours and unconfirmed
- blocking a company priority
- repeated in 2 or more Team OS Pods
- creating leadership decision debt

### Account OS to Team OS

Promote when an account pulse contains:

- expansion signal
- renewal risk
- exec engagement
- technical blocker
- product gap affecting deal or deployment
- notable usage or builder signal

## Part 6 - Source-of-truth matrix

Every setup writes a matrix like this to `README.md` or `specs/source-of-truth.md`.

| Fact | Owner | Readers | Notes |
|---|---|---|---|
| Personal tasks | Pod tasks in Personal OS | Personal OS, optional Team OS | Only team-visible tasks emit upward |
| Daily prep | Personal OS `state/daily-runs/latest.json` | Personal OS, optional Team OS | Sanitized before team read |
| Team goals and commitments | Team OS `pulse/goals-ledger.json` | Team OS banner, HQ OS router | Hard contract |
| Company asks | HQ OS `pulse/asks-board.json` | HQ banner, leadership review | HQ owns accepted asks |
| People roster | HQ OS `people/people.json` | Team banners | Identity only |
| Account pulse | Account OS `pulse/latest.json` | Sales OS or CS OS | Account Pod owns raw account detail |
| CRM stage | CRM | All layers read | No layer writes without approval |
| Calendar | User calendar | Personal OS | No auto-booking |

## Part 7 - Validation gates

Every heartbeat must run these checks before writing or posting.

1. Parse JSON.
2. Validate against the declared schema.
3. Confirm `schemaVersion` and `contract` match the registry.
4. Confirm required arrays exist.
5. Confirm every item has stable `id`, `type`, `text`, `state`, `rag`, `source`, `evidence`, `lineage`, and `promotion`.
6. Confirm no illegal states.
7. Confirm every promoted item has lineage.
8. Confirm file-level `updatedAt` changed on successful refresh, even when there is thin signal.
9. Confirm no archive files are read as active inputs.
10. Write a dated run log with validation results.

A heartbeat with validation failure should write a run log, mark the banner data as degraded if safe, and avoid publishing a green pulse.

## Part 8 - Privacy and sensitivity

The wider the layer, the less raw detail it should hold.

Personal OS may contain personal preferences, meeting prep, private calendar context, drafts, and detailed account notes.

Team OS may contain team-operating state, aggregated risks, and public work signals. It should not contain private HR state, candidate-level detail unless it is a Talent Pod with appropriate restrictions, or personal calendar detail.

HQ OS may contain promoted exceptions, company-level asks, and sanitized aggregate status. It should not become a dump of team ledgers.

People and Talent OS must aggregate process health and role-level work. They should not expose individual HR cases, candidate private detail, compensation, or sensitive employee states in broad Pods.

## Part 9 - Setup steps

### Personal OS setup

1. Ask Q1 through Q8.
2. Create the Personal OS file layout.
3. Write `README.md`, `STATUS.md`, `me/profile.json`, `state/handoff-status.json`, and `state/daily-runs/latest.json`.
4. Create or confirm Pod tasks as the active commitment ledger.
5. Add `state/task-visibility.json` to classify tasks as `personal`, `team_visible`, or `cross_functional`.
6. Create wake-ups for selected engines.
7. Pin the banner if Standard or Full.
8. Post the orientation message.

### Team OS setup

1. Define unit, channel, area lead, and source channels.
2. Create `pulse/goals-ledger.json` with schemaVersion 2 and all 5 arrays, even if empty.
3. Create `pulse/source-health.json`.
4. Create `system/handoff-status.json` and `system/runs/`.
5. Create heartbeat wake-up.
6. Create pinned banner.
7. Validate ledger and banner data before the first post.
8. Register HQ as a consumer, but not a writer.

### HQ OS setup

1. Define Team OS Pod inventory.
2. Create `people/people.json` as identity-only roster.
3. Create `pulse/asks-board.json`, `pulse/goals-ledger.json`, `pulse/org-status-banner.json`, and `pulse/priority-pulse.json`.
4. Create router spec and validation rules.
5. Validate every Team OS ledger before routing.
6. Promote only exceptions, not every team item.
7. Post daily or weekly pulse depending on operating mode.

### Account OS setup

1. Define account, CRM record, owner, and Team OS destination.
2. Create `state/account-pulse.json` and `pulse/latest.json`.
3. Store account-level intelligence and stakeholders locally.
4. Emit sanitized account pulse into Sales OS or CS OS when relevant.
5. Never push raw call notes or private emails into Team OS unless explicitly approved.

## Part 10 - Migration from v7

When upgrading an existing v7 Pod or OS network:

1. Inventory active files and pinned Frame path.
2. Identify source-of-truth files and stale files.
3. Add `schemaVersion` and `contract` to all machine-state files.
4. Normalize `pulse/goals-ledger.json` to the v8 item model.
5. Move schema docs out of data files and into `specs/`.
6. Move old Frames and setup docs into `archive/` with an `archive/README.md`.
7. Add `system/runs/` if missing.
8. Add validation results to the next run log.
9. Add a contract registry to README.
10. Do not change wake-up IDs unless the relay requires it.
11. Do not replace a pinned banner without explicit user approval.
12. Record all changes in STATUS.md.

## Part 11 - Known drift patterns to guard against

These are common failures observed in live v7-derived Pods:

- Same contract intent, different file shapes.
- `schemaVersion` exists in one file but not another.
- `contract` field exists in one Team OS but not another.
- Evidence alternates between plain URL strings and structured objects.
- Status vocabulary drifts between `yellow`, `amber`, `overdue`, `blocked`, and `red`.
- Promotion fields exist but are always null.
- Heartbeat fires but data files do not refresh.
- Run logs use a different relay threshold than `handoff-status.json`.
- Legacy Frames remain beside active Frames with no deprecation note.
- Stale monolithic setup docs stay in active folders and confuse new agents.
- Personal OS specs reference missing state files.
- HQ banner QA says pass even when the JSON shape violates the prose spec.

v8 exists to make these failures detectable.

## Part 12 - Orientation message

After setup, post a short orientation message in the Pod:

```text
Your Command Center OS is live.

What runs:
- Morning brief: {{schedule}}
- Evening review: {{schedule_or_off}}
- Weekly prep: {{schedule_or_off}}
- Cleanup/watchdog: {{schedule_or_off}}

What it owns:
- {{owned_state_files}}

What it only reads:
- {{systems_read}}

What it will never do without approval:
- send emails
- move CRM stages
- book meetings
- expose private data to broader Pods

If something feels noisy, reply with what to change. If you want the next layer, say: upgrade my command center.
```

## Part 13 - Repo package

The v8 repo package should include this setup guide plus schema files under `contracts/`. At minimum:

```text
Command_Center_Setup_v8.md
contracts/team-os-goals-ledger.schema.json
contracts/hq-org-status-banner.schema.json
contracts/personal-os-daily-run.schema.json
```

Future additions:

```text
contracts/hq-asks-board.schema.json
contracts/account-pulse.schema.json
validators/validate-pod-state.ts
migrations/v7-to-v8.md
examples/team-os-goals-ledger.example.json
examples/personal-os-daily-run.example.json
```

## Final rule

If an agent cannot tell which file owns a fact, which schema validates it, and which layer is allowed to write it, the setup is not complete.