# Tab Blocks

Each block declares: what the tab shows, the state file that feeds it, which engine refreshes it, and which banner actions its rows support. The shell renders whatever `banner-config.json.tabs` lists, in order. All rows follow the design system row anatomy; blocks own only their data shape and chips.

Universal trio (nearly every pod): `my-plate`, `waiting-on`, `inbox`. Strongly recommended: `today`. Role flavor: `news`, `rituals`, `pipe`, `projects`, `campaigns`, `agents`, `queue`.

## Role-pack-defined blocks

`pipe`, `projects`, `campaigns`, `agents`, `queue` have no file here on purpose: their row contracts live in the role pack that owns them (`roles/ae.md` defines Pipe, `roles/ops-pm.md` Projects, `roles/marketer.md` Campaigns + Content Queue, `roles/ai-ops.md` Agents + Adoption). When installing one, build its tab component following the design-system row anatomy plus the pack's declared chips and state file, and register it in `TAB_BLOCKS`.
