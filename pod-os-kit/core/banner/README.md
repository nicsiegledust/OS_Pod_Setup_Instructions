# The Banner

The banner is the product: a single pinned Frame at the top of the Pod. It is where the user reads state and steers the system. Everything else exists to feed it.

## Anatomy

1. **Admin row (top).** Fixed, identical for every role:
   - Health dot: worst engine health from `state/health.json` (LIVE green / DEGRADED amber / STALE red). Clicking opens the engines panel.
   - Engines panel: per engine, health dot · name · last run · schedule · 10 trailing daily dots · fires n/32 (data: `state/engine-history.json`).
   - **Capture box**: one input, three markers. Plain text -> `state/inbox.jsonl`. `!` -> instant Pod task (deduped). `?` -> Pod task + calendar work block in the next open slot. All via the `banner-action` pod function.
   - **Steer box**: appends the user's verbatim words to `me/context/priorities.json`.
   - Brief link: deep link to today's daily conversation / Slack brief.
2. **Tab row.** 3-6 tabs selected by the role pack from `core/tabs/`. Universal trio almost every pod wants: My Plate, Waiting On, Inbox. Today is strongly recommended. The rest is role flavor.
3. **Tab body.** Every list row follows the design system row anatomy. No exceptions, no per-tab creativity.

## Build steps (for the installing agent)

1. Fetch `BannerShell.tsx` from this folder. It renders the admin row and a tab registry from `config/banner-config.json`; each tab block plugs in as a component reading its declared state file.
2. Include ONLY the tab components the role pack selected. Delete unused blocks; do not ship dead code.
3. Write `config/banner-config.json` per the schema. The shell reads it with a file hook and falls back to safe defaults if missing.
4. Publish via the interactive content / Frames tools ONLY (writing .tsx to Pod disk does NOT update what users see), then pin it as the Pod banner.
5. Verify: no vertical scroll at banner height for the collapsed state, health badge renders, capture round-trips (type a test `!` capture, confirm the task exists, delete it).

`BannerShell.tsx` STATUS: extracted from a production banner (Nic OS v9). If it is missing from this folder in your copy of the repo, build from `design-system.md` + the tab block contracts, and keep the admin row spec above exactly.
