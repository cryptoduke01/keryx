"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Role = "user" | "assistant" | "system";

interface UiMessage {
  id: string;
  role: Role;
  content: string;
  /** Tool calls the assistant produced during this turn. */
  toolEvents?: ToolEvent[];
}

interface ToolEvent {
  /** Stable id from the AI SDK data stream, so the pending → paid transition
   *  can find the exact event even when multiple calls are in flight. */
  callId: string;
  name: string;
  cost?: number;
  publisher?: string;
  txHash?: string;
  settlementMode?: "gateway" | "local" | "demo";
  status: "pending" | "paid" | "failed";
}

const STORAGE_KEY = "keryx.ask.history.v1";
const HISTORY_LIMIT = 24; // enough to keep a sensible conversation, not enough to bloat localStorage

function loadHistory(): UiMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (m): m is UiMessage =>
        m && typeof m === "object" && typeof m.id === "string" &&
        typeof m.content === "string" &&
        (m.role === "user" || m.role === "assistant" || m.role === "system"),
    );
  } catch {
    return [];
  }
}

function saveHistory(messages: UiMessage[]) {
  if (typeof window === "undefined") return;
  try {
    const trimmed = messages.slice(-HISTORY_LIMIT);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    /* quota exceeded, private browsing, etc — silently drop */
  }
}

const SUGGESTIONS = [
  "What's the 24h trading volume for BONK on Solana?",
  "Show me the newest Solana token launches right now.",
  "Rug-check the USDC mint EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v.",
  "What's trending in crypto today?",
  "Search for what Circle Arc is.",
] as const;

function newId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

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
    for (const line of lines) {
      if (line.length > 0) yield line;
    }
  }
  if (buffer.length > 0) yield buffer;
}

/**
 * Parses the ai/react data-stream protocol. Each line looks like:
 *   0:"text chunk"                 → assistant text
 *   9:{"toolCallId":"...", ...}    → tool call started
 *   a:{"toolCallId":"...", ...}    → tool call result
 *   d:{"finishReason":"stop",...}  → end of a turn
 *
 * We only need text (`0:`) and tool events for the UI.
 */
type Parsed =
  | { kind: "text"; delta: string }
  | { kind: "toolCall"; callId: string; name: string }
  | {
      kind: "toolResult";
      callId: string;
      name: string;
      ok: boolean;
      cost?: number;
      publisher?: string;
      txHash?: string;
      settlementMode?: "gateway" | "local" | "demo";
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
      return { kind: "toolResult", callId, name, ok, cost, txHash, settlementMode };
    }
    if (tag === "d") return { kind: "done" };
    if (tag === "3") return { kind: "error", msg: typeof data === "string" ? data : "stream_error" };
  } catch {
    return null;
  }
  return null;
}

