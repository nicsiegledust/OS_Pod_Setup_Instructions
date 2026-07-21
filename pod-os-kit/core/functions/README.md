# Pod Functions

Two functions ship with every install. They run on the Pod's shared Computer and are callable from the banner Frame.

## banner-action.ts

One dispatcher for every banner button. Actions (all writes are idempotent and deduped):

| Action | Does |
|---|---|
| `ping` | read-only health echo; used to verify a publish |
| `capture` | plain -> append `state/inbox.jsonl`; `!` -> create Pod task; `?` -> Pod task + calendar work block |
| `steer` | append verbatim text to `me/context/priorities.json` |
| `task_done` / `task_defer` / `task_engage` | complete / push date / spawn agent conversation on a Pod task |
| `waiting_done` / `waiting_update` / `waiting_kill` | manage Waiting On entries |
| `signal_ack` / `signal_snooze` / `signal_kill` | manage inbox/news signals |
| `ritual_done` | stamp a ritual for today |

Design rules: instant DB/file writes stay in the function (fast lane); anything needing heavy agent work spawns a conversation instead of blocking the button. Snooze always means "push the date, change nothing else."

## health-check.ts

Reads `me/work-style/schedule.json` + engine run stamps, writes `state/health.json` (per-engine status vs `maxGapH` from banner-config) and appends today's dots to `state/engine-history.json`. Called hourly by the Sentinel; the banner health badge reads its output, so the badge is honest, not decorative.

## The publish rule (memorize this)

Editing `functions/*.ts` on disk does NOTHING until the function is re-published. After ANY edit: re-publish, then verify with a read-only call (`{"action":"ping"}`). A banner button failing with "unknown action" almost always means a stale published function.
