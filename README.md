# Command Center

Agents that run before you wake up, research your day, keep your systems updated in the background, and send you **one Slack message** with what matters and the decisions that need you. You reply to the thread; they do the legwork.

Built on [Dust](https://dust.tt). Works for any role: sales, recruiting, product, support, finance/ops, founder. Born as a sales (GTM) system; sales remains the deepest role pack.

## Start here

1. Create a fresh Pod in Dust.
2. Drop `Command_Center_Setup_v8.md` into it. The file instructs the agent to start on its own; if nothing happens, say: **"set up this Pod using this file."**
3. Answer a handful of plain-language questions. Pick your size:
   - **Simple** - one morning agent + one Slack brief with decisions. Live in minutes.
   - **Standard** - adds an evening agent, a watchdog, and a live dashboard pinned to the Pod.
   - **Full** - the whole machine, including proactive suggested next moves every morning you approve with a one-line reply.

You can start Simple and say "upgrade my command center" later; everything is additive. An ops person can also run setup on behalf of a teammate whose entire experience is reading and replying to one Slack message (see Part 11.2).

## Hard guarantees

The system never sends an email (drafts only), never changes a CRM stage or record without your explicit yes, and never books a meeting. Autonomy lives in research, drafting, and bookkeeping.

## Files

| File | What it is |
|---|---|
| `Command_Center_Setup_v8.md` | **Current.** Generalized, all roles, Simple/Standard/Full modes, plain-language setup. New in v8: canonical four-engine naming (🚒 Morning Engine / 🚒 Evening Engine / 🚒 Weekly Prep Engine / 🚒 Cleanup Engine, retiring the v5 name "Sentinel"), a thin Morning Engine that spawns a fresh daily worker conversation, the Compass / Daily Research + Prep calendar split, the Pod-task naming convention with tasks as the single commitment ledger, full-week meeting prep with calendar QA guards, and the Cleanup Engine four-engine schedule health audit. |
| `Command_Center_Setup_v7.md` | Previous edition. New in v7: the human-readable file system (folders named for what a human looks for; no `logs/` junk drawer) and the MOVED.md pattern for restructuring a live Pod safely. |
| `Command_Center_Setup_v6.md` | Older edition. Kept as lineage; older versions live in git history. |
