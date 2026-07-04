"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Role = "user" | "assistant" | "system";

interface UiMessage {
  id: string;
  role: Role;
  content: string;
  toolEvents?: ToolEvent[];
}

interface ToolEvent {
  callId: string;
  name: string;
  cost?: number;
  publisher?: string;
  txHash?: string;
  settlementMode?: "gateway" | "local" | "demo";
  status: "pending" | "paid" | "failed";
  error?: string;
}

interface Session {
  id: string;
  title: string;
  updatedAt: number;
  messages: UiMessage[];
}

interface LedgerEntry {
  id: string;
  ts: number;
  toolId: string;
  publisherName: string;
  callerId: string;
  priceUsd: number;
  txHash?: string;
  settlementMode?: "gateway" | "local" | "demo";
  status: "paid" | "pending" | "failed";
}

// ---------------------------------------------------------------------------
// Constants + storage
// ---------------------------------------------------------------------------

const SUGGESTIONS = [
  "A wallet just aped $50K into this Solana mint right now: EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v. Should I follow?",
  "A fresh Solana token just launched with big buys. Is it safe or a rug? Check the latest data.",
  "What's the current price of ETH in USD?",
  "Live weather right now in New York.",
  "Convert 100 EUR to USDC using live rates.",
] as const;

const SESSIONS_KEY = "keryx.ask.sessions.v2";
const CURRENT_KEY = "keryx.ask.current.v2";
const SESSION_LIMIT = 20;
const MESSAGE_LIMIT_PER_SESSION = 32;

function newId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function loadSessions(): Session[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(SESSIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (s): s is Session =>
        s && typeof s === "object" &&
        typeof s.id === "string" &&
        typeof s.title === "string" &&
        typeof s.updatedAt === "number" &&
        Array.isArray(s.messages),
    );
  } catch {
    return [];
  }
}

function saveSessions(sessions: Session[]) {
  if (typeof window === "undefined") return;
  try {
    const trimmed = sessions.slice(0, SESSION_LIMIT).map((s) => ({
      ...s,
      messages: s.messages.slice(-MESSAGE_LIMIT_PER_SESSION),
    }));
    window.localStorage.setItem(SESSIONS_KEY, JSON.stringify(trimmed));
  } catch {
    /* quota / private browsing */
  }
}

function loadCurrent(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(CURRENT_KEY);
  } catch {
    return null;
  }
}

function saveCurrent(id: string | null) {
  if (typeof window === "undefined") return;
  try {
    if (id) window.localStorage.setItem(CURRENT_KEY, id);
    else window.localStorage.removeItem(CURRENT_KEY);
  } catch {
    /* quota / private browsing */
  }
}

function titleFor(messages: UiMessage[]): string {
  const first = messages.find((m) => m.role === "user")?.content?.trim();
  if (!first) return "New conversation";
  return first.length > 44 ? first.slice(0, 44) + "…" : first;
}

// ---------------------------------------------------------------------------
// AI SDK data-stream parser
// ---------------------------------------------------------------------------

async function* readSseLines(body: ReadableStream<Uint8Array>) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) if (line.length > 0) yield line;
  }
  if (buffer.length > 0) yield buffer;
}

type Parsed =
  | { kind: "text"; delta: string }
  | { kind: "toolCall"; callId: string; name: string }
  | {
      kind: "toolResult";
      callId: string;
      name: string;
      ok: boolean;
      cost?: number;
      txHash?: string;
      settlementMode?: "gateway" | "local" | "demo";
      error?: string;
    }
  | { kind: "done" }
  | { kind: "error"; msg: string }
  | null;

