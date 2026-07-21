// ═══════════════════════════════════════════════════════════════════════════
// Pod OS Kit — BannerShell.tsx
// Generic, config-driven Pod banner. Extracted from a production banner
// (Nic OS v9, Dust, July 2026). The installing agent:
//   1. Replaces the three {{PLACEHOLDERS}} below.
//   2. Deletes tab components the role pack did not select (and their entries
//      in TAB_BLOCKS). Do not ship dead code.
//   3. Publishes via the interactive content tools ONLY, then pins.
// Layout follows core/banner/design-system.md. Do not freestyle.
// ═══════════════════════════════════════════════════════════════════════════
import React, { useState, useEffect, useMemo } from "react";
import { useFile, callFunction } from "@dust/react-hooks";
import {
  Inbox as InboxIcon, ClipboardList, Hourglass, CalendarCheck, Newspaper,
  Repeat2, Activity, Mic, Compass, Sun, Clock3, Pencil, Send, ChevronDown,
  ChevronUp, ExternalLink,
} from "lucide-react";

// ── Install-time constants ──────────────────────────────────────────────────
const POD = "{{POD_ID}}"; // e.g. vlt_abc123
const FN_ACTION = "{{POD_ID}}/banner-action" as const;
const OS_EMOJI = "{{EMOJI}}"; // e.g. 🦉
const OS_TITLE = "{{TITLE}}"; // e.g. "Jane OS"
const P = (rel: string) => "pod-" + POD + "/" + rel;

// ── Tiny utilities ──────────────────────────────────────────────────────────
function relTime(iso: string | null | undefined): string {
  if (!iso) return "never";
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return "just now"; if (m < 60) return m + "m ago";
  const h = Math.floor(m / 60); if (h < 24) return h + "h ago";
  return Math.floor(h / 24) + "d ago";
}
function parseDay(v: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(v));
  return m ? new Date(+m[1], +m[2] - 1, +m[3]) : new Date(v);
}
function fmtDay(v: string | null | undefined): string {
  if (!v) return "";
  const d = parseDay(v), now = new Date();
  if (d.toDateString() === now.toDateString()) return "Today";
  const opt: any = { month: "short", day: "numeric" };
  if (d.getFullYear() !== now.getFullYear()) opt.year = "2-digit";
  return d.toLocaleDateString("en-US", opt);
}
function dueTone(v: string | null | undefined) {
  if (!v) return { color: "#64748b", bg: "#f8fafc", border: "#e2e8f0" };
  const d = parseDay(v), t = new Date(); t.setHours(0, 0, 0, 0);
  if (d < t) return { color: "#be123c", bg: "#fff1f2", border: "#fecdd3" };       // overdue
  if (d.toDateString() === new Date().toDateString()) return { color: "#047857", bg: "#ecfdf5", border: "#a7f3d0" }; // today
  const fri = new Date(t); fri.setDate(t.getDate() + ((5 - t.getDay() + 7) % 7));
  if (d <= fri) return { color: "#0369a1", bg: "#f0f9ff", border: "#bae6fd" };     // this week
  return { color: "#475569", bg: "#f8fafc", border: "#e2e8f0" };                   // later
}
const DueChip = ({ date }: { date?: string | null }) => date ? (
  <span style={{ fontSize: 9, fontWeight: 700, padding: "1px 6px", borderRadius: 999, whiteSpace: "nowrap", color: dueTone(date).color, background: dueTone(date).bg, border: "1px solid " + dueTone(date).border }}>{fmtDay(date)}</span>
) : null;
const Chip = ({ text, fg = "#475569", bg = "#f8fafc", br = "#e2e8f0" }: { text: string; fg?: string; bg?: string; br?: string }) => (
  <span style={{ fontSize: 9, fontWeight: 700, padding: "1px 6px", borderRadius: 999, whiteSpace: "nowrap", color: fg, background: bg, border: "1px solid " + br }}>{text}</span>
);

// Read a pod file as parsed JSON (or JSONL array). Engines own the data.
function useJson(rel: string, jsonl = false): any {
  const f = useFile(P(rel));
  const [v, setV] = useState<any>(null);
  useEffect(() => {
    if (!f) return; let dead = false;
    f.text().then((t: string) => {
      if (dead) return;
      try {
        setV(jsonl
          ? t.split("\n").filter(Boolean).map((l: string) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean)
          : JSON.parse(t));
      } catch { setV(null); }
    }).catch(() => {});
    return () => { dead = true; };
  }, [f]);
  return v;
}

