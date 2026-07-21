# Banner Design System

Single source of truth for how the banner looks and behaves. Any future edit must follow this; drift is a bug.

## Row anatomy (every list row, every tab)

`[status dot] [P-chip] [TYPE chip] Title … [context chips] ──── [action cluster]`

Action cluster, right-aligned, fixed order left to right (safe to destructive):

| Slot | Icon | Token | Meaning |
|---|---|---|---|
| Caret | ▾/▴ | ghost `#94a3b8` | expand context + secondary actions |
| Edit | ✎ icon-only | sky `#0369a1/#f0f9ff/#bae6fd` | open inline editor |
| Start | agent logo (+"Start" when no convo) | violet `#7c3aed` family | kick off an agent conversation on this item |
| Snooze | 🕐 | slate `#475569/#f8fafc/#e2e8f0` | popover 1d/3d/7d/30d; "push the date, change nothing else" |
| Done | ✓ | green `#047857/#ecfdf5/#a7f3d0` | complete |
| Kill | ✕ | rose `#be123c/#fff1f2/#fecdd3` | drop; always LAST |

Rules:
- Rows without a semantic slot omit it (tasks have no Kill; rituals have no Snooze). Never reorder slots.
- All buttons share one helper (inline-flex, minWidth 24, padding 3px 7px, same radius). No text labels except Start-without-convo.
- One snooze popover open at a time.
- Feeds render newest first, one line per collapsed item (TYPE chip · relative time · first line), click to expand. Never a wall of full-text cards. Explainers are one small gray line, not a colored box.

## Color tokens

Done green `#047857/#ecfdf5/#a7f3d0` · Kill rose `#be123c/#fff1f2/#fecdd3` · Edit sky `#0369a1/#f0f9ff/#bae6fd` · Neutral slate `#475569/#f8fafc/#e2e8f0` · Start violet family · one accent per tab.
Engine dots: ok `#059669`, miss `#e11d48`, pending `#d97706`, off `#e2e8f0`, no-telemetry white with `#cbd5e1` border.

## Hard rules

- The banner is JSON-only on daily runs: engines refresh data files; layout changes are rare, deliberate, and go through this spec plus the interactive tools.
- Chips render only when the data exists. Missing amount/date = no chip. Never fabricate.
- Calendar prep blocks never render as standalone rows; they fold into the meeting they prepare (📋 chip + line in the expanded panel).
- Toasts/confirmations appear next to the button that triggered them.
