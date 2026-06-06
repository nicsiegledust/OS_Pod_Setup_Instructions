# GTM Command Center — Setup Playbook

Turn a Dust Pod into an automated GTM Command Center for one sales rep: a fast interview, a seeded file system, a pinned live glass banner, and three self-renewing scheduled engines (Morning Run, Nightly Review, Weekly Prep).

**Start here:** [`GTM_Command_Center_Setup_v4_External.md`](./GTM_Command_Center_Setup_v4_External.md)

How to use: drop the playbook file into a fresh Dust Pod and tell an agent "set up this Pod using this file" (or paste it as a dedicated setup agent's instructions). Everything company-specific is a `{{PLACEHOLDER}}` the setup interview fills. No CRM portal, Slack workspace, or warehouse specifics are assumed; HubSpot, Salesforce, and Attio are all covered.

Built from a live production Pod, June 2026. Lineage: v2 (single morning engine) → v3 (wake-up relay, playbooks/specs layout) → v4 (glass banner + design system, image asset rules, contact registry, watchdogs, day types, inbound leads engine sweeps, verified-stage-ID method, and a Speed Protocol that guarantees the first interview question within ~30 seconds).
