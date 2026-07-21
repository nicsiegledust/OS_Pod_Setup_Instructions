# SETUP.md - Agent entry point

You are an agent setting up a Pod OS for a user. This file is your router. Read it fully, then fetch only the files each step tells you to fetch. Do not load the whole repo.

## Non-negotiables (read before anything else)

1. **Fetch and obey `LESSONS.md` verbatim.** Every guardrail in it exists because a real system broke without it.
2. **The Speed Protocol.** Question 1 fires within your FIRST step, using only instantly available context (user name, email, company from domain). Max ~30 seconds of work before Q1. Enrich in parallel between questions. Never make the user watch a spinner.
3. **The Plain-Language Contract.** Ask about outcomes, never mechanisms. Never name a subsystem (engine, sentinel, relay, frame) in a question before explaining it in one plain sentence. Glossary in `core/interview.md`.
4. **Every decision point uses the structured question tool** (ask_user_question or equivalent): 2-4 options, recommended option marked. Free text only for non-enumerable values, grouped.
5. **Confirmations beat questions.** Research first, then present detected values to correct, not blanks to fill.
6. **Do not freestyle the banner.** The shell, design system, and tab blocks in `core/banner/` and `core/tabs/` are the layout. You wire data; you do not invent UI.

## Preflight (silent, parallel with Q1)

Verify availability of: a Pod (create or reuse), the Computer/sandbox, pod functions, wake-ups (scheduled triggers), Frames/interactive content, the structured question tool, Slack posting, calendar and email read access. Note gaps; mention each gap only when it first matters. Never block the interview on a missing tool.

## The flow

1. **Interview** - fetch `core/interview.md`. Run Q1 (identity) immediately. Mode question (Q2) decides everything downstream. Role question (Q3) selects a role pack from `roles/` (fetch only that one).
2. **Propose, don't ask.** After Q3, fetch the role pack and present a proposed build on one screen: tabs, schedule, Slack channel, watch list. The user adjusts; you do not interrogate.
3. **Install** in this order (mode table in `core/interview.md` says which parts apply):
   a. Create/confirm the Pod; set description.
   b. Seed the file system - fetch `core/filesystem.md`.
   c. Write `config/banner-config.json` - schema in `core/banner/banner-config.schema.json`.
   d. Build the banner from the shell - fetch `core/banner/README.md` and the selected tab blocks from `core/tabs/`. Publish via the interactive content tools ONLY, then pin it as the Pod banner.
   e. Publish pod functions - fetch `core/functions/README.md`. Publish, then verify with a read-only ping. Editing a .ts source does nothing until re-published.
   f. Create engine conversations and wake-ups - fetch `core/engines/README.md` plus the playbooks for the engines this mode installs. Install the wake-up relay in ALL modes.
4. **Verify + smoke test** - fetch `core/verify.md`. Run every applicable check. Fix before declaring done.
5. **Orient** - post the orientation message (template in `core/verify.md`) and generate a personalized `CHEATSHEET.md` in the Pod root. Setup is NOT complete until orientation is posted.

## Mode table

| Component | Simple | Standard | Full |
|---|---|---|---|
| Interview questions | Q1-Q7 | Q1-Q12 | all |
| File system | minimal | full | full |
| Banner + capture + pod functions | yes | yes | yes |
| Morning engine | yes (simple variant) | yes | yes |
| Evening engine + task janitor | no | yes | yes |
| Sentinel (hourly health loop) | no | yes | yes |
| Weekly prep engine | no | optional | yes |
| Proactive suggested moves | no | no | yes |
| Wake-up relay | yes | yes | yes |
| Orientation + cheatsheet | yes | yes | yes |

Note: unlike earlier private versions of this system, the banner ships in ALL modes here. The banner and its capture box are the product; a mode without them is just a cron job.

## Setting it up for someone else (proxy)

If the operator is building for a teammate: answer as proxy, confirm uncertain answers via ONE confirmation-style Slack DM to the end user, default to Simple mode, route all system alerts to the OPERATOR, and write the orientation for someone who has never opened Dust. Full protocol in `core/verify.md`.

## Upgrade path

"Upgrade my pod OS" re-runs this file: keep stored answers, resume the interview where the old mode stopped, install the delta. Never rebuild from scratch; never orphan existing state files.
