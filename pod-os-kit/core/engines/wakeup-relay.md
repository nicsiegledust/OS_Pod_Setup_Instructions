# Wake-Up Relay (final step of EVERY engine run, ALL modes)

- fireCount < 20: update this engine's entry in `state/handoff-status.json` (lastRun, fireCount, status healthy). Done.
- fireCount >= 20: create a successor conversation ("{Engine} - {Month YYYY}") whose only job is to (1) schedule its own identical wake-up and (2) write `successor.confirmed: true` plus its IDs into `state/handoff-status.json`. The remaining fires are the retry window; never assume one attempt succeeded.
- Only after `successor.confirmed` is true: update `me/work-style/schedule.json` canonical IDs, cancel your own wake-up, mark `handoffComplete`.
- NEVER create a second wake-up in your own conversation. NEVER cancel your own wake-up before the successor is confirmed.
- Successors may use a capable general-purpose agent; record the choice in schedule.json.
