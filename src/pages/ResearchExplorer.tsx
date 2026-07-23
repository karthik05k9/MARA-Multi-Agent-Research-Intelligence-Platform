import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import ForceGraph2D from "react-force-graph-2d";
import {
  ArrowRight,
  BarChart3,
  Brain,
  ChevronDown,
  ChevronRight,
  Clock3,
  ExternalLink,
  FileText,
  Filter,
  GitBranch,
  Layers,
  Loader2,
  MessageSquareText,
  Newspaper,
  Plus,
  Search,
  Sparkles,
  SquareStack,
  WandSparkles,
  Info,
  RotateCcw,
  CheckCircle2,
  Network,
  ShieldCheck,
  AlertTriangle,
  Radio,
} from "lucide-react";
import type { NormalizedSource, ResearchResult, TopicNode } from "../types/researchResult";

type SummaryMode = "brief" | "extensive";
type SourceTab = "all" | NormalizedSource["type"];

interface RecentSearchItem {
  id: string;
  query: string;
  timestamp: string;
  result: ResearchResult;
}

interface FollowUpMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  citationIds?: string[];
}

const RECENTS_KEY = "mara_recents_v1";

function formatTime(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDate(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function typeLabel(type: NormalizedSource["type"]) {
  switch (type) {
    case "paper":
      return "Paper";
    case "article":
      return "Article";
    case "news":
      return "News";
    case "repo":
      return "GitHub Repo";
    case "model":
      return "Model";
    default:
      return type;
  }
}

function typeIcon(type: NormalizedSource["type"]) {
  switch (type) {
    case "paper":
      return <FileText className="h-4 w-4" />;
    case "article":
    case "news":
      return <Newspaper className="h-4 w-4" />;
    case "repo":
      return <GitBranch className="h-4 w-4" />;
    case "model":
      return <Brain className="h-4 w-4" />;
    default:
      return <FileText className="h-4 w-4" />;
  }
}

function sourceAccent(type: NormalizedSource["type"]) {
  switch (type) {
    case "paper":
      return "from-blue-50 to-blue-100 text-blue-700 border-blue-200";
    case "article":
      return "from-amber-50 to-amber-100 text-amber-700 border-amber-200";
    case "news":
      return "from-emerald-50 to-emerald-100 text-emerald-700 border-emerald-200";
    case "repo":
      return "from-violet-50 to-violet-100 text-violet-700 border-violet-200";
    case "model":
      return "from-cyan-50 to-cyan-100 text-cyan-700 border-cyan-200";
    default:
      return "from-slate-50 to-slate-100 text-slate-700 border-slate-200";
  }
}

function groupByType(sources: NormalizedSource[]) {
  return sources.reduce<Record<string, NormalizedSource[]>>((acc, src) => {
    acc[src.type] ??= [];
    acc[src.type].push(src);
    return acc;
  }, {});
}

function SourceCard({ source }: { source: NormalizedSource }) {
  const accent = sourceAccent(source.type);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:border-slate-300 hover:shadow-sm"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className={`rounded-xl border bg-gradient-to-br p-2 ${accent}`}>
            {typeIcon(source.type)}
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                {typeLabel(source.type)}
              </span>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] text-slate-500">
                {source.source}
              </span>
            </div>
            <a
              href={source.url}
              target="_blank"
              rel="noreferrer"
              className="mt-1 block text-sm font-semibold leading-snug text-slate-900 hover:text-blue-700"
            >
              {source.title}
            </a>
          </div>
        </div>

        <a
          href={source.url}
          target="_blank"
          rel="noreferrer"
          className="rounded-lg border border-slate-200 bg-slate-50 p-2 text-slate-500 transition hover:border-slate-300 hover:text-slate-900"
          aria-label={`Open ${source.title}`}
        >
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-slate-600">
        {source.snippet || "No snippet available."}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-slate-500">
          <Clock3 className="h-3.5 w-3.5" />
          {formatDate(source.publishedAt)}
        </span>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-slate-500">
          Relevance {Math.round(source.relevance * 100)}%
        </span>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-slate-500">
          Freshness {Math.round(source.freshness * 100)}%
        </span>
      </div>

      {source.tags?.length ? (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {source.tags.slice(0, 6).map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] text-slate-500"
            >
              {tag}
            </span>
          ))}
        </div>
      ) : null}
    </motion.div>
  );
}

