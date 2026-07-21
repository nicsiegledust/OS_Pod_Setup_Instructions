# Pod OS Kit

Turn a Dust Pod into a personal operating system: a pinned live dashboard with tabs (Inbox, My Plate, Waiting On, and more), a capture box that turns thoughts into tasks, and scheduled agents that research your day, close your evening, and keep themselves alive.

Built from a real system that has run daily in production since June 2026 (Nic OS at Dust). Everything in this kit is battle-tested, including the failure modes. Read `LESSONS.md` if you doubt that.

## Install (one sentence)

Open Dust, start a conversation with a capable general agent, and paste:

> Set up my Pod OS using this repo: https://github.com/nicsiegledust/OS_Pod_Setup_Instructions. Fetch pod-os-kit/SETUP.md (raw: https://raw.githubusercontent.com/nicsiegledust/OS_Pod_Setup_Instructions/main/pod-os-kit/SETUP.md) and follow it exactly. Start by asking me Question 1.

That's it. The agent interviews you (structured questions, under 8 for the Simple mode), researches your role, proposes a layout, and builds the whole thing: Pod, file system, banner, capture, scheduled runs. You never touch a file.

## What you get

- **A pinned banner** at the top of your Pod: an admin row (health dot, engines panel, Capture, Steer) plus a row of tabs chosen for your role.
- **Capture from anywhere**: type a note in the banner. Plain text goes to your Inbox. `!` makes it a task instantly. `?` makes a task plus a calendar work block.
- **Scheduled agents ("engines")** that run themselves: a morning run that preps your day before you wake, an optional evening close-out, an optional weekly reset, and a silent watchdog.
- **One Slack message a day** with what matters. You steer by replying to it.

## Three modes

| Mode | Moving parts | Time to live |
|---|---|---|
| Simple | Banner + capture + one morning run + one daily Slack message | ~15 min |
| Standard | + evening close-out, task janitor, watchdog | ~30 min |
| Full | + weekly prep, proactive suggested moves, deep role automation | ~45 min |

Start Simple. Say "upgrade my pod OS" any time; nothing is thrown away.

## Repo map

| Path | What it is |
|---|---|
| `SETUP.md` | The agent entry point. Everything routes from here. |
| `core/interview.md` | The question flow (structured options, research-first) |
| `core/filesystem.md` | Folder skeleton + seed file templates |
| `core/banner/` | Banner shell, design system, config schema |
| `core/functions/` | Pod functions: capture/task actions + health check |
| `core/engines/` | Morning, evening, weekly, sentinel, wake-up relay |
| `core/tabs/` | The tab blocks: pick the ones your role needs |
| `core/verify.md` | Smoke test + go-live checklist + orientation |
| `roles/` | Role packs: preset tabs, watch topics, engine tweaks |
| `LESSONS.md` | Hard-won guardrails. Installing agents read this verbatim. |
