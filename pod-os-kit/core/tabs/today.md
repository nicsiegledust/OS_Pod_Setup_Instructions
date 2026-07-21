# Tab: Today
Shows: today's meetings (external first) with prep status, work blocks, and the day's top 3.
Feeds: `state/calendar.json` (+ `dashboard_data.json.top3`). Refreshed by: Morning; patched by Sentinel.
Row chips: time, attendees count, 📋 prep chip when a prep file exists. Prep calendar blocks fold into their meeting row, never standalone.
Actions: Caret (attendees, meeting intel, prep link), Start (spawn prep/follow-up conversation).
Config: role pack decides whether internal meetings render (sales default: hidden unless same-day revenue impact).