function parseLine(line: string): Parsed {
  const colon = line.indexOf(":");
  if (colon <= 0) return null;
  const tag = line.slice(0, colon);
  const rest = line.slice(colon + 1);
  try {
    const data = JSON.parse(rest);
    if (tag === "0") return { kind: "text", delta: typeof data === "string" ? data : String(data) };
    if (tag === "9") {
      const name = typeof data?.toolName === "string" ? data.toolName : "unknown";
      const callId = typeof data?.toolCallId === "string" ? data.toolCallId : name;
      return { kind: "toolCall", callId, name };
    }
    if (tag === "a") {
      const name = typeof data?.toolName === "string" ? data.toolName : "unknown";
      const callId = typeof data?.toolCallId === "string" ? data.toolCallId : name;
      const result = data?.result;
      const ok = !(result && typeof result === "object" && "error" in result);
      const cost =
        result && typeof result === "object" && "paid" in result && result.paid?.priceUsd
          ? Number(result.paid.priceUsd)
          : undefined;
      const txHash =
        result && typeof result === "object" && "txHash" in result && typeof result.txHash === "string"
          ? result.txHash
          : undefined;
      const settlementMode =
        result && typeof result === "object" && "settlementMode" in result && typeof result.settlementMode === "string"
          ? (result.settlementMode as "gateway" | "local" | "demo")
          : undefined;
      const errorDetail =
        result && typeof result === "object" && "error" in result
          ? (typeof (result as any).detail === "string" ? (result as any).detail : (result as any).error)
          : undefined;
      return { kind: "toolResult", callId, name, ok, cost, txHash, settlementMode, error: errorDetail };
    }
    if (tag === "d") return { kind: "done" };
    if (tag === "3") return { kind: "error", msg: typeof data === "string" ? data : "stream_error" };
  } catch {
    return null;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Root component
// ---------------------------------------------------------------------------

export default function AskClient() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  const agentId = useMemo(() => `web-${Math.random().toString(36).slice(2, 8)}`, []);

  // hydrate on mount
  useEffect(() => {
    const s = loadSessions();
    const cur = loadCurrent();
    setSessions(s);
    setCurrentId(cur && s.some((x) => x.id === cur) ? cur : null);
    setHydrated(true);
  }, []);

  // persist whenever sessions or current change
  useEffect(() => {
    if (hydrated) {
      saveSessions(sessions);
      saveCurrent(currentId);
    }
  }, [sessions, currentId, hydrated]);

  const current = useMemo(
    () => sessions.find((s) => s.id === currentId) ?? null,
    [sessions, currentId],
  );
  const messages = current?.messages ?? [];

  useEffect(() => {
    if (!scrollerRef.current) return;
    scrollerRef.current.scrollTop = scrollerRef.current.scrollHeight;
  }, [messages]);

  const canSend = input.trim().length > 0 && !busy;

  // ---- session mutations ------------------------------------------------
  //
  // Mutations take an explicit session id so concurrent React state updates
  // (esp. streaming responses that call patch many times in a burst) all
  // target the same session. Relying on the currentId closure caused a bug
  // where every streamed chunk spawned a fresh "New conversation" row.

  const patchSession = useCallback(
    (sid: string, mut: (m: UiMessage[]) => UiMessage[]) => {
      setSessions((prev) => {
        const idx = prev.findIndex((s) => s.id === sid);
        if (idx === -1) {
          const nextMessages = mut([]);
          const fresh: Session = {
            id: sid,
            title: titleFor(nextMessages),
            updatedAt: Date.now(),
            messages: nextMessages,
          };
          return [fresh, ...prev];
        }
        const nextMessages = mut(prev[idx].messages);
        const updated: Session = {
          ...prev[idx],
          messages: nextMessages,
          title:
            prev[idx].title === "New conversation" || !prev[idx].title
              ? titleFor(nextMessages)
              : prev[idx].title,
          updatedAt: Date.now(),
        };
        return [updated, ...prev.filter((_, i) => i !== idx)];
      });
    },
    [],
  );

  function newConversation() {
    if (busy) abortRef.current?.abort();
    setCurrentId(null);
    setInput("");
  }

  function switchTo(id: string) {
    if (busy) abortRef.current?.abort();
    setCurrentId(id);
    setInput("");
  }

  function deleteSession(id: string) {
    setSessions((prev) => prev.filter((s) => s.id !== id));
    if (currentId === id) setCurrentId(null);
  }

  // ---- send flow --------------------------------------------------------

  async function send(text: string) {
    if (!text.trim() || busy) return;
    const userMsg: UiMessage = { id: newId(), role: "user", content: text.trim() };
    const assistantId = newId();
    let firstToolForAssistant = false; // used to delay the first tool card (~1.8s) so the "why I paid" reasoning is visible
    setInput("");

    // Lock in the session id up front. If we're starting fresh, create one
    // now and set it as current; from here every mutation uses this same
    // id so streamed chunks all land in the same conversation.
    const sid = currentId ?? newId();
    if (!currentId) setCurrentId(sid);

    // Optimistically push both messages
    patchSession(sid, (prev) => [
      ...prev,
      userMsg,
      { id: assistantId, role: "assistant", content: "", toolEvents: [] },
    ]);
    setBusy(true);

    // Build the request payload from the transcript we're about to send.
    const priorTranscript = [...messages, userMsg];

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          agent: agentId,
          messages: priorTranscript.map((m) => ({ role: m.role, content: m.content })),
        }),
        signal: controller.signal,
      });
      if (!res.ok) {
        const errText = await res.text();
        patchSession(sid, (prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, content: `⚠ ${errText || "request_failed"}` } : m)),
        );
        setBusy(false);
        return;
      }
      if (!res.body) {
        setBusy(false);
        return;
      }

      for await (const line of readSseLines(res.body)) {
        const evt = parseLine(line);
        if (!evt) continue;
        if (evt.kind === "text") {
          patchSession(sid, (prev) =>
            prev.map((m) => (m.id === assistantId ? { ...m, content: m.content + evt.delta } : m)),
          );
        } else if (evt.kind === "toolCall") {
          // First tool for this assistant response gets a short delay so the streamed
          // "Calling X because..." reasoning stays on screen long enough to be seen.
          const isFirstTool = !firstToolForAssistant;
          if (isFirstTool) firstToolForAssistant = true;

          const addTool = () => {
            patchSession(sid, (prev) =>
              prev.map((m) => {
                if (m.id !== assistantId) return m;
                const events = m.toolEvents ?? [];
                if (events.some((e) => e.callId === evt.callId)) return m;
                return {
                  ...m,
                  toolEvents: [...events, { callId: evt.callId, name: evt.name, status: "pending" }],
                };
              }),
            );
          };

          if (isFirstTool) {
            // Hold the LLM's "Calling X ($price) — reason" text for ~1.8s before the tool card appears.
            setTimeout(addTool, 1800);
          } else {
            addTool();
          }
        } else if (evt.kind === "toolResult") {
          patchSession(sid, (prev) =>
            prev.map((m) => {
              if (m.id !== assistantId) return m;
              const events = m.toolEvents ?? [];
              let idx = events.findIndex((e) => e.callId === evt.callId);
              if (idx < 0) idx = events.findIndex((e) => e.status === "pending" && e.name === evt.name);
              if (idx < 0) idx = events.findIndex((e) => e.status === "pending");
              const next = [...events];
              const patch = {
                status: evt.ok ? ("paid" as const) : ("failed" as const),
                cost: evt.cost,
                txHash: evt.txHash,
                settlementMode: evt.settlementMode,
                error: evt.error,
              };
              if (idx >= 0) {
                const preservedName =
                  evt.name && evt.name !== "unknown" ? evt.name : next[idx].name;
                next[idx] = { ...next[idx], name: preservedName, ...patch };
              } else {
                next.push({ callId: evt.callId, name: evt.name, ...patch });
              }
              const updated = { ...m, toolEvents: next };
              // If the tool failed and we have no explanatory text yet, surface it.
              if (!evt.ok && evt.error && !updated.content?.trim()) {
                updated.content = `Tool "${evt.name}" failed: ${evt.error}`;
              }
              return updated;
            }),
          );
        } else if (evt.kind === "error") {
          patchSession(sid, (prev) =>
            prev.map((m) => (m.id === assistantId ? { ...m, content: `⚠ ${evt.msg}` } : m)),
          );
        }
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      patchSession(sid, (prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, content: `⚠ ${err instanceof Error ? err.message : "stream_failed"}` }
            : m,
        ),
      );
    } finally {
      setBusy(false);
      abortRef.current = null;
      patchSession(sid, (prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? {
                ...m,
                toolEvents: (m.toolEvents ?? []).map((e) =>
                  e.status === "pending" ? { ...e, status: e.error ? ("failed" as const) : ("paid" as const) } : e,
                ),
              }
            : m,
        ),
      );
    }
  }

  // ---- render -----------------------------------------------------------

  return (
    <div
      className="ask-shell"
      style={{
        display: "grid",
        gridTemplateColumns: "240px minmax(0, 1fr) 300px",
        gap: 14,
        alignItems: "start",
      }}
    >
      <SessionRail
        sessions={sessions}
        currentId={currentId}
        onNew={newConversation}
        onSwitch={switchTo}
        onDelete={deleteSession}
        busy={busy}
      />

      <ChatColumn
        scrollerRef={scrollerRef}
        messages={messages}
        busy={busy}
        onSuggest={(s) => send(s)}
      >
        <ChatComposer
          input={input}
          setInput={setInput}
          canSend={canSend}
          busy={busy}
          onSend={() => canSend && void send(input)}
          onStop={() => abortRef.current?.abort()}
        />
      </ChatColumn>

      <ActivityRail agentId={agentId} />

      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media (max-width: 1080px) {
              .ask-shell {
                grid-template-columns: 220px minmax(0, 1fr) !important;
              }
              .ask-activity { display: none !important; }
            }
            @media (max-width: 780px) {
              .ask-shell {
                grid-template-columns: 1fr !important;
              }
              .ask-sessions { display: none !important; }
            }
          `,
        }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Session rail (left)
// ---------------------------------------------------------------------------

function SessionRail({
  sessions,
  currentId,
  onNew,
  onSwitch,
  onDelete,
  busy,
}: {
  sessions: Session[];
  currentId: string | null;
  onNew: () => void;
  onSwitch: (id: string) => void;
  onDelete: (id: string) => void;
  busy: boolean;
}) {
  return (
    <aside
      className="ask-sessions card"
      style={{
        padding: 12,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        maxHeight: 620,
        overflowY: "auto",
      }}
    >
      <button
        type="button"
        onClick={onNew}
        disabled={busy}
        style={{
          padding: "9px 12px",
          borderRadius: 8,
          border: "1px solid var(--border)",
          background: "var(--surface-3)",
          color: "var(--text-primary)",
          fontSize: 13,
          fontWeight: 600,
          textAlign: "left",
          cursor: busy ? "wait" : "pointer",
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden>
          <path d="M12 5v14M5 12h14" />
        </svg>
        New conversation
      </button>

      {sessions.length === 0 && (
        <div style={{ fontSize: 12, color: "var(--text-muted)", padding: "8px 4px", lineHeight: 1.5 }}>
          Past conversations live here. They persist across reloads.
        </div>
      )}

      {sessions.map((s) => {
        const active = s.id === currentId;
        return (
          <div
            key={s.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: 8,
              borderRadius: 6,
              background: active ? "var(--surface-3)" : "transparent",
              border: active ? "1px solid var(--border)" : "1px solid transparent",
            }}
          >
            <button
              type="button"
              onClick={() => onSwitch(s.id)}
              style={{
                flex: 1,
                minWidth: 0,
                background: "transparent",
                border: "none",
                textAlign: "left",
                cursor: "pointer",
                color: active ? "var(--text-primary)" : "var(--text-secondary)",
                fontSize: 12.5,
                lineHeight: 1.35,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                padding: 0,
              }}
              title={s.title}
            >
              {s.title}
            </button>
            <button
              type="button"
              onClick={() => onDelete(s.id)}
              aria-label="Delete conversation"
              style={{
                width: 22,
                height: 22,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 4,
                border: "none",
                background: "transparent",
                color: "var(--text-muted)",
                cursor: "pointer",
                fontSize: 15,
                lineHeight: 1,
              }}
            >
              ×
            </button>
          </div>
        );
      })}
    </aside>
  );
}

// ---------------------------------------------------------------------------
// Chat column (center)
// ---------------------------------------------------------------------------

function ChatColumn({
  scrollerRef,
  messages,
  busy,
  onSuggest,
  children,
}: {
  scrollerRef: React.RefObject<HTMLDivElement | null>;
  messages: UiMessage[];
  busy: boolean;
  onSuggest: (s: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, minWidth: 0 }}>
      <div
        ref={scrollerRef}
        className="card"
        style={{
          minHeight: 460,
          maxHeight: 620,
          overflowY: "auto",
          padding: 20,
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        {messages.length === 0 && (
          <div style={{ margin: "auto", textAlign: "center", maxWidth: 460 }}>
            <div className="text-eyebrow" style={{ marginBottom: 10 }}>
              Try one · designed to force a paid decision
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => onSuggest(s)}
                  disabled={busy}
                  style={{
                    padding: "12px 14px",
                    borderRadius: 8,
                    border: "1px solid var(--border)",
                    background: "var(--surface-2)",
                    color: "var(--text-primary)",
                    textAlign: "left",
                    fontSize: 13,
                    lineHeight: 1.4,
                    cursor: busy ? "wait" : "pointer",
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) => (
          <MessageBubble key={m.id} msg={m} />
        ))}

        {busy && (
          <div className="text-eyebrow" style={{ color: "var(--text-muted)" }}>
            Kēryx is thinking…
          </div>
        )}
      </div>
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Composer
// ---------------------------------------------------------------------------

function ChatComposer({
  input,
  setInput,
  canSend,
  busy,
  onSend,
  onStop,
}: {
  input: string;
  setInput: (v: string) => void;
  canSend: boolean;
  busy: boolean;
  onSend: () => void;
  onStop: () => void;
}) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSend();
      }}
      style={{ display: "flex", gap: 8 }}
    >
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Ask Kēryx anything…"
        disabled={busy}
        style={{
          flex: 1,
          padding: "12px 14px",
          borderRadius: 8,
          border: "1px solid var(--border)",
          background: "var(--surface-2)",
          color: "var(--text-primary)",
          outline: "none",
          fontSize: 14,
        }}
      />
      {busy ? (
        <button type="button" onClick={onStop} className="btn btn-ghost">
          Stop
        </button>
      ) : (
        <button type="submit" className="btn btn-primary" disabled={!canSend}>
          Ask
        </button>
      )}
    </form>
  );
}

// ---------------------------------------------------------------------------
// Activity rail (right) — polls /api/ledger
// ---------------------------------------------------------------------------

function ActivityRail({ agentId }: { agentId: string }) {
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    let cancelled = false;
    async function tick() {
      try {
        const res = await fetch("/api/ledger?limit=12", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { entries?: LedgerEntry[] };
        if (cancelled || !data.entries) return;
        setEntries(data.entries);
      } catch {
        /* ignore */
      }
    }
    void tick();
    const p = setInterval(tick, 3500);
    const c = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      cancelled = true;
      clearInterval(p);
      clearInterval(c);
    };
  }, []);

  const myCount = entries.filter((e) => e.callerId === agentId).length;

  return (
    <aside
      className="ask-activity card"
      style={{
        padding: 14,
        display: "flex",
        flexDirection: "column",
        gap: 12,
        maxHeight: 620,
        overflowY: "auto",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div className="text-eyebrow" style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: 999,
              background: "#10b981",
              display: "inline-block",
              animation: "keryx-pulse 2000ms ease-in-out infinite",
            }}
          />
          Live activity
        </div>
        {myCount > 0 && (
          <span style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.04em" }}>
            {myCount} from you
          </span>
        )}
      </div>

      {entries.length === 0 && (
        <div style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5 }}>
          Every paid call across every Kēryx agent lands here as it settles onchain. Ask something to start the ticker.
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {entries.map((e) => (
          <ActivityRow key={e.id} entry={e} now={now} mine={e.callerId === agentId} />
        ))}
      </div>
    </aside>
  );
}

function ActivityRow({ entry, now, mine }: { entry: LedgerEntry; now: number; mine: boolean }) {
  const secondsAgo = Math.max(0, Math.floor((now - entry.ts) / 1000));
  const rel =
    secondsAgo < 60
      ? `${secondsAgo}s ago`
      : secondsAgo < 3600
        ? `${Math.floor(secondsAgo / 60)}m ago`
        : `${Math.floor(secondsAgo / 3600)}h ago`;
  const cleanHash = entry.txHash?.replace(/^demo_/, "");
  const isReal =
    entry.settlementMode === "local" || entry.settlementMode === "gateway";

  return (
    <div
      style={{
        padding: 10,
        borderRadius: 8,
        border: "1px solid var(--border)",
        background: mine ? "var(--surface-3)" : "var(--surface-2)",
        fontSize: 12,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
        <span className="text-mono" style={{ color: "var(--text-primary)", fontSize: 12 }}>
          {entry.toolId}
        </span>
        <span style={{ color: "var(--text-muted)", fontSize: 10, fontVariantNumeric: "tabular-nums" }}>{rel}</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span
          style={{
            fontSize: 11.5,
            fontWeight: 700,
            color: "var(--text-primary)",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          ${entry.priceUsd.toFixed(4)}
        </span>
        {cleanHash && (
          isReal ? (
            <a
              href={`https://testnet.arcscan.app/tx/${cleanHash}`}
              target="_blank"
              rel="noreferrer"
              className="text-mono"
              style={{ fontSize: 10.5, color: "var(--text-secondary)", textDecoration: "underline", textUnderlineOffset: 2 }}
            >
              {cleanHash.slice(0, 6)}…{cleanHash.slice(-4)}
            </a>
          ) : (
            <span className="text-mono" style={{ fontSize: 10.5, color: "var(--text-muted)" }}>
              demo
            </span>
          )
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Message bubble + tool chip
// ---------------------------------------------------------------------------

