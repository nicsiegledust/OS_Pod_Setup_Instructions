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
   - **Team OS / HQ OS / Account OS** - v8 adds a contract-first setup path for multi-Pod operating systems.

You can start Simple and say "upgrade my command center" later; everything is additive. An ops person can also run setup on behalf of a teammate whose entire experience is reading and replying to one Slack message.

## Hard guarantees

The system never sends an email (drafts only), never changes a CRM stage or record without your explicit yes, and never books a meeting. Autonomy lives in research, drafting, bookkeeping, and contract-safe state refreshes.

## v8 architecture

v8 moves the Command Center from one-Pod setup guidance to a layered OS model:

| Layer | Owns | Emits |
|---|---|---|
| Personal OS | One person's prep, tasks, commitments, meetings, and daily decision loop | daily run state, team-visible tasks |
| Team OS | Functional goals, commitments, asks, decisions, risks, and pulse | `pulse/goals-ledger.json`, promotion candidates |
| HQ OS | Company-level exception router and priority pulse | asks board, org status banner, priority pulse |
| Account OS | Account-specific intelligence and relationship state | account pulse into Sales OS or CS OS |

v8 uses JSON as the canonical state format, Markdown as the human operating manual, and JSON Schema as the first executable contract layer.

## Files

| File | What it is |
|---|---|
| `Command_Center_Setup_v8.md` | **Current.** Contract-first setup guide for Personal OS, Team OS, HQ OS, and Account OS. New in v8: data contracts, source-of-truth matrix, promotion lineage, validation gates, and schema files. |
| `contracts/team-os-goals-ledger.schema.json` | JSON Schema for the Team OS ledger consumed by HQ OS. |
| `contracts/hq-org-status-banner.schema.json` | JSON Schema for the HQ OS banner data surface. |
| `contracts/personal-os-daily-run.schema.json` | JSON Schema for the Personal OS daily run artifact. |
| `Command_Center_Setup_v7.md` | Previous edition. Good historical bootstrap guide for single-Pod setup, now superseded by v8. |
| `Command_Center_Setup_v6.md` | Older edition. Kept as lineage; older versions live in git history. |
