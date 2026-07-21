# File System Seed

Do not overwrite files that already exist. Generic skeleton; role packs may add folders under `work/`.

```text
README.md                 <- the map: what this Pod is, how it runs, folder map (agents read first)
STATUS.md                 <- one-pager: setup date, mode, owner, what is configured (history -> archive/)
CHEATSHEET.md             <- generated at orientation: how the HUMAN drives the system
PodBanner.tsx             <- pinned banner source (edited ONLY via interactive content tools)
dashboard_data.json       <- banner data, refreshed by engines

config/
  banner-config.json      <- workspace URL, Slack channel, wakeupDefs, tab list (schema in core/banner/)
me/                       <- who the user is and how the system runs for them
  context/                profile.json, priorities.json (steering beacons), scratchpad.md (someday/reminders)
  work-style/             schedule.json (CANONICAL wake-up + conversation IDs), tasks.json, notifications.json
  watch/                  watchlist.json (key = stable ID/domain, never display name), topics.json
run/                      <- how the system executes
  playbooks/              step-by-step files engines execute (copied from core/engines/ + role pack)
  specs/                  output contracts agents read but do not execute
functions/                <- pod function sources (banner-action.ts, health-check.ts) + README with publish rule
work/                     <- actual output: role pack defines subfolders (meetings/, deals/, campaigns/, projects/, notes/)
state/                    <- machine memory; humans rarely look
  inbox.jsonl             capture inbox (plain notes awaiting triage)
  handoff-status.json     wake-up relay state
  health.json             written by the health-check pod function; banner LIVE/DEGRADED/STALE badge reads it
  engine-history.json     trailing daily fire dots per engine
  daily-runs/             latest.json + dated snapshots
  eod/                    evening close-out outputs (Standard+)
  weekly/                 weekly prep outputs (Full)
briefings/                <- what the user hears/sees each morning (Standard+)
archive/                  <- cold storage; engines never read it
```

## Seed rules

- Every `.json` seed must parse. Seed with honest empties (`[]`, `{}`) plus a `version` and `updated` field, never fabricated data.
- `me/work-style/schedule.json` is the SINGLE source of truth for conversation IDs and wake-up IDs. Playbooks never hardcode them.
- Task title format (enforced by the evening janitor): `P{0-3} · {explicit date} · {Context}: {action}`. Relative date words (today, tomorrow, Friday) are BANNED in tasks; they rot.
- `me/context/priorities.json` holds the user's steering beacons, edited only through the banner Steer box. Verbatim user words plus agent annotations prefixed `↳`. Never rewrite the user's words.
- README.md's folder map must list every file a playbook references, and vice versa. The verify step checks both directions.
