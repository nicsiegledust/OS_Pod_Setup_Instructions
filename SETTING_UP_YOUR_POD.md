# Setting Up Your Pod

Build yourself a Pod OS in Dust: a pinned live dashboard (tabs like Inbox, My Plate, Waiting On), a capture box that turns thoughts into tasks, and scheduled agents that prep your morning and keep the system alive. Works for AEs, CSMs, marketers, ops/PMs, AI ops, founders, analysts, and whole teams.

## The one-step install

1. Open [Dust](https://dust.tt) and start a conversation with a capable general agent (one with web browsing, the Computer, Frames, wake-ups, and pod tools).
2. Paste this:

> Set up my Pod OS using this repo: https://github.com/nicsiegledust/OS_Pod_Setup_Instructions. Fetch `pod-os-kit/SETUP.md` (raw: https://raw.githubusercontent.com/nicsiegledust/OS_Pod_Setup_Instructions/main/pod-os-kit/SETUP.md) and follow it exactly. Start by asking me Question 1.

3. Answer the questions (structured multiple choice, under 8 for the starter mode). The agent researches your role, proposes a layout, and builds everything: Pod, file system, pinned banner, capture, scheduled runs, Slack brief.
4. You get an orientation message and a personal cheatsheet when it's done. Total time: ~15 minutes for Simple mode.

Pick **Simple** mode your first time. You can say "upgrade my pod OS" later; nothing is thrown away.

## What the agent will read (for the curious)

| File | Purpose |
|---|---|
| [`pod-os-kit/SETUP.md`](pod-os-kit/SETUP.md) | Entry point: install order, modes, non-negotiables |
| [`pod-os-kit/LESSONS.md`](pod-os-kit/LESSONS.md) | 20 guardrails from running this system in production |
| [`pod-os-kit/core/interview.md`](pod-os-kit/core/interview.md) | The question flow |
| [`pod-os-kit/core/banner/BannerShell.tsx`](pod-os-kit/core/banner/BannerShell.tsx) | Ready-to-publish banner Frame (3 placeholders to fill) |
| [`pod-os-kit/core/tabs/`](pod-os-kit/core/tabs/) | The tab blocks (Inbox, My Plate, Waiting On, Today, News, Rituals) |
| [`pod-os-kit/core/engines/`](pod-os-kit/core/engines/) | Morning / evening / weekly / sentinel playbooks + the wake-up relay |
| [`pod-os-kit/roles/`](pod-os-kit/roles/) | Role packs: AE, CSM, marketer, ops/PM, AI ops, founder, team OS |

## What it will never do

No emails sent (drafts only), no CRM/record changes without your explicit yes, no meetings booked. Autonomy lives in research, drafting, and bookkeeping.

## Setting it up for a teammate

Same paste-in sentence, then tell the agent "I'm setting this up for someone else." It switches to the proxy protocol: you answer, they confirm via one Slack DM, alerts route to you.

---
*Legacy note: the `Command_Center_Setup_v*.md` files and `CEO_OS_Banner_Template.tsx` at the repo root are earlier, role-specific generations of this system. New installs should use `pod-os-kit/` only.*
