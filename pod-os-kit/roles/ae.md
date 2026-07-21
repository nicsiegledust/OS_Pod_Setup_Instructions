# Role Pack: Sales - AE
Tabs: Today · Pipe · My Plate · Waiting On · Inbox (News optional; deal news can live inside Pipe rows).
System of record: CRM. Store owner ID + pipeline ID; verify stage IDs from CRM metadata ONCE, freeze in the refresh playbook. Verify account ownership per latest-updated record before freezing any tier list.
work/: `meetings/`, `deals/`, `pipeline/`, `notes/`.
Pipe tab contract: every deal row carries name, company, domain, stage, amount, closeDate, nextStep, nextStepDate, dealId, dealUrl. Rows missing data render without those chips; never fabricate.
Watch topics (preselected): deal movement & risk / meetings & prep / pipeline generation / multithreading gaps / account news / usage & adoption (if a warehouse is connected: resolve workspace/tenant IDs once into a mapping, never re-derive by name).
Engine tweaks: Morning leads with revenue-relevant moves; internal meetings hidden by default; Evening preps tomorrow's external meetings deeply; Weekly runs the deal deep-review. Full mode: graded A/B/C morning moves with the one-line Slack reply grammar.
Doctrine hooks (optional, recommended over time): stage gates, outreach do/don't rules, ICP notes in `me/context/`. Recommendations must QUOTE doctrine when citing it.
Hard rules: no CRM stage moves, no auto-sent email, ever. Every draft subject carries a short curly-brace why-tag the user strips before sending.
