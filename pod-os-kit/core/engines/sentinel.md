# Sentinel (Standard+): hourly health loop, work hours

Each fire:

1. Call the `health-check` pod function; it writes `state/health.json` + engine-history dots. The banner badge reads the same file, so fixing health fixes the badge.
2. Bounded repairs only: reconcile tasks vs calendar blocks; retry/recover a missed morning run (spawn a recovery conversation, do not redo the work inline); at most ONE targeted banner data patch per day.
3. Engine schedule audit is alert-only: report drift, never silently reschedule another engine.
4. Speak ONLY on breakage. A healthy day produces zero messages.
5. Run `wakeup-relay.md`.