// callFunction wrapper: unwraps { content: [{ text }] } shapes and JSON bodies.
async function callFn(slug: string, input: any): Promise<any> {
  const res: any = await callFunction(slug as any, input);
  try {
    const t = res?.content?.[0]?.text ?? res;
    return typeof t === "string" ? JSON.parse(t) : t;
  } catch { return res; }
}

// ═══ Design system (verbatim from design-system.md; do not change) ══════════
const DSC = {
  done:   { fg: "#047857", bg: "#ecfdf5", br: "#a7f3d0" },
  kill:   { fg: "#be123c", bg: "#fff1f2", br: "#fecdd3" },
  snooze: { fg: "#475569", bg: "#f8fafc", br: "#e2e8f0" },
  edit:   { fg: "#0369a1", bg: "#f0f9ff", br: "#bae6fd" },
  start:  { fg: "#7c3aed", bg: "#faf5ff", br: "#e9d5ff" },
  ghost:  { fg: "#94a3b8", bg: "#ffffff", br: "#e2e8f0" },
};
const dsBtn = (v: { fg: string; bg: string; br: string }, disabled = false): React.CSSProperties => ({
  fontSize: 10, fontWeight: 600, padding: "3px 7px", borderRadius: 7, minWidth: 24,
  border: "1px solid " + v.br, background: v.bg, color: v.fg,
  cursor: disabled ? "wait" : "pointer", opacity: disabled ? 0.6 : 1,
  display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 3,
  whiteSpace: "nowrap", lineHeight: 1.2, flexShrink: 0,
});
const SNOOZE_CHOICES = [1, 3, 7, 30];
const snoozeISO = (d: number) => new Date(Date.now() + d * 86400000).toISOString().slice(0, 10);

// ═══ Shared row scaffolding ═════════════════════════════════════════════════
// Row anatomy: [dot] [P-chip] [TYPE chip] Title … [context chips] ── [actions]
// Action order (safe → destructive): caret · edit · start · snooze · done · kill.
// Rows without a semantic slot omit it; never reorder.
type RowAction =
  | { kind: "caret"; open: boolean; onClick: () => void }
  | { kind: "edit"; onClick: () => void }
  | { kind: "start"; onClick: () => void; label?: string }
  | { kind: "snooze"; onPick: (days: number) => void; what: string }
  | { kind: "done"; onClick: () => void }
  | { kind: "kill"; onClick: () => void }
  | { kind: "open"; href: string };

