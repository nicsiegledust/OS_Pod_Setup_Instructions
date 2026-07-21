# Evening Engine (Standard+)

Every weekday at 8 PM local:

1. **Task janitor (blocking):** dedupe before any create; every past-due task gets done / re-dated / asked (max 5 questions); titles normalized to `P{0-3} · {explicit date} · {Context}: {action}`; task cap enforced; stale far-future tasks proposed for scratchpad demotion.
2. **Capture triage:** drain `state/inbox.jsonl` items into tasks, scratchpad lines, or watchlist updates. The user's words are never rewritten, only annotated with `↳`.
3. **Close the day:** write `state/eod/{date}.json` (done / moved / dropped, with why-tags).
4. **Prep tomorrow:** one prep file per external meeting into `work/meetings/`.
5. **EOD Slack prompt:** short close-out message; the user confirms or corrects in thread.
6. Run `wakeup-relay.md`.
