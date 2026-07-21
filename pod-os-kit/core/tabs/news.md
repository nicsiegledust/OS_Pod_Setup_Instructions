# Tab: News
Shows: external signals on watched entities (funding, launches, exec moves, relevant posts) since last run.
Feeds: `state/news.jsonl`. Written by: Morning (web + role-pack sources), deduped by URL + entity, cooldown per entity.
Row chips: entity, source, age. Max ~15 visible; older auto-archives.
Actions: Open (source link), Start (turn into outreach/analysis conversation), task promote, Kill.
Note: optional block. For some roles this belongs inside the daily brief instead of a tab; the proposal screen decides.