function Row({ k, dot, chips, title, sub, actions, busy, snoozePop, setSnoozePop, expanded }:
  { k: string; dot?: string; chips?: React.ReactNode; title: string; sub?: string;
    actions: RowAction[]; busy: Record<string, boolean>;
    snoozePop: string | null; setSnoozePop: (v: string | null) => void; expanded?: React.ReactNode }) {
  return (
    <div style={{ borderBottom: "1px solid #f1f5f9" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 8px", minWidth: 0 }}>
        {dot && <span style={{ width: 7, height: 7, borderRadius: 999, background: dot, flexShrink: 0 }} />}
        {chips}
        <span style={{ fontSize: 11, fontWeight: 600, color: "#0f172a", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
          {title}{sub && <span style={{ color: "#94a3b8", fontWeight: 400 }}> · {sub}</span>}
        </span>
        <span style={{ display: "inline-flex", gap: 4, flexShrink: 0 }}>
          {actions.map((a, i) => {
            const bk = k + ":" + a.kind;
            if (a.kind === "caret") return <button key={i} onClick={a.onClick} style={dsBtn(DSC.ghost)}>{a.open ? <ChevronUp size={10} /> : <ChevronDown size={10} />}</button>;
            if (a.kind === "edit") return <button key={i} onClick={a.onClick} style={dsBtn(DSC.edit)}><Pencil size={9} /></button>;
            if (a.kind === "start") return <button key={i} onClick={a.onClick} disabled={!!busy[bk]} style={dsBtn(DSC.start, !!busy[bk])} title="Start an agent conversation on this item">{busy[bk] ? "…" : (a.label ?? "Start")}</button>;
            if (a.kind === "snooze") return (
              <span key={i} style={{ position: "relative", display: "inline-flex", flexShrink: 0 }}>
                <button onClick={() => setSnoozePop(snoozePop === k ? null : k)} disabled={!!busy[bk]} title={"Push " + a.what + " out — nothing else changes"} style={dsBtn(DSC.snooze, !!busy[bk])}>{busy[bk] ? "…" : <Clock3 size={10} />}</button>
                {snoozePop === k && (
                  <span style={{ position: "absolute", top: 22, right: 0, zIndex: 70, display: "flex", gap: 3, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, padding: "4px 5px", boxShadow: "0 6px 16px rgba(15,23,42,0.16)" }}>
                    {SNOOZE_CHOICES.map((d) => <button key={d} onClick={() => { setSnoozePop(null); a.onPick(d); }} style={{ fontSize: 9, fontWeight: 800, color: "#334155", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 6, padding: "2px 7px", cursor: "pointer" }}>{d}d</button>)}
                  </span>)}
              </span>);
            if (a.kind === "done") return <button key={i} onClick={a.onClick} disabled={!!busy[bk]} style={dsBtn(DSC.done, !!busy[bk])}>{busy[bk] ? "…" : "✓"}</button>;
            if (a.kind === "kill") return <button key={i} onClick={a.onClick} disabled={!!busy[bk]} style={dsBtn(DSC.kill, !!busy[bk])}>{busy[bk] ? "…" : "✕"}</button>;
            if (a.kind === "open") return <a key={i} href={a.href} target="_blank" rel="noreferrer" style={{ ...dsBtn(DSC.ghost), textDecoration: "none" }}><ExternalLink size={10} /></a>;
            return null;
          })}
        </span>
      </div>
      {expanded && <div style={{ padding: "2px 12px 8px 22px", fontSize: 10.5, color: "#475569", lineHeight: 1.5 }}>{expanded}</div>}
    </div>
  );
}
const Empty = ({ text }: { text: string }) => <div style={{ padding: "14px 10px", fontSize: 10.5, color: "#94a3b8", textAlign: "center" }}>{text}</div>;

// ═══ Main shell ═════════════════════════════════════════════════════════════
export default function PodBanner() {
  // Engine-owned data (JSON-only refreshes; the banner never writes these).
  const cfg = useJson("config/banner-config.json");
  const health = useJson("state/health.json");
  const engHist = useJson("state/engine-history.json");
  const dash = useJson("dashboard_data.json");
  const cal = useJson("state/calendar.json");
  const inboxItems = useJson("state/inbox.jsonl", true);
  const waiting = useJson("state/waiting.jsonl", true);
  const news = useJson("state/news.jsonl", true);
  const tasksData = useJson("state/tasks.json");
  const rituals = useJson("me/rituals.json");
  const ritLog = useJson("state/rituals-log.jsonl", true);

  // UI state
  const [tab, setTab] = useState<string>("");
  const [overlay, setOverlay] = useState<null | "engines" | "capture" | "steer">(null);
  const [busy, setBusy] = useState<Record<string, boolean>>({});
  const [toast, setToast] = useState<{ near: string; text: string; err?: boolean } | null>(null);
  const [snoozePop, setSnoozePop] = useState<string | null>(null);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [beacon, setBeacon] = useState("");
  const [hidden, setHidden] = useState<Record<string, boolean>>({}); // optimistic removal

  const tabs: string[] = cfg?.tabs?.length ? cfg.tabs : ["my-plate", "waiting-on", "inbox"];
  useEffect(() => { if (!tab && tabs.length) setTab(tabs[0]); }, [cfg]);

  const flash = (near: string, text: string, err = false) => { setToast({ near, text, err }); setTimeout(() => setToast(null), 3500); };
  const act = async (key: string, input: any, okMsg: string, hideKey?: string) => {
    setBusy((b) => ({ ...b, [key]: true }));
    try {
      const r = await callFn(FN_ACTION, { ...input, requestedBy: "banner" });
      if (r?.ok === false) throw new Error(r?.error || "failed");
      if (hideKey) setHidden((h) => ({ ...h, [hideKey]: true }));
      flash(key, okMsg);
    } catch (e: any) { flash(key, "Failed: " + (e?.message || "error"), true); }
    setBusy((b) => ({ ...b, [key]: false }));
  };

  // Client-side health: derive from data age so a dead sentinel can't show green.
  const engineIso = dash?.lastRefreshed ?? null;
  const ageH = engineIso ? (Date.now() - new Date(engineIso).getTime()) / 3600000 : Infinity;
  const derived = ageH > 48 ? "red" : ageH > 24 ? "yellow" : (health?.overall ?? "green");
  const eff = health?.overall === "red" ? "red" : derived;
  const healthColor = eff === "green" ? "#059669" : eff === "yellow" ? "#d97706" : "#e11d48";
  const dateLabel = new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

  const pill = (active: boolean, fg: string, bg: string, br: string): React.CSSProperties => ({
    display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10, fontWeight: 700,
    padding: "4px 9px", borderRadius: 999, cursor: "pointer", whiteSpace: "nowrap",
    border: "1px solid " + (active ? fg : br), background: active ? fg : bg, color: active ? "#fff" : fg,
  });

  // ── Capture / Steer handlers ──────────────────────────────────────────────
  const doCapture = async () => {
    const text = note.trim(); if (!text || busy.capture) return;
    await act("capture", { action: "capture", note: text, source: "banner-capture" },
      text.startsWith(cfg?.captureMarkers?.taskWithBlock ?? "?") ? "Task + calendar block created"
      : text.startsWith(cfg?.captureMarkers?.task ?? "!") ? "Task created" : "Saved to inbox");
    setNote("");
  };
  const doSteer = async () => {
    const text = beacon.trim(); if (!text || busy.steer) return;
    await act("steer", { action: "steer", text }, "Beacon saved — your words, verbatim");
    setBeacon("");
  };

  // ═══ Tab bodies. DELETE the ones your role pack did not select. ═══════════
  const TodayTab = () => {
    const evts = (cal?.events ?? []).filter((e: any) => !hidden["evt:" + e.id]);
    if (!evts.length) return <Empty text="No meetings today. The morning engine refreshes this." />;
    return <>{evts.map((e: any) => (
      <Row key={e.id} k={"evt:" + e.id} busy={busy} snoozePop={snoozePop} setSnoozePop={setSnoozePop}
        dot={e.external ? "#0e7490" : "#cbd5e1"}
        chips={<><Chip text={e.time ?? ""} fg="#0e7490" bg="#ecfeff" br="#a5f3fc" />{e.prepFile && <Chip text="📋 prep" fg="#047857" bg="#ecfdf5" br="#a7f3d0" />}</>}
        title={e.title} sub={e.attendees ? e.attendees + " attendees" : undefined}
        actions={[
          { kind: "caret", open: expandedRow === "evt:" + e.id, onClick: () => setExpandedRow(expandedRow === "evt:" + e.id ? null : "evt:" + e.id) },
          { kind: "start", onClick: () => act("evt:" + e.id + ":start", { action: "task_engage", ref: "meeting:" + e.id, title: e.title }, "Prep conversation queued") },
        ]}
        expanded={expandedRow === "evt:" + e.id ? (e.prepSummary ?? "No prep notes yet.") : null} />
    ))}</>;
  };

  const MyPlateTab = () => {
    const items = (tasksData?.tasks ?? []).filter((t: any) => t.status !== "done" && !hidden["task:" + t.id]);
    if (!items.length) return <Empty text="Plate is clear. Capture with ! to add a task." />;
    return <>{items.map((t: any) => (
      <Row key={t.id} k={"task:" + t.id} busy={busy} snoozePop={snoozePop} setSnoozePop={setSnoozePop}
        dot={t.status === "blocked" ? "#e11d48" : t.status === "active" ? "#0369a1" : "#cbd5e1"}
        chips={<>{t.priority != null && <Chip text={"P" + t.priority} fg="#7c3aed" bg="#faf5ff" br="#e9d5ff" />}{t.due ? <DueChip date={t.due} /> : <Chip text="missing date" fg="#b45309" bg="#fffbeb" br="#fde68a" />}</>}
        title={t.title}
        actions={[
          { kind: "caret", open: expandedRow === "task:" + t.id, onClick: () => setExpandedRow(expandedRow === "task:" + t.id ? null : "task:" + t.id) },
          { kind: "start", onClick: () => act("task:" + t.id + ":start", { action: "task_engage", taskId: t.id }, "Agent started on this task") },
          { kind: "snooze", what: "the due date", onPick: (d) => act("task:" + t.id + ":snooze", { action: "task_defer", taskId: t.id, until: snoozeISO(d) }, "Pushed to " + fmtDay(snoozeISO(d))) },
          { kind: "done", onClick: () => act("task:" + t.id + ":done", { action: "task_done", taskId: t.id }, "Done ✓", "task:" + t.id) },
        ]} // no Kill: tasks are closed or re-dated, never silently dropped
        expanded={expandedRow === "task:" + t.id ? (t.context ?? null) : null} />
    ))}</>;
  };

  const WaitingTab = () => {
    const items = (waiting ?? []).filter((w: any) => w.status !== "done" && !hidden["wait:" + w.id]);
    if (!items.length) return <Empty text="Not waiting on anyone. Engines detect sent-and-unanswered threads." />;
    return <>{items.map((w: any) => (
      <Row key={w.id} k={"wait:" + w.id} busy={busy} snoozePop={snoozePop} setSnoozePop={setSnoozePop}
        dot={w.nudgeAfter && parseDay(w.nudgeAfter) < new Date() ? "#e11d48" : "#d97706"}
        chips={<><Chip text={w.who ?? "?"} fg="#0369a1" bg="#f0f9ff" br="#bae6fd" />{w.since && <Chip text={relTime(w.since)} />}</>}
        title={w.what ?? w.title ?? ""}
        actions={[
          { kind: "start", label: "Nudge", onClick: () => act("wait:" + w.id + ":start", { action: "task_engage", ref: "waiting:" + w.id, title: "Draft nudge to " + w.who }, "Nudge draft queued — never auto-sent") },
          { kind: "snooze", what: "the nudge date", onPick: (d) => act("wait:" + w.id + ":snooze", { action: "waiting_update", id: w.id, nudgeAfter: snoozeISO(d) }, "Nudge pushed to " + fmtDay(snoozeISO(d))) },
          { kind: "done", onClick: () => act("wait:" + w.id + ":done", { action: "waiting_done", id: w.id }, "Resolved ✓", "wait:" + w.id) },
          { kind: "kill", onClick: () => act("wait:" + w.id + ":kill", { action: "waiting_kill", id: w.id }, "Dropped", "wait:" + w.id) },
        ]} />
    ))}</>;
  };

  const InboxTab = () => {
    const items = (inboxItems ?? []).filter((s: any) => !s.triaged && !hidden["sig:" + s.id]).slice().reverse();
    if (!items.length) return <Empty text="Inbox zero. Captures and routed signals land here." />;
    return <>{items.map((s: any) => (
      <Row key={s.id} k={"sig:" + s.id} busy={busy} snoozePop={snoozePop} setSnoozePop={setSnoozePop}
        chips={<><Chip text={(s.type ?? "note").toUpperCase()} fg="#4338ca" bg="#eef2ff" br="#c7d2fe" /><Chip text={relTime(s.ts)} /></>}
        title={(s.note ?? s.text ?? "").split("\n")[0]}
        actions={[
          { kind: "caret", open: expandedRow === "sig:" + s.id, onClick: () => setExpandedRow(expandedRow === "sig:" + s.id ? null : "sig:" + s.id) },
          { kind: "edit", onClick: () => act("sig:" + s.id + ":edit", { action: "capture", note: (cfg?.captureMarkers?.task ?? "!") + " " + (s.note ?? s.text), promotes: s.id }, "Promoted to task", "sig:" + s.id) },
          { kind: "snooze", what: "this item", onPick: (d) => act("sig:" + s.id + ":snooze", { action: "signal_snooze", id: s.id, until: snoozeISO(d) }, "Snoozed", "sig:" + s.id) },
          { kind: "done", onClick: () => act("sig:" + s.id + ":done", { action: "signal_ack", id: s.id }, "Acknowledged", "sig:" + s.id) },
          { kind: "kill", onClick: () => act("sig:" + s.id + ":kill", { action: "signal_kill", id: s.id }, "Dropped", "sig:" + s.id) },
        ]}
        expanded={expandedRow === "sig:" + s.id ? (s.note ?? s.text) : null} />
    ))}</>;
  };

  const NewsTab = () => {
    const items = (news ?? []).filter((n: any) => !n.archived && !hidden["news:" + n.id]).slice(0, 15);
    if (!items.length) return <Empty text="No external signals since the last run." />;
    return <>{items.map((n: any) => (
      <Row key={n.id} k={"news:" + n.id} busy={busy} snoozePop={snoozePop} setSnoozePop={setSnoozePop}
        chips={<><Chip text={n.entity ?? ""} fg="#c2410c" bg="#fff7ed" br="#fed7aa" /><Chip text={relTime(n.ts)} /></>}
        title={n.headline ?? n.title ?? ""} sub={n.source}
        actions={[
          ...(n.url ? [{ kind: "open", href: n.url } as RowAction] : []),
          { kind: "start", onClick: () => act("news:" + n.id + ":start", { action: "task_engage", ref: "news:" + n.id, title: n.headline }, "Analysis conversation queued") },
          { kind: "kill", onClick: () => act("news:" + n.id + ":kill", { action: "signal_kill", id: n.id, kind: "news" }, "Dropped", "news:" + n.id) },
        ]} />
    ))}</>;
  };

  const RitualsTab = () => {
    const defs = rituals?.rituals ?? [];
    const today = new Date().toISOString().slice(0, 10);
    const doneToday = new Set((ritLog ?? []).filter((r: any) => (r.ts ?? "").slice(0, 10) === today).map((r: any) => r.id));
    if (!defs.length) return <Empty text="No rituals declared. Add them in me/rituals.json via the evening engine." />;
    return <>{defs.map((r: any) => {
      const dots = [...Array(10)].map((_, i) => {
        const d = new Date(Date.now() - (9 - i) * 86400000).toISOString().slice(0, 10);
        return (ritLog ?? []).some((l: any) => l.id === r.id && (l.ts ?? "").slice(0, 10) === d);
      });
      return (
        <Row key={r.id} k={"rit:" + r.id} busy={busy} snoozePop={snoozePop} setSnoozePop={setSnoozePop}
          dot={doneToday.has(r.id) ? "#059669" : "#cbd5e1"}
          chips={<><Chip text={r.cadence ?? "daily"} /><span style={{ display: "inline-flex", gap: 2 }}>{dots.map((ok, i) => <span key={i} style={{ width: 5, height: 5, borderRadius: 999, background: ok ? "#059669" : "#e2e8f0" }} />)}</span></>}
          title={r.name}
          actions={doneToday.has(r.id) ? [] : [{ kind: "done", onClick: () => act("rit:" + r.id + ":done", { action: "ritual_done", id: r.id }, "Ritual stamped ✓") }]} // no Snooze: a miss is a miss
        />);
    })}</>;
  };

  const TAB_BLOCKS: Record<string, { label: string; icon: any; body: () => JSX.Element; count: number }> = {
    "today":      { label: "Today",      icon: CalendarCheck, body: TodayTab,   count: (cal?.events ?? []).length },
    "my-plate":   { label: "My plate",   icon: ClipboardList, body: MyPlateTab, count: (tasksData?.tasks ?? []).filter((t: any) => t.status !== "done").length },
    "waiting-on": { label: "Waiting on", icon: Hourglass,     body: WaitingTab, count: (waiting ?? []).filter((w: any) => w.status !== "done").length },
    "inbox":      { label: "Inbox",      icon: InboxIcon,     body: InboxTab,   count: (inboxItems ?? []).filter((s: any) => !s.triaged).length },
    "news":       { label: "News",       icon: Newspaper,     body: NewsTab,    count: (news ?? []).filter((n: any) => !n.archived).length },
    "rituals":    { label: "Rituals",    icon: Repeat2,       body: RitualsTab, count: (rituals?.rituals ?? []).length },
  };

  // ═══ Render ═════════════════════════════════════════════════════════════
  return (
    <div style={{ fontFamily: "'Inter','SF Pro Text',system-ui,sans-serif", background: "#ffffff", color: "#0f172a", display: "flex", flexDirection: "column", height: "100%", overflow: "hidden", position: "relative" }}>

      {/* ── Admin row ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "6px 10px 4px", flexShrink: 0, minWidth: 0, position: "relative", zIndex: 60 }}>
        <span style={{ fontSize: 14, lineHeight: 1 }}>{OS_EMOJI}</span>
        <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: 0.2, whiteSpace: "nowrap" }}>{OS_TITLE}</span>
        <span style={{ fontSize: 9, color: ageH > 24 ? "#b45309" : "#64748b", whiteSpace: "nowrap" }}>{dateLabel} · engine {relTime(engineIso)}</span>

        {/* Health dot → engines panel */}
        <button onClick={() => setOverlay(overlay === "engines" ? null : "engines")} title={"System health: " + eff + " — click for the engines panel"} style={pill(overlay === "engines", healthColor, "#f8fafc", "#e2e8f0")}>
          <Activity size={11} />engines
        </button>

        <span style={{ flex: 1 }} />

        {/* Capture */}
        <button onClick={() => setOverlay(overlay === "capture" ? null : "capture")} style={pill(overlay === "capture", "#4338ca", "#eef2ff", "#c7d2fe")}>
          <Mic size={11} />Capture
        </button>
        {/* Steer */}
        <button onClick={() => setOverlay(overlay === "steer" ? null : "steer")} style={pill(overlay === "steer", "#0e7490", "#ecfeff", "#a5f3fc")}>
          <Compass size={11} />Steer
        </button>
        {/* Daily brief link */}
        {cfg?.briefUrl && (
          <a href={cfg.briefUrl} target="_blank" rel="noreferrer" style={{ ...pill(false, "#c2410c", "#fff7ed", "#fed7aa"), textDecoration: "none" }}>
            <Sun size={11} />Brief
          </a>
        )}
      </div>

      {/* ── Overlays ── */}
      {overlay === "engines" && (
        <div style={{ position: "absolute", top: 34, left: 10, right: 10, zIndex: 80, background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 10, boxShadow: "0 10px 30px rgba(15,23,42,0.18)", padding: 10 }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: "#334155", marginBottom: 6 }}>Engines</div>
          {(cfg?.wakeupDefs ?? []).map((w: any) => {
            const h = health?.engines?.[w.key];
            const dots = engHist?.[w.key] ?? {};
            const dotDays = [...Array(10)].map((_, i) => new Date(Date.now() - (9 - i) * 86400000).toISOString().slice(0, 10));
            const c = h?.status === "ok" ? "#059669" : h?.status === "stale" ? "#e11d48" : "#94a3b8";
            return (
              <div key={w.key} style={{ display: "flex", alignItems: "center", gap: 8, padding: "3px 0", fontSize: 10, color: "#475569" }}>
                <span style={{ width: 7, height: 7, borderRadius: 999, background: c, flexShrink: 0 }} />
                <span style={{ fontWeight: 700, minWidth: 90 }}>{w.name}</span>
                <span style={{ color: "#94a3b8" }}>{w.schedule}</span>
                <span>last {relTime(h?.lastRun)}</span>
                <span style={{ display: "inline-flex", gap: 2, marginLeft: "auto" }}>
                  {dotDays.map((d) => <span key={d} title={d + ": " + (dots[d] ?? "no data")} style={{ width: 6, height: 6, borderRadius: 999, background: dots[d] === "ok" ? "#059669" : dots[d] === "miss" ? "#e11d48" : dots[d] === "pending" ? "#d97706" : "#ffffff", border: dots[d] ? "none" : "1px solid #cbd5e1" }} />)}
                </span>
                {h?.fireCount != null && <span style={{ color: h.fireCount >= 20 ? "#b45309" : "#94a3b8" }}>{h.fireCount}/32</span>}
              </div>);
          })}
          {!cfg?.wakeupDefs?.length && <Empty text="No engines configured yet (config/banner-config.json wakeupDefs)." />}
        </div>
      )}
      {overlay === "capture" && (
        <div style={{ position: "absolute", top: 34, left: 10, right: 10, zIndex: 80, background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 10, boxShadow: "0 10px 30px rgba(15,23,42,0.18)", padding: 10 }}>
          <div style={{ fontSize: 10, color: "#64748b", marginBottom: 6 }}>
            Anything on your mind. Plain = inbox · <b>{cfg?.captureMarkers?.task ?? "!"}</b> = task now · <b>{cfg?.captureMarkers?.taskWithBlock ?? "?"}</b> = task + calendar block. Saved instantly; your words are never rewritten.
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <input value={note} onChange={(e: any) => setNote(e.target.value)} onKeyDown={(e: any) => e.key === "Enter" && doCapture()} placeholder="e.g. ! Send pricing follow-up to Acme by Thursday" autoFocus
              style={{ flex: 1, fontSize: 11, padding: "7px 10px", borderRadius: 8, border: "1px solid #c7d2fe", outline: "none", fontFamily: "inherit" }} />
            <button onClick={doCapture} disabled={!!busy.capture || !note.trim()} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, fontWeight: 700, padding: "6px 12px", borderRadius: 8, border: "1px solid #4338ca", background: note.trim() ? "#4338ca" : "#eef2ff", color: note.trim() ? "#ffffff" : "#94a3b8", cursor: busy.capture ? "wait" : "pointer" }}>
              <Send size={11} />{busy.capture ? "…" : "Save"}
            </button>
          </div>
          {toast?.near === "capture" && <div style={{ marginTop: 6, fontSize: 10, fontWeight: 700, color: toast.err ? "#be123c" : "#047857" }}>{toast.text}</div>}
        </div>
      )}
      {overlay === "steer" && (
        <div style={{ position: "absolute", top: 34, left: 10, right: 10, zIndex: 80, background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 10, boxShadow: "0 10px 30px rgba(15,23,42,0.18)", padding: 10 }}>
          <div style={{ fontSize: 10, color: "#64748b", marginBottom: 6 }}>
            Steer the system: a priority, a rule, a "focus on X this week". Appended verbatim to your priorities file; every engine reads it next run.
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <input value={beacon} onChange={(e: any) => setBeacon(e.target.value)} onKeyDown={(e: any) => e.key === "Enter" && doSteer()} placeholder="e.g. Deprioritize partner work until the launch ships" autoFocus
              style={{ flex: 1, fontSize: 11, padding: "7px 10px", borderRadius: 8, border: "1px solid #a5f3fc", outline: "none", fontFamily: "inherit" }} />
            <button onClick={doSteer} disabled={!!busy.steer || !beacon.trim()} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, fontWeight: 700, padding: "6px 12px", borderRadius: 8, border: "1px solid #0e7490", background: beacon.trim() ? "#0e7490" : "#ecfeff", color: beacon.trim() ? "#ffffff" : "#94a3b8", cursor: busy.steer ? "wait" : "pointer" }}>
              <Compass size={11} />{busy.steer ? "…" : "Set"}
            </button>
          </div>
          {toast?.near === "steer" && <div style={{ marginTop: 6, fontSize: 10, fontWeight: 700, color: toast.err ? "#be123c" : "#047857" }}>{toast.text}</div>}
        </div>
      )}

      {/* ── Tab row ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "2px 10px", borderBottom: "1px solid #e2e8f0", flexShrink: 0 }}>
        {tabs.map((key) => {
          const b = TAB_BLOCKS[key]; if (!b) return null;
          const active = tab === key; const Icon = b.icon;
          return (
            <button key={key} onClick={() => { setTab(key); setOverlay(null); setExpandedRow(null); }}
              style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 10.5, fontWeight: active ? 800 : 600, color: active ? "#0f172a" : "#64748b", background: "transparent", border: "none", borderBottom: active ? "2px solid #0f172a" : "2px solid transparent", padding: "6px 9px 5px", cursor: "pointer" }}>
              <Icon size={12} />{b.label}
              {b.count > 0 && <span style={{ background: active ? "#0f172a" : "#e2e8f0", color: active ? "#ffffff" : "#475569", borderRadius: 999, fontSize: 8, fontWeight: 800, padding: "0 5px", lineHeight: "13px" }}>{b.count}</span>}
            </button>);
        })}
      </div>

      {/* ── Tab body ── */}
      <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
        {TAB_BLOCKS[tab] ? TAB_BLOCKS[tab].body() : <Empty text="Pick a tab." />}
      </div>

      {/* Global toast (rendered near-bottom for row actions) */}
      {toast && toast.near !== "capture" && toast.near !== "steer" && (
        <div style={{ position: "absolute", bottom: 10, right: 12, zIndex: 90, fontSize: 10, fontWeight: 700, padding: "6px 12px", borderRadius: 8, color: toast.err ? "#be123c" : "#047857", background: toast.err ? "#fff1f2" : "#ecfdf5", border: "1px solid " + (toast.err ? "#fecdd3" : "#a7f3d0"), boxShadow: "0 4px 12px rgba(15,23,42,0.12)" }}>{toast.text}</div>
      )}
    </div>
  );
}