function MessageBubble({ msg }: { msg: UiMessage }) {
  const isUser = msg.role === "user";
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        alignItems: isUser ? "flex-end" : "flex-start",
      }}
    >
      <div
        style={{
          maxWidth: "92%",
          padding: "12px 14px",
          borderRadius: 10,
          background: isUser ? "var(--surface-3)" : "var(--surface-2)",
          border: isUser ? "1px solid var(--border-strong)" : "1px solid var(--border)",
          fontSize: 14,
          lineHeight: 1.55,
          whiteSpace: "pre-wrap",
          color: "var(--text-primary)",
        }}
      >
        {msg.content || <span style={{ color: "var(--text-muted)" }}>…</span>}
      </div>
      {msg.toolEvents && msg.toolEvents.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {msg.toolEvents.map((t) => (
            <ToolCard key={t.callId} tool={t} />
          ))}
        </div>
      )}
    </div>
  );
}

function ToolCard({ tool }: { tool: ToolEvent }) {
  const label = tool.name.replace(/_/g, ".");
  const isReal =
    tool.settlementMode === "local" || tool.settlementMode === "gateway";
  const cleanHash = tool.txHash?.replace(/^demo_/, "");
  const statusColor =
    tool.status === "paid" ? "#10b981" : tool.status === "failed" ? "#f59e0b" : "#f59e0b";
  const statusText =
    tool.status === "pending" ? "calling…" : tool.status === "paid" ? "settled" : "failed";
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 4,
        padding: "8px 12px",
        borderRadius: 8,
        border: "1px solid var(--border)",
        background: "var(--surface-2)",
        fontSize: 12,
        maxWidth: "100%",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: 999,
            background: statusColor,
            display: "inline-block",
            flexShrink: 0,
            animation: tool.status === "pending" ? "keryx-pulse 900ms ease-in-out infinite" : "none",
          }}
        />
        <span className="text-mono" style={{ color: "var(--text-primary)" }}>
          {label}
        </span>
        <span style={{ color: "var(--text-muted)" }}>·</span>
        <span
          style={{
            fontVariantNumeric: "tabular-nums",
            color: "var(--text-primary)",
            fontWeight: 600,
          }}
        >
          {typeof tool.cost === "number" ? `$${tool.cost.toFixed(4)}` : "…"}
        </span>
        <span style={{ color: "var(--text-muted)" }}>·</span>
        <span style={{ color: "var(--text-secondary)" }}>{statusText}</span>
        {tool.publisher && <span style={{ color: "var(--text-muted)", marginLeft: 6 }}>→ {tool.publisher}</span>}
        {cleanHash && (
          <>
            <span style={{ color: "var(--text-muted)" }}>·</span>
            {isReal ? (
              <a
                href={`https://testnet.arcscan.app/tx/${cleanHash}`}
                target="_blank"
                rel="noreferrer"
                className="text-mono"
                style={{
                  color: "var(--text-secondary)",
                  textDecoration: "underline",
                  textUnderlineOffset: 2,
                  fontSize: 11,
                }}
              >
                {cleanHash.slice(0, 6)}…{cleanHash.slice(-4)}
              </a>
            ) : (
              <span className="text-mono" style={{ color: "var(--text-muted)", fontSize: 11 }}>
                demo
              </span>
            )}
          </>
        )}
      </div>
      {tool.status === "failed" && tool.error && (
        <div
          style={{
            fontSize: 11,
            color: "#f59e0b",
            opacity: 0.9,
            paddingLeft: 16,
            wordBreak: "break-word",
          }}
        >
          {tool.error}
        </div>
      )}
    </div>
  );
}
