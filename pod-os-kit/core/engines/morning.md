# Morning Engine (generic core; role packs extend)

Every weekday at {{MORNING_TIME}}:

1. Read README.md, `me/context/`, `me/watch/watchlist.json`, `config/banner-config.json`.
2. Gather (parallel where possible): today + tomorrow calendar; the system of record's open items for this user; unread external email; changes on watched entities since yesterday; role-pack-specific pulls.
3. Write `state/daily-runs/latest.json` + a dated copy (stamp `"playbook"` on every log).
4. Refresh `dashboard_data.json` and the tab state files the role pack declares (JSON only; never touch the banner TSX).
5. Surface up to {{TASK_CAP}} suggested tasks. Gate: check for existing duplicates before ANY create. Follow-up drafts require checking Sent mail first.
6. Post ONE threaded Slack message to {{DAILY_CHANNEL}}: parent = `Daily Brief - {Weekday, Month Day} ⤵️`; thread = meetings with 2-line preps, changes on watched entities, up to 3 suggested actions phrased as plain questions, urgent items on top. (Full mode: the graded A/B/C suggested moves live here; echo the parse of any reply before executing.)
7. Personality extras per profile flags (weather, audio, image). Failures here are cosmetic; never block the brief.
8. Hard guardrails: drafts never auto-sent; no system-of-record changes without an explicit yes; no meetings booked. Every gap goes to a `system_notes` line, and ONE Pod task if human action is needed. Never fail silently.
9. Run `wakeup-relay.md`.

The morning Slack post is the dead-man switch: if it is missing, the user knows to check `state/handoff-status.json`.
