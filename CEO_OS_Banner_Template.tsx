import { useEffect, useRef, useState } from "react";
import {
  Inbox,
  CheckCircle2,
  BellRing,
  Radio,
  Clock3,
  Users,
  CalendarClock,
  X,
  Compass,
  ExternalLink,
  Slack,
  Target,
  Send,
  Loader2,
  Mic,
  ChevronDown,
  Sunrise,
  Plus,
  ListTodo,
  CalendarCheck,
  RefreshCw,
  Video,
  Clock,
  Circle,
  MoreHorizontal,
  BarChart3,
  Timer,
  Zap,
  Repeat,
  Phone,
  UserPlus,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { callFunction, useFile } from "@dust/react-hooks";

type Person = { name: string; first: string; initials: string; slackId: string; color: string; avatarUrl?: string | null };
type PeopleFile = { people: Record<string, Person> };
type Item = { id: string; text: string; meta: string; triage?: string; status?: string; severity?: string; people?: string[] };

type TaskItem = {
  sId: string;
  created?: string;
  title: string;
  status: "open" | "in_progress" | "done";
  priority?: "low" | "medium" | "high" | "urgent";
  dueDate?: string;
  assignees?: string[];
  description?: string;
  url?: string;
};

type CalendarEvent = {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  attendees?: string[];
  attendeeNames?: string[];
  isExternal: boolean;
  meetLink?: string;
  location?: string;
  type?: "1:1" | "team" | "external" | "focus" | "personal";
  prepContext?: string;
  prepStatus?: "none" | "pending" | "ready";
};

type CeoAsk = {
  id: string;
  requester: string; // display name
  requesterId?: string; // Slack user ID for avatar lookup
  ask: string; // what was asked
  askedAt: string; // ISO timestamp
  channel?: string; // Slack channel name
  channelId?: string;
  slackLink?: string;
  priority?: "urgent" | "high" | "normal" | "low";
  tags?: string[]; // e.g. "deal", "hiring", "product", "ops"
  done?: boolean;
};

// Wakeup engine relay state (mirrors state/wakeups.json)
type WakeupEngine = {
  name: string; wakeupId?: string; conversationId?: string | null;
  scheduleHuman?: string; fireCount?: number; fireQuota?: number;
  lastRun?: string | null; lastStatus?: string | null;
  successorConfirmed?: boolean; note?: string;
};

type Dash = {
  updated: string;
  build_phase: boolean;
  wakeups?: WakeupEngine[];
  talked_about: Item[];
  action_items: Item[];
  pokes: Item[];
  pulses: Item[];
  rituals_due_today?: Item[];
  rituals?: { id: string; name: string; cadence: string; day: string; output: string; draft_by?: string }[];
  time_blocks?: Item[];
  tasks?: TaskItem[];
  calendar_events?: CalendarEvent[];
  calendar_date?: string;
  metrics?: { label: string; value: string | null; delta?: string | null }[];
  news?: (Item & { source?: "dust" | "world"; url?: string })[];
  queued?: Item[];
  week_ahead?: { day: string; label: string; flags?: string }[];
  ceo_asks?: CeoAsk[];
};

const POD_ID = "{{POD_ID}}"; // set by setup.md when the new Pod is created
const PEOPLE_FILE = `pod-${POD_ID}/me/people.json`;
const FN = `${POD_ID}/exec-action`;
const EXPECTED_FN_VERSION = 1; // bump together with the deployed exec-action bundle
// DEMO_MODE: every action succeeds locally without a pod function behind it.
// setup.md flips this to false once <POD_ID>/exec-action is deployed.
const DEMO_MODE = true;

// Standard callFunction hygiene (Pod Frame Action Buttons skill): retry with backoff
// on cold starts / transient pod-computer failures. Single wrapper for all actions.
// Wake-up engine definitions for the Wakeups pill. setup.md fills the real
// wakeup IDs + engine conversation IDs after scheduling the engines (Phase 2).
const DUST_WORKSPACE_URL = "{{DUST_WORKSPACE_URL}}"; // e.g. https://app.dust.tt/w/<workspaceId>
const CEO_OS_WAKEUP_DEFS = [
  { key: "morning", name: "Morning Engine", wakeupId: "{{MORNING_WAKEUP_ID}}", conversationId: null as string | null, scheduleHuman: "{{MORNING_SCHEDULE}}", maxGapH: 6 },
  { key: "eod", name: "EOD Engine", wakeupId: "{{EOD_WAKEUP_ID}}", conversationId: null as string | null, scheduleHuman: "{{EOD_SCHEDULE}}", maxGapH: 28 },
];

async function callFn(input: { action: string; [k: string]: unknown }, tries = 3): Promise<{ result: any; error: unknown }> {
  if (DEMO_MODE) {
    await new Promise((r) => setTimeout(r, 600));
    return { result: { ok: true, response: { body: JSON.stringify({ ok: true, posted: false, version: EXPECTED_FN_VERSION }) } }, error: null };
  }
  let last: { result: any; error: unknown } = { result: null, error: new Error("no attempt") };
  for (let i = 0; i < tries; i++) {
    try {
      last = (await callFunction(FN as any, input as never)) as { result: any; error: unknown };
      if (!last.error && last.result?.ok) return last;
    } catch (e) {
      last = { result: null, error: e };
    }
    await new Promise((r) => setTimeout(r, 700 * (i + 1)));
  }
  return last;
}
// Dust square logo: used wherever an action means "the system/agent does it"
// (replaces the old robot icon, per Nic). Signature-compatible with lucide icons.
const DUST_LOGO_URL = "https://dust.tt/static/landing/logos/dust/Dust_LogoSquare.png";
function DustLogo({ size = 11 }: { size?: number }) {
  const px = Math.max(11, size);
  return (
    <img
      src={DUST_LOGO_URL}
      alt="Dust"
      width={px}
      height={px}
      style={{ borderRadius: 2, verticalAlign: "middle", display: "inline-block", flexShrink: 0 }}
    />
  );
}

const SLACK_BASE = "https://{{SLACK_WORKSPACE}}.slack.com/archives/";

// v13: linkify #channels and bare URLs inside item text/meta (Nic: "not enough links")
const CHANNEL_IDS: Record<string, string> = {
  "{{OS_CHANNEL}}": "{{OS_CHANNEL_ID}}",
  // Add other channels the engines reference so #channel mentions become links:
  // team_goals: "C...", updates: "C...",
};
function MetaText({ text }: { text?: string }) {
  if (!text) return null;
  const parts = text.split(/(#[\w-]+|https?:\/\/\S+)/g);
  return (
    <>
      {parts.map((p, i) => {
        if (/^https?:\/\//.test(p)) {
          return (
            <a key={i} href={p} target="_blank" rel="noreferrer" style={{ color: "#4f46e5", textDecoration: "underline" }}>
              {p.replace(/^https?:\/\/(www\.)?/, "").slice(0, 32)}
            </a>
          );
        }
        const ch = p.startsWith("#") ? p.slice(1).toLowerCase() : null;
        if (ch && CHANNEL_IDS[ch]) {
          return (
            <a key={i} href={`${SLACK_BASE}${CHANNEL_IDS[ch]}`} target="_blank" rel="noreferrer" style={{ color: "#4f46e5", textDecoration: "underline", fontWeight: 600 }}>
              {p}
            </a>
          );
        }
        return <span key={i}>{p}</span>;
      })}
    </>
  );
}

const LINKS = [
  { name: "{{OS_CHANNEL}}", id: "{{OS_CHANNEL_ID}}" },
];
const CP_DOC = "{{CP_DOC_URL}}"; // company priorities doc (Google Doc, Notion, ...)

const NOTION_CP_HUB = "{{CP_HUB_URL}}"; // priorities hub every CP row links to
const CP_POD_URL = "{{CP_POD_URL}}"; // optional: a company-priorities Pod

// Company priorities: setup.md fills these from the interview. Add up to 8 rows.
// `status` is engine-owned (null until the first monthly review posts a color).
const slackUrl = (id: string) => `${SLACK_BASE}${id}`;
const PRIORITIES = [
  { n: 1, pillar: "{{CP1_PILLAR}}", text: "{{CP1_TEXT}}", sherpa: "{{CP1_OWNER}}", sherpaId: "cp1", color: "#0d9488", status: null as string | null, channel: "#{{CP1_CHANNEL}}" as string | null, channelId: "{{CP1_CHANNEL_ID}}" as string | null, notionUrl: NOTION_CP_HUB },
  { n: 2, pillar: "{{CP2_PILLAR}}", text: "{{CP2_TEXT}}", sherpa: "{{CP2_OWNER}}", sherpaId: "cp2", color: "#7c3aed", status: null as string | null, channel: "#{{CP2_CHANNEL}}" as string | null, channelId: "{{CP2_CHANNEL_ID}}" as string | null, notionUrl: NOTION_CP_HUB },
  { n: 3, pillar: "{{CP3_PILLAR}}", text: "{{CP3_TEXT}}", sherpa: "{{CP3_OWNER}}", sherpaId: "cp3", color: "#c2410c", status: null as string | null, channel: "#{{CP3_CHANNEL}}" as string | null, channelId: "{{CP3_CHANNEL_ID}}" as string | null, notionUrl: NOTION_CP_HUB },
  { n: 4, pillar: "{{CP4_PILLAR}}", text: "{{CP4_TEXT}}", sherpa: "{{CP4_OWNER}}", sherpaId: "cp4", color: "#64748b", status: null as string | null, channel: null as string | null, channelId: null as string | null, notionUrl: NOTION_CP_HUB },
];

const ME_SLACK = "{{OPERATOR_SLACK_ID}}"; // the operator running setup (may be the CEO themself)
const CEO_SLACK = "{{CEO_SLACK_ID}}"; // the CEO - this OS's owner
const SHERPA_SLACK: Record<string, string> = {
  cp1: "{{CP1_OWNER_SLACK_ID}}", cp2: "{{CP2_OWNER_SLACK_ID}}", cp3: "{{CP3_OWNER_SLACK_ID}}", cp4: "{{CP4_OWNER_SLACK_ID}}",
};

const STATUS_COLOR: Record<string, string> = { green: "#059669", yellow: "#d97706", red: "#e11d48" };

// SEED: what the banner shows before the engines write dashboard_data.json.
// Every item below is an example. The morning engine replaces all of it.
const SEED: Dash = {
  updated: new Date().toISOString(),
  build_phase: true,
  talked_about: [
    { id: "t1", text: "Example: topic raised on {{CEO_FIRST}}'s last leadership call", meta: "{{CEO_FIRST}} / {{OPERATOR_FIRST}} call", triage: "do" },
    { id: "t2", text: "Example: framing {{COMPANY}} wants to reuse in exec conversations", meta: "Leadership sync", triage: "defer" },
    { id: "t3", text: "Example: research thread to hand to someone else", meta: "Leadership sync", triage: "delegate" },
  ],
  action_items: [
    { id: "a1", text: "Example: commitment {{CEO_FIRST}} made on a call", meta: "Committed on call - proposed 15-min block", triage: "do" },
    { id: "a2", text: "Example: email owed to a customer or investor", meta: "Waiting on thumbs-up to book time", triage: "do" },
  ],
  pokes: [
    { id: "p1", text: "Example: delegation {{CEO_FIRST}} is waiting on", meta: "Asked this week - poke Friday" },
  ],
  pulses: [
    { id: "pulse-setup", text: "Pod not wired yet - this banner is running on seed data", meta: "System - run setup.md to create the Pod, engines, and exec-action function", severity: "orange", triage: "do" },
  ],
  rituals_due_today: [],
  rituals: [
    { id: "r1", name: "{{RITUAL_1_NAME}}", cadence: "Weekly", day: "{{RITUAL_1_DAY}}", output: "{{RITUAL_1_OUTPUT}}", draft_by: "Morning engine" },
    { id: "r2", name: "{{RITUAL_2_NAME}}", cadence: "Weekly", day: "{{RITUAL_2_DAY}}", output: "{{RITUAL_2_OUTPUT}}", draft_by: "EOD engine" },
  ],
  time_blocks: [],
  tasks: [],
  calendar_events: [],
  calendar_date: "",
  metrics: [
    { label: "{{METRIC_1}}", value: null },
    { label: "{{METRIC_2}}", value: null },
    { label: "{{METRIC_3}}", value: null },
    { label: "{{METRIC_4}}", value: null },
  ],
  news: [],
  week_ahead: [],
  ceo_asks: [
    { id: "ask-1", requester: "{{OPERATOR_NAME}}", requesterId: "{{OPERATOR_SLACK_ID}}", ask: "Example: a review {{CEO_FIRST}} was asked for", askedAt: new Date().toISOString(), channel: "{{OS_CHANNEL}}", channelId: "{{OS_CHANNEL_ID}}", priority: "high", tags: ["example"] },
  ],
};

// SEED_PEOPLE: replaces me/people.json until the Pod writes it.
// The CEO avatar ships with the template (photo kept per Nic's request).
const SEED_PEOPLE: Record<string, Person> = {
  "{{CEO_SLACK_ID}}": { name: "{{CEO_NAME}}", first: "{{CEO_FIRST}}", initials: "{{CEO_INITIALS}}", slackId: "{{CEO_SLACK_ID}}", color: "#7c3aed", avatarUrl: "https://avatars.githubusercontent.com/u/998689" },
  "{{OPERATOR_SLACK_ID}}": { name: "{{OPERATOR_NAME}}", first: "{{OPERATOR_FIRST}}", initials: "{{OPERATOR_INITIALS}}", slackId: "{{OPERATOR_SLACK_ID}}", color: "#4338ca", avatarUrl: null },
};

const TRIAGE_COLOR: Record<string, { bg: string; fg: string }> = {
  do: { bg: "#e0e7ff", fg: "#4338ca" },
  delegate: { bg: "#fef3c7", fg: "#b45309" },
  defer: { bg: "#f1f5f9", fg: "#64748b" },
  system: { bg: "#d1fae5", fg: "#047857" },
};

// Eisenhower-coded exec actions
const ACTIONS: {
  key: string;
  label: string;
  full: string;
  icon: React.ComponentType<{ size?: number }>;
  fg: string;
  bg: string;
  bd: string;
  phone: boolean;
}[] = [
  { key: "done", label: "Done", full: "Do: mark done", icon: CheckCircle2, fg: "#047857", bg: "#ecfdf5", bd: "#a7f3d0", phone: true },
  { key: "block15", label: "15m", full: "Do: book 15 min", icon: Clock3, fg: "#4338ca", bg: "#eef2ff", bd: "#c7d2fe", phone: true },
  { key: "agent", label: "Agent", full: "Do: system does it", icon: DustLogo, fg: "#7c3aed", bg: "#f5f3ff", bd: "#ddd6fe", phone: true },
  { key: "delegate_ea", label: "EA", full: "Delegate: message {{EA_NAME}}", icon: Users, fg: "#b45309", bg: "#fffbeb", bd: "#fde68a", phone: true },
  { key: "tomorrow", label: "Tmrw", full: "Defer: tomorrow's brief", icon: Sunrise, fg: "#0369a1", bg: "#f0f9ff", bd: "#bae6fd", phone: true },
  { key: "friday", label: "Fri", full: "Defer: Friday run", icon: CalendarClock, fg: "#475569", bg: "#f8fafc", bd: "#e2e8f0", phone: true },
  { key: "kill", label: "Kill", full: "Delete: drop it", icon: X, fg: "#be123c", bg: "#fff1f2", bd: "#fecdd3", phone: false },
];

// Future-state contract: the banner ships the full 2-3 month UI now. Actions whose
// downstream agentic behavior is not yet wired end-to-end carry a small amber caution
// badge. As engines come online, flip the flag to true - the badge disappears, the UI
// does not change. Keep this map honest.
const WIRED: Record<string, boolean> = {
  done: true, kill: true, tomorrow: true, friday: true, add: true, complete_task: true, start_task_agent: true,
  capture: true,
  // 2026-07-18: refresh_* and block15 flipped to caution — the pod runtime resolves
  // to broken/duplicate google_calendar + slack_bot connections (admin cleanup needed).
  // The scheduled engine keeps calendar/tasks fresh in the meantime.
  refresh_calendar: false, refresh_tasks: false,
  block15: false,       // calendar connection broken at runtime; will book for real once admin cleans up connections
  agent: false,         // queues in the inbox; no engine executes it yet
  delegate_ea: false,   // posts to #{{OS_CHANNEL}}; no direct EA DM yet
  meeting_prep: false,  // queues prep; brief pipeline not fully live
  steer: false,         // logged for review; no cascade to team OS pods yet
};

const HOVER_DESC: Record<string, string> = {
  done: "Marks it done, strikes the row, posts a Done note to #{{OS_CHANNEL}}",
  block15: "Books a free 15-min slot on today\u2019s calendar - escalates to the EA if no slot is free",
  agent: "Hands it to the agent system - engines execute it and report back to #{{OS_CHANNEL}}",
  delegate_ea: "Sends the preloaded handoff message to {{EA_NAME}} (EA) via #{{OS_CHANNEL}}",
  tomorrow: "Resurfaces this in tomorrow's morning brief",
  friday: "Queues it for the Friday accountability run",
  kill: "Drops it for good - engines will not resurface it",
};

const FEEDBACK: Record<string, string> = {
  done: "Done",
  block15: "15-min calendar booking attempted",
  agent: "Handed to the agent system",
  delegate_ea: "Delegated to {{EA_NAME}} (EA)",
  friday: "Deferred to the Friday run",
  tomorrow: "Deferred to tomorrow's brief",
  kill: "Killed",
  complete_task: "Done - Pod task updated",
  start_task_agent: "Agent conversation opened - link appears on the row after sync",
  note: "Note saved to the pod inbox",
  draft: "Draft handed to the agent system",
};

type TabKey = "inbox" | "plate" | "waiting" | "pulse" | "news" | "steer" | "asks" | "rituals";

function parseFnBody(result: any): any {
  try {
    const body = result?.response?.body;
    if (typeof body === "string") return JSON.parse(body);
    return body ?? null;
  } catch {
    return null;
  }
}

export default function PodBanner() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(896);
  const [tab, setTab] = useState<TabKey>("plate");
  const [dash, setDash] = useState<Dash>(SEED);
  const [acted, setActed] = useState<Record<string, { label: string; tone: string }>>({});
  const [pending, setPending] = useState<Record<string, string>>({});
  const [cpOpen, setCpOpen] = useState(false);
  const [calOpen, setCalOpen] = useState(false);
  const [capOpen, setCapOpen] = useState(false);
  const [pulseOpen, setPulseOpen] = useState(false); // now the News overlay
  const [newsFilter, setNewsFilter] = useState<"pulses" | "dust" | "world">("pulses");
  const [pulseSubFilter, setPulseSubFilter] = useState<"all" | "internal" | "external">("all");
  const [numsOpen, setNumsOpen] = useState(false);
  const [queueOpen, setQueueOpen] = useState(false);
  const [todayMode, setTodayMode] = useState<"today" | "week">("today");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [hoverBtn, setHoverBtn] = useState<string | null>(null);
  const [captureText, setCaptureText] = useState("");
  const [captureState, setCaptureState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [toasts, setToasts] = useState<{ id: number; tone: string; label: string; detail: string; action?: { label: string; onClick: () => void }; ttl?: number }[]>([]);
  // v14 (item 2): stale exec-action bundle detection (envelope version vs expected)
  const [fnStale, setFnStale] = useState<number | null>(null);
  // v14 (item 3): pending 10s delayed-commit timers for Kill
  const killTimers = useRef<Record<string, number>>({});
  const toastCounter = useRef(0);

  // Add-card state
  const [addOpen, setAddOpen] = useState(false);
  const [addText, setAddText] = useState("");
  const [plateExpanded, setPlateExpanded] = useState(false); // v13: show-all toggle
  // v13: relative "last updated" label, ticks every minute (Nic: no raw ISO timestamps)
  const [nowTick, setNowTick] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNowTick(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);
  const [addState, setAddState] = useState<"idle" | "sending" | "error">("idle");

  // Steer state
  const [steerScope, setSteerScope] = useState("Company-wide");
  const [steerCP, setSteerCP] = useState<number | null>(null);
  const [steerText, setSteerText] = useState("");
  const [steerState, setSteerState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  // Tasks state
  const [taskRefreshing, setTaskRefreshing] = useState(false);
  const [taskActed, setTaskActed] = useState<Record<string, { label: string; tone: string }>>({});

  // Calendar state
  const [calRefreshing, setCalRefreshing] = useState(false);
  const [prepPending, setPrepPending] = useState<Record<string, boolean>>({});
  const [expandedEvtId, setExpandedEvtId] = useState<string | null>(null);

  // POD_WIRED: setup.md flips this to true once the new Pod exists and
  // dashboard_data.json + me/people.json have been created. Until then the
  // banner runs entirely on SEED data (constant condition keeps hook order stable).
  const POD_WIRED = false;
  const dashFile = POD_WIRED ? useFile(`pod-${POD_ID}/dashboard_data.json`) : null;
  const peopleFile = POD_WIRED ? useFile(PEOPLE_FILE) : null;
  const [people, setPeople] = useState<Record<string, Person>>(SEED_PEOPLE);
  // Wakeups pill state
  const [wakeupsOpen, setWakeupsOpen] = useState(false);
  const [wakeupsData, setWakeupsData] = useState<WakeupEngine[]>([]);
  const [wakeupsLoading, setWakeupsLoading] = useState(false);


  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) setWidth(e.contentRect.width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    setAddOpen(false);
    setAddText("");
    setAddState("idle");
  }, [tab]);

  useEffect(() => {
    if (!dashFile) return;
    let cancelled = false;
    async function load() {
      try {
        const text = await dashFile.text();
        const data = JSON.parse(text) as Dash;
        if (!cancelled && data && Array.isArray(data.action_items)) setDash((prev) => ({ ...prev, ...data }));
      } catch {
        // keep seed
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [dashFile]);

  useEffect(() => {
    if (!peopleFile) return;
    let cancelled = false;
    async function loadPeople() {
      try {
        const text = await peopleFile.text();
        const data = JSON.parse(text) as PeopleFile;
        if (!cancelled && data?.people) setPeople(data.people);
      } catch {
        // fallback: no faces
      }
    }
    void loadPeople();
    return () => { cancelled = true; };
  }, [peopleFile]);

  const phone = width < 560;
  // v14 (item 5): touch devices get tap-to-toggle overlays (hover-open is skipped so a
  // single tap doesn't open-then-close), and >=32px touch targets on action verbs.
  const noHover = phone || (typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(hover: none)").matches);
  const showLinks = width >= 400;
  const maxLinks = width >= 840 ? 3 : width >= 700 ? 2 : 1;

  const visible = (items: Item[]) => items.filter((i) => i.status !== "done" && i.status !== "kill");

  // Calendar helpers
  const CAL_TZ_DISPLAY = "America/New_York";
  const fmtTimeET = (iso: string) =>
    new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZone: CAL_TZ_DISPLAY }).format(new Date(iso));
  const fmtDuration = (s: string, e: string) => {
    const mins = Math.round((new Date(e).getTime() - new Date(s).getTime()) / 60000);
    if (mins < 60) return `${mins}m`;
    const h = Math.floor(mins / 60); const m = mins % 60;
    return m > 0 ? `${h}h${m}m` : `${h}h`;
  };
  const isNowEvt = (s: string, e: string) => { const n = Date.now(); return new Date(s).getTime() <= n && n <= new Date(e).getTime(); };
  const isPastEvt = (e: string) => new Date(e).getTime() < Date.now();

  // Task counts (open/in_progress only)
  const activeTasks = (dash.tasks ?? []).filter((t) => t.status !== "done" && !taskActed[t.sId]);
  // Calendar: upcoming + now (not past)
  const calEvents = (dash.calendar_events ?? []).filter((e) => !isPastEvt(e.endTime));

  // CEO loop, 5 lanes (Jul 18 consolidation): Inbox (talked about + captures) /
  // My plate (my commitments: actions + pod tasks) / Waiting on (delegations, ex-Pokes) /
  // Pulse (Company OS exceptions + rituals due) / Steer. Calendar lives in the Today strip.
  const pulseItems: Item[] = [
    // v12: rituals due today moved to their own Rituals tab (Nic, Jul 18) - no longer mixed into News.
    ...visible(dash.pulses).filter((p) => dash.build_phase || p.severity !== "green"),
  ];
  const plateItems = visible(dash.action_items);
  const ritualsDue = visible(dash.rituals_due_today ?? []);

  // My plate v12 (Jul 18, Nic feedback): ONE unified list. Everything on the plate is
  // something Nic owns, whatever the origin. A source chip says where it came from
  // (call / Pod task / added by you); "Slipped Nx" flags items pushed by the EOD engine.
  type PlateRow = {
    key: string; title: string; sub?: string; pushed: number;
    src: { label: string; icon: React.ComponentType<{ size?: number }> };
    item?: Item; task?: TaskItem; people?: string[];
  };
  const plateRows: PlateRow[] = [
    ...plateItems.map((it) => {
      const pm = it.meta?.match(/push(?:ed)?[^0-9]{0,15}(\d+)/i);
      const pushed = pm ? parseInt(pm[1], 10) : /push/i.test(it.meta ?? "") ? 1 : 0;
      const src = /added from banner/i.test(it.meta ?? "")
        ? { label: "Added by you", icon: UserPlus }
        : /call/i.test(it.meta ?? "")
          ? { label: "From a call", icon: Phone }
          : { label: "You own this", icon: CheckCircle2 };
      return { key: it.id, title: it.text, sub: it.meta, pushed, src, item: it, people: it.people };
    }),
    ...activeTasks.map((t) => ({
      key: t.sId,
      title: t.title,
      sub: t.assignees?.length ? `Pod task · assigned to ${t.assignees.join(", ")}` : "Pod task",
      pushed: 0,
      src: { label: "Pod task", icon: ListTodo },
      task: t,
    })),
  ].sort((a, b) => b.pushed - a.pushed);

  // News = pod pulses (live) + internal Dust news + external world signals (engine-fed)
  type NewsItem = Item & { source: "pulses" | "dust" | "world"; pulseSource?: "internal" | "external"; url?: string };
  const newsItems: NewsItem[] = [
    ...pulseItems.map((it) => ({ ...it, source: "pulses" as const, pulseSource: ((it as any).pulseSource ?? "internal") as "internal" | "external" })),
    ...(dash.news ?? []).map((n) => {
      const raw = (n.source ?? "dust") as string;
      return { ...n, source: (raw === "pods" ? "pulses" : raw === "world" ? "world" : "dust") as "pulses" | "dust" | "world", pulseSource: raw === "external" ? "external" as const : "internal" as const };
    }),
  ];
  const pulseItems_news = newsItems.filter((n) => n.source === "pulses");
  const newsShown = newsItems.filter((n) => {
    if (newsFilter === "pulses") {
      if (n.source !== "pulses") return false;
      if (pulseSubFilter === "all") return true;
      return n.pulseSource === pulseSubFilter;
    }
    return n.source === newsFilter;
  });
  const metrics = dash.metrics ?? [];
  const metricsWired = metrics.some((m) => m.value !== null && m.value !== undefined);
  const queuedItems = visible(dash.queued ?? []);
  const weekAhead = dash.week_ahead ?? [];
  // Engine health: real signal - freshness of the morning sweep
  const engineAgeH = (Date.now() - new Date(dash.updated).getTime()) / 3.6e6;
  const engineColor = engineAgeH < 26 ? "#059669" : engineAgeH < 50 ? "#d97706" : "#e11d48";
  const closeAllOverlays = () => { setCpOpen(false); setCalOpen(false); setCapOpen(false); setPulseOpen(false); setNumsOpen(false); setQueueOpen(false); setWakeupsOpen(false); };
  // Wakeup engine rows derived from live data or cold-start fallback
  const wakeupRows = CEO_OS_WAKEUP_DEFS.map((def) => {
    const src: WakeupEngine[] = wakeupsData.length > 0 ? wakeupsData : (dash?.wakeups ?? []);
    const e = src.find((d) => d.wakeupId === def.wakeupId || d.name === def.name) ?? {} as WakeupEngine;
    const fc = e.fireCount ?? 0;
    const quota = e.fireQuota ?? 32;
    const lr: string | null = e.lastRun ?? null;
    const st: string = e.lastStatus ?? "unknown";
    const url = def.conversationId ? `${DUST_WORKSPACE_URL}/conversation/${def.conversationId}` : null;
    const ageH = lr ? (Date.now() - new Date(lr).getTime()) / 3600000 : null;
    const health: "green" | "amber" | "red" =
      (st === "failed" || st === "error") ? "red" :
      (fc >= 26 || (ageH !== null && ageH > def.maxGapH)) ? "amber" : "green";
    return { ...def, fireCount: fc, fireQuota: quota, lastRun: lr, status: st, url, health };
  });
  const wakeupHealthy = wakeupRows.filter((r) => r.health === "green").length;
  const wakeupTotal = CEO_OS_WAKEUP_DEFS.length;
  const loadWakeups = async () => {
    if (wakeupsLoading) return;
    setWakeupsLoading(true);
    try {
      const { result } = await callFn({ action: "wakeups" }, 1);
      const body = parseFnBody(result);
      if (body?.ok && Array.isArray(body.wakeups)) setWakeupsData(body.wakeups);
    } catch { /* non-fatal */ }
    finally { setWakeupsLoading(false); }
  };
  // News engagement: inline context input per item (Dust-agent button + note-to-self)
  const [newsInputOpen, setNewsInputOpen] = useState<string | null>(null);
  const [newsInputText, setNewsInputText] = useState("");
  const newsAct = async (item: Item, kind: "note" | "draft" | "book" | "agent" | "kill", context?: string) => {
    if (pending[item.id]) return;
    setPending((m) => ({ ...m, [item.id]: kind }));
    const payload =
      kind === "note"
        ? { action: "capture", note: `[News note] ${context && context.trim() ? context.trim() + " - re: " : ""}${item.text}`, source: "news-tab" }
        : kind === "draft"
          ? { action: "agent", itemId: item.id, itemText: `Draft a response (Slack comment / doc note) for: ${item.text}`, source: "news-tab" }
          : kind === "book"
            ? { action: "block15", itemId: item.id, itemText: item.text, source: "news-tab" }
            : kind === "agent"
              ? { action: "agent", itemId: item.id, itemText: `${item.text}${context && context.trim() ? ` - context from {{CEO_FIRST}}: ${context.trim()}` : ""}`, source: "news-tab" }
              : { action: "kill", itemId: item.id, itemText: item.text, source: "news-tab" };
    try {
      const { result, error } = await callFn(payload);
      const body = parseBody(result);
      if (error || !body?.ok) {
        pushToast("error", "Action failed", "Could not reach the pod function - retry");
      } else {
        const fb = kind === "note" ? "Note saved to inbox" : kind === "draft" ? "Draft queued for the agent" : kind === "book" ? "15-min booking attempted" : kind === "agent" ? "Handed to the agent with your context" : "Dismissed";
        setActed((m) => ({ ...m, [item.id]: { label: fb, tone: kind === "kill" ? "kill" : "done" } }));
        pushToast(body.posted ? "ok" : "queued", fb, item.text.slice(0, 70));
        setNewsInputOpen(null); setNewsInputText("");
      }
    } catch {
      pushToast("error", "Action failed", "Could not reach the pod function - retry");
    } finally {
      setPending((m) => { const n = { ...m }; delete n[item.id]; return n; });
    }
  };

  // Asks engagement: reach out directly / reroute / triage / escalate → pod function
  const askAct = async (ask: CeoAsk, kind: "reply" | "reroute" | "triage" | "escalate"): Promise<boolean> => {
    const payload =
      kind === "triage"
        ? { action: "capture", note: `[Ask triage] From ${ask.requester}: ${ask.ask}`, source: "asks-tab" }
        : kind === "reply"
          ? { action: "agent", itemId: ask.id, itemText: `Draft a direct Slack reply from {{CEO_FIRST}} to ${ask.requester} answering their ask: "${ask.ask}"`, source: "asks-tab" }
          : kind === "reroute"
            ? { action: "agent", itemId: ask.id, itemText: `Find the right owner (not {{CEO_FIRST}}) for ${ask.requester}'s ask and draft the redirect message: "${ask.ask}"`, source: "asks-tab" }
            : { action: "agent", itemId: ask.id, itemText: `Escalate ${ask.requester}'s ${ask.priority ?? "normal"}-priority ask - flag it in #{{OS_CHANNEL}} with context and a proposed next step: "${ask.ask}"`, source: "asks-tab" };
    try {
      const { result, error } = await callFn(payload);
      const body = parseBody(result);
      if (error || !body?.ok) { pushToast("error", "Action failed", "Could not reach the pod function - retry"); return false; }
      const fb = kind === "reply" ? "Reply draft queued" : kind === "reroute" ? "Reroute queued for the agent" : kind === "triage" ? "Triaged to inbox" : "Escalation queued";
      pushToast(body.posted ? "ok" : "queued", fb, ask.ask.slice(0, 70));
      return true;
    } catch {
      pushToast("error", "Action failed", "Could not reach the pod function - retry");
      return false;
    }
  };

  const TABS: { key: TabKey; label: string; icon: React.ComponentType<{ size?: number }>; items: Item[] | null; count?: number }[] = [
    { key: "inbox", label: "Inbox", icon: Inbox, items: visible(dash.talked_about) },
    { key: "plate", label: phone ? "Plate" : "My plate", icon: CheckCircle2, items: null, count: plateRows.length },
    { key: "waiting", label: phone ? "Wait" : "Waiting on", icon: BellRing, items: visible(dash.pokes) },
    { key: "rituals", label: "Rituals", icon: Repeat, items: null, count: ritualsDue.length },
    { key: "asks", label: phone ? "Asks" : "Asks", icon: Zap, items: null, count: (dash.ceo_asks ?? []).filter((a) => !a.done).length },
    { key: "news", label: "News", icon: Radio, items: newsItems },
    { key: "steer", label: "Steer", icon: Compass, items: null },
  ];

  const active = TABS.find((t) => t.key === tab) ?? TABS[1];
  const maxRows = 4;
  const rows = (active.items ?? []).slice(0, maxRows);
  const extra = (active.items?.length ?? 0) - rows.length;

  const pushToast = (tone: string, label: string, detail: string, opts?: { ttlMs?: number; action?: { label: string; onClick: () => void } }) => {
    const id = ++toastCounter.current;
    const ttl = opts?.ttlMs ?? 5000;
    setToasts((t) => [...t.slice(-3), { id, tone, label, detail, action: opts?.action, ttl }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), ttl);
    return id;
  };
  const dismissToast = (id: number) => setToasts((t) => t.filter((x) => x.id !== id));

  // v14 (item 2): note the exec-action envelope version on every response
  const noteFnVersion = (body: any) => {
    if (body && typeof body.version === "number") setFnStale(body.version === EXPECTED_FN_VERSION ? null : body.version);
  };
  const parseBody = (result: any) => {
    const b = parseFnBody(result);
    noteFnVersion(b);
    return b;
  };

  // v14 (item 3): undo a 15-min booking within the toast window
  const undoBlock15 = async (item: Item, eventId?: string) => {
    const { result, error } = await callFn({ action: "undo_block15", itemId: item.id, itemText: item.text, ...(eventId ? { eventId } : {}), source: tab });
    const body = parseBody(result);
    if (!error && body?.ok) {
      setActed((m) => { const n = { ...m }; delete n[item.id]; return n; });
      pushToast("ok", "Booking undone", `"${item.text.slice(0, 60)}${item.text.length > 60 ? "…" : ""}"`);
    } else {
      pushToast("error", "Undo failed", "Could not undo the booking — check #{{OS_CHANNEL}}");
    }
  };

  const commitAction = async (item: Item, actionKey: string) => {
    setPending((m) => ({ ...m, [item.id]: actionKey }));
    try {
      const { result, error } = await callFn({
        action: actionKey,
        itemId: item.id,
        itemText: item.text,
        source: tab,
      });
      const body = parseBody(result);
      if (error || !body?.ok) {
        setActed((m) => ({ ...m, [item.id]: { label: "Failed - retry", tone: "error" } }));
        pushToast("error", "Action failed", `${FEEDBACK[actionKey] ?? actionKey} — tap to retry`);
      } else {
        const via = body.posted ? "✓ posted to #{{OS_CHANNEL}}" : "⏳ queued (Slack path down — queued, engine will deliver)";
        // v14 (item 7): simulated routing (build phase) is visually tagged [SIM]
        const sim = !!dash.build_phase && (actionKey === "delegate_ea" || actionKey === "steer");
        const label = `${sim ? "[SIM] " : ""}${FEEDBACK[actionKey]} — ${via}`;
        setActed((m) => ({ ...m, [item.id]: { label, tone: actionKey } }));
        if (actionKey === "block15") {
          // v14 (item 3): 10s undo window on bookings (deletes the event / cancels the queued booking)
          const when = body.when ? ` at ${body.when}` : "";
          pushToast(body.posted ? "ok" : "queued", `15 min booked${when}`, `"${item.text.slice(0, 60)}${item.text.length > 60 ? "…" : ""}" — Undo within 10s`, {
            ttlMs: 10_000,
            action: { label: "Undo", onClick: () => { void undoBlock15(item, typeof body.eventId === "string" ? body.eventId : undefined); } },
          });
        } else {
          pushToast(body.posted ? "ok" : "queued", `${sim ? "[SIM] " : ""}${FEEDBACK[actionKey] ?? actionKey}`, `"${item.text.slice(0, 60)}${item.text.length > 60 ? "…" : ""}" — ${via}`);
        }
      }
    } catch {
      setActed((m) => ({ ...m, [item.id]: { label: "Failed - retry", tone: "error" } }));
      pushToast("error", "Action failed", "Could not reach the pod function — retry");
    } finally {
      setPending((m) => {
        const n = { ...m };
        delete n[item.id];
        return n;
      });
    }
  };

  const runAction = async (item: Item, actionKey: string) => {
    if (pending[item.id]) return;
    if (actionKey === "kill") {
      // v14 (item 3): delayed commit — the card is struck immediately but nothing is
      // posted or persisted until the 10s Undo window lapses. Undo restores the card.
      if (killTimers.current[item.id]) return;
      setActed((m) => ({ ...m, [item.id]: { label: "Killed — Undo in toast (10s)", tone: "kill" } }));
      const toastId = pushToast("queued", "Killed", `"${item.text.slice(0, 60)}${item.text.length > 60 ? "…" : ""}" — Undo within 10s`, {
        ttlMs: 10_000,
        action: {
          label: "Undo",
          onClick: () => {
            const tid = killTimers.current[item.id];
            if (tid) window.clearTimeout(tid);
            delete killTimers.current[item.id];
            setActed((m) => { const n = { ...m }; delete n[item.id]; return n; });
            pushToast("ok", "Kill undone", `"${item.text.slice(0, 60)}${item.text.length > 60 ? "…" : ""}" is back`);
          },
        },
      });
      killTimers.current[item.id] = window.setTimeout(() => {
        delete killTimers.current[item.id];
        dismissToast(toastId);
        void commitAction(item, "kill");
      }, 10_000);
      return;
    }
    await commitAction(item, actionKey);
  };

  const LIST_KEY: Record<string, "talked_about" | "action_items" | "pokes" | "pulses"> = {
    inbox: "talked_about",
    plate: "action_items",
    waiting: "pokes",
    pulse: "pulses",
  };

  const ADD_LABEL: Record<string, string> = {
    inbox: "an inbox item",
    plate: "an item",
    waiting: "a waiting-on item",
    pulse: "a pulse",
  };

  const submitAdd = async () => {
    const listKey = LIST_KEY[tab];
    if (!addText.trim() || addState === "sending" || !listKey) return;
    setAddState("sending");
    const text = addText.trim();
    try {
      const { result, error } = await callFn({
        action: "add",
        itemText: text,
        list: listKey,
        source: tab,
      });
      const body = parseBody(result);
      if (error || !body?.ok) {
        setAddState("error");
        pushToast("error", "Add failed", "Could not save the new card - try again");
      } else {
        const newItem: Item = {
          id: `local-add-${Date.now()}`,
          text,
          meta: "Added from banner - just now",
          triage: "do",
        };
        setDash((d) => ({ ...d, [listKey]: [...d[listKey], newItem] }));
        setAddText("");
        setAddOpen(false);
        setAddState("idle");
        pushToast(body.posted ? "ok" : "queued", "Card added", `"${text.slice(0, 60)}${text.length > 60 ? "…" : ""}" - saved to ${listKey.replace("_", " ")}`);
      }
    } catch {
      setAddState("error");
      pushToast("error", "Add failed", "Could not reach the pod function - retry");
    }
  };

  // ---- refresh calendar ----
  const refreshCalendar = async () => {
    if (calRefreshing) return;
    setCalRefreshing(true);
    try {
      const { result, error } = await callFn({ action: "refresh_calendar", source: "calendar-tab" });
      const body = parseBody(result);
      if (!error && body?.ok) {
        pushToast("ok", "Calendar refreshed", `${body.count ?? 0} events loaded`);
      } else {
        pushToast("error", "Calendar refresh failed", body?.detail ?? "Could not reach the pod function");
      }
    } catch {
      pushToast("error", "Calendar refresh failed", "Could not reach the pod function");
    } finally {
      setCalRefreshing(false);
    }
  };

  // ---- refresh tasks ----
  const refreshTasks = async () => {
    if (taskRefreshing) return;
    setTaskRefreshing(true);
    try {
      const { result, error } = await callFn({ action: "refresh_tasks", source: "tasks-tab" });
      const body = parseBody(result);
      if (!error && body?.ok) {
        pushToast("ok", "Tasks refreshed", `${body.count ?? 0} tasks loaded`);
      } else {
        pushToast("error", "Tasks refresh failed", body?.detail ?? "Could not reach the pod function");
      }
    } catch {
      pushToast("error", "Tasks refresh failed", "Could not reach the pod function");
    } finally {
      setTaskRefreshing(false);
    }
  };

  // ---- task action ----
  const runTaskAction = async (task: TaskItem, actionKey: string) => {
    const key = task.sId;
    if (pending[key]) return;
    setPending((m) => ({ ...m, [key]: actionKey }));
    try {
      const { result, error } = await callFn({
        action: actionKey,
        itemId: task.sId,
        itemText: task.title,
        source: "tasks-tab",
      });
      const body = parseBody(result);
      if (error || !body?.ok) {
        setTaskActed((m) => ({ ...m, [key]: { label: "Failed - retry", tone: "error" } }));
        pushToast("error", "Task action failed", `${actionKey} — tap to retry`);
      } else {
        const via = body.posted ? "✓ posted to #{{OS_CHANNEL}}" : "⏳ queued";
        setTaskActed((m) => ({ ...m, [key]: { label: `${FEEDBACK[actionKey] ?? actionKey} — ${via}`, tone: actionKey } }));
        pushToast(body.posted ? "ok" : "queued", FEEDBACK[actionKey] ?? actionKey, `"${task.title.slice(0, 60)}" — ${via}`);
      }
    } catch {
      setTaskActed((m) => ({ ...m, [task.sId]: { label: "Failed - retry", tone: "error" } }));
      pushToast("error", "Task action failed", "Could not reach the pod function");
    } finally {
      setPending((m) => { const n = { ...m }; delete n[key]; return n; });
    }
  };

  // ---- meeting prep ----
  const runMeetingPrep = async (evt: CalendarEvent) => {
    if (prepPending[evt.id]) return;
    setPrepPending((m) => ({ ...m, [evt.id]: true }));
    setExpandedEvtId(evt.id);
    try {
      const { result, error } = await callFn({
        action: "meeting_prep",
        itemId: evt.id,
        itemText: evt.title,
        note: `${evt.startTime} | attendees: ${(evt.attendeeNames ?? []).join(", ")} | external: ${evt.isExternal}`,
        source: "calendar-tab",
      });
      const body = parseBody(result);
      if (!error && body?.ok) {
        pushToast("ok", "Prep brief queued", `"${evt.title.slice(0, 50)}" - will surface in #{{OS_CHANNEL}}`);
      } else {
        pushToast("error", "Prep failed", "Could not reach the pod function");
      }
    } catch {
      pushToast("error", "Prep failed", "Could not reach the pod function");
    } finally {
      setPrepPending((m) => { const n = { ...m }; delete n[evt.id]; return n; });
    }
  };

  const submitCapture = async () => {
    if (!captureText.trim() || captureState === "sending") return;
    setCaptureState("sending");
    try {
      const { result, error } = await callFn({
        action: "capture",
        note: captureText.trim(),
        source: "banner-capture",
      });
      const body = parseBody(result);
      if (error || !body?.ok) {
        setCaptureState("error");
        pushToast("error", "Capture failed", "Could not reach the pod — try again");
      } else {
        const note = captureText.trim();
        setCaptureState("sent");
        setCaptureText("");
        setTimeout(() => setCaptureState("idle"), 3500);
        pushToast(
          body.posted ? "ok" : "queued",
          body.posted ? "Captured → Slack" : "Captured (queued)",
          `"${note.slice(0, 60)}${note.length > 60 ? "…" : ""}" — ${body.posted ? "posted to #{{OS_CHANNEL}}" : "inbox + outbox, posts on next engine run"}`
        );
      }
    } catch {
      setCaptureState("error");
      pushToast("error", "Capture failed", "Could not reach the pod — try again");
    }
  };

  const submitSteer = async () => {
    if (!steerText.trim() || steerState === "sending") return;
    setSteerState("sending");
    try {
      const { result, error } = await callFn({
        action: "steer",
        note: steerText.trim(),
        scope: steerScope,
        priority: steerCP ? `CP${steerCP}: ${PRIORITIES[steerCP - 1].text}` : undefined,
        source: "steer",
      });
      const body = parseBody(result);
      if (error || !body?.ok) {
        setSteerState("error");
      } else {
        setSteerState("sent");
        setSteerText("");
        setTimeout(() => setSteerState("idle"), 4000);
      }
    } catch {
      setSteerState("error");
    }
  };

  return (
    <div
      ref={rootRef}
      style={{
        width: "100%",
        height: "100vh",
        overflow: "hidden",
        position: "relative",
        background: "linear-gradient(135deg, #eef2ff 0%, #ffffff 55%)",
        fontFamily: "ui-sans-serif, system-ui, sans-serif",
        display: "flex",
        flexDirection: "column",
        padding: phone ? "7px 10px 6px" : "12px 16px",
        boxSizing: "border-box",
      }}
    >
      {/* header, right padding keeps top-right corner clear for host controls */}
      <div className="hdr-row" style={{ display: "flex", alignItems: "center", gap: phone ? 4 : 8, paddingRight: phone ? 64 : 110, minHeight: 30, flexWrap: "nowrap", flexShrink: 0, overflow: "visible" }}>
        {people[CEO_SLACK] && <Avatar person={people[CEO_SLACK]} size={phone ? 22 : 26} />}
        <span style={{ fontSize: phone ? 12 : 13, fontWeight: 700, color: "#312e81", whiteSpace: "nowrap" }}>{"{{COMPANY}} \u00b7 CEO OS"}</span>
        {!phone && (
          <span
          title={`Engine data written ${dash.updated.replace("T", " ").replace("Z", "")} UTC`}
          style={{ fontSize: 11, color: "#64748b", whiteSpace: "nowrap" }}
        >
          {(() => {
            const min = Math.max(0, Math.round((nowTick - new Date(dash.updated).getTime()) / 60000));
            const ago = min < 1 ? "just now" : min < 60 ? `${min} min ago` : min < 1440 ? `${Math.round(min / 60)}h ago` : `${Math.round(min / 1440)}d ago`;
            return `Updated ${ago}`;
          })()}
        </span>
        )}
        {dash.build_phase && !phone && (
          <span style={{ fontSize: 9, fontWeight: 600, color: "#b45309", background: "#fef3c7", borderRadius: 999, padding: "2px 7px", whiteSpace: "nowrap" }}>
            BUILD
          </span>
        )}
        {/* Company Priorities node */}
        <button
          onMouseEnter={() => { if (noHover) return; closeAllOverlays(); setCpOpen(true); }}
          onClick={() => { const v = cpOpen; closeAllOverlays(); setCpOpen(!v); }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            border: cpOpen ? "1px solid #7c3aed" : "1px solid #ddd6fe",
            background: cpOpen ? "#7c3aed" : "#f5f3ff",
            color: cpOpen ? "#ffffff" : "#6d28d9",
            borderRadius: 999,
            minHeight: phone ? 32 : undefined, padding: phone ? "5px 7px" : "3px 9px",
            fontSize: 10,
            fontWeight: 700,
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          <Target size={11} />
          {phone ? "CP" : `CP x${PRIORITIES.length}`}
          {PRIORITIES.filter((pp) => pp.status).map((pp) => (
            <span key={pp.n} title={`CP${pp.n}: ${pp.status}`} style={{ width: 6, height: 6, borderRadius: 999, background: STATUS_COLOR[pp.status!] ?? "#94a3b8" }} />
          ))}
        </button>
        {/* Today's calendar node: hover for the day + prep */}
        <button
          onMouseEnter={() => { if (noHover) return; closeAllOverlays(); setCalOpen(true); }}
          onClick={() => { const v = calOpen; closeAllOverlays(); setCalOpen(!v); }}
          style={{
            display: "flex", alignItems: "center", gap: 4,
            border: calOpen ? "1px solid #0891b2" : "1px solid #cffafe",
            background: calOpen ? "#0891b2" : "#ecfeff",
            color: calOpen ? "#ffffff" : "#0e7490",
            borderRadius: 999, minHeight: phone ? 32 : undefined, padding: phone ? "5px 7px" : "3px 9px", fontSize: 10, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap",
          }}
        >
          <CalendarCheck size={11} />
          {phone ? (calEvents.length > 0 ? String(calEvents.length) : "") : `Today${calEvents.length > 0 ? ` x${calEvents.length}` : ""}`}
        </button>
        {/* Capture node: expands on click, stays out of the way otherwise */}
        <button
          onMouseEnter={() => { if (noHover) return; closeAllOverlays(); setCapOpen(true); }}
          onClick={() => { const v = capOpen; closeAllOverlays(); setCapOpen(!v); }}
          style={{
            display: "flex", alignItems: "center", gap: 4,
            border: capOpen ? "1px solid #4338ca" : "1px solid #c7d2fe",
            background: capOpen ? "#4338ca" : "#eef2ff",
            color: capOpen ? "#ffffff" : "#4338ca",
            borderRadius: 999, minHeight: phone ? 32 : undefined, padding: phone ? "5px 7px" : "3px 9px", fontSize: 10, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap",
          }}
        >
          <Mic size={11} />
          {!phone && "Capture"}
        </button>
        {/* Numbers node: the 4 numbers before a board call - view-only */}
        <button
          onMouseEnter={() => { if (noHover) return; closeAllOverlays(); setNumsOpen(true); }}
          onClick={() => { const v = numsOpen; closeAllOverlays(); setNumsOpen(!v); }}
          style={{
            display: "flex", alignItems: "center", gap: 4,
            border: numsOpen ? "1px solid #0f766e" : "1px solid #99f6e4",
            background: numsOpen ? "#0f766e" : "#f0fdfa",
            color: numsOpen ? "#ffffff" : "#0f766e",
            borderRadius: 999, minHeight: phone ? 32 : undefined, padding: phone ? "5px 7px" : "3px 9px", fontSize: 10, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", position: "relative",
          }}
        >
          <BarChart3 size={11} />
          {!phone && "Numbers"}
          {!metricsWired && <CautionDot label="North-star metrics land via the morning engine - not wired yet" />}
        </button>
        {/* Queue badge: outstanding agentic work - only shows when non-empty */}
        {queuedItems.length > 0 && (
          <button
            onMouseEnter={() => { if (noHover) return; closeAllOverlays(); setQueueOpen(true); }}
            onClick={() => { const v = queueOpen; closeAllOverlays(); setQueueOpen(!v); }}
            style={{
              display: "flex", alignItems: "center", gap: 4,
              border: queueOpen ? "1px solid #475569" : "1px solid #e2e8f0",
              background: queueOpen ? "#475569" : "#f8fafc",
              color: queueOpen ? "#ffffff" : "#475569",
              borderRadius: 999, minHeight: phone ? 32 : undefined, padding: phone ? "5px 7px" : "3px 9px", fontSize: 10, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap",
            }}
          >
            <Clock3 size={11} />
            {queuedItems.length}
          </button>
        )}
                {/* Wakeups pill - left of engine health dot */}
        <button
          onMouseEnter={() => { if (!wakeupsOpen) { closeAllOverlays(); setWakeupsOpen(true); void loadWakeups(); } }}
          onClick={() => { const v = wakeupsOpen; closeAllOverlays(); setWakeupsOpen(!v); if (!v) void loadWakeups(); }}
          style={{
            display: "flex", alignItems: "center", gap: 4, flexShrink: 0,
            border: `1px solid ${wakeupsOpen ? "#7c3aed" : "#e9d5ff"}`,
            background: wakeupsOpen ? "#7c3aed" : "#faf5ff",
            color: wakeupsOpen ? "#ffffff" : "#7c3aed",
            borderRadius: 999, padding: phone ? "3px 6px" : "3px 9px",
            fontSize: 10, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap",
          }}
          title={`Wake-up engines \u00b7 ${wakeupHealthy}/${wakeupTotal} healthy`}
        >
          <Sunrise size={11} />
          {!phone && <span>{wakeupsData.length > 0 ? `${wakeupHealthy}/${wakeupTotal}` : "Wakeups"}</span>}
        </button>
{/* Engine health: freshness of the morning sweep - real signal, no caution */}
        <a
          href={`${SLACK_BASE}{{OS_CHANNEL_ID}}`}
          target="_blank"
          rel="noreferrer"
          title={`Morning engine last ran ${dash.updated.replace("T", " ").replace("Z", "")} UTC (${Math.round(engineAgeH)}h ago) - click to open #{{OS_CHANNEL}} where the engines report`}
          style={{ width: 9, height: 9, borderRadius: 999, background: engineColor, flexShrink: 0, display: "inline-block", cursor: "pointer", boxShadow: `0 0 0 2px ${engineColor}33` }}
        />
        {/* v14 (item 2): stale exec-action bundle detected via envelope version echo */}
        {fnStale !== null && (
          <span
            title={`exec-action responded with version ${fnStale}, banner expects ${EXPECTED_FN_VERSION} — the deployed function bundle is stale. Re-publish exec-action.`}
            style={{ fontSize: 8.5, fontWeight: 800, color: "#b45309", background: "#fffbeb", border: "1px dashed #fde68a", borderRadius: 6, padding: "1px 5px", flexShrink: 0, animation: "pulse 1.6s ease infinite" }}
          >
            engine mismatch v{fnStale}≠{EXPECTED_FN_VERSION}
          </span>
        )}
        {/* Slack link pills */}
        {showLinks && (
          <div style={{ display: "flex", gap: 5, marginLeft: "auto", minWidth: 0, overflow: "hidden" }}>
            {LINKS.slice(0, maxLinks).map((l) => (
              <a
                key={l.id}
                href={`${SLACK_BASE}${l.id}`}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  border: "1px solid #e2e8f0",
                  background: "#ffffff",
                  color: "#475569",
                  borderRadius: 999,
                  padding: "3px 9px",
                  fontSize: 10,
                  fontWeight: 600,
                  textDecoration: "none",
                  whiteSpace: "nowrap",
                }}
              >
                <Slack size={11} color="#611f69" />
                {l.name}
                <ExternalLink size={9} color="#94a3b8" />
              </a>
            ))}
          </div>
        )}
      </div>

      {/* CP hover panel */}
      {cpOpen && (
        <div
          onMouseLeave={() => setCpOpen(false)}
          style={{
            position: "absolute",
            top: 40,
            left: phone ? 8 : 16,
            right: phone ? 8 : 16,
            bottom: 8,
            zIndex: 50,
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: 12,
            boxShadow: "0 12px 32px rgba(49,46,129,0.18)",
            padding: "8px 10px",
            overflowY: "auto",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
            <Target size={12} color="#7c3aed" />
            <span style={{ fontSize: 11, fontWeight: 700, color: "#312e81" }}>{"{{YEAR}} {{COMPANY}} Priorities"}</span>
            <a href={CP_DOC} target="_blank" rel="noreferrer" style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 4, fontSize: 10, fontWeight: 600, color: "#6d28d9", textDecoration: "none", border: "1px solid #ddd6fe", background: "#f5f3ff", borderRadius: 999, padding: "2px 8px" }}>
              Source doc <ExternalLink size={9} />
            </a>
            <a href={CP_POD_URL} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, fontWeight: 600, color: "#0e7490", textDecoration: "none", border: "1px solid #cffafe", background: "#ecfeff", borderRadius: 999, padding: "2px 8px" }}>
              CP Pod <ExternalLink size={9} />
            </a>
            <button onClick={() => setCpOpen(false)} style={{ border: "none", background: "transparent", cursor: "pointer", color: "#94a3b8", padding: 2 }}>
              <X size={12} />
            </button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: phone ? "1fr" : "1fr 1fr", gap: 5 }}>
            {PRIORITIES.map((p) => {
              const sherpaPerson = people[SHERPA_SLACK[p.sherpaId]];
              return (
              <div
                key={p.n}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  border: "1px solid #e2e8f0",
                  borderLeft: `3px solid ${p.status ? STATUS_COLOR[p.status] ?? "#cbd5e1" : "#cbd5e1"}`,
                  borderRadius: 8,
                  padding: "5px 8px",
                  background: "#fafafa",
                  minWidth: 0,
                }}
              >
                <span style={{ fontSize: 10, fontWeight: 800, color: "#64748b", flexShrink: 0, width: 12, textAlign: "center" }}>{p.n}</span>
                <span
                  title={p.status ? `Status: ${p.status}` : "Status: not yet reported (monthly CP review)"}
                  style={{ width: 8, height: 8, borderRadius: 999, flexShrink: 0, background: p.status ? STATUS_COLOR[p.status] ?? "#94a3b8" : "#cbd5e1" }}
                />
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block", fontSize: 10.5, fontWeight: 600, color: "#1e293b", lineHeight: 1.25 }}>
                    {p.text}
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 9, color: "#94a3b8", flexWrap: "wrap", marginTop: 2 }}>
                    {sherpaPerson ? <Avatar person={sherpaPerson} size={16} /> : null}
                    <span style={{ whiteSpace: "nowrap" }}>{p.sherpa}</span>
                    <a href={p.notionUrl} target="_blank" rel="noreferrer" title="Notion doc" style={{ display: "inline-flex", alignItems: "center", gap: 3, color: "#6d28d9", fontWeight: 700, textDecoration: "none", flexShrink: 0, border: "1px solid #ede9fe", background: "#f5f3ff", borderRadius: 999, padding: "1px 6px" }}>Notion <ExternalLink size={8} /></a>
                    {p.channelId && (
                      <a href={slackUrl(p.channelId)} target="_blank" rel="noreferrer" title={p.channel ?? "Slack channel"} style={{ display: "inline-flex", alignItems: "center", gap: 3, color: "#0e7490", fontWeight: 700, textDecoration: "none", flexShrink: 0, border: "1px solid #cffafe", background: "#ecfeff", borderRadius: 999, padding: "1px 6px" }}>Slack <ExternalLink size={8} /></a>
                    )}
                  </span>
                </span>
              </div>
              );
            })}
          </div>
        </div>
      )}

      {/* capture overlay: opens from the Capture pill in the header */}
      {capOpen && (
      <div style={{ position: "absolute", top: 40, left: phone ? 8 : 16, right: phone ? 8 : 16, zIndex: 60, background: "#ffffff", border: "1px solid #c7d2fe", borderRadius: 12, boxShadow: "0 12px 32px rgba(49,46,129,0.18)", padding: "8px 10px" }}>
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 7, border: "1px solid #c7d2fe", background: "#ffffff", borderRadius: 10, padding: phone ? "8px 10px" : "6px 10px", minWidth: 0 }}>
          <Mic size={13} color="#4338ca" />
          <input
            value={captureText}
            onChange={(e) => setCaptureText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void submitCapture();
            }}
            placeholder={phone ? "Dictate or type - lands in the inbox" : "Capture anything - tap and dictate on mobile, it lands in the CEO OS inbox for triage"}
            style={{ flex: 1, minWidth: 0, border: "none", outline: "none", fontSize: phone ? 12 : 11.5, color: "#1e293b", background: "transparent" }}
          />
        </div>
        <button
          onClick={() => void submitCapture()}
          disabled={!captureText.trim() || captureState === "sending"}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            border: "1px solid #4338ca",
            background: captureText.trim() ? "#4338ca" : "#e0e7ff",
            color: captureText.trim() ? "#ffffff" : "#818cf8",
            borderRadius: 10,
            padding: phone ? "8px 12px" : "6px 12px",
            fontSize: 11,
            fontWeight: 700,
            cursor: captureText.trim() ? "pointer" : "default",
            whiteSpace: "nowrap",
          }}
        >
          {captureState === "sending" ? <SpinLoader size={12} /> : <Send size={12} />}
          {captureState === "sent" ? "Captured" : "Capture"}
        </button>
      </div>
      {captureState === "sent" && (
        <div style={{ fontSize: 9.5, color: "#047857", marginTop: 2 }}>In the inbox - the next engine run triages it.</div>
      )}
      {captureState === "error" && (
        <div style={{ fontSize: 9.5, color: "#be123c", marginTop: 2 }}>Capture failed - try again.</div>
      )}
      </div>
      )}

      {/* Today overlay: today's calendar + prep, opens from the Today pill */}
      {calOpen && (
      <div onMouseLeave={() => setCalOpen(false)} style={{ position: "absolute", top: 40, left: phone ? 8 : 16, right: phone ? 8 : 16, zIndex: 55, background: "#ffffff", border: "1px solid #a5f3fc", borderRadius: 12, boxShadow: "0 12px 32px rgba(8,145,178,0.16)", padding: "8px 10px", maxHeight: 200, overflowY: "auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4 }}>
        {(["today", "week"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setTodayMode(m)}
            style={{
              border: todayMode === m ? "1px solid #0891b2" : "1px solid #cffafe",
              background: todayMode === m ? "#0891b2" : "#ecfeff",
              color: todayMode === m ? "#ffffff" : "#0e7490",
              borderRadius: 999, padding: "1px 9px", fontSize: 9, fontWeight: 700, cursor: "pointer", position: "relative",
            }}
          >
            {m === "today" ? "Today" : "Week ahead"}
            {m === "week" && weekAhead.length === 0 && <CautionDot label="Week-ahead load lands via the morning engine - not wired yet" />}
          </button>
        ))}
      </div>
      {todayMode === "today" ? (<>
      <div className="tab-scroll-row" style={{ display: "flex", alignItems: "center", gap: 5, minHeight: 26, overflowX: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
          <CalendarCheck size={11} color="#0891b2" />
          <span style={{ fontSize: 9.5, fontWeight: 800, color: "#0891b2", whiteSpace: "nowrap" }}>TODAY</span>
        </div>
        {calEvents.length === 0 ? (
          <span style={{ fontSize: 10, color: "#94a3b8", whiteSpace: "nowrap" }}>No events loaded - hit Sync</span>
        ) : (
          calEvents
            .slice()
            .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
            .slice(0, phone ? 2 : 4)
            .map((evt) => {
              const nowE = isNowEvt(evt.startTime, evt.endTime);
              const sel = expandedEvtId === evt.id;
              return (
                <button
                  key={evt.id}
                  onClick={() => setExpandedEvtId(sel ? null : evt.id)}
                  style={{ display: "flex", alignItems: "center", gap: 4, border: sel ? "1px solid #0891b2" : "1px solid #e0f2fe", background: sel ? "#0891b2" : nowE ? "#ecfeff" : "#ffffff", color: sel ? "#ffffff" : "#0e7490", borderRadius: 999, padding: "3px 9px", fontSize: 9.5, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}
                >
                  {nowE && <span style={{ width: 6, height: 6, borderRadius: 999, background: sel ? "#ffffff" : "#0891b2" }} />}
                  {fmtTimeET(evt.startTime)} {evt.title.length > 24 ? evt.title.slice(0, 24) + "…" : evt.title}
                </button>
              );
            })
        )}
        {calEvents.length > (phone ? 2 : 4) && (
          <span style={{ fontSize: 9.5, color: "#0e7490", fontWeight: 700, whiteSpace: "nowrap", flexShrink: 0 }}>+{calEvents.length - (phone ? 2 : 4)}</span>
        )}
        {(dash.time_blocks ?? []).length > 0 && (
          <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 9.5, fontWeight: 700, color: "#7c3aed", background: "#f5f3ff", border: "1px solid #ddd6fe", borderRadius: 999, padding: "3px 8px", whiteSpace: "nowrap", flexShrink: 0 }}>
            <Clock3 size={9} /> {(dash.time_blocks ?? []).length} block{(dash.time_blocks ?? []).length > 1 ? "s" : ""}
          </span>
        )}
        <button
          onClick={() => void refreshCalendar()}
          disabled={calRefreshing}
          title="Refresh today's calendar"
          style={{ display: "flex", alignItems: "center", gap: 3, border: "1px solid #cffafe", background: "#ecfeff", color: "#0891b2", borderRadius: 999, padding: "3px 8px", fontSize: 9.5, fontWeight: 700, cursor: calRefreshing ? "default" : "pointer", whiteSpace: "nowrap", flexShrink: 0, marginLeft: "auto" }}
        >
          {calRefreshing ? <SpinLoader size={9} /> : <RefreshCw size={9} />}
          {calRefreshing ? "Loading…" : "Sync"}
        </button>
      </div>
      {expandedEvtId && (() => {
        const evt = calEvents.find((e) => e.id === expandedEvtId);
        if (!evt) return null;
        const prepLoading = prepPending[evt.id];
        return (
          <div style={{ marginTop: 4, border: "1px solid #e0f2fe", borderLeft: "3px solid #38bdf8", borderRadius: 10, padding: "6px 10px", background: "#ffffff" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, minWidth: 0 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11.5, fontWeight: 600, color: "#1e293b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {evt.title}
                </div>
                <div style={{ fontSize: 9.5, color: "#94a3b8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {fmtTimeET(evt.startTime)} · {fmtDuration(evt.startTime, evt.endTime)}
                  {(evt.attendeeNames ?? []).length > 0 ? ` · ${(evt.attendeeNames ?? []).slice(0, 4).join(", ")}` : ""}
                </div>
              </div>
              {evt.meetLink && (
                <a href={evt.meetLink} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: 3, border: "1px solid #cffafe", background: "#ecfeff", color: "#0891b2", borderRadius: 6, padding: "3px 7px", fontSize: 9.5, fontWeight: 700, textDecoration: "none", flexShrink: 0 }}>
                  <Video size={9} /> Join
                </a>
              )}
              <button
                onClick={() => void runMeetingPrep(evt)}
                disabled={prepLoading}
                style={{ display: "flex", alignItems: "center", gap: 3, border: "1px solid #fde68a", background: "#fffbeb", color: "#b45309", borderRadius: 6, padding: "3px 7px", fontSize: 9.5, fontWeight: 700, cursor: prepLoading ? "default" : "pointer", whiteSpace: "nowrap", flexShrink: 0, position: "relative" }}
              >
                {prepLoading ? <SpinLoader size={9} /> : <Target size={9} />} Prep
                {!WIRED.meeting_prep && <CautionDot />}
              </button>
              <button onClick={() => setExpandedEvtId(null)} style={{ border: "none", background: "transparent", color: "#94a3b8", cursor: "pointer", flexShrink: 0, display: "flex" }}>
                <X size={11} />
              </button>
            </div>
            {evt.prepContext && (
              <div style={{ marginTop: 6, paddingTop: 6, borderTop: "1px solid #e0f2fe", fontSize: 10.5, color: "#1e293b", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
                {evt.prepContext}
              </div>
            )}
          </div>
        );
      })()}
      </>) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {weekAhead.length === 0 ? (
            <div style={{ fontSize: 10.5, color: "#64748b", padding: "2px 2px" }}>
              Next 5 days at a glance - meeting load, travel and OOO flags. Lands via the morning engine.
            </div>
          ) : (
            weekAhead.map((d) => (
              <div key={d.day} style={{ display: "flex", alignItems: "center", gap: 8, border: "1px solid #f1f5f9", borderRadius: 8, padding: "4px 8px", background: "#fafafa" }}>
                <span style={{ fontSize: 9.5, fontWeight: 800, color: "#0e7490", width: 32, flexShrink: 0 }}>{d.day}</span>
                <span style={{ flex: 1, minWidth: 0, fontSize: 10.5, color: "#1e293b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.label}</span>
                {d.flags && <span style={{ fontSize: 8.5, fontWeight: 700, color: "#b45309", background: "#fffbeb", borderRadius: 4, padding: "1px 5px", flexShrink: 0 }}>{d.flags}</span>}
              </div>
            ))
          )}
        </div>
      )}
      </div>
      )}

      {/* Numbers overlay: north-star metrics, engine-fed */}
      {numsOpen && (
      <div onMouseLeave={() => setNumsOpen(false)} style={{ position: "absolute", top: 40, left: phone ? 8 : 16, right: phone ? 8 : 16, zIndex: 53, background: "#ffffff", border: "1px solid #99f6e4", borderRadius: 12, boxShadow: "0 12px 32px rgba(15,118,110,0.16)", padding: "8px 10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
          <BarChart3 size={12} color="#0f766e" />
          <span style={{ fontSize: 10.5, fontWeight: 800, color: "#134e4a" }}>The numbers</span>
          {!metricsWired && <span style={{ fontSize: 8.5, color: "#d97706" }}>engine not wired yet - placeholders below</span>}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: phone ? "1fr 1fr" : "repeat(4, 1fr)", gap: 6 }}>
          {(metrics.length > 0 ? metrics : [{ label: "ARR", value: null, delta: null }, { label: "Pipeline", value: null, delta: null }, { label: "Runway", value: null, delta: null }, { label: "Weekly actives", value: null, delta: null }]).map((m) => (
            <div key={m.label} style={{ border: "1px solid #f1f5f9", borderRadius: 8, padding: "6px 8px", background: "#fafafa" }}>
              <div style={{ fontSize: 8.5, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>{m.label}</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: m.value ? "#134e4a" : "#cbd5e1" }}>{m.value ?? "—"}</div>
              {m.delta && (() => { const neg = /^[-−↓]|down/i.test(m.delta.trim()); return (
                <div style={{ display: "flex", alignItems: "center", gap: 2, fontSize: 8.5, fontWeight: 700, color: neg ? "#be123c" : "#059669" }}>
                  {neg ? <TrendingDown size={9} /> : <TrendingUp size={9} />}{m.delta}
                </div>
              ); })()}
            </div>
          ))}
        </div>
      </div>
      )}

      {/* Queue overlay: outstanding agentic work */}
      {queueOpen && queuedItems.length > 0 && (
      <div onMouseLeave={() => setQueueOpen(false)} style={{ position: "absolute", top: 40, left: phone ? 8 : 16, right: phone ? 8 : 16, zIndex: 54, background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 12, boxShadow: "0 12px 32px rgba(71,85,105,0.16)", padding: "8px 10px", maxHeight: 190, overflowY: "auto", display: "flex", flexDirection: "column", gap: 5 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Clock3 size={12} color="#475569" />
          <span style={{ fontSize: 10.5, fontWeight: 800, color: "#334155" }}>Queued agentic work</span>
        </div>
        {queuedItems.map((it: any) => {
          // v14 (item 4): per-item lifecycle chip (queued -> running -> draft ready -> done)
          // + retry/cancel wired to exec-action. Entries without status are legacy "queued".
          const st = (it.status ?? "queued") as string;
          const stCfg: Record<string, { label: string; fg: string; bg: string; bd: string }> = {
            queued: { label: "queued", fg: "#475569", bg: "#f1f5f9", bd: "#e2e8f0" },
            running: { label: "running", fg: "#4338ca", bg: "#eef2ff", bd: "#c7d2fe" },
            draft_ready: { label: "draft ready", fg: "#b45309", bg: "#fffbeb", bd: "#fde68a" },
            done: { label: "done", fg: "#15803d", bg: "#f0fdf4", bd: "#bbf7d0" },
          };
          const sc = stCfg[st] ?? stCfg.queued;
          const busy = pending[it.id];
          const qAct = async (action: "retry_queued" | "cancel_queued") => {
            if (busy) return;
            setPending((m) => ({ ...m, [it.id]: action }));
            try {
              const { result, error } = await callFn({ action, itemId: it.id, itemText: it.text });
              const body = parseBody(result);
              if (!error && body?.ok) pushToast("ok", action === "cancel_queued" ? "Task cancelled" : "Task re-queued", `"${String(it.text).slice(0, 60)}"`);
              else pushToast("error", "Queue action failed", "Entry not found or function unreachable");
            } finally {
              setPending((m) => { const n = { ...m }; delete n[it.id]; return n; });
            }
          };
          return (
          <div key={it.id} style={{ display: "flex", alignItems: "center", gap: 7, border: "1px solid #f1f5f9", borderRadius: 8, padding: "5px 8px", background: "#fafafa" }}>
            <span style={{ fontSize: 8.5, fontWeight: 800, color: sc.fg, background: sc.bg, border: `1px solid ${sc.bd}`, borderRadius: 6, padding: "1px 6px", flexShrink: 0, whiteSpace: "nowrap", ...(st === "running" ? { animation: "pulse 1.6s ease infinite" } : {}) }}>{sc.label}</span>
            <span style={{ flex: 1, minWidth: 0, fontSize: 10.5, fontWeight: 600, color: "#1e293b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{it.text}</span>
            {it.meta && !phone && <span style={{ fontSize: 9, color: "#94a3b8", flexShrink: 0 }}>{it.meta}</span>}
            {st !== "done" && (
              <span style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                <button disabled={!!busy} onClick={() => void qAct("retry_queued")} title="Re-queue for the next engine run" style={{ border: "1px solid #c7d2fe", background: "#eef2ff", color: "#4338ca", borderRadius: 6, padding: "2px 7px", fontSize: 9, fontWeight: 800, cursor: busy ? "wait" : "pointer", minHeight: phone ? 32 : undefined }}>{busy === "retry_queued" ? "…" : "Retry"}</button>
                <button disabled={!!busy} onClick={() => void qAct("cancel_queued")} title="Remove from the queue - engines will not run it" style={{ border: "1px solid #fecdd3", background: "#fff1f2", color: "#be123c", borderRadius: 6, padding: "2px 7px", fontSize: 9, fontWeight: 800, cursor: busy ? "wait" : "pointer", minHeight: phone ? 32 : undefined }}>{busy === "cancel_queued" ? "…" : "Cancel"}</button>
              </span>
            )}
          </div>
          );
        })}
      </div>
      )}

      {/* Wakeups overlay - engine relay health */}
      {wakeupsOpen && (
      <div onMouseLeave={() => setWakeupsOpen(false)} style={{ position: "absolute", top: 40, left: phone ? 8 : 16, right: phone ? 8 : 16, zIndex: 55, background: "#ffffff", border: "1px solid #e9d5ff", borderRadius: 12, boxShadow: "0 12px 32px rgba(124,58,237,0.13)", padding: "8px 10px", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
          <Sunrise size={12} color="#7c3aed" />
          <span style={{ fontSize: 10.5, fontWeight: 800, color: "#6d28d9" }}>Wake-up engines</span>
          <span style={{ fontSize: 8.5, color: "#64748b" }}>relay quota: 32 fires · handoff at 26+</span>
          {wakeupsLoading && <Loader2 size={10} style={{ color: "#7c3aed", animation: "spin 1s linear infinite", marginLeft: 2 }} />}
          <span style={{ flex: 1 }} />
          <button onClick={closeAllOverlays} style={{ border: "none", background: "transparent", color: "#94a3b8", cursor: "pointer", padding: 0, display: "flex" }}><X size={12} /></button>
        </div>
        {wakeupRows.map((row) => {
          const hColor = row.health === "green" ? "#059669" : row.health === "amber" ? "#d97706" : "#e11d48";
          return (
          <div key={row.key} style={{ display: "flex", alignItems: "center", gap: 6, borderBottom: "1px solid #f5f3ff", padding: "5px 0" }}>
            <span style={{ width: 7, height: 7, borderRadius: 999, background: hColor, flexShrink: 0, display: "inline-block" }} title={row.health} />
            <Sunrise size={9} color="#7c3aed" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: "#1e293b", whiteSpace: "nowrap", minWidth: 95 }}>{row.name}</span>
            {!phone && <span style={{ fontSize: 9, color: "#64748b", whiteSpace: "nowrap", maxWidth: 130, overflow: "hidden", textOverflow: "ellipsis" }}>{row.scheduleHuman}</span>}
            <span style={{ fontSize: 9, fontWeight: 800, color: row.fireCount >= 26 ? "#d97706" : "#475569", whiteSpace: "nowrap" }}>{row.fireCount}/{row.fireQuota}</span>
            <span style={{ fontSize: 9, color: row.health === "green" ? "#059669" : row.health === "amber" ? "#d97706" : "#e11d48", whiteSpace: "nowrap", flex: 1 }}>
              {row.lastRun ? new Date(row.lastRun).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "no runs yet"}{row.status !== "unknown" ? " \u00b7 " + row.status : ""}
            </span>
            {row.url && (
              <a href={row.url} target="_blank" rel="noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 2, fontSize: 9, color: "#6d28d9", textDecoration: "none", border: "1px solid #ddd6fe", borderRadius: 6, padding: "1px 7px", whiteSpace: "nowrap", flexShrink: 0 }}>
                Open <ExternalLink size={8} />
              </a>
            )}
          </div>
          );
        })}
        <div style={{ fontSize: 8.5, color: "#94a3b8", marginTop: 4 }}>Source: state/wakeups.json · engines update fireCount/lastRun on each fire</div>
      </div>
      )}

      {/* tabs: ONE row always (banner budget) - scrolls horizontally on phone */}
      <div className="tab-scroll-row" style={{ display: "flex", flexWrap: "nowrap", gap: phone ? 4 : 5, marginTop: 6, minHeight: 32, flexShrink: 0, overflowX: "auto" }}>
        {/* Banner budget (Pod Frame Action Buttons skill): keep tabs on one row —
            low-traffic tabs auto-hide when empty. */}
        {TABS.map(({ key, label, icon: Icon, items, count }) => {
          const sel = key === tab;
          const steerTab = key === "steer";
          const pulseTab = key === "pulse";
          const badge = count ?? (items !== null ? items.length : undefined);
          return (
            <button
              key={key}
              onClick={() => setTab(key)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                border: sel
                  ? steerTab ? "1px solid #7c3aed" : pulseTab ? "1px solid #b45309" : "1px solid #4338ca"
                  : "1px solid #e2e8f0",
                background: sel
                  ? steerTab ? "#7c3aed" : pulseTab ? "#b45309" : "#4338ca"
                  : "#ffffff",
                color: sel ? "#ffffff" : steerTab ? "#6d28d9" : pulseTab ? "#b45309" : "#475569",
                borderRadius: 8,
                padding: phone ? "4px 7px" : "5px 11px",
                fontSize: phone ? 10.5 : 11,
                fontWeight: 600,
                cursor: "pointer",
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              <Icon size={phone ? 11 : 12} />
              {label}
              {badge !== undefined && (
                <span style={{ fontSize: 9, fontWeight: 700, background: sel ? "rgba(255,255,255,0.25)" : "#f1f5f9", borderRadius: 999, padding: "1px 5px" }}>
                  {badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* content */}
      <div style={{ flex: 1, minHeight: 0, overflowY: "auto", marginTop: 6, display: "flex", flexDirection: "column", gap: 4 }}>
        {tab === "steer" ? (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 5, minHeight: 0 }}>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ fontSize: 9.5, fontWeight: 700, color: "#64748b" }}>SCOPE</span>
              {["Company-wide", "GTM", "Product", "Eng", "Team/Ops"].map((s) => (
                <Chip key={s} label={s} selected={steerScope === s} onClick={() => setSteerScope(s)} color="#4338ca" />
              ))}
              <span style={{ fontSize: 9.5, fontWeight: 700, color: "#64748b", marginLeft: 6 }}>CP</span>
              {PRIORITIES.map((p) => (
                <Chip
                  key={p.n}
                  label={String(p.n)}
                  selected={steerCP === p.n}
                  onClick={() => setSteerCP(steerCP === p.n ? null : p.n)}
                  color="#4338ca"
                  title={p.text}
                />
              ))}
            </div>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <input
                value={steerText}
                onChange={(e) => setSteerText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void submitSteer();
                }}
                placeholder={phone ? "Steer the company..." : "What should change? One clear steer - it cascades Company OS → Team OS → Personal OS."}
                style={{
                  flex: 1,
                  minWidth: 0,
                  border: "1px solid #e2e8f0",
                  borderRadius: 9,
                  padding: "8px 11px",
                  fontSize: 11.5,
                  color: "#1e293b",
                  outline: "none",
                  background: "#ffffff",
                }}
              />
              <button
                onClick={() => void submitSteer()}
                disabled={!steerText.trim() || steerState === "sending"}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  border: "1px solid #7c3aed",
                  background: steerText.trim() ? "#7c3aed" : "#ede9fe",
                  color: steerText.trim() ? "#ffffff" : "#a78bfa",
                  borderRadius: 9,
                  padding: "8px 13px",
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: steerText.trim() ? "pointer" : "default",
                  whiteSpace: "nowrap",
                  position: "relative",
                }}
              >
                {steerState === "sending" ? <SpinLoader size={12} /> : <Send size={12} />}
                {steerState === "sending" ? "Sending" : "Steer"}
                {!WIRED.steer && <CautionDot label="Logged to #{{OS_CHANNEL}} - cascade to team OS pods not wired yet" />}
              </button>
            </div>
            <div style={{ fontSize: 9.5, color: steerState === "error" ? "#be123c" : steerState === "sent" ? "#047857" : "#94a3b8" }}>
              {steerState === "sent"
                ? "Steer logged and routed to #{{OS_CHANNEL}}. Build phase: reviewed before it cascades."
                : steerState === "error"
                  ? "Could not submit - try again."
                  : `Routing: ${steerScope}${steerCP ? ` - CP${steerCP}` : ""} → posts to #{{OS_CHANNEL}}, then cascades down the OS stack.`}
            </div>
          </div>
        ) : tab === "asks" ? (
          <AsksTab asks={dash.ceo_asks ?? []} people={people} phone={phone} act={askAct} />
        ) : tab === "news" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            {/* News primary sub-tabs: Pulses / Dust / World */}
            <div style={{ display: "flex", alignItems: "center", gap: phone ? 3 : 4 }}>
              {([
                ["pulses", "Pulses", pulseItems_news.length] as const,
                ["dust", "{{COMPANY_SHORT}}", newsItems.filter(n => n.source === "dust").length] as const,
                ["world", "World", newsItems.filter(n => n.source === "world").length] as const,
              ]).map(([k, lab, cnt]) => {
                const sel = newsFilter === k;
                const accent = k === "pulses" ? { border: "#7c3aed", bg: "#7c3aed", pill: "#ede9fe", pillFg: "#6d28d9", inact: "#f5f3ff", inactBorder: "#ddd6fe", inactFg: "#7c3aed" }
                  : k === "dust" ? { border: "#4338ca", bg: "#4338ca", pill: "#e0e7ff", pillFg: "#3730a3", inact: "#eef2ff", inactBorder: "#c7d2fe", inactFg: "#4338ca" }
                  : { border: "#0e7490", bg: "#0e7490", pill: "#cffafe", pillFg: "#0e7490", inact: "#ecfeff", inactBorder: "#a5f3fc", inactFg: "#0e7490" };
                return (
                  <button key={k} onClick={() => { setNewsFilter(k); setPulseSubFilter("all"); }} style={{
                    display: "flex", alignItems: "center", gap: 4,
                    border: sel ? `1.5px solid ${accent.border}` : `1px solid ${accent.inactBorder}`,
                    background: sel ? accent.bg : accent.inact,
                    color: sel ? "#fff" : accent.inactFg,
                    borderRadius: 999, padding: phone ? "3px 7px" : "3px 10px",
                    fontSize: phone ? 9 : 9.5, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap",
                  }}>
                    {lab}
                    {cnt > 0 && (
                      <span style={{ background: sel ? "rgba(255,255,255,0.25)" : accent.pill, color: sel ? "#fff" : accent.pillFg, borderRadius: 999, padding: "0 4px", fontSize: 8, fontWeight: 800, minWidth: 14, textAlign: "center" }}>{cnt}</span>
                    )}
                  </button>
                );
              })}
              {!phone && <span style={{ fontSize: 8, color: "#94a3b8", marginLeft: "auto" }}>{"Pulses live \u00b7 {{COMPANY_SHORT}} + World via engine"}</span>}
            </div>
            {/* Pulses sub-filter: Internal / External (only when Pulses tab active) */}
            {newsFilter === "pulses" && (
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ fontSize: 8.5, color: "#6d28d9", fontWeight: 600, flexShrink: 0 }}>Source:</span>
                {([["all", "All"], ["internal", "Internal"], ["external", "External"]] as const).map(([k, lab]) => (
                  <button key={k} onClick={() => setPulseSubFilter(k)} style={{
                    border: pulseSubFilter === k ? "1.5px solid #7c3aed" : "1px solid #ddd6fe",
                    background: pulseSubFilter === k ? "#7c3aed" : "#faf5ff",
                    color: pulseSubFilter === k ? "#fff" : "#7c3aed",
                    borderRadius: 999, padding: "1px 7px", fontSize: 8.5, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap",
                  }}>{lab}</button>
                ))}
                {!phone && <span style={{ fontSize: 8, color: "#a78bfa", marginLeft: 4 }}>Team OS · Company OS · external signals</span>}
              </div>
            )}

            {newsShown.length === 0 ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8, border: "1px dashed #cbd5e1", borderRadius: 10, padding: "10px 12px", background: "#ffffff" }}>
                <Radio size={14} color="#b45309" />
                <span style={{ fontSize: 11, color: "#64748b" }}>
                  {newsFilter === "dust"
                    ? "{{COMPANY_SHORT}} internal news (launches, closed-wons, hires, incidents) lands here once the engine sweep is wired."
                    : newsFilter === "world"
                      ? "External signals (competitors, model releases, funding, market moves) land here once the engine sweep is wired."
                      : pulseSubFilter === "internal"
                        ? "No internal pulses yet. Team OS and Company OS Slack signals surface here via the morning engine."
                        : pulseSubFilter === "external"
                          ? "No external pulses yet. Curated external signals from Company OS channels land here via the morning engine."
                          : "Quiet for now. Pulses from Team OS and Company OS (internal + external) land here via the morning engine."}
                </span>
              </div>
            ) : (
              newsShown.map((it) => {
                const fb = acted[it.id];
                const nbusy = pending[it.id];
                const inputOpen = newsInputOpen === it.id;
                if (fb && fb.tone === "kill") return null;
                const nExp = expandedId === it.id;
                return (
                  <div key={it.id} className="item-row" onClick={phone ? () => setExpandedId(nExp ? null : it.id) : undefined} style={{ background: "#ffffff", border: nExp && phone ? "1px solid #c7d2fe" : "1px solid #e2e8f0", borderRadius: 10, padding: "6px 10px", cursor: phone ? "pointer" : "default" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                      <span style={{ width: 7, height: 7, borderRadius: 999, flexShrink: 0, background: it.severity === "red" ? "#e11d48" : it.severity === "yellow" ? "#d97706" : "#059669" }} />
                      <span style={{ fontSize: 8, fontWeight: 800, color: it.source === "world" ? "#0e7490" : it.source === "dust" ? "#4338ca" : it.pulseSource === "external" ? "#059669" : "#7c3aed", background: it.source === "world" ? "#ecfeff" : it.source === "dust" ? "#eef2ff" : it.pulseSource === "external" ? "#ecfdf5" : "#f5f3ff", borderRadius: 4, padding: "1px 4px", flexShrink: 0, textTransform: "uppercase" }}>{it.source === "pulses" ? (it.pulseSource === "external" ? "EXT" : "INT") : it.source}</span>
                      {it.url && (() => { let h: string | null = null; try { h = new URL(it.url).hostname; } catch { h = null; } return h ? (
                        <img src={`https://www.google.com/s2/favicons?domain=${h}&sz=32`} alt="" width={12} height={12} style={{ borderRadius: 3, flexShrink: 0 }} onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                      ) : null; })()}
                      <span style={{ flex: 1, minWidth: 0 }}>
                        {it.url ? (
                          <a href={it.url} target="_blank" rel="noreferrer" style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#1e293b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: phone ? "normal" : "nowrap", textDecoration: "none" }}>{it.text}</a>
                        ) : (
                          <span style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#1e293b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: phone ? "normal" : "nowrap" }}>{it.text}</span>
                        )}
                        {it.meta && <span style={{ display: "block", fontSize: 9, color: "#94a3b8" }}>{it.meta}</span>}
                      </span>
                      {it.people && it.people.length > 0 && <AvatarStack ids={it.people} people={people} max={4} />}
                      {fb ? (
                        <span style={{ fontSize: 9, fontWeight: 700, color: "#059669", flexShrink: 0 }}>{fb.label}</span>
                      ) : phone ? (
                        <ChevronDown size={14} color="#94a3b8" style={{ flexShrink: 0, transform: nExp ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
                      ) : (
                        <div className="row-actions" style={{ display: "flex", gap: 4, flexShrink: 0, alignItems: "center" }}>
                          <button onClick={() => { setNewsInputOpen(inputOpen ? null : it.id); setNewsInputText(""); }} title="Note to self - saved in the pod for later review" style={{ border: "1px solid #bae6fd", background: "#f0f9ff", color: "#0369a1", borderRadius: 7, padding: "4px 7px", fontSize: 9.5, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
                            {nbusy === "note" ? <SpinLoader size={9} /> : "Note"}
                          </button>
                          <button onClick={() => void newsAct(it, "draft")} title="Draft the response - Slack congrats, doc comment" style={{ position: "relative", border: "1px solid #ddd6fe", background: "#f5f3ff", color: "#7c3aed", borderRadius: 7, padding: "4px 7px", fontSize: 9.5, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
                            {nbusy === "draft" ? <SpinLoader size={9} /> : "Draft"}
                            {!WIRED.agent && <CautionDot />}
                          </button>
                          <button onClick={() => void newsAct(it, "book")} title="Book 15 min to go deeper" style={{ border: "1px solid #c7d2fe", background: "#eef2ff", color: "#4338ca", borderRadius: 7, padding: "4px 7px", fontSize: 9.5, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
                            {nbusy === "book" ? <SpinLoader size={9} /> : "Book"}
                          </button>
                          <DustButton active={inputOpen} wired={WIRED.agent} onClick={() => { setNewsInputOpen(inputOpen ? null : it.id); setNewsInputText(""); }} />
                          <button onClick={() => void newsAct(it, "kill")} title="Dismiss" style={{ border: "1px solid #fecdd3", background: "#fff1f2", color: "#be123c", borderRadius: 7, padding: "4px 7px", fontSize: 9.5, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
                            <X size={9} />
                          </button>
                        </div>
                      )}
                    </div>
                    {phone && nExp && !fb && (
                      <div onClick={(e) => e.stopPropagation()} style={{ display: "flex", gap: 4, marginTop: 6, flexWrap: "wrap", alignItems: "center" }}>
                        <button onClick={() => { setNewsInputOpen(inputOpen ? null : it.id); setNewsInputText(""); }} title="Note to self - saved in the pod for later review" style={{ border: "1px solid #bae6fd", background: "#f0f9ff", color: "#0369a1", borderRadius: 7, padding: "4px 8px", fontSize: 9.5, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
                          {nbusy === "note" ? <SpinLoader size={9} /> : "Note"}
                        </button>
                        <button onClick={() => void newsAct(it, "draft")} title="Draft the response - Slack congrats, doc comment" style={{ position: "relative", border: "1px solid #ddd6fe", background: "#f5f3ff", color: "#7c3aed", borderRadius: 7, padding: "4px 8px", fontSize: 9.5, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
                          {nbusy === "draft" ? <SpinLoader size={9} /> : "Draft"}
                          {!WIRED.agent && <CautionDot />}
                        </button>
                        <button onClick={() => void newsAct(it, "book")} title="Book 15 min to go deeper" style={{ border: "1px solid #c7d2fe", background: "#eef2ff", color: "#4338ca", borderRadius: 7, padding: "4px 8px", fontSize: 9.5, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
                          {nbusy === "book" ? <SpinLoader size={9} /> : "Book"}
                        </button>
                        <DustButton active={inputOpen} wired={WIRED.agent} onClick={() => { setNewsInputOpen(inputOpen ? null : it.id); setNewsInputText(""); }} />
                        <button onClick={() => void newsAct(it, "kill")} title="Dismiss" style={{ border: "1px solid #fecdd3", background: "#fff1f2", color: "#be123c", borderRadius: 7, padding: "4px 8px", fontSize: 9.5, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
                          <X size={9} />
                        </button>
                      </div>
                    )}
                    {inputOpen && !fb && (
                      <div onClick={(e) => e.stopPropagation()} style={{ display: "flex", gap: 5, alignItems: "center", marginTop: 6 }}>
                        <Mic size={11} color="#64748b" style={{ flexShrink: 0 }} />
                        <input
                          value={newsInputText}
                          onChange={(e) => setNewsInputText(e.target.value)}
                          placeholder="Type or dictate context, then Note it or send to the agent"
                          style={{ flex: 1, minWidth: 0, border: "1px solid #e2e8f0", borderRadius: 7, padding: "5px 8px", fontSize: 10.5, outline: "none" }}
                        />
                        <button onClick={() => void newsAct(it, "note", newsInputText)} style={{ border: "1px solid #bae6fd", background: "#f0f9ff", color: "#0369a1", borderRadius: 7, padding: "5px 9px", fontSize: 9.5, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
                          Save note
                        </button>
                        <button onClick={() => void newsAct(it, "agent", newsInputText)} style={{ position: "relative", border: "1px solid #1e293b", background: "#1e293b", color: "#ffffff", borderRadius: 7, padding: "5px 9px", fontSize: 9.5, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
                          Run agent
                          {!WIRED.agent && <CautionDot />}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        ) : rows.length === 0 && tab !== "plate" && tab !== "rituals" ? (
          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, border: "1px dashed #cbd5e1", borderRadius: 10, padding: "0 12px", background: "#ffffff" }}>
            <Radio size={14} color="#b45309" />
            <span style={{ fontSize: 11, color: "#64748b" }}>
              {tab === "pulse"
                ? "Quiet for now. Pulses roll up Team OS and Company OS Slack channels (internal + external) via the morning engine - open News → Pulses to view them."
                : tab === "waiting"
                  ? "Nobody owes you anything right now. Delegations with an owner + poke date surface here, overdue first."
                  : tab === "inbox"
                    ? "Inbox zero. Voice captures and things you said on calls land here for triage."
                    : "Nothing here. The morning engine refreshes this view."}
            </span>
          </div>
        ) : (
          rows.map((item) => {
            const feedback = acted[item.id];
            const busy = pending[item.id];
            const tc = item.triage ? TRIAGE_COLOR[item.triage] : undefined;
            const closed = feedback && (feedback.tone === "done" || feedback.tone === "kill");
            const expanded = phone && expandedId === item.id;
            const sevColor = item.severity === "red" ? "#e11d48" : item.severity === "orange" ? "#d97706" : item.severity === "green" ? "#059669" : null;
            // v14 (item 4): live lifecycle chip when this card has queued agent work
            const qEntry = (Array.isArray((dash as any).queued) ? (dash as any).queued : []).find((q: any) => q.itemId === item.id);
            // v14 (item 5): `primary` renders the always-visible mobile verb (>=32px target)
            const renderBtn = (a: (typeof ACTIONS)[number], big: boolean, primary = false) => {
              const Icon = busy === a.key ? SpinLoader : a.icon;
              const hoverKey = `${item.id}:${a.key}`;
              const hovered = !big && !phone && hoverBtn === hoverKey && !busy && !closed;
              return (
                <button
                  key={a.key}
                  title={a.full}
                  onClick={(e) => {
                    e.stopPropagation();
                    void runAction(item, a.key);
                  }}
                  onMouseEnter={() => {
                    if (!big && !phone) setHoverBtn(hoverKey);
                  }}
                  onMouseLeave={() => {
                    if (!big && !phone) setHoverBtn((h) => (h === hoverKey ? null : h));
                  }}
                  disabled={!!busy || !!closed}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: big ? "center" : "flex-start",
                    gap: 4,
                    border: `1px solid ${hovered ? a.fg : a.bd}`,
                    background: hovered ? a.fg : a.bg,
                    color: hovered ? "#ffffff" : a.fg,
                    borderRadius: big ? 9 : 7,
                    padding: big ? "9px 8px" : primary ? "6px 9px" : "4px 7px",
                    minHeight: big || primary ? 32 : undefined,
                    fontSize: big ? 11 : primary ? 10.5 : 9.5,
                    fontWeight: 700,
                    cursor: busy || closed ? "default" : "pointer",
                    whiteSpace: big ? "normal" : "nowrap",
                    textAlign: "left",
                    lineHeight: 1.25,
                    minWidth: 0,
                    opacity: busy && busy !== a.key ? 0.5 : 1,
                    width: big ? "100%" : undefined,
                    transform: hovered ? "translateY(-1px)" : "none",
                    boxShadow: hovered ? "0 3px 8px rgba(15,23,42,0.18)" : "none",
                    transition: "background 0.15s, color 0.15s, transform 0.15s, box-shadow 0.15s, border-color 0.15s",
                    position: "relative",
                  }}
                >
                  <Icon size={big ? 13 : 10} />
                  {hovered ? a.full : big ? a.full : a.label}
                  {!WIRED[a.key] && <CautionDot />}
                </button>
              );
            };
            return (
              <div
                className="item-row"
                key={item.id}
                onClick={phone ? () => setExpandedId(expanded ? null : item.id) : undefined}
                style={{
                  background: "#ffffff",
                  border: expanded ? "1px solid #c7d2fe" : "1px solid #e2e8f0",
                  borderRadius: 10,
                  padding: "6px 10px",
                  minWidth: 0,
                  opacity: closed ? 0.5 : 1,
                  cursor: phone ? "pointer" : "default",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                  {sevColor && (
                    <span style={{ width: 8, height: 8, borderRadius: 999, background: sevColor, flexShrink: 0 }} />
                  )}
                  <div style={{ flex: 1, minWidth: 0, overflow: "hidden" }}>
                    <div style={{ fontSize: phone ? 12 : 11.5, fontWeight: 600, color: "#1e293b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", textDecoration: closed ? "line-through" : "none" }}>
                      {item.text}
                    </div>
                    <div style={{ fontSize: 9.5, color: hoverBtn?.startsWith(`${item.id}:`) && !feedback ? (ACTIONS.find((x) => x.key === hoverBtn.slice(hoverBtn.lastIndexOf(":") + 1))?.fg ?? "#94a3b8") : feedback?.tone === "error" ? "#be123c" : feedback ? "#047857" : "#94a3b8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontWeight: hoverBtn?.startsWith(`${item.id}:`) && !feedback ? 600 : 400, fontStyle: feedback?.label?.startsWith("[SIM]") ? "italic" : undefined, transition: "color 0.15s" }}>
                      {hoverBtn?.startsWith(`${item.id}:`) && !feedback
                        ? HOVER_DESC[hoverBtn.slice(hoverBtn.lastIndexOf(":") + 1)] ?? item.meta
                        : feedback
                          ? feedback.label
                          : item.meta}
                    </div>
                  </div>
                  {item.people && item.people.length > 0 && (
                    <AvatarStack ids={item.people} people={people} />
                  )}
                  {tc && !phone && (
                    <span style={{ fontSize: 9, fontWeight: 700, color: tc.fg, background: tc.bg, borderRadius: 999, padding: "2px 7px", whiteSpace: "nowrap" }}>
                      {item.triage}
                    </span>
                  )}
                  {qEntry && (
                    /* v14 (item 4): lifecycle chip mirrors the Queue overlay states */
                    (() => {
                      const st = (qEntry.status ?? "queued") as string;
                      const cfg: Record<string, { l: string; fg: string; bg: string; bd: string }> = {
                        queued: { l: "queued", fg: "#475569", bg: "#f1f5f9", bd: "#e2e8f0" },
                        running: { l: "running", fg: "#4338ca", bg: "#eef2ff", bd: "#c7d2fe" },
                        draft_ready: { l: "draft ready", fg: "#b45309", bg: "#fffbeb", bd: "#fde68a" },
                        done: { l: "done", fg: "#15803d", bg: "#f0fdf4", bd: "#bbf7d0" },
                      };
                      const c = cfg[st] ?? cfg.queued;
                      return <span style={{ fontSize: 8.5, fontWeight: 800, color: c.fg, background: c.bg, border: `1px solid ${c.bd}`, borderRadius: 6, padding: "1px 6px", whiteSpace: "nowrap", flexShrink: 0 }}>{c.l}</span>;
                    })()
                  )}
                  {phone ? (
                    /* v14 (item 5): primary verb always visible on mobile; the rest behind tap-to-expand */
                    <span onClick={(e) => e.stopPropagation()} style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
                      {!closed && renderBtn(ACTIONS[0], false, true)}
                      <ChevronDown
                        size={16}
                        color="#94a3b8"
                        onClick={() => setExpandedId(expanded ? null : item.id)}
                        style={{ flexShrink: 0, minWidth: 32, minHeight: 32, padding: 8, boxSizing: "border-box", transform: expanded ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}
                      />
                    </span>
                  ) : (
                    <div style={{ position: "relative", display: "flex", alignItems: "center", flexShrink: 0 }}>
                      <MoreHorizontal className="row-hint" size={14} color="#cbd5e1" style={{ position: "absolute", right: 2 }} />
                      <div className="row-actions" style={{ display: "flex", gap: 4 }}>
                        {ACTIONS.map((a) => renderBtn(a, false))}
                      </div>
                    </div>
                  )}
                </div>
                {expanded && !closed && (
                  <div style={{ marginTop: 6 }}>
                    {item.people && item.people.length > 0 && (
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                        <AvatarStack ids={item.people} people={people} max={5} />
                        <span style={{ fontSize: 9.5, color: "#64748b" }}>
                          {item.people.map((id) => people[id]?.first).filter(Boolean).join(", ")}
                        </span>
                      </div>
                    )}
                    <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: 6 }}>
                      {/* v14 (item 5): primary verb lives on the collapsed row; expand shows the rest */}
                      {ACTIONS.slice(1).map((a) => renderBtn(a, true))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
        {tab === "plate" && (
          /* My plate v12: ONE list of everything Nic owns (commitments + pod tasks),
             source chips, slip badges, add bar on top. */
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 1 }}>
              <ListTodo size={12} color="#047857" />
              <span style={{ fontSize: 10, fontWeight: 700, color: "#047857" }}>EVERYTHING YOU OWN</span>
              {!phone && <span style={{ fontSize: 9, color: "#94a3b8", flex: 1 }}>one list - from calls, the Pod, or added by you</span>}
              {phone && <span style={{ flex: 1 }} />}
              <button
                onClick={() => void refreshTasks()}
                disabled={taskRefreshing}
                title="Pull the latest open tasks from the Pod into this list"
                style={{ display: "flex", alignItems: "center", gap: 4, border: "1px solid #d1fae5", background: "#ecfdf5", color: "#047857", borderRadius: 7, padding: "3px 8px", fontSize: 9.5, fontWeight: 700, cursor: taskRefreshing ? "default" : "pointer" }}
              >
                {taskRefreshing ? <SpinLoader size={10} /> : <RefreshCw size={10} />}
                {taskRefreshing ? "Syncing…" : "Sync Pod"}
              </button>
            </div>

            {/* add bar: always visible, on top */}
            <div style={{ display: "flex", gap: 6, alignItems: "center", border: "1px dashed #a7f3d0", background: "#f0fdf4", borderRadius: 10, padding: "5px 8px", flexShrink: 0 }}>
              <Plus size={12} color="#047857" />
              <input
                value={addText}
                onChange={(e) => setAddText(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") void submitAdd(); }}
                placeholder="Add something to your plate…"
                style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontSize: 11, color: "#1e293b", minWidth: 0 }}
              />
              <button
                onClick={() => void submitAdd()}
                disabled={addState === "sending" || !addText.trim()}
                style={{ border: "1px solid #a7f3d0", background: addText.trim() ? "#047857" : "#ecfdf5", color: addText.trim() ? "#ffffff" : "#047857", borderRadius: 7, padding: "3px 10px", fontSize: 9.5, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}
              >
                {addState === "sending" ? "Adding…" : "Add"}
              </button>
            </div>

            {plateRows.length === 0 ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8, border: "1px dashed #a7f3d0", borderRadius: 10, padding: "10px 12px", background: "#f0fdf4" }}>
                <CheckCircle2 size={14} color="#059669" />
                <span style={{ fontSize: 11, color: "#047857" }}>
                  Plate clear. Pod tasks land here automatically - hit Sync Pod if something is missing.
                </span>
              </div>
            ) : (plateExpanded ? plateRows : plateRows.slice(0, 6)).map((row) => {
              const fb = row.item ? acted[row.key] : taskActed[row.key];
              const busy = pending[row.key];
              const closed = fb && (fb.tone === "done" || fb.tone === "kill" || fb.tone === "complete_task");
              const SrcIcon = row.src.icon;
              const doAction = (k: string) => {
                if (row.item) void runAction(row.item, k);
                else if (row.task) void runTaskAction(row.task, k === "done" ? "complete_task" : k === "agent" ? "start_task_agent" : k);
              };
              const BTNS: { k: string; label: string; icon: React.ComponentType<{ size?: number }>; fg: string; bg: string; bd: string; caution?: string }[] = [
                { k: "done", label: "Done", icon: CheckCircle2, fg: "#047857", bg: "#ecfdf5", bd: "#a7f3d0" },
                { k: "block15", label: "15m", icon: Clock3, fg: "#4338ca", bg: "#eef2ff", bd: "#c7d2fe" },
                { k: "agent", label: "Agent", icon: DustLogo, fg: "#7c3aed", bg: "#f5f3ff", bd: "#ddd6fe", caution: row.task ? undefined : WIRED.agent ? undefined : "Queues the ask - no engine executes it yet" },
                { k: "delegate_ea", label: "EA", icon: Users, fg: "#b45309", bg: "#fffbeb", bd: "#fde68a", caution: WIRED.delegate_ea ? undefined : "Posts to #{{OS_CHANNEL}} - direct EA handoff not wired yet" },
                { k: "tomorrow", label: "Tmrw", icon: Sunrise, fg: "#0369a1", bg: "#f0f9ff", bd: "#bae6fd" },
                { k: "friday", label: "Fri", icon: CalendarClock, fg: "#475569", bg: "#f8fafc", bd: "#e2e8f0" },
                { k: "kill", label: "Kill", icon: X, fg: "#be123c", bg: "#fff1f2", bd: "#fecdd3" },
              ];
              const phoneKeys = ["done", "block15", "agent", "tomorrow"];
              return (
                <div key={row.key} className="item-row" onClick={phone ? () => setExpandedId(expandedId === row.key ? null : row.key) : undefined} style={{ display: "flex", flexDirection: phone ? "column" : "row", alignItems: phone ? "stretch" : "center", gap: phone ? 0 : 8, background: "#ffffff", border: "1px solid #e2e8f0", borderLeft: `3px solid ${row.pushed > 0 ? "#d97706" : "#059669"}`, borderRadius: 10, padding: "6px 10px", opacity: closed ? 0.45 : 1, cursor: phone ? "pointer" : "default" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, minWidth: 0, flex: 1 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: phone ? 12 : 11.5, fontWeight: 600, color: "#1e293b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", textDecoration: closed ? "line-through" : "none" }}>
                        <MetaText text={row.title} />
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 2, minWidth: 0 }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 8.5, fontWeight: 700, color: "#475569", background: "#f1f5f9", borderRadius: 999, padding: "1px 7px", whiteSpace: "nowrap", flexShrink: 0 }}>
                          <SrcIcon size={8} /> {row.src.label}
                        </span>
                        {row.task?.conversationUrl && (
                          <a href={row.task.conversationUrl} target="_blank" rel="noreferrer"
                            style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 8.5, fontWeight: 700, color: "#7c3aed", background: "#f5f3ff", border: "1px solid #ddd6fe", borderRadius: 999, padding: "1px 7px", whiteSpace: "nowrap", flexShrink: 0, textDecoration: "none" }}>
                            <DustLogo size={11} /> Conversation open ↗
                          </a>
                        )}
                        {row.pushed > 0 && (
                          <span style={{ fontSize: 8.5, fontWeight: 700, color: "#b45309", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 999, padding: "1px 7px", whiteSpace: "nowrap", flexShrink: 0 }} title="Pushed forward by the evening reconcile - it slipped past its day">
                            Slipped {row.pushed}×
                          </span>
                        )}
                        <span style={{ fontSize: 9, color: fb?.tone === "error" ? "#be123c" : fb ? "#047857" : "#94a3b8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontStyle: fb?.label?.startsWith("[SIM]") ? "italic" : undefined }}>
                          {fb ? fb.label : <MetaText text={row.sub} />}
                        </span>
                      </div>
                    </div>
                    {row.people && row.people.length > 0 && <AvatarStack ids={row.people} people={people} max={3} />}
                  </div>
                  {!closed && (
                    phone ? (
                      /* v14 (item 5): primary verb (Done) permanently visible; the rest behind tap-to-expand. >=32px targets. */
                      <div onClick={(e) => e.stopPropagation()} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 5 }}>
                          {(() => {
                            const b = BTNS[0];
                            const Ic = b.icon;
                            const busyKey = row.item ? b.k : "complete_task";
                            return (
                              <button key={b.k} onClick={() => doAction(b.k)} disabled={!!busy || !!closed} style={{ display: "flex", alignItems: "center", gap: 4, border: `1px solid ${b.bd}`, background: b.bg, color: b.fg, borderRadius: 7, padding: "6px 10px", minHeight: 32, fontSize: 10.5, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", position: "relative" }}>
                                {busy === busyKey ? <SpinLoader size={11} /> : <Ic size={11} />} {b.label}
                              </button>
                            );
                          })()}
                        </div>
                        <div style={{ display: expandedId !== row.key ? "none" : "flex", gap: 4, flexWrap: "wrap" }}>
                          {BTNS.slice(1).map((b) => {
                            const Ic = b.icon;
                            const busyKey = row.item ? b.k : b.k === "done" ? "complete_task" : b.k === "agent" ? "start_task_agent" : b.k;
                            return (
                              <button key={b.k} onClick={() => doAction(b.k)} disabled={!!busy || !!closed} style={{ display: "flex", alignItems: "center", gap: 3, border: `1px solid ${b.bd}`, background: b.bg, color: b.fg, borderRadius: 6, padding: "6px 10px", minHeight: 32, fontSize: 10, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", position: "relative" }}>
                                {busy === busyKey ? <SpinLoader size={10} /> : <Ic size={10} />} {b.label}
                                {b.caution && <CautionDot label={b.caution} />}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div style={{ position: "relative", display: "flex", alignItems: "center", flexShrink: 0 }}>
                        <MoreHorizontal className="row-hint" size={14} color="#cbd5e1" style={{ position: "absolute", right: 2 }} />
                        <div className="row-actions" style={{ display: "flex", gap: 4 }}>
                          {BTNS.map((b) => {
                            const Ic = b.icon;
                            const busyKey = row.item ? b.k : b.k === "done" ? "complete_task" : b.k === "agent" ? "start_task_agent" : b.k;
                            const hoverKey = `${row.key}:${b.k}`;
                            const hovered = hoverBtn === hoverKey && !busy && !closed;
                            return (
                              <button
                                key={b.k}
                                title={b.caution ?? b.label}
                                onClick={() => doAction(b.k)}
                                onMouseEnter={() => setHoverBtn(hoverKey)}
                                onMouseLeave={() => setHoverBtn((h) => (h === hoverKey ? null : h))}
                                disabled={!!busy || !!closed}
                                style={{
                                  display: "flex", alignItems: "center", gap: 3,
                                  border: `1px solid ${hovered ? b.fg : b.bd}`,
                                  background: hovered ? b.fg : b.bg,
                                  color: hovered ? "#ffffff" : b.fg,
                                  borderRadius: 6, padding: "4px 7px", fontSize: 9.5, fontWeight: 700,
                                  cursor: busy || closed ? "default" : "pointer", whiteSpace: "nowrap",
                                  position: "relative",
                                  transform: hovered ? "translateY(-1px)" : "none",
                                  boxShadow: hovered ? "0 3px 8px rgba(15,23,42,0.18)" : "none",
                                  transition: "background 0.15s, color 0.15s, transform 0.15s, box-shadow 0.15s, border-color 0.15s",
                                  opacity: busy && busy !== busyKey ? 0.5 : 1,
                                }}
                              >
                                {busy === busyKey ? <SpinLoader size={9} /> : <Ic size={9} />} {b.label}
                                {b.caution && <CautionDot label={b.caution} />}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )
                  )}
                </div>
              );
            })}
            {plateRows.length > 6 && (
              <button
                onClick={() => setPlateExpanded((v) => !v)}
                style={{ alignSelf: "flex-start", border: "1px solid #d1fae5", background: "#ecfdf5", color: "#047857", borderRadius: 7, padding: "3px 10px", fontSize: 9.5, fontWeight: 700, cursor: "pointer" }}
              >
                {plateExpanded ? "Show less" : `Show all ${plateRows.length}`}
              </button>
            )}
          </div>
        )}
        {tab === "rituals" && (
          /* Rituals: recurring CEO habits. Due-today cards on top, weekly cadence below. */
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Repeat size={12} color="#7c3aed" />
              <span style={{ fontSize: 10, fontWeight: 700, color: "#7c3aed" }}>DUE TODAY</span>
              {!phone && <span style={{ fontSize: 9, color: "#94a3b8", flex: 1 }}>recurring habits - engines draft the output ahead of time</span>}
            </div>
            {ritualsDue.length === 0 ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8, border: "1px dashed #ddd6fe", borderRadius: 10, padding: "9px 12px", background: "#faf5ff" }}>
                <CheckCircle2 size={13} color="#7c3aed" />
                <span style={{ fontSize: 11, color: "#6d28d9" }}>Nothing due today. Each ritual surfaces here on its day, draft ready.</span>
              </div>
            ) : ritualsDue.map((r) => {
              const fb = acted[r.id];
              const busy = pending[r.id];
              const closed = fb && (fb.tone === "done" || fb.tone === "kill");
              return (
                <div key={r.id} className="item-row" onClick={phone ? () => setExpandedId(expandedId === r.id ? null : r.id) : undefined} style={{ display: "flex", flexDirection: phone ? "column" : "row", alignItems: phone ? "stretch" : "center", gap: phone ? 0 : 8, background: "#ffffff", border: "1px solid #ddd6fe", borderLeft: "3px solid #7c3aed", borderRadius: 10, padding: "6px 10px", opacity: closed ? 0.45 : 1, cursor: phone ? "pointer" : "default" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: phone ? 12 : 11.5, fontWeight: 600, color: "#1e293b", textDecoration: closed ? "line-through" : "none", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.text}</div>
                    <div style={{ fontSize: 9.5, color: fb?.tone === "error" ? "#be123c" : fb ? "#047857" : "#94a3b8", marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {fb ? fb.label : <MetaText text={r.meta} />}
                    </div>
                  </div>
                  {!closed && (
                    <div className={phone ? undefined : "row-actions"} onClick={phone ? (e) => e.stopPropagation() : undefined} style={{ display: phone && expandedId !== r.id ? "none" : "flex", gap: 4, marginTop: phone ? 5 : 0, flexShrink: 0 }}>
                      <button onClick={() => void runAction(r, "done")} disabled={!!busy}
                        style={{ display: "flex", alignItems: "center", gap: 3, border: "1px solid #a7f3d0", background: "#ecfdf5", color: "#047857", borderRadius: 6, padding: "3px 8px", fontSize: 9.5, fontWeight: 700, cursor: "pointer" }}>
                        {busy === "done" ? <SpinLoader size={9} /> : <CheckCircle2 size={9} />} Done
                      </button>
                      <button onClick={() => void runAction(r, "tomorrow")} disabled={!!busy}
                        style={{ display: "flex", alignItems: "center", gap: 3, border: "1px solid #bae6fd", background: "#f0f9ff", color: "#0369a1", borderRadius: 6, padding: "3px 8px", fontSize: 9.5, fontWeight: 700, cursor: "pointer" }}>
                        {busy === "tomorrow" ? <SpinLoader size={9} /> : <Sunrise size={9} />} Tmrw
                      </button>
                      <button onClick={() => void runAction(r, "kill")} disabled={!!busy}
                        style={{ display: "flex", alignItems: "center", gap: 3, border: "1px solid #fecdd3", background: "#fff1f2", color: "#be123c", borderRadius: 6, padding: "3px 8px", fontSize: 9.5, fontWeight: 700, cursor: "pointer" }}>
                        {busy === "kill" ? <SpinLoader size={9} /> : <X size={9} />} Skip
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
              <CalendarClock size={12} color="#64748b" />
              <span style={{ fontSize: 10, fontWeight: 700, color: "#475569" }}>WEEKLY CADENCE</span>
            </div>
            {(dash.rituals ?? []).length === 0 ? (
              <div style={{ fontSize: 10, color: "#94a3b8", paddingLeft: 2 }}>No rituals registered yet - they live in me/rituals.json.</div>
            ) : (dash.rituals ?? []).map((r) => {
              const todayName = new Intl.DateTimeFormat("en-US", { weekday: "long", timeZone: "America/New_York" }).format(new Date()).toLowerCase();
              const isToday = todayName === r.day.toLowerCase();
              return (
                <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 8, background: isToday ? "#faf5ff" : "#ffffff", border: isToday ? "1px solid #ddd6fe" : "1px solid #f1f5f9", borderRadius: 10, padding: "6px 10px" }}>
                  <span style={{ fontSize: 8.5, fontWeight: 800, color: isToday ? "#7c3aed" : "#64748b", background: isToday ? "#ede9fe" : "#f8fafc", borderRadius: 999, padding: "2px 8px", textTransform: "uppercase", flexShrink: 0 }}>
                    {r.day.slice(0, 3)}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "#1e293b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.name}</div>
                    <div style={{ fontSize: 9, color: "#94a3b8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {r.output}{r.draft_by ? ` · draft ready by ${r.draft_by}` : ""}
                    </div>
                  </div>
                  {isToday && <span style={{ fontSize: 8.5, fontWeight: 700, color: "#7c3aed", flexShrink: 0 }}>TODAY</span>}
                </div>
              );
            })}
          </div>
        )}
        {tab !== "steer" && LIST_KEY[tab] && (
          addOpen ? (
            <div style={{ display: "flex", gap: 6, alignItems: "center", border: "1px solid #c7d2fe", background: "#ffffff", borderRadius: 10, padding: "6px 10px", flexShrink: 0 }}>
              <Plus size={12} color="#6366f1" style={{ flexShrink: 0 }} />
              <input
                autoFocus
                value={addText}
                onChange={(e) => setAddText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void submitAdd();
                  if (e.key === "Escape") {
                    setAddOpen(false);
                    setAddText("");
                    setAddState("idle");
                  }
                }}
                placeholder={`Add ${ADD_LABEL[tab]} - Enter to save, Esc to cancel`}
                style={{ flex: 1, minWidth: 0, border: "none", outline: "none", fontSize: 11.5, color: "#1e293b", background: "transparent" }}
              />
              <button
                onClick={() => void submitAdd()}
                disabled={!addText.trim() || addState === "sending"}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  border: "1px solid #4338ca",
                  background: addText.trim() ? "#4338ca" : "#e0e7ff",
                  color: addText.trim() ? "#ffffff" : "#818cf8",
                  borderRadius: 7,
                  padding: "4px 9px",
                  fontSize: 10,
                  fontWeight: 700,
                  cursor: addText.trim() ? "pointer" : "default",
                  whiteSpace: "nowrap",
                }}
              >
                {addState === "sending" ? <SpinLoader size={11} /> : <Plus size={11} />}
                {addState === "sending" ? "Adding" : addState === "error" ? "Retry" : "Add"}
              </button>
              <button
                onClick={() => {
                  setAddOpen(false);
                  setAddText("");
                  setAddState("idle");
                }}
                style={{ border: "none", background: "transparent", cursor: "pointer", color: "#94a3b8", padding: 2, flexShrink: 0 }}
              >
                <X size={12} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setAddOpen(true)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                border: "1px dashed #c7d2fe",
                background: "transparent",
                color: "#6366f1",
                borderRadius: 10,
                padding: "6px 10px",
                fontSize: 10.5,
                fontWeight: 700,
                cursor: "pointer",
                flexShrink: 0,
              }}
            >
              <Plus size={12} />
              Add {ADD_LABEL[tab]}
            </button>
          )
        )}
        {tab !== "steer" && extra > 0 && (
          <div style={{ fontSize: 9.5, color: "#6366f1", fontWeight: 600, paddingLeft: 2 }}>
            +{extra} more in the pod
          </div>
        )}
      </div>

      {/* Standard toast (Pod Frame Action Buttons skill): fixed bottom-right overlay,
          consistent position across pods. */}
      {toasts.length > 0 && (
        // v14 (item 5): phones get bottom-center toasts within thumb reach; web keeps top-right
        <div style={{ position: "absolute", ...(phone ? { bottom: 8, left: 8, right: 8 } : { top: 8, right: 8 }), zIndex: 60, display: "flex", flexDirection: "column", gap: 4, maxWidth: phone ? undefined : 420, pointerEvents: "none" }}>
          {toasts.map((t) => {
            const isOk = t.tone === "ok";
            const isQ = t.tone === "queued";
            const isErr = t.tone === "error";
            const bg = isErr ? "#fff1f2" : isQ ? "#fffbeb" : "#f0fdf4";
            const border = isErr ? "#fecdd3" : isQ ? "#fde68a" : "#bbf7d0";
            const fg = isErr ? "#be123c" : isQ ? "#b45309" : "#15803d";
            const icon = isErr ? "❌" : isQ ? "⏳" : "✅";
            return (
              <div
                key={t.id}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 7,
                  background: bg,
                  border: `1px solid ${border}`,
                  borderRadius: 9,
                  padding: "6px 10px",
                  animation: "fadeIn 0.2s ease",
                  pointerEvents: "auto",
                }}
              >
                <span style={{ fontSize: 12, flexShrink: 0 }}>{icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: fg, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.label}</div>
                  <div style={{ fontSize: 9.5, color: fg, opacity: 0.8, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.detail}</div>
                </div>
                {t.action && (
                  // v14 (item 3): inline Undo button (10s window for Kill / 15m booking)
                  <button
                    onClick={() => { t.action!.onClick(); dismissToast(t.id); }}
                    style={{ border: `1px solid ${border}`, background: "#ffffff", cursor: "pointer", color: fg, fontSize: 10.5, fontWeight: 800, borderRadius: 7, padding: "4px 10px", minHeight: 26, flexShrink: 0, alignSelf: "center" }}
                  >
                    {t.action.label}
                  </button>
                )}
                <button
                  onClick={() => setToasts((ts) => ts.filter((x) => x.id !== t.id))}
                  style={{ border: "none", background: "transparent", cursor: "pointer", color: fg, padding: 0, opacity: 0.6, flexShrink: 0 }}
                >
                  <X size={11} />
                </button>
              </div>
            );
          })}
        </div>
      )}
      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.45; } } @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } } @keyframes dust-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } } .dust-spinner { animation: dust-spin 0.8s linear infinite; transform-origin: center; display: inline-flex; align-items: center; justify-content: center; } .tab-scroll-row { scrollbar-width: none; -ms-overflow-style: none; } .tab-scroll-row::-webkit-scrollbar { display: none; } .item-row .row-actions { opacity: 0; pointer-events: none; max-width: 0; overflow: hidden; transition: opacity 0.15s, max-width 0.22s ease; } .item-row:hover .row-actions, .item-row:focus-within .row-actions { opacity: 1; pointer-events: auto; max-width: 700px; overflow: visible; } .item-row .row-hint { opacity: 0.7; transition: opacity 0.15s; } .item-row:hover .row-hint { opacity: 0; } .item-row { transition: box-shadow 0.18s ease, transform 0.18s ease; } .item-row:hover { box-shadow: 0 3px 12px rgba(15,23,42,0.10); transform: translateY(-1px); } .item-row a:hover { text-decoration: underline; } .hdr-row > button, .hdr-row a { transition: transform 0.15s ease, box-shadow 0.15s ease; } .hdr-row > button:hover, .hdr-row a:hover { transform: translateY(-1px); box-shadow: 0 2px 8px rgba(30,27,75,0.16); } .tab-scroll-row > button { transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease; } .tab-scroll-row > button:hover { transform: translateY(-1px); box-shadow: 0 2px 8px rgba(67,56,202,0.16); }`}</style>
    </div>
  );
}

// Reliable spin wrapper — avoids brittle Lucide class-name selectors
function SpinLoader({ size = 12 }: { size?: number }) {
  // v13: dual fallback - .dust-spinner keyframes AND Tailwind's animate-spin,
  // so the icon rotates regardless of which CSS pipeline the frame runtime keeps.
  return (
    <span className="dust-spinner" style={{ display: "inline-flex", alignItems: "center" }}>
      <Loader2 size={size} className="animate-spin" />
    </span>
  );
}

function CautionDot({ label = "Not fully wired yet - agentic backend coming" }: { label?: string }) {
  return (
    <span
      title={label}
      style={{
        position: "absolute", top: -4, right: -4, width: 11, height: 11, borderRadius: "50%",
        background: "#f59e0b", border: "1.5px solid #ffffff", display: "flex", alignItems: "center",
        justifyContent: "center", fontSize: 7.5, fontWeight: 900, color: "#ffffff", lineHeight: 1, zIndex: 2,
      }}
    >
      !
    </span>
  );
}

// The Dust button: a small brand-colored square that means "hand this to an agent,
// with my context first". Reusable on any item type - drop it next to row actions.
function DustButton({ onClick, active, wired }: { onClick: (e: React.MouseEvent) => void; active?: boolean; wired?: boolean }) {
  return (
    <button
      onClick={onClick}
      title="Send to agent - add context by typing or dictating first"
      style={{
        position: "relative", width: 22, height: 22, borderRadius: 6, padding: 2,
        border: active ? "1.5px solid #1e293b" : "1.5px solid #e2e8f0",
        background: "#ffffff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}
    >
      <span style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5, width: 14, height: 14 }}>
        <span style={{ background: "#61A5FA", borderRadius: "3px 1px 1px 1px" }} />
        <span style={{ background: "#FCD34D", borderRadius: "1px 3px 1px 1px" }} />
        <span style={{ background: "#F87171", borderRadius: "1px 1px 1px 3px" }} />
        <span style={{ background: "#34D399", borderRadius: "1px 1px 3px 1px" }} />
      </span>
      {!wired && <CautionDot label="Queues for the agent system - execution engine not wired yet" />}
    </button>
  );
}

function Avatar({ person, size = 20 }: { person: Person; size?: number }) {
  const [imgFailed, setImgFailed] = useState(false);
  const showImg = person.avatarUrl && !imgFailed;
  return (
    <div
      title={person.name}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: showImg ? "transparent" : person.color,
        border: "1.5px solid #ffffff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.38,
        fontWeight: 700,
        color: "#ffffff",
        flexShrink: 0,
        overflow: "hidden",
        boxShadow: "0 0 0 1px rgba(0,0,0,0.08)",
      }}
    >
      {showImg ? (
        <img
          src={person.avatarUrl!}
          alt={person.initials}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
          onError={() => setImgFailed(true)}
        />
      ) : (
        person.initials
      )}
    </div>
  );
}

function AvatarStack({ ids, people, max = 3 }: { ids: string[]; people: Record<string, Person>; max?: number }) {
  const resolved = ids.map((id) => people[id]).filter(Boolean);
  if (resolved.length === 0) return null;
  const visible = resolved.slice(0, max);
  const overflow = resolved.length - visible.length;
  return (
    <div style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
      {visible.map((p, i) => (
        <div key={p.slackId} style={{ marginLeft: i === 0 ? 0 : -8, zIndex: visible.length - i }}>
          <Avatar person={p} size={26} />
        </div>
      ))}
      {overflow > 0 && (
        <div
          style={{
            width: 26, height: 26, borderRadius: "50%",
            background: "#e2e8f0", border: "1.5px solid #ffffff",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 9, fontWeight: 700, color: "#64748b",
            marginLeft: -8, flexShrink: 0,
          }}
        >
          +{overflow}
        </div>
      )}
    </div>
  );
}

function Chip({
  label,
  selected,
  onClick,
  color,
  title,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
  color: string;
  title?: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        border: `1px solid ${selected ? color : "#e2e8f0"}`,
        background: selected ? color : "#ffffff",
        color: selected ? "#ffffff" : "#64748b",
        borderRadius: 999,
        padding: "2px 8px",
        fontSize: 9.5,
        fontWeight: 700,
        cursor: "pointer",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </button>
  );
}

// ─── Timer helpers for AsksTab ─────────────────────────────────────────────

function getAskHours(askedAt: string): number {
  return (Date.now() - new Date(askedAt).getTime()) / 3600000;
}

function getTimerColor(hours: number): string {
  if (hours < 2) return "#059669";   // green
  if (hours < 4) return "#d97706";   // amber
  if (hours < 6) return "#ea580c";   // orange
  return "#dc2626";                  // reddest
}

function formatAskAge(hours: number): string {
  if (hours < 1) {
    const m = Math.round(hours * 60);
    return `${m}m`;
  }
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return m > 0 ? `${h}h${m.toString().padStart(2, "0")}m` : `${h}h`;
}

const PRIORITY_META: Record<string, { label: string; color: string; bg: string }> = {
  urgent: { label: "URGENT", color: "#dc2626", bg: "#fff1f2" },
  high:   { label: "HIGH",   color: "#ea580c", bg: "#fff7ed" },
  normal: { label: "NORMAL", color: "#4338ca", bg: "#eef2ff" },
  low:    { label: "LOW",    color: "#64748b", bg: "#f8fafc" },
};

const TAG_COLOR: Record<string, { color: string; bg: string }> = {
  deal:    { color: "#c2410c", bg: "#fff7ed" },
  pricing: { color: "#7c3aed", bg: "#f5f3ff" },
  hiring:  { color: "#0d9488", bg: "#f0fdfa" },
  product: { color: "#0369a1", bg: "#eff6ff" },
  ops:     { color: "#475569", bg: "#f1f5f9" },
  finance: { color: "#b45309", bg: "#fffbeb" },
  eng:     { color: "#0369a1", bg: "#eff6ff" },
  GTM:     { color: "#c2410c", bg: "#fff7ed" },
};

function AsksTab({
  asks,
  people,
  phone,
  act,
}: {
  asks: CeoAsk[];
  people: Record<string, Person>;
  phone: boolean;
  act: (ask: CeoAsk, kind: "reply" | "reroute" | "triage" | "escalate") => Promise<boolean>;
}) {
  const [doneIds, setDoneIds] = useState<Set<string>>(new Set());
  const [now, setNow] = useState(Date.now());
  const [busy, setBusy] = useState<Record<string, string>>({});
  const [fbMap, setFbMap] = useState<Record<string, string>>({});
  const [exp, setExp] = useState<string | null>(null);
  const run = async (ask: CeoAsk, kind: "reply" | "reroute" | "triage" | "escalate") => {
    if (busy[ask.id]) return;
    setBusy((m) => ({ ...m, [ask.id]: kind }));
    const ok = await act(ask, kind);
    setBusy((m) => { const n = { ...m }; delete n[ask.id]; return n; });
    if (ok) setFbMap((m) => ({ ...m, [ask.id]: kind === "reply" ? "Reply draft queued" : kind === "reroute" ? "Reroute queued" : kind === "triage" ? "Triaged to inbox" : "Escalation queued" }));
  };

  // Tick every 30s so timers stay fresh
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);

  const open = asks.filter((a) => !a.done && !doneIds.has(a.id));
  // Sort: urgent first, then by age descending (oldest on top)
  const sorted = [...open].sort((a, b) => {
    const po: Record<string, number> = { urgent: 0, high: 1, normal: 2, low: 3 };
    const pa = po[a.priority ?? "normal"] ?? 2;
    const pb = po[b.priority ?? "normal"] ?? 2;
    if (pa !== pb) return pa - pb;
    return new Date(a.askedAt).getTime() - new Date(b.askedAt).getTime();
  });

  if (sorted.length === 0) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8, border: "1px dashed #cbd5e1", borderRadius: 10, padding: "12px 14px", background: "#ffffff" }}>
        <Zap size={14} color="#059669" />
        <span style={{ fontSize: 11, color: "#64748b" }}>No open asks. You're clear.</span>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, paddingBottom: 2 }}>
        <Timer size={11} color="#64748b" />
        <span style={{ fontSize: 9.5, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.4 }}>
          Asks · {sorted.length} open
        </span>
        <span style={{ fontSize: 9, color: "#94a3b8", marginLeft: "auto" }}>Timer turns red after 6 h</span>
      </div>
      {sorted.map((ask) => {
        const hours = (now - new Date(ask.askedAt).getTime()) / 3600000;
        const timerColor = getTimerColor(hours);
        const ageLabel = formatAskAge(hours);
        const pMeta = PRIORITY_META[ask.priority ?? "normal"] ?? PRIORITY_META.normal;
        const requesterPerson = ask.requesterId ? people[ask.requesterId] : undefined;
        const aBusy = busy[ask.id];
        const aFb = fbMap[ask.id];
        const aExp = exp === ask.id;
        return (
          <div
            key={ask.id}
            className="item-row"
            onClick={phone ? () => setExp(aExp ? null : ask.id) : undefined}
            style={{ display: "flex", flexDirection: phone ? "column" : "row", alignItems: phone ? "stretch" : "center", gap: phone ? 4 : 8, background: "#ffffff", border: "1px solid #e2e8f0", borderLeft: `3px solid ${timerColor}`, borderRadius: 10, padding: "7px 10px", cursor: phone ? "pointer" : "default" }}
          >
            {/* Left: ask text + subtext / Middle: face + timer + priority */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div title={ask.ask} style={{ fontSize: phone ? 12 : 11, fontWeight: 600, color: "#1e293b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ask.ask}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 2, minWidth: 0, overflow: "hidden" }}>
                  <span style={{ fontSize: 9, fontWeight: 700, color: "#475569", whiteSpace: "nowrap", flexShrink: 0 }}>{ask.requester}</span>
                  {(ask.tags ?? []).map((tag) => {
                    const tc = TAG_COLOR[tag] ?? { color: "#475569", bg: "#f1f5f9" };
                    return (
                      <span key={tag} style={{ fontSize: 8, fontWeight: 700, color: tc.color, background: tc.bg, borderRadius: 4, padding: "1px 5px", textTransform: "uppercase", flexShrink: 0 }}>
                        {tag}
                      </span>
                    );
                  })}
                  {ask.channelId && (
                    <a
                      href={ask.slackLink ?? `https://{{SLACK_WORKSPACE}}.slack.com/archives/${ask.channelId}`}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 9, color: "#611f69", fontWeight: 600, textDecoration: "none", whiteSpace: "nowrap", flexShrink: 0 }}
                    >
                      <Slack size={9} color="#611f69" />
                      {ask.channel ?? "Slack"}
                      <ExternalLink size={8} color="#94a3b8" />
                    </a>
                  )}
                  {aFb && <span style={{ fontSize: 9, fontWeight: 700, color: "#047857", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{aFb}</span>}
                </div>
              </div>
              {requesterPerson && <Avatar person={requesterPerson} size={22} />}
              <span
                title={`Asked ${new Date(ask.askedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`}
                style={{ display: "flex", alignItems: "center", gap: 3, background: timerColor + "18", color: timerColor, border: `1px solid ${timerColor}44`, borderRadius: 999, padding: "2px 7px", fontSize: 9.5, fontWeight: 800, flexShrink: 0, fontVariantNumeric: "tabular-nums" }}
              >
                <Timer size={9} />
                {ageLabel}
              </span>
              <span style={{ fontSize: 8, fontWeight: 800, color: pMeta.color, background: pMeta.bg, borderRadius: 4, padding: "1px 5px", flexShrink: 0 }}>
                {pMeta.label}
              </span>
            </div>
            {/* Right: actions - reach out directly, reroute, triage, escalate, done */}
            <div className={phone ? undefined : "row-actions"} onClick={phone ? (e) => e.stopPropagation() : undefined} style={{ display: phone && !aExp ? "none" : "flex", gap: 4, marginTop: phone ? 4 : 0, flexWrap: phone ? "wrap" : "nowrap", flexShrink: 0, alignItems: "center" }}>
              <button onClick={() => void run(ask, "reply")} disabled={!!aBusy} title="Reach out directly - agent drafts a Slack reply from you" style={{ display: "flex", alignItems: "center", gap: 3, border: "1px solid #c7d2fe", background: "#eef2ff", color: "#4338ca", borderRadius: 6, padding: "3px 8px", fontSize: 9.5, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
                {aBusy === "reply" ? <SpinLoader size={9} /> : <Send size={9} />} Reply
              </button>
              <button onClick={() => void run(ask, "reroute")} disabled={!!aBusy} title="Ask someone else - agent finds the right owner and drafts the redirect" style={{ display: "flex", alignItems: "center", gap: 3, border: "1px solid #fde68a", background: "#fffbeb", color: "#b45309", borderRadius: 6, padding: "3px 8px", fontSize: 9.5, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
                {aBusy === "reroute" ? <SpinLoader size={9} /> : <Users size={9} />} Reroute
              </button>
              <button onClick={() => void run(ask, "triage")} disabled={!!aBusy} title="Park it in the inbox to handle later" style={{ display: "flex", alignItems: "center", gap: 3, border: "1px solid #e2e8f0", background: "#f8fafc", color: "#475569", borderRadius: 6, padding: "3px 8px", fontSize: 9.5, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
                {aBusy === "triage" ? <SpinLoader size={9} /> : <Inbox size={9} />} Triage
              </button>
              <button onClick={() => void run(ask, "escalate")} disabled={!!aBusy} title="Escalate - flag in #{{OS_CHANNEL}} with context and a proposed next step" style={{ display: "flex", alignItems: "center", gap: 3, border: "1px solid #fecdd3", background: "#fff1f2", color: "#be123c", borderRadius: 6, padding: "3px 8px", fontSize: 9.5, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
                {aBusy === "escalate" ? <SpinLoader size={9} /> : <BellRing size={9} />} Esc
              </button>
              <button onClick={() => setDoneIds((s) => new Set([...s, ask.id]))} disabled={!!aBusy} title="Mark answered" style={{ display: "flex", alignItems: "center", gap: 3, border: "1px solid #a7f3d0", background: "#ecfdf5", color: "#047857", borderRadius: 6, padding: "3px 8px", fontSize: 9.5, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
                <CheckCircle2 size={9} /> Done
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
