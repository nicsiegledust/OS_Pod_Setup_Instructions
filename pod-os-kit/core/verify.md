# Verify, Smoke Test, Orient

Setup is NOT complete until every applicable check passes AND the orientation message is posted.

## Verification checklist (check only what the mode installed)

- [ ] Every file referenced by README.md or any playbook exists; every existing file appears in README's folder map. All .json parses.
- [ ] `schedule.json` IDs == `handoff-status.json` IDs == live wake-ups (probe-verified: each engine confirmed its wake-up and fireCount; `lastVerified` stamped).
- [ ] Banner published via interactive tools, PINNED as the Pod banner, badge reads LIVE, no vertical scroll collapsed, every row deep-links where a system of record exists.
- [ ] Pod functions published and ping-verified AFTER the last source edit.
- [ ] Capture round-trip: a test `!` capture created a real task (then delete it); a plain capture landed in inbox.jsonl.
- [ ] Watchlist keyed by stable IDs, ownership-verified against the system of record (latest-updated record). Teammate-owned items are watch-only.
- [ ] Slack bot actually posted a test message to the daily channel.
- [ ] No legacy scheduled agents still write to the same surfaces (retire or repoint; document in STATUS.md).

## Smoke test

1. Manual mini morning run (data pull + dashboard refresh only): confirm `dashboard_data.json.lastRefreshed` updates and the banner re-renders with real data.
2. STALE test: set `lastRefreshed` back 30h, confirm the badge flips, restore.
3. Sentinel dry-run: with stale data, ask it what it would do; restore; confirm it would stay silent when healthy.
4. Evening dry-run (Standard+): write one `state/eod/` file, confirm the playbook stamp.
5. Relay dry-read: each engine states in one sentence what it does at fireCount 20. Wrong answer = fix the kickoff message now.
6. Record results in STATUS.md.

## Orientation message (~12 lines, plain words, both in the setup conversation AND as the first Slack message)

- What just got built, one sentence.
- What happens next ("Tomorrow at {{TIME}} you'll get the first brief. Reply to the thread to act on anything.").
- What I can see, honestly: connected sources by name AND what is not connected.
- What I will never do on my own: never send emails (drafts only), never change records without your yes, never book meetings.
- The one habit: "If it's in your head, put it in the banner Capture box. `!` if it's a commitment, `?` if it needs time on the calendar."
- Three things you can say right now: "What are you watching for me?" / "Change my morning time to 7" / "Upgrade my pod OS."
- One line: "This Pod's files are my memory. You never need to open them."

Then generate `CHEATSHEET.md` in the Pod root: the mental model, the morning routine, capture markers, reply grammar, where things live, and a "if something looks wrong" section. Personalize with the user's actual channel names, times, and tabs.

## Proxy protocol (setting up for someone else)

Operator answers as proxy; ALL uncertain answers confirmed via ONE confirmation-style Slack DM to the end user. Daily channel must be one the end user actually reads. Orientation written for someone who has never opened Dust: wake up, read one Slack message, reply in plain words. Operator recorded in STATUS.md as maintainer; ALL system alerts go to the operator, never the end user. Default proxy setups to Simple.

## First-week expectations (tell the user)

Day 1: first brief, expect 1-2 honest gaps (fix config, not playbooks). Weeks 4-5: first relay handoffs happen automatically; the morning post is the dead-man switch. First month: the Kaizen pass proposes its first deletions; accept some.