function NodeGraph({
  query,
  nodes,
  selectedNodeId,
  onSelectNode,
}: {
  query: string;
  nodes: TopicNode[];
  selectedNodeId: string | null;
  onSelectNode: (id: string | null) => void;
}) {
  const [keywordFilter, setKeywordFilter] = useState("");
  const [graphWidth, setGraphWidth] = useState(900);
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<any>(null);

  const shown = useMemo(() => {
    const clean = keywordFilter.trim().toLowerCase();
    const filtered = clean
      ? nodes.filter((node) => node.label.toLowerCase().includes(clean))
      : nodes;
    return filtered.slice(0, 14);
  }, [nodes, keywordFilter]);

  const graphData = useMemo(() => {
    const graphNodes = [
      {
        id: "query-root",
        label: query,
        kind: "query",
        sourceCount: nodes.length,
        val: 18,
        color: "#2563eb",
        fx: 0,
        fy: 0,
      },
      ...shown.map((node, index) => ({
        id: node.id,
        label: node.label,
        kind: "concept",
        sourceCount: node.sourceCount,
        val: Math.max(5, Math.min(13, 5 + node.sourceCount * 0.8)),
        color: ["#0ea5e9", "#8b5cf6", "#14b8a6", "#f59e0b", "#ec4899"][index % 5],
      })),
    ];
    const links = shown.map((node) => ({
      source: "query-root",
      target: node.id,
      nodeId: node.id,
      sourceCount: node.sourceCount,
    }));
    return { nodes: graphNodes, links };
  }, [nodes.length, query, shown]);

  useEffect(() => {
    if (!containerRef.current) return;
    const updateWidth = () => {
      if (containerRef.current) setGraphWidth(Math.max(320, containerRef.current.clientWidth));
    };
    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const graph = graphRef.current;
    if (!graph) return;
    graph.d3Force("charge")?.strength(-260);
    graph.d3Force("link")?.distance(125).strength(0.75);
    graph.d3ReheatSimulation();
    const timer = window.setTimeout(() => graph.zoomToFit?.(450, 70), 850);
    return () => window.clearTimeout(timer);
  }, [graphData]);

  const selectGraphNode = (node: any) => {
    if (node.id === "query-root") {
      onSelectNode(null);
      return;
    }
    onSelectNode(String(node.id));
    graphRef.current?.centerAt?.(node.x, node.y, 500);
    graphRef.current?.zoom?.(2.2, 500);
  };

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.08)]">
      <div className="flex flex-col gap-3 border-b border-slate-200 bg-white px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-slate-700">
            <Network className="h-4 w-4 text-blue-600" />
            <span className="text-xs font-semibold uppercase tracking-[0.2em]">
              Key concepts found in the research
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Drag, zoom, or select a concept or relationship to inspect its supporting sources.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-500">
            <Search className="h-3.5 w-3.5" />
            <input
              value={keywordFilter}
              onChange={(event) => setKeywordFilter(event.target.value)}
              placeholder="Find a concept"
              className="w-32 bg-transparent text-xs text-slate-800 outline-none placeholder:text-slate-400"
            />
          </label>
          <button
            onClick={() => onSelectNode(null)}
            className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${
              selectedNodeId === null
                ? "border-blue-300 bg-blue-50 text-blue-700"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            All evidence
          </button>
          <button
            onClick={() => graphRef.current?.zoomToFit?.(500, 70)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            Recenter
          </button>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
            {nodes.length} concepts
          </div>
        </div>
      </div>

      <div ref={containerRef} className="relative h-[520px] bg-white">
        <ForceGraph2D
          ref={graphRef}
          width={graphWidth}
          height={520}
          graphData={graphData}
          backgroundColor="#ffffff"
          enableNodeDrag
          enablePanInteraction
          enableZoomInteraction
          minZoom={0.6}
          maxZoom={5}
          warmupTicks={40}
          cooldownTicks={140}
          d3AlphaDecay={0.035}
          d3VelocityDecay={0.28}
          linkColor={(link: any) => link.nodeId === selectedNodeId ? "#2563eb" : "#cbd5e1"}
          linkWidth={(link: any) => link.nodeId === selectedNodeId ? 3 : 1.5}
          linkDirectionalParticles={(link: any) => link.nodeId === selectedNodeId ? 3 : 0}
          linkDirectionalParticleColor={() => "#2563eb"}
          linkDirectionalParticleWidth={2.5}
          onNodeClick={selectGraphNode}
          onLinkClick={(link: any) => onSelectNode(String(link.nodeId))}
          nodePointerAreaPaint={(node: any, color, context) => {
            context.fillStyle = color;
            context.beginPath();
            context.arc(node.x, node.y, node.kind === "query" ? 21 : 16, 0, 2 * Math.PI);
            context.fill();
          }}
          nodeCanvasObject={(node: any, context, globalScale) => {
            const active = node.id === selectedNodeId;
            const radius = node.kind === "query" ? 15 : Math.max(7, Math.min(12, 6 + node.sourceCount * 0.55));
            context.beginPath();
            context.arc(node.x, node.y, radius + (active ? 3 : 0), 0, 2 * Math.PI);
            context.fillStyle = active ? "#1d4ed8" : node.color;
            context.fill();
            context.lineWidth = active ? 3 : 1.5;
            context.strokeStyle = active ? "#93c5fd" : "#ffffff";
            context.stroke();

            const fontSize = Math.max(10 / globalScale, node.kind === "query" ? 5.2 : 4.4);
            context.font = `${node.kind === "query" ? 700 : 600} ${fontSize}px Inter, sans-serif`;
            context.textAlign = "center";
            context.textBaseline = "top";
            const label = String(node.label);
            const maxLabel = node.kind === "query" ? 34 : 24;
            const display = label.length > maxLabel ? `${label.slice(0, maxLabel - 3)}...` : label;
            const textWidth = context.measureText(display).width;
            context.fillStyle = "rgba(255,255,255,.94)";
            context.fillRect(node.x - textWidth / 2 - 3, node.y + radius + 3, textWidth + 6, fontSize + 5);
            context.fillStyle = node.kind === "query" ? "#1e3a8a" : "#334155";
            context.fillText(display, node.x, node.y + radius + 5);
          }}
        />
        {!shown.length ? (
          <div className="pointer-events-none absolute inset-0 flex items-end justify-center pb-8 text-sm text-slate-500">
            No concepts match that filter.
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-slate-200 bg-slate-50 px-5 py-3 text-[11px] text-slate-500">
        <span className="inline-flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-blue-600" /> Research question
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-violet-500" /> Evidence-backed concept
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-px w-5 bg-slate-400" /> Connection to supporting sources
        </span>
        <span className="ml-auto">Circle size reflects the amount of supporting evidence</span>
      </div>
    </div>
  );
}

export default function ResearchExplorer() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<ResearchResult | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [summaryMode, setSummaryMode] = useState<SummaryMode>("extensive");
  const [sourceTab, setSourceTab] = useState<SourceTab>("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recents, setRecents] = useState<RecentSearchItem[]>([]);
  const [sidebarFilter, setSidebarFilter] = useState("");
  const [bottomQuery, setBottomQuery] = useState("");
  const [followUps, setFollowUps] = useState<FollowUpMessage[]>([]);
  const [followUpLoading, setFollowUpLoading] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(RECENTS_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as RecentSearchItem[];
      setRecents(Array.isArray(parsed) ? parsed : []);
    } catch {
      setRecents([]);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(RECENTS_KEY, JSON.stringify(recents.slice(0, 10)));
    } catch {
      // ignore storage errors
    }
  }, [recents]);

  const selectedNode = useMemo(() => {
    if (!result || !selectedNodeId) return null;
    return result.nodes.find((n) => n.id === selectedNodeId) ?? null;
  }, [result, selectedNodeId]);

  const visibleSources = useMemo(() => {
    if (!result) return [] as NormalizedSource[];

    let list = result.sources;
    if (selectedNode) {
      list = list.filter((s) => selectedNode.sourceIds.includes(s.id));
    }
    if (sourceTab !== "all") {
      list = list.filter((s) => s.type === sourceTab);
    }
    return list;
  }, [result, selectedNode, sourceTab]);

  const groupedSources = useMemo(() => groupByType(visibleSources), [visibleSources]);

  const visibleRecents = useMemo(() => {
    const q = sidebarFilter.trim().toLowerCase();
    if (!q) return recents;
    return recents.filter((r) => r.query.toLowerCase().includes(q));
  }, [recents, sidebarFilter]);

  const summaryText = useMemo(() => {
    if (!result) return "";
    return summaryMode === "brief" ? result.summary.brief : result.summary.extensive;
  }, [result, summaryMode]);

  const addRecent = (next: ResearchResult) => {
    setRecents((prev) => {
      const filtered = prev.filter((r) => r.query.toLowerCase() !== next.query.toLowerCase());
      return [
        {
          id: `${Date.now()}`,
          query: next.query,
          timestamp: next.generatedAt,
          result: next,
        },
        ...filtered,
      ].slice(0, 10);
    });
  };

  const queryBackend = async (input: string) => {
    const clean = input.trim();
    if (!clean) {
      setError("Please enter a query.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("http://localhost:3000/api/research/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: clean,
          maxResults: 10,
        }),
      });

      const contentType = res.headers.get("content-type") || "";
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Research request failed.");
      }
      if (!contentType.includes("application/json")) {
        const text = await res.text();
        throw new Error(`Expected JSON response, got ${contentType}. ${text.slice(0, 120)}`);
      }

      const data = (await res.json()) as ResearchResult;
      setResult(data);
      setSelectedNodeId(null);
      setSummaryMode("extensive");
      setSourceTab("all");
      setQuery("");
      setBottomQuery("");
      setFollowUps([]);
      addRecent(data);
    } catch (err: any) {
      setError(err?.message || "Failed to search.");
    } finally {
      setLoading(false);
    }
  };

  const openRecent = (item: RecentSearchItem) => {
    setResult(item.result);
    setSelectedNodeId(null);
    setSummaryMode("extensive");
    setSourceTab("all");
    setQuery(item.query);
    setBottomQuery("");
    setFollowUps([]);
    setError(null);
  };

  const startNewChat = () => {
    setResult(null);
    setSelectedNodeId(null);
    setSummaryMode("extensive");
    setSourceTab("all");
    setQuery("");
    setBottomQuery("");
    setFollowUps([]);
    setError(null);
  };

  const onMainSearch = () => queryBackend(query);
  const onBottomSearch = async () => {
    const question = bottomQuery.trim();
    if (!question || !result || followUpLoading) return;

    const evidenceSources = selectedNode
      ? result.sources.filter((source) => selectedNode.sourceIds.includes(source.id))
      : result.sources;
    const userMessage: FollowUpMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: question,
    };

    setFollowUps((previous) => [...previous, userMessage]);
    setBottomQuery("");
    setFollowUpLoading(true);
    setError(null);

    try {
      const res = await fetch("http://localhost:3000/api/research/follow-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          originalQuery: result.query,
          sources: evidenceSources.map(({ raw: _raw, ...source }) => source),
          history: followUps.map(({ role, content }) => ({ role, content })),
        }),
      });

      if (!res.ok) {
        throw new Error((await res.text()) || "Could not answer from the retrieved documents.");
      }

      const answer = await res.json() as { answer: string; citationIds: string[] };
      setFollowUps((previous) => [
        ...previous,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: answer.answer,
          citationIds: answer.citationIds,
        },
      ]);
    } catch (err: any) {
      setFollowUps((previous) => [
        ...previous,
        {
          id: `assistant-error-${Date.now()}`,
          role: "assistant",
          content: err?.message || "Could not answer from the retrieved documents.",
          citationIds: [],
        },
      ]);
    } finally {
      setFollowUpLoading(false);
    }
  };

  const hasResult = Boolean(result);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-[1800px]">
        {/* Sidebar */}
        <aside className="flex w-[290px] flex-col border-r border-slate-200 bg-white px-4 py-4 shadow-[2px_0_18px_rgba(15,23,42,0.03)]">
          <div className="flex items-center justify-between gap-3 px-1">
            <div>
              <div className="text-2xl font-extrabold tracking-tight text-blue-700">MARA</div>
              <div className="text-sm text-slate-500">Multi Agentic Research Assistant</div>
            </div>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              v1
            </span>
          </div>

          <button
            onClick={startNewChat}
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
          >
            <Plus className="h-4 w-4" />
            New Chat
          </button>

          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
            <div className="flex items-center gap-2 text-slate-500">
              <Search className="h-4 w-4" />
              <input
                value={sidebarFilter}
                onChange={(e) => setSidebarFilter(e.target.value)}
                placeholder="Search chats"
                className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
              />
            </div>
          </div>

          <div className="mt-6 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            <Clock3 className="h-4 w-4" />
            Recents
          </div>

          <div className="mt-3 flex-1 overflow-y-auto pr-1">
            {visibleRecents.length ? (
              <div className="space-y-2">
                {visibleRecents.map((item) => {
                  const active = result?.query === item.result.query;
                  return (
                    <button
                      key={item.id}
                      onClick={() => openRecent(item)}
                      className={`w-full rounded-2xl border px-3 py-3 text-left transition ${
                        active
                          ? "border-blue-200 bg-blue-50"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold text-slate-900">
                            {item.query}
                          </div>
                          <div className="mt-1 text-xs text-slate-500">
                            {formatTime(item.timestamp) || formatDate(item.timestamp)}
                          </div>
                        </div>
                        <RotateCcw className="h-4 w-4 shrink-0 text-slate-400" />
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                No recents yet. Run your first search.
              </div>
            )}
          </div>

          <div className="mt-4 border-t border-slate-200 pt-4 text-xs text-slate-400">
            Powered by multi-agent retrieval
          </div>
        </aside>

        {/* Main panel */}
        <main className="flex min-w-0 flex-1 flex-col px-5 py-5 lg:px-6 lg:py-6">
          {!hasResult ? (
            <div className="flex flex-1 flex-col items-center justify-center rounded-[28px] border border-slate-200 bg-white px-8 py-10 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-50 text-blue-700">
                <WandSparkles className="h-8 w-8" />
              </div>
              <div className="text-center">
                <div className="text-5xl font-black tracking-tight text-blue-700 md:text-6xl">MARA</div>
                <div className="mt-2 text-xl font-semibold text-slate-900 md:text-2xl">
                  Multi Agentic Research Assistant
                </div>
                <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 md:text-base">
                  Search papers, news, repositories, and models. Select a key concept to inspect its evidence, then ask follow-up questions using only the retrieved documents.
                </p>
              </div>

              <div className="mt-10 w-full max-w-3xl rounded-[28px] border border-slate-200 bg-slate-50 p-3 shadow-sm">
                <div className="flex flex-col gap-3 md:flex-row md:items-center">
                  <div className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3">
                    <div className="flex items-center gap-2 text-slate-500">
                      <Search className="h-4 w-4" />
                      <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") onMainSearch();
                        }}
                        placeholder="Ask about Applied NLP, agentic systems, RAG, fine-tuning..."
                        className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400 md:text-base"
                      />
                    </div>
                  </div>
                  <button
                    onClick={onMainSearch}
                    disabled={loading}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-60"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                    Search
                  </button>
                </div>
                {error ? <div className="mt-3 text-sm text-rose-600">{error}</div> : null}
              </div>

              <div className="mt-6 grid w-full max-w-4xl grid-cols-1 gap-3 md:grid-cols-3">
                {[
                  "What is happening in Applied NLP?",
                  "Search recent agentic workflow papers",
                  "Find GitHub repos for RAG systems",
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => {
                      setQuery(suggestion);
                      queryBackend(suggestion);
                    }}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-sm text-slate-700 transition hover:border-blue-200 hover:bg-blue-50"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col gap-4">
              {/* Top header */}
              <div className="rounded-[28px] border border-slate-200 bg-white px-5 py-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="text-2xl font-bold tracking-tight text-slate-900">
                      {result?.query}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                      <span>{result?.sources.length ?? 0} sources found</span>
                      <span>•</span>
                      <span>Generated on {result ? formatDate(result.generatedAt) : ""} {result ? formatTime(result.generatedAt) : ""}</span>
                    </div>
                  </div>
                  <button
                    onClick={startNewChat}
                    className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    <RotateCcw className="h-4 w-4" />
                    New Search
                  </button>
                </div>
              </div>

              {/* Node graph */}
              {result ? (
                <NodeGraph
                  query={result.query}
                  nodes={result.nodes}
                  selectedNodeId={selectedNodeId}
                  onSelectNode={setSelectedNodeId}
                />
              ) : null}

              {/* Summary + Sources */}
              <div className="grid min-h-0 flex-1 grid-cols-1 items-start gap-4 xl:grid-cols-2">
                <section className="min-h-0 rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] xl:sticky xl:top-4">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-slate-500">
                      <BarChart3 className="h-4 w-4 text-blue-700" />
                      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
                        Research findings from retrieved sources
                      </span>
                    </div>
                    <div className="inline-flex rounded-2xl border border-slate-200 bg-slate-50 p-1">
                      <button
                        onClick={() => setSummaryMode("brief")}
                        className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
                          summaryMode === "brief"
                            ? "bg-blue-600 text-white"
                            : "text-slate-600 hover:bg-white"
                        }`}
                      >
                        Brief Summary
                      </button>
                      <button
                        onClick={() => setSummaryMode("extensive")}
                        className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
                          summaryMode === "extensive"
                            ? "bg-blue-600 text-white"
                            : "text-slate-600 hover:bg-white"
                        }`}
                      >
                        Extensive Summary
                      </button>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="mb-3 flex items-center gap-2 text-slate-500">
                      <Sparkles className="h-4 w-4 text-blue-700" />
                      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
                        {selectedNode
                          ? `Evidence connected to ${selectedNode.label}`
                          : summaryMode === "brief"
                            ? "Brief research synthesis"
                            : "Detailed research synthesis"}
                      </span>
                    </div>
                    {selectedNode ? (
                      <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 p-3">
                        <p className="text-sm leading-relaxed text-blue-950">{selectedNode.summaryHint}</p>
                        <div className="mt-3 text-[10px] font-bold uppercase tracking-[0.16em] text-blue-700">
                          Retrieved from these sources
                        </div>
                        <div className="mt-2 space-y-1.5">
                          {result.sources
                            .filter((source) => selectedNode.sourceIds.includes(source.id))
                            .map((source, index) => (
                              <a
                                key={source.id}
                                href={source.url}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-start gap-2 text-xs leading-relaxed text-blue-800 hover:text-blue-600"
                              >
                                <span className="font-bold">[{index + 1}]</span>
                                <span>{source.title} <span className="text-blue-500">— {source.source}</span></span>
                              </a>
                            ))}
                        </div>
                      </div>
                    ) : null}
                    <div className="whitespace-pre-line text-sm leading-relaxed text-slate-700">
                      {summaryText || "Run a search to see the summary."}
                    </div>
                  </div>

                  {result.intelligence?.agentRuns?.length ? (
                    <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-950 p-4 text-white">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <Brain className="h-4 w-4 text-cyan-400" />
                            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">
                              Agent Intelligence
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-slate-500">
                            Retrieval agents feed a graph analyst and evidence critic.
                          </p>
                        </div>
                        <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${
                          result.intelligence.usedLLM
                            ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                            : "border-amber-400/30 bg-amber-400/10 text-amber-300"
                        }`}>
                          {result.intelligence.usedLLM ? "AI synthesis" : "Fallback synthesis"}
                        </span>
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-2">
                        {result.intelligence.agentRuns.map((agent) => (
                          <div
                            key={agent.id}
                            title={agent.message}
                            className="rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2"
                          >
                            <div className="flex items-center gap-2">
                              {agent.status === "completed" ? (
                                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                              ) : (
                                <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-400" />
                              )}
                              <span className="truncate text-xs font-semibold text-slate-200">{agent.name}</span>
                            </div>
                            <div className="mt-1 truncate pl-5 text-[10px] text-slate-500">
                              {typeof agent.sourceCount === "number"
                                ? `${agent.sourceCount} outputs`
                                : agent.role}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {result.intelligence?.insights?.length ? (
                    <div className="mt-4">
                      <div className="mb-3 flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-violet-600" />
                        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
                          Evidence-backed findings
                        </span>
                      </div>
                      <div className="space-y-3">
                        {result.intelligence.insights.map((insight, index) => (
                          <div key={`${insight.title}-${index}`} className="rounded-2xl border border-slate-200 bg-white p-4">
                            <div className="flex items-start gap-3">
                              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-xs font-black text-violet-700">
                                {index + 1}
                              </span>
                              <div>
                                <h4 className="text-sm font-semibold text-slate-900">{insight.title}</h4>
                                <p className="mt-1 text-xs leading-relaxed text-slate-600">{insight.explanation}</p>
                                <div className="mt-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                                  {insight.sourceIds.length} linked evidence items
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {(result.intelligence?.consensus?.length || result.intelligence?.gaps?.length) ? (
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                        <div className="flex items-center gap-2 text-emerald-800">
                          <ShieldCheck className="h-4 w-4" />
                          <span className="text-xs font-bold uppercase tracking-wider">Consensus</span>
                        </div>
                        <ul className="mt-3 space-y-2 text-xs leading-relaxed text-emerald-950/75">
                          {(result.intelligence?.consensus ?? []).map((item) => <li key={item}>• {item}</li>)}
                        </ul>
                      </div>
                      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                        <div className="flex items-center gap-2 text-amber-800">
                          <AlertTriangle className="h-4 w-4" />
                          <span className="text-xs font-bold uppercase tracking-wider">Evidence gaps</span>
                        </div>
                        <ul className="mt-3 space-y-2 text-xs leading-relaxed text-amber-950/75">
                          {(result.intelligence?.gaps ?? []).map((item) => <li key={item}>• {item}</li>)}
                        </ul>
                      </div>
                    </div>
                  ) : null}

                  {selectedNode ? (
                    <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                      <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                        Selected Concept
                      </div>
                      <div className="mt-2 text-lg font-semibold text-slate-900">
                        {selectedNode.label}
                      </div>
                      <p className="mt-1 text-sm leading-relaxed text-slate-600">
                        {selectedNode.summaryHint}
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-slate-500">
                          {selectedNode.sourceCount} sources
                        </span>
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-slate-500">
                          Score {selectedNode.score}
                        </span>
                      </div>
                    </div>
                  ) : null}
                </section>

                <section className="min-h-0 rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                  <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-slate-500">
                        <Filter className="h-4 w-4 text-blue-700" />
                        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
                          Information retrieved from sources
                        </span>
                      </div>
                      <div className="mt-1 text-sm text-slate-500">
                        {selectedNode ? (
                          <span className="font-medium text-emerald-700">
                            {selectedNode.label} ({visibleSources.length})
                          </span>
                        ) : (
                          <span>All sources ({visibleSources.length})</span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {([
                        ["all", `All (${visibleSources.length})`],
                        ["paper", `Papers (${groupedSources.paper?.length ?? 0})`],
                        ["news", `News/Articles (${(groupedSources.news?.length ?? 0) + (groupedSources.article?.length ?? 0)})`],
                        ["repo", `GitHub Repos (${groupedSources.repo?.length ?? 0})`],
                        ["model", `Models (${groupedSources.model?.length ?? 0})`],
                      ] as const).map(([tab, label]) => (
                        <button
                          key={tab}
                          onClick={() => setSourceTab(tab)}
                          className={`rounded-2xl border px-3 py-2 text-xs font-semibold transition ${
                            sourceTab === tab
                              ? "border-blue-300 bg-blue-50 text-blue-700"
                              : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-white"
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="max-h-[900px] space-y-4 overflow-y-auto pr-1">
                    {visibleSources.length ? (
                      (Object.entries({
                        paper: groupedSources.paper ?? [],
                        news: groupedSources.news ?? [],
                        article: groupedSources.article ?? [],
                        repo: groupedSources.repo ?? [],
                        model: groupedSources.model ?? [],
                      }) as Array<[string, NormalizedSource[]]>).map(([type, items]) => {
                        if (!items.length) return null;
                        return (
                          <div key={type} className="space-y-3">
                            <div className="flex items-center gap-2">
                              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                                {type}
                              </span>
                              <span className="text-xs text-slate-500">{items.length} items</span>
                            </div>
                            <div className="grid grid-cols-1 gap-4">
                              {items.map((source) => (
                                <SourceCard key={source.id} source={source} />
                              ))}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
                        No retrieved sources match the selected concept or filter.
                      </div>
                    )}
                  </div>
                </section>
              </div>

              {followUps.length || followUpLoading ? (
                <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                  <div className="flex items-center gap-2">
                    <MessageSquareText className="h-4 w-4 text-blue-600" />
                    <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
                      Questions answered from this research
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Answers below use only the documents retrieved for this study.
                  </p>
                  <div className="mt-4 space-y-3">
                    {followUps.map((message) => {
                      const citedSources = (message.citationIds ?? [])
                        .map((id) => result.sources.find((source) => source.id === id))
                        .filter(Boolean) as NormalizedSource[];
                      return (
                        <div
                          key={message.id}
                          className={`rounded-2xl border p-4 ${
                            message.role === "user"
                              ? "ml-auto max-w-[85%] border-blue-200 bg-blue-50"
                              : "mr-auto max-w-[92%] border-slate-200 bg-slate-50"
                          }`}
                        >
                          <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
                            {message.role === "user" ? "Your question" : "Answer from retrieved documents"}
                          </div>
                          <div className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-700">
                            {message.content}
                          </div>
                          {citedSources.length ? (
                            <div className="mt-3 border-t border-slate-200 pt-3">
                              <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
                                Sources used
                              </div>
                              <div className="mt-2 flex flex-wrap gap-2">
                                {citedSources.map((source, index) => (
                                  <a
                                    key={source.id}
                                    href={source.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] text-blue-700 hover:border-blue-300"
                                  >
                                    [{index + 1}] {source.title}
                                  </a>
                                ))}
                              </div>
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                    {followUpLoading ? (
                      <div className="mr-auto flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                        <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                        Reading the retrieved documents...
                      </div>
                    ) : null}
                  </div>
                </section>
              ) : null}

              {/* Bottom search bar */}
              <div className="rounded-[28px] border border-slate-200 bg-white p-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                <div className="flex flex-col gap-3 md:flex-row md:items-center">
                  <div className="flex flex-1 items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <MessageSquareText className="h-4 w-4 text-slate-400" />
                    <input
                      value={bottomQuery}
                      onChange={(e) => setBottomQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") onBottomSearch();
                      }}
                      placeholder="Ask a follow-up using only the retrieved documents..."
                      className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400 md:text-base"
                    />
                  </div>
                  <button
                    onClick={onBottomSearch}
                    disabled={followUpLoading || !bottomQuery.trim()}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-60"
                  >
                    {followUpLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                    Ask documents
                  </button>
                </div>
                <div className="mt-2 text-center text-xs text-slate-500">
                  {selectedNode
                    ? `Using only the ${selectedNode.sourceCount} sources connected to ${selectedNode.label}.`
                    : "Using only the sources already retrieved for this research."}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
