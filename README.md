# GTM Command Center — Setup Playbook

Turn a Dust Pod into an automated GTM Command Center for one sales rep: a fast interview, a seeded file system, a pinned live glass banner, four self-renewing scheduled engines (Morning Run, Nightly Review, Weekly Prep, Sentinel), and Periscope, a proactive Play Card recommendation layer dispatched from Slack.

**Start here:** [`GTM_Command_Center_Setup_v5_External.md`](./GTM_Command_Center_Setup_v5_External.md)

How to use: drop the playbook file into a fresh Dust Pod and tell an agent "set up this Pod using this file" (or paste it as a dedicated setup agent's instructions). Everything company-specific is a `{{PLACEHOLDER}}` the setup interview fills. No CRM portal, Slack workspace, or warehouse specifics are assumed; HubSpot, Salesforce, and Attio are all covered.

Built from a live production Pod, June 2026. Lineage: v2 (single morning engine) → v3 (wake-up relay, playbooks/specs layout) → v4 (glass banner + design system, watchdogs, day types, inbound engine sweeps, Speed Protocol) → v5 (Periscope Play Cards with Slack decide-and-dispatch, parse echo, and citation enforcement; the Sentinel watchdog engine; deal stage gates; the why-tag draft taxonomy; power coverage; re-engagement doctrine; single-writer CSV windows; relay threshold 20; monthly Kaizen pass).
