# Dust OS Data Contracts — External Reference Package

> **Version:** v8 (June 2026)  
> **Prepared by:** Dust  
> **Audience:** Teams evaluating or replicating the Dust Pod OS architecture  
> **Scrubbing:** All company names, personal names, Slack IDs, URLs, account names, and deal specifics have been replaced with generic placeholders. The **structure and schemas are authentic**.

---

## What is the Dust OS?

The Dust OS is a three-layer operating system built entirely inside Dust Pods. Each layer runs autonomous AI agents (via Pod wake-ups) that read from and write to JSON files, post daily Slack reports, and route signals up or down the stack.

```
┌─────────────────────────────────────────┐
│          🏢 COMPANY OS (1 Pod)          │
│  Daily rollup of all 7 Team OS signals  │
│  Posts to: #company_os (Slack)          │
│  Promotes exceptions only → Company     │
└──────────────┬──────────────────────────┘
               │ reads Team OS ledgers
               │ promotes to HQ router
┌──────────────▼──────────────────────────┐
│         📋 TEAM OS (7 Pods)             │
│  Sales · CS · SE · Product              │
│  Marketing · Talent · People            │
│  Each team: goals + commitments daily   │
│  Posts to: #team_[name]_os (Slack)      │
└──────────────┬──────────────────────────┘
               │ emits opt-in signals
               │ reads team ledgers
┌──────────────▼──────────────────────────┐
│         👤 PERSONAL OS (1 Pod)          │
│  Individual AE / IC operating layer     │
│  Morning Prep · Evening Review          │
│  Dashboard Frame · Task ledger          │
└─────────────────────────────────────────┘
```

---

## Directory Structure

```
dust-os-data-contracts/
├── README.md                        ← This file
├── manifest.json                    ← Full file index with descriptions
│
├── contracts/                       ← SHARED JSON SCHEMAS (all layers)
│   ├── base-os-item.schema.json     ← Core item type (goals/commitments/asks/risks/decisions)
│   ├── os-item-v2.schema.json       ← Normalized item format (vNext layer)
│   ├── team-os-goals-ledger.schema.json  ← Team OS ledger envelope
│   ├── company-commitment-router.schema.json  ← Company-level router
│   ├── personal-os-team-signal.schema.json    ← Personal → Team signal bus
│   ├── alignment.schema.json        ← CP tag + ownership route + area
│   ├── evidence.schema.json         ← Evidence / citation type
│   ├── status.schema.json           ← State + RAG + confidence
│   ├── metric.schema.json           ← Metric record (current/target/baseline)
│   ├── handoff.schema.json          ← Cross-pod handoff / routing state
│   ├── pod-action-task.schema.json  ← Pod Task linked to a ledger item
│   ├── cp-tag.schema.json           ← Company Priority tag (CP1–CP7)
│   └── recommended-action.schema.json  ← Personal OS AI-recommended action
│
├── company-os/                      ← COMPANY OS (HQ rollup layer)
│   ├── pulse/
│   │   ├── org-status-banner.json   ← Daily company state snapshot
│   │   ├── priority-pulse.json      ← Per-CP rolling pulse with history
│   │   └── os-contract-registry.json ← Registry of all OS pods and their paths
│   ├── system/
│   │   └── handoff-status.json      ← Engine config + last run metadata
│   └── people/
│       └── roster.json              ← Company-wide identity roster
│
├── team-os/                         ← TEAM OS (7 functional team pods)
│   ├── cs-os/
│   ├── sales-os/
│   ├── se-os/
│   ├── marketing-os/
│   ├── talent-os/
│   ├── people-os/
│   └── product-os/
│
└── personal-os/                     ← PERSONAL OS (individual AE layer)
    ├── dashboard_data.json
    ├── me/
    └── state/
```

---

## Key Design Principles

### 1. Pod Files as Canonical State
JSON files inside a Pod are the source of truth. Frames read them. Agents write them. Slack posts evidence state. Nothing else is "the record."

### 2. Company Priority Tags (CP1–CP7)
Every item in every ledger is tagged with a Company Priority. This enables rollup without reading every item.

### 3. RAG at every level
Every item, team, and company roll-up carries an explicit RAG. Company OS only writes exceptions it promotes.

### 4. Ownership Routes
Promoted Company items carry an ownershipRoute: `Business`, `Craft`, `Coaching`, or `Company Decision`.

### 5. Freshness Gates
Every engine checks file timestamps before publishing. `system/handoff-status.json` records last run.

### 6. Privacy by Layer
- Personal OS: private. Only emits signals when the AE opts in.
- Team OS: aggregate team-visible. People/Talent are **process-only** — no individual HR states.
- Company OS: cross-functional exceptions only.

### 7. Frames are Display, Not Source of Truth
React/TSX Frame files render JSON data. They contain no business logic. They cannot write state.

---

## Glossary

| Term | Meaning |
|------|----------|
| **Dustweek (DW)** | Internal work-week counter |
| **Pod** | A Dust workspace unit with files, tasks, and conversations |
| **Wake-up** | A scheduled cron inside Dust that triggers an agent automatically |
| **RAG** | Red / Amber / Green — the health color for an item, team, or company |
| **CP tag** | Company Priority tag (CP1–CP7) |
| **DRI** | Directly Responsible Individual |
| **Heartbeat** | The engine run cycle (typically daily) for a Pod's agent |
| **Frame** | A React/TSX component that renders Pod JSON data as a visual dashboard |
| **Promotion** | Elevating a team-level item to Company OS for cross-functional action |
| **Handoff** | A structured signal passed between Personal, Team, or Company layers |
| **Fire count** | Number of times a Pod's wake-up engine has fired since launch |

---

*This package was prepared by Dust. All company-specific information has been removed.*
