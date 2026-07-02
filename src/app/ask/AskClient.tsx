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
  name: string;
  cost?: number;
  publisher?: string;
  status: "pending" | "paid" | "failed";
}

const SUGGESTIONS = [
  "What are the top 3 wallets trading BONK in the last 24h?",
  "Any new Solana token launches in the last hour with volume > $25k?",
  "Give me the rug risk score for So1111...1112 and what's trending on X about arc.",
  "Search the web: latest news on Circle Arc mainnet.",
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
  | { kind: "toolCall"; name: string }
  | { kind: "toolResult"; name: string; ok: boolean; cost?: number; publisher?: string }
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
      return { kind: "toolCall", name };
    }
    if (tag === "a") {
      const name = typeof data?.toolName === "string" ? data.toolName : "unknown";
      const result = data?.result;
      const ok = !(result && typeof result === "object" && "error" in result);
      const cost =
        result && typeof result === "object" && "paid" in result && result.paid?.priceUsd
          ? Number(result.paid.priceUsd)
          : undefined;
      return { kind: "toolResult", name, ok, cost };
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
  const abortRef = useRef<AbortController | null>(null);
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  const agentId = useMemo(() => `web-${Math.random().toString(36).slice(2, 8)}`, []);

  useEffect(() => {
    if (!scrollerRef.current) return;
    scrollerRef.current.scrollTop = scrollerRef.current.scrollHeight;
  }, [messages]);

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
            prev.map((m) =>
              m.id === assistantId
                ? {
                    ...m,
                    toolEvents: [
                      ...(m.toolEvents ?? []),
                      { name: evt.name, status: "pending" },
                    ],
                  }
                : m
            )
          );
        } else if (evt.kind === "toolResult") {
          setMessages((prev) =>
            prev.map((m) => {
              if (m.id !== assistantId) return m;
              const events = m.toolEvents ?? [];
              const idx = [...events].reverse().findIndex((e) => e.name === evt.name && e.status === "pending");
              if (idx < 0) return m;
              const realIdx = events.length - 1 - idx;
              const next = [...events];
              next[realIdx] = {
                name: evt.name,
                status: evt.ok ? "paid" : "failed",
                cost: evt.cost,
              };
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
        gap: 20,
        maxWidth: 820,
      }}
    >
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
            <div className="text-eyebrow" style={{ color: "var(--accent)", marginBottom: 10 }}>
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
                    e.currentTarget.style.borderColor = "var(--accent)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--border)";
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
          background: isUser ? "var(--gold-tint)" : "var(--surface-2)",
          border: isUser
            ? "1px solid rgba(226, 197, 110, 0.3)"
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
  return (
    <span className={badgeClass}>
      {tool.status === "pending" ? "…" : tool.status === "paid" ? "paid" : "failed"} {label}
      {cost}
    </span>
  );
}
