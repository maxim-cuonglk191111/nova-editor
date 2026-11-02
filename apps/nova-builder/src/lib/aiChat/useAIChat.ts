"use client";
// Orchestrates the AI tab: which scope the next message is about, sending it (edit proposal or
// whole-page generation), Stop / Retry, Apply / Discard, and the hover outline on the canvas.
// The panel components only render what this returns.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useStore } from "@nanostores/react";
import type { EditOp } from "@studio/ai";
import type { WSCompositionResult } from "@studio/ai";
import { $instances, $props, $styles, $styleSourceSelections, $projectMeta } from "@/lib/data-stores";
import { $selectedPage, $selectedInstanceId, $hoveredInstanceSelector, $aiInitialPrompt } from "@/lib/nano-states";
import { applyWSComposition, compositionBreakpoints } from "@/lib/applyWSComposition";
import { composeSite, applySite, type SiteResult } from "@/lib/generateSite";
import { planSitePages, type SitePage, type SitePageKey } from "@/lib/aiSitePlan";
import { useI18n, fmt } from "@/lib/i18n";
import { uid } from "@/lib/uid";
import { buildEditContext, parentMap } from "./context";
import { applyEditOps } from "./applyOps";
import { describeOps } from "./describe";
import { chatStore } from "./store";
import type { AssistantMessage, ChatMessage, ChatScope, ChatThread, ProposalLine } from "./types";

const MODEL_KEY = "nova-ai-model";
const draftKey = (projectId: string) => `nova-ai-draft:${projectId}`;

export type Provider = { id: string; keyConfigured: boolean };
export type Pending = { stage: "reading" | "writing" } | { stage: "building"; progress: string };

type EditResponse = {
  reply?: string;
  ops?: EditOp[];
  provider?: string;
  ms?: number;
  error?: string;
  code?: string;
};

type GenerateResponse = { composition?: WSCompositionResult; provider?: string; error?: string };

function readStored(key: string): string {
  try { return localStorage.getItem(key) ?? ""; } catch { return ""; }
}
function writeStored(key: string, value: string) {
  try { if (value) localStorage.setItem(key, value); else localStorage.removeItem(key); } catch { /* storage blocked */ }
}

