# LESSONS.md - hard-won guardrails (installing agents obey these verbatim)

1. **Frames are edited ONLY through the interactive content tools.** Writing .tsx to Pod disk does NOT update what users see. Interactive edits sync back to disk, not the other way around.
2. **The banner is JSON-only on daily runs.** Engines refresh data files. Layout changes are rare, deliberate, and follow the design system.
3. **Pod functions: editing the .ts source does nothing until re-published.** After any edit: re-publish, then ping-verify.
4. **Wake-ups are mortal (32 fires).** The relay + watchdogs are what keep the system alive. Never hardcode wake-up IDs in playbooks; `schedule.json` is the single source of truth.
5. **Never fail silently.** Every gap goes to a system_notes line and, when human action is needed, ONE task.
6. **Confirmations beat questions.** In setup and in daily briefs: present detected values to correct, not blanks to fill.
7. **Verify IDs against the system of record once, then freeze them** (stage IDs via CRM metadata, tenant IDs via the warehouse, channel IDs via a test post, ownership via the latest-updated record). Fuzzy name matching is how dashboards lie.
8. **No relative dates in tasks.** "Today/tomorrow/Friday" rot. Explicit dates only; the janitor enforces it.
9. **The user's words are sacred.** Beacons and captures are never rewritten; agents only annotate with `↳`.
10. **Echo the parse before executing.** Any reply grammar humans type WILL be typo'd. State your reading first; ask only about the ambiguous token. Never define two commands whose tokens collide.
11. **Serialize shared-state writers by scheduling, not locking.** One owner per write window. Concurrent writers on a shared file is a corruption bug found weeks later.
12. **The system never sends an email, moves a record stage, or books a meeting on its own.** Autonomy lives in research, drafting, and bookkeeping only.
13. **Recommendations must quote their sources.** A "reason" without a verbatim quote from the user's own doctrine/context is confabulation wearing a citation.
14. **Tag every artifact with WHY it exists** (why-tags on drafts, playbook stamps on logs). Unlabeled agent output erodes trust faster than any bug.
15. **Alert fatigue is the failure mode of proactive systems.** Caps, cooldowns, skip semantics, dismiss-with-reason. Not polish; survival.
16. **Retention is part of the system.** Unbounded artifact growth makes Pods unusable. Archive on schedule; run the monthly Kaizen deletion pass. A system that only grows is rotting.
17. **Restructure live Pods with a breadcrumb, not a freeze.** When paths move while engines are scheduled, update every reference in the same pass AND leave a MOVED.md mapping at the old location.
18. **No special-cased layouts** (no "week mode"). One banner structure, 7 days a week. Special cases rot.
19. **Missing data renders as missing.** No chip, or an honest yellow warning. Never fabricate an amount, date, or health score.
20. **Chips, dots, and badges must be backed by real telemetry.** A decorative LIVE badge is worse than none; wire it to the health check or delete it.