export default function AskClient() {
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  const agentId = useMemo(() => `web-${Math.random().toString(36).slice(2, 8)}`, []);

  // Restore history from localStorage on first client render, then persist
  // every subsequent update. Skips the first render to avoid overwriting
  // localStorage with an empty [] before the load completes.
  useEffect(() => {
    setMessages(loadHistory());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveHistory(messages);
  }, [messages, hydrated]);

  useEffect(() => {
    if (!scrollerRef.current) return;
    scrollerRef.current.scrollTop = scrollerRef.current.scrollHeight;
  }, [messages]);

  function newConversation() {
    if (busy) abortRef.current?.abort();
    setMessages([]);
    setInput("");
  }

  const canSend = input.trim().length > 0 && !busy;

  async function send(text: string) {
    if (!text.trim() || busy) return;
    const userMsg: UiMessage = { id: newId(), role: "user", content: text.trim() };
    const assistantId = newId();
    const nextMessages = [...messages, userMsg];
    setMessages([
      ...nextMessages,
      { id: assistantId, role: "assistant", content: "", toolEvents: [] },
    ]);
    setInput("");
    setBusy(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          agent: agentId,
          messages: nextMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
        signal: controller.signal,
      });
      if (!res.ok) {
        const errText = await res.text();
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: `⚠ ${errText || "request_failed"}` }
              : m
          )
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
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, content: m.content + evt.delta } : m
            )
          );
        } else if (evt.kind === "toolCall") {
          setMessages((prev) =>
            prev.map((m) => {
              if (m.id !== assistantId) return m;
              const events = m.toolEvents ?? [];
              // De-dupe: if the same callId was already pushed (e.g. the AI SDK
              // emits both a start and a subsequent delta), don't add twice.
              if (events.some((e) => e.callId === evt.callId)) return m;
              return {
                ...m,
                toolEvents: [
                  ...events,
                  { callId: evt.callId, name: evt.name, status: "pending" },
                ],
              };
            })
          );
        } else if (evt.kind === "toolResult") {
          setMessages((prev) =>
            prev.map((m) => {
              if (m.id !== assistantId) return m;
              const events = m.toolEvents ?? [];
              // Prefer exact callId match. Fall back to the last pending event
              // with the same name if the result stream drops the toolCallId,
              // and finally to any pending event so a chip can never get
              // orphaned in "calling" forever.
              let idx = events.findIndex((e) => e.callId === evt.callId);
              if (idx < 0) idx = events.findIndex((e) => e.status === "pending" && e.name === evt.name);
              if (idx < 0) idx = events.findIndex((e) => e.status === "pending");
              const next = [...events];
              if (idx >= 0) {
                // Keep the pending event's name when the result stream doesn't
                // repeat it (Vercel AI SDK emits toolName only on `9:`, not `a:`).
                const preservedName =
                  evt.name && evt.name !== "unknown" ? evt.name : next[idx].name;
                next[idx] = {
                  ...next[idx],
                  name: preservedName,
                  status: evt.ok ? "paid" : "failed",
                  cost: evt.cost,
                  txHash: evt.txHash,
                  settlementMode: evt.settlementMode,
                };
              } else {
                next.push({
                  callId: evt.callId,
                  name: evt.name,
                  status: evt.ok ? "paid" : "failed",
                  cost: evt.cost,
                  txHash: evt.txHash,
                  settlementMode: evt.settlementMode,
                });
              }
              return { ...m, toolEvents: next };
            })
          );
        } else if (evt.kind === "error") {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, content: `⚠ ${evt.msg}` } : m
            )
          );
        }
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, content: `⚠ ${err instanceof Error ? err.message : "stream_failed"}` }
            : m
        )
      );
    } finally {
      setBusy(false);
      abortRef.current = null;
      // If the LLM wrote its answer and moved on but a result chunk got
      // dropped for any reason, don't leave a pending pulse on screen forever.
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? {
                ...m,
                toolEvents: (m.toolEvents ?? []).map((e) =>
                  e.status === "pending" ? { ...e, status: "paid" as const } : e,
                ),
              }
            : m,
        ),
      );
    }
  }

  function stop() {
    abortRef.current?.abort();
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr",
        gap: 14,
        maxWidth: 820,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          padding: "0 4px",
        }}
      >
        <div
          className="text-eyebrow"
          style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--text-muted)" }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: 999,
              background: "#10b981",
              display: "inline-block",
              animation: "keryx-pulse 1600ms ease-in-out infinite",
            }}
          />
          {messages.length === 0
            ? "Ready · live on Arc testnet"
            : `${messages.filter((m) => m.role === "user").length} question${messages.filter((m) => m.role === "user").length === 1 ? "" : "s"} in this session`}
        </div>
        {messages.length > 0 && (
          <button
            type="button"
            onClick={newConversation}
            style={{
              background: "transparent",
              border: "1px solid var(--border)",
              color: "var(--text-secondary)",
              fontSize: 12,
              padding: "5px 10px",
              borderRadius: 6,
              cursor: "pointer",
            }}
          >
            New conversation
          </button>
        )}
      </div>

      <div
        ref={scrollerRef}
        className="card"
        style={{
          minHeight: 380,
          maxHeight: 560,
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
              Try one
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => send(s)}
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
                    transition: "border-color 140ms",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "var(--border-hover-solid)";
                    e.currentTarget.style.background = "var(--surface-3)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--border)";
                    e.currentTarget.style.background = "var(--surface-2)";
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

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (canSend) void send(input);
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
          <button type="button" onClick={stop} className="btn btn-ghost">
            Stop
          </button>
        ) : (
          <button type="submit" className="btn btn-primary" disabled={!canSend}>
            Ask
          </button>
        )}
      </form>
    </div>
  );
}

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
          maxWidth: "90%",
          padding: "12px 14px",
          borderRadius: 10,
          background: isUser ? "var(--surface-3)" : "var(--surface-2)",
          border: isUser
            ? "1px solid var(--border-strong)"
            : "1px solid var(--border)",
          fontSize: 14,
          lineHeight: 1.55,
          whiteSpace: "pre-wrap",
          color: "var(--text-primary)",
        }}
      >
        {msg.content || (
          <span style={{ color: "var(--text-muted)" }}>…</span>
        )}
      </div>
      {msg.toolEvents && msg.toolEvents.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {msg.toolEvents.map((t, i) => (
            <ToolChip key={i} tool={t} />
          ))}
        </div>
      )}
    </div>
  );
}

function ToolChip({ tool }: { tool: ToolEvent }) {
  const label = tool.name.replace(/_/g, ".");
  const cost =
    typeof tool.cost === "number" ? ` · $${tool.cost.toFixed(3)}` : "";
  const badgeClass =
    tool.status === "paid"
      ? "badge badge-gold"
      : tool.status === "failed"
        ? "badge badge-info"
        : "badge";
  const statusWord =
    tool.status === "pending" ? "calling" : tool.status === "paid" ? "paid" : "failed";

  // Real onchain tx (mode "local" / "gateway") → clickable arcscan link.
  // Synthetic demo tx → visible but not clickable.
  const isRealTx = tool.txHash && !tool.txHash.startsWith("demo_") && (tool.settlementMode === "local" || tool.settlementMode === "gateway");
  const shortHash = tool.txHash?.replace(/^demo_/, "").slice(0, 10);

  return (
    <span
      className={badgeClass}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        whiteSpace: "nowrap",
      }}
    >
      {tool.status === "pending" && (
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: 999,
            background: "currentColor",
            animation: "keryx-pulse 900ms ease-in-out infinite",
            display: "inline-block",
          }}
        />
      )}
      <span>
        {statusWord} {label}{cost}
      </span>
      {tool.txHash && (
        isRealTx ? (
          <a
            href={`https://testnet.arcscan.app/tx/${tool.txHash}`}
            target="_blank"
            rel="noreferrer"
            className="text-mono"
            style={{
              fontSize: 10,
              opacity: 0.85,
              textDecoration: "underline",
              textUnderlineOffset: 2,
            }}
            title="View this settlement on Arcscan"
          >
            {shortHash}…
          </a>
        ) : (
          <span className="text-mono" style={{ fontSize: 10, opacity: 0.7 }}>
            {shortHash}…
          </span>
        )
      )}
    </span>
  );
}
