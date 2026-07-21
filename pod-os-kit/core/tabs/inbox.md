# Tab: Inbox
Shows: untriaged captures + signals routed to the user (plain captures, flagged emails, mentions).
Feeds: `state/inbox.jsonl` (append-only). Drained by: Evening triage; user can triage inline any time.
Row: TYPE chip (note/email/slack) · relative time · first line; click to expand. Filter chips: All / source / last 24h (default ON).
Actions: Caret, Edit (promote to task), Snooze (signal_snooze), Done (signal_ack), Kill (signal_kill).
