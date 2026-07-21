# Engines

Four scheduled agent runs, each living in its OWN Pod conversation with exactly ONE recurring wake-up. The engine conversation's kickoff message is minimal: "Each time you are invoked here, execute `run/playbooks/<engine>.md` top to bottom, then run `run/playbooks/wakeup-relay.md`." Long wake-up reasons drift from the source of truth; the playbook file IS the source of truth.

## Platform facts

- A recurring wake-up auto-expires after **32 fires**. Weekday cadence = ~6.5 weeks of life. Plan for mortality: the relay is mandatory in every mode.
- One conversation holds at most one active wake-up.
- Compute the UTC cron from the user's LOCAL time (mind DST). Never guess.
- Record every conversation ID + wake-up ID in `me/work-style/schedule.json` and seed `state/handoff-status.json`. Then verify live: post a probe asking the runner to confirm its wake-up and report fireCount.

## The set

| Engine | Default schedule | Owns | Playbook |
|---|---|---|---|
| Morning | weekdays, user's chosen time (4-7 AM) | research the day, refresh dashboard data, daily Slack brief, tasks surfaced | `morning.md` |
| Evening | weekdays 8 PM (Standard+) | task janitor, capture triage, EOD close-out, tomorrow's meeting prep | `evening.md` |
| Weekly | weekend, user's choice (Full) | weekly reset, week preview, deep review of everything in flight | `weekly.md` |
| Sentinel | hourly, work hours (Standard+) | health check function, bounded repairs, alert only on breakage | `sentinel.md` |

Heavy conditional work is SPAWNED into dedicated Pod conversations (detect-and-spawn), never inlined into an engine run. Shared-file writers are serialized by scheduling (one owner per window), never by locking.