export function useAIChat() {
  const { t } = useI18n();
  const L = t.tools.aiChat;
  const A = t.tools.ai;
  const meta = useStore($projectMeta);
  const projectId = meta?.id ?? "unsaved";
  const instances = useStore($instances);
  const page = useStore($selectedPage);
  const selectedId = useStore($selectedInstanceId);
  const chat = useStore(chatStore.$chat);

  const [maxScope, setMaxScope] = useState<ChatScope>("element");
  const [pending, setPending] = useState<Pending | null>(null);
  const [model, setModelState] = useState<string>("auto");
  const [providers, setProviders] = useState<Provider[] | null>(null);
  const [draft, setDraftState] = useState("");
  const [onePageOnly, setOnePageOnly] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const lastSelected = useRef<string | undefined>(undefined);

  // ── threads and draft belong to the project ──
  useEffect(() => {
    chatStore.open(projectId);
    setDraftState(readStored(draftKey(projectId)));
    setModelState(readStored(MODEL_KEY) || "auto");
  }, [projectId]);

  const setDraft = useCallback((value: string) => {
    setDraftState(value);
    writeStored(draftKey(projectId), value);
  }, [projectId]);

  const setModel = useCallback((value: string) => {
    setModelState(value);
    writeStored(MODEL_KEY, value === "auto" ? "" : value);
  }, []);

  // A new selection starts at its own scope again.
  useEffect(() => {
    if (lastSelected.current !== selectedId) {
      lastSelected.current = selectedId;
      setMaxScope("element");
    }
  }, [selectedId]);

  // Which providers have a key (for the model picker). Guests get a 401: the picker just shows Auto.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/ai/providers?light=1")
      .then((r) => (r.ok ? (r.json() as Promise<{ providers?: Provider[] }>) : null))
      .then((json) => { if (!cancelled && json?.providers) setProviders(json.providers); })
      .catch(() => { /* picker keeps Auto */ });
    return () => { cancelled = true; };
  }, []);

  const thread: ChatThread | null = useMemo(
    () => chat.state.threads.find((x) => x.id === chat.state.activeId) ?? null,
    [chat.state]
  );

  const rootChildren = page ? instances.get(page.rootInstanceId)?.children.filter((c) => c.type === "id").length ?? 0 : 0;
  const hasPage = rootChildren > 0;

  // ── context chips ──
  const scope = useMemo(() => {
    if (!page) return null;
    return buildEditContext(
      { instances, props: $props.get(), styles: $styles.get(), styleSourceSelections: $styleSourceSelections.get() },
      { id: page.id, name: page.name, rootInstanceId: page.rootInstanceId },
      selectedId,
      compositionBreakpoints().baseBpId,
      maxScope
    );
  }, [page, instances, selectedId, maxScope]);

  const widen = useCallback(() => setMaxScope((s) => (s === "element" ? "section" : "page")), []);

  // ── outline of the elements a proposal line touches ──
  const highlight = useCallback((ids: string[] | null) => {
    const id = ids?.[0];
    if (!id) { $hoveredInstanceSelector.set(undefined); return; }
    const parents = parentMap($instances.get());
    const path: string[] = [id];
    for (let cur = parents.get(id); cur && path.length < 100; cur = parents.get(cur)) path.push(cur);
    $hoveredInstanceSelector.set(path);
  }, []);

  // ── messages ──
  const post = useCallback((threadId: string, m: ChatMessage) => chatStore.append(threadId, m), []);

  const fail = useCallback((threadId: string, text: string, needsAccount = false) => {
    post(threadId, { id: uid("msg_"), role: "assistant", at: Date.now(), kind: "error", text, needsAccount });
  }, [post]);

  const history = useCallback((th: ChatThread | null) => (th?.messages ?? [])
    .filter((m) => m.role === "user" || m.kind === "reply" || m.kind === "proposal")
    .slice(-6)
    .map((m) => ({ role: m.role, text: m.text })), []);

  const runEdit = useCallback(async (threadId: string, text: string) => {
    const ctx = scope?.context;
    if (!ctx) return;
    const controller = new AbortController();
    abortRef.current = controller;
    setPending({ stage: "reading" });
    const writing = setTimeout(() => setPending((p) => (p ? { stage: "writing" } : p)), 1500);
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          message: text,
          context: ctx,
          history: history(chatStore.active()).slice(0, -1),
          projectId: meta?.id ?? null,
          provider: model,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as EditResponse;
      if (res.status === 401) return fail(threadId, A.needsAccount, true);
      if (!res.ok) return fail(threadId, json.code === "busy" ? L.busy : json.error ?? fmt(A.genericError, { status: res.status }));

      const ops = json.ops ?? [];
      const answeredBy = { provider: json.provider, ms: json.ms };
      if (ops.length === 0) {
        return post(threadId, { id: uid("msg_"), role: "assistant", at: Date.now(), kind: "reply", text: json.reply || L.askedOnly, ...answeredBy });
      }
      post(threadId, {
        id: uid("msg_"), role: "assistant", at: Date.now(), kind: "proposal", text: json.reply ?? "", ...answeredBy,
        status: "pending",
        proposal: { lines: describeOps(ops, $instances.get()), payload: { type: "ops", ops } },
      });
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      fail(threadId, String(err));
    } finally {
      clearTimeout(writing);
      abortRef.current = null;
      setPending(null);
    }
  }, [scope, meta?.id, model, history, fail, post, A, L]);

  const runGenerate = useCallback(async (threadId: string, text: string, pages: SitePage[] | null) => {
    const controller = new AbortController();
    abortRef.current = controller;
    setPending({ stage: "writing" });
    try {
      if (pages) {
        const nameOf = (key: SitePageKey) => A.sitePageNames[key];
        const outcome = await composeSite({
          prompt: text, pages, nameOf, projectId: meta?.id ?? null,
          onProgress: (index, name) => setPending({ stage: "building", progress: fmt(A.buildingPage, { current: index + 1, total: pages.length, name }) }),
        });
        if (controller.signal.aborted) return;
        if (outcome.failure && outcome.results.length === 0) {
          return outcome.failure.status === 401 ? fail(threadId, A.needsAccount, true) : fail(threadId, outcome.failure.message || fmt(A.genericError, { status: outcome.failure.status }));
        }
        const results = outcome.results;
        const partial = outcome.failure ? fmt(A.sitePartial, { done: results.length, total: pages.length, reason: outcome.failure.message || fmt(A.genericError, { status: outcome.failure.status }) }) : "";
        post(threadId, {
          id: uid("msg_"), role: "assistant", at: Date.now(), kind: "proposal", status: "pending",
          text: [fmt(A.siteReadyBody, { count: results.length, pages: results.map((r) => r.name).join(", ") }), partial].filter(Boolean).join(" "),
          proposal: { lines: [{ kind: "site", count: results.length, label: "", ids: [], detail: results.map((r) => r.name).join(", ") }], payload: { type: "site", results } },
        });
        return;
      }
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({ userMessage: text, projectId: meta?.id ?? null, ...(model !== "auto" ? { provider: model } : {}) }),
      });
      const json = (await res.json().catch(() => ({}))) as GenerateResponse;
      if (res.status === 401) return fail(threadId, A.needsAccount, true);
      if (!res.ok || !json.composition) return fail(threadId, json.error ?? fmt(A.genericError, { status: res.status }));
      post(threadId, {
        id: uid("msg_"), role: "assistant", at: Date.now(), kind: "proposal", status: "pending",
        text: fmt(A.readyBody, { count: json.composition.instances.length }), provider: json.provider,
        proposal: { lines: [{ kind: "page", count: json.composition.instances.length, label: "", ids: [] }], payload: { type: "page", composition: json.composition } },
      });
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      fail(threadId, String(err));
    } finally {
      abortRef.current = null;
      setPending(null);
    }
  }, [meta?.id, model, fail, post, A]);

  /** Sends the text. `generate` forces a whole new page (start over); an empty page always generates. */
  const send = useCallback((raw: string, opts: { generate?: boolean } = {}) => {
    const text = raw.trim();
    if (!text || pending) return;
    const threadId = chatStore.active()?.id ?? chatStore.newThread();
    const ref = scope?.ref;
    const generate = Boolean(opts.generate) || !hasPage;
    post(threadId, { id: uid("msg_"), role: "user", at: Date.now(), text, ...(ref ? { ref } : {}), ...(generate ? { generate: true } : {}) });
    setDraft("");
    if (generate) {
      void runGenerate(threadId, text, onePageOnly ? null : planSitePages(text));
    } else {
      void runEdit(threadId, text);
    }
  }, [pending, scope, hasPage, onePageOnly, post, setDraft, runGenerate, runEdit]);

  const stop = useCallback(() => {
    const th = chatStore.active();
    abortRef.current?.abort();
    abortRef.current = null;
    setPending(null);
    if (th) post(th.id, { id: uid("msg_"), role: "assistant", at: Date.now(), kind: "reply", text: L.stopped });
  }, [post, L]);

  /** Re-sends the last user message after an error. */
  const retry = useCallback(() => {
    const th = chatStore.active();
    if (!th || pending) return;
    const last = [...th.messages].reverse().find((m) => m.role === "user");
    const tail = th.messages[th.messages.length - 1];
    if (!last || last.role !== "user") return;
    if (tail?.role === "assistant" && tail.kind === "error") chatStore.removeMessage(th.id, tail.id);
    chatStore.removeMessage(th.id, last.id);
    send(last.text, { generate: last.generate });
  }, [pending, send]);

  const apply = useCallback((message: AssistantMessage) => {
    const th = chatStore.active();
    const payload = message.proposal?.payload;
    if (!th || !payload) return;
    highlight(null);
    if (payload.type === "ops") {
      const result = applyEditOps(payload.ops);
      chatStore.patch(th.id, message.id, { status: result.applied > 0 ? "applied" : "discarded", result, proposal: { lines: message.proposal!.lines } });
    } else {
      if (payload.type === "page") applyWSComposition(payload.composition);
      else applySite(payload.results as SiteResult[]);
      chatStore.patch(th.id, message.id, { status: "applied", result: { applied: 1, skipped: 0 }, proposal: { lines: message.proposal!.lines } });
    }
  }, [highlight]);

  const discard = useCallback((message: AssistantMessage) => {
    const th = chatStore.active();
    if (!th) return;
    highlight(null);
    chatStore.patch(th.id, message.id, { status: "discarded", proposal: { lines: message.proposal?.lines ?? ([] as ProposalLine[]) } });
  }, [highlight]);

  // The landing-page prompt arrives once, when the AI tab first opens in a new project.
  useEffect(() => {
    const initial = $aiInitialPrompt.get();
    if (!initial || !page) return;
    $aiInitialPrompt.set("");
    chatStore.newThread();
    // A multi-page request costs one generation per page: let the owner confirm in the composer.
    if (planSitePages(initial)) setDraft(initial);
    else setTimeout(() => send(initial), 80);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page?.id]);

  return {
    thread, threads: chat.state.threads, hasPage, scope, pending, model, providers, draft, onePageOnly,
    setDraft, setModel, setOnePageOnly, widen, highlight, send, stop, retry, apply, discard,
    selectThread: chatStore.selectThread, newThread: () => chatStore.newThread(), deleteThread: chatStore.deleteThread,
  };
}
