import React, { useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  Search,
  Sparkles,
  LayoutGrid,
  FileText,
  GitBranch,
  Newspaper,
  Brain,
  ExternalLink,
  Loader2,
  Clock3,
  Filter,
  ChevronRight,
  Layers,
  WandSparkles,
  BarChart3,
} from "lucide-react";
import type { NormalizedSource, ResearchResult, TopicNode } from "../types/researchResult";

type SummaryMode = "brief" | "extensive";

function getTypeLabel(type: NormalizedSource["type"]) {
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
      return "Hugging Face Model";
    default:
      return type;
  }
}

function getTypeIcon(type: NormalizedSource["type"]) {
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

function formatDate(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "Unknown date";
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function groupByType(sources: NormalizedSource[]) {
  return sources.reduce<Record<string, NormalizedSource[]>>((acc, src) => {
    acc[src.type] ??= [];
    acc[src.type].push(src);
    return acc;
  }, {});
}

function SourceCard({ source }: { source: NormalizedSource }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-sm transition hover:border-white/20 hover:bg-white/7"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="mt-0.5 rounded-lg border border-white/10 bg-black/30 p-2 text-white/70 shrink-0">
            {getTypeIcon(source.type)}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">
                {getTypeLabel(source.type)}
              </span>
              <span className="rounded-full border border-white/10 bg-black/30 px-2 py-0.5 text-[10px] text-white/45">
                {source.source}
              </span>
            </div>
            <a
              href={source.url}
              target="_blank"
              rel="noreferrer"
              className="mt-1 block break-words text-base font-semibold leading-snug text-white hover:text-blue-400 hover:underline"
            >
              {source.title}
            </a>
          </div>
        </div>
        <a
          href={source.url}
          target="_blank"
          rel="noreferrer"
          className="rounded-lg border border-white/10 bg-black/25 p-2 text-white/45 transition hover:text-white"
          aria-label={`Open ${source.title}`}
        >
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>

      <p className="mt-3 line-clamp-4 text-sm leading-relaxed text-white/70">
        {source.snippet || "No snippet available."}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/30 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-white/45">
          <Clock3 className="h-3.5 w-3.5" />
          {formatDate(source.publishedAt)}
        </span>
        <span className="rounded-full border border-white/10 bg-black/30 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-white/45">
          Relevance {Math.round(source.relevance * 100)}%
        </span>
        <span className="rounded-full border border-white/10 bg-black/30 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-white/45">
          Freshness {Math.round(source.freshness * 100)}%
        </span>
      </div>

      {source.tags?.length ? (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {source.tags.slice(0, 6).map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-white/50"
            >
              {tag}
            </span>
          ))}
        </div>
      ) : null}
    </motion.div>
  );
}

function TopicNodeButton({
  node,
  active,
  onClick,
}: {
  node: TopicNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`group w-full rounded-2xl border p-4 text-left transition-all duration-200 ${
        active
          ? "border-blue-500/30 bg-blue-500/10 shadow-[0_0_0_1px_rgba(59,130,246,0.15)]"
          : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/7"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <LayoutGrid className="h-4 w-4 text-blue-400" />
            <h3 className="truncate text-sm font-semibold text-white">
              {node.label}
            </h3>
          </div>
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-white/55">
            {node.summaryHint}
          </p>
        </div>
        <ChevronRight className={`h-4 w-4 shrink-0 transition ${active ? "text-blue-300" : "text-white/25 group-hover:text-white/50"}`} />
      </div>

      <div className="mt-4 flex items-center justify-between text-[10px] uppercase tracking-[0.18em] text-white/45">
        <span>{node.sourceCount} sources</span>
        <span>Score {node.score}</span>
      </div>
    </button>
  );
}

export default function ResearchExplorer() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<ResearchResult | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [summaryMode, setSummaryMode] = useState<SummaryMode>("brief");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedNode = useMemo(() => {
    if (!result || !selectedNodeId) return null;
    return result.nodes.find((n) => n.id === selectedNodeId) ?? null;
  }, [result, selectedNodeId]);

  const filteredSources = useMemo(() => {
    if (!result) return [];
    if (!selectedNode) return result.sources;
    return result.sources.filter((s) => selectedNode.sourceIds.includes(s.id));
  }, [result, selectedNode]);

  const groupedSources = useMemo(() => groupByType(filteredSources), [filteredSources]);

  const runSearch = async () => {
    const cleanQuery = query.trim();
    if (!cleanQuery) {
      setError("Please enter a query first.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("http://localhost:3000/api/research/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: cleanQuery,
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
        throw new Error(`Expected JSON but got ${contentType}. First chars: ${text.slice(0, 120)}`);
      }

      const data = (await res.json()) as ResearchResult;
      setResult(data);
      setSelectedNodeId(data.nodes[0]?.id ?? null);
      setSummaryMode("brief");
    } catch (err: any) {
      setError(err?.message || "Failed to run search.");
    } finally {
      setLoading(false);
    }
  };

  const summaryText = useMemo(() => {
    if (!result) return "";
    return summaryMode === "brief" ? result.summary.brief : result.summary.extensive;
  }, [result, summaryMode]);

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <div className="mx-auto flex min-h-screen max-w-[1700px] flex-col px-4 py-4 lg:px-6 lg:py-6">
        <header className="mb-4 rounded-3xl border border-white/10 bg-white/5 px-5 py-4 backdrop-blur">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <div className="flex items-center gap-2 text-blue-400">
                <WandSparkles className="h-5 w-5" />
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">
                  Retrieval Explorer
                </span>
              </div>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl lg:text-4xl">
                Multi-source research discovery
              </h1>
              <p className="mt-1 max-w-3xl text-sm leading-relaxed text-white/55 md:text-base">
                Search arXiv, IEEE, GitHub, Hugging Face, and tech news, then click a topic node to inspect sources and switch between a brief or extensive summary.
              </p>
            </div>

            <div className="flex w-full max-w-2xl flex-col gap-3 xl:w-[36rem] xl:max-w-none">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") runSearch();
                  }}
                  placeholder="e.g. Applied NLP, RAG evaluation, agentic systems"
                  className="w-full rounded-2xl border border-white/10 bg-black/40 py-3.5 pl-10 pr-4 text-sm outline-none ring-0 placeholder:text-white/25 focus:border-blue-500/40 focus:bg-black/50"
                />
              </div>
              <button
                onClick={runSearch}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                {loading ? "Searching..." : "Search"}
              </button>
            </div>
          </div>

          {error ? (
            <div className="mt-4 rounded-2xl border border-rose-500/20 bg-rose-950/20 px-4 py-3 text-sm text-rose-200">
              {error}
            </div>
          ) : null}
        </header>

        <div className="grid flex-1 min-h-0 grid-cols-1 gap-4 xl:grid-cols-[19rem_minmax(0,1fr)_24rem]">
          <aside className="min-h-0 rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-white/45">
                  <Layers className="h-4 w-4 text-blue-400" />
                  <span className="text-xs font-semibold uppercase tracking-[0.2em]">Topic nodes</span>
                </div>
                <p className="mt-1 text-xs text-white/45">
                  Click a node to filter the center panel.
                </p>
              </div>
              {result ? (
                <span className="rounded-full border border-white/10 bg-black/30 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-white/45">
                  {result.nodes.length} nodes
                </span>
              ) : null}
            </div>

            <div className="space-y-3 overflow-y-auto pr-1" style={{ maxHeight: "calc(100vh - 220px)" }}>
              {result?.nodes?.length ? (
                result.nodes.map((node) => (
                  <TopicNodeButton
                    key={node.id}
                    node={node}
                    active={node.id === selectedNodeId}
                    onClick={() => setSelectedNodeId(node.id)}
                  />
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-6 text-sm text-white/45">
                  Run a search to see topic nodes.
                </div>
              )}
            </div>
          </aside>

          <main className="min-h-0 rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-white/45">
                  <Filter className="h-4 w-4 text-blue-400" />
                  <span className="text-xs font-semibold uppercase tracking-[0.2em]">Source explorer</span>
                </div>
                <p className="mt-1 text-xs text-white/45">
                  {selectedNode ? `${selectedNode.label} · ${filteredSources.length} sources` : "All sources"}
                </p>
              </div>
              <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/30 p-1">
                {(["paper", "news", "repo", "model"] as const).map((type) => {
                  const count = groupedSources[type]?.length ?? 0;
                  return (
                    <span
                      key={type}
                      className="rounded-xl border border-white/10 px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] text-white/50"
                    >
                      {type}: {count}
                    </span>
                  );
                })}
              </div>
            </div>

            <div className="space-y-6 overflow-y-auto pr-1" style={{ maxHeight: "calc(100vh - 220px)" }}>
              {result ? (
                Object.entries(groupedSources).length ? (
                  (Object.entries({
                    paper: groupedSources.paper ?? [],
                    news: groupedSources.news ?? [],
                    repo: groupedSources.repo ?? [],
                    model: groupedSources.model ?? [],
                    article: groupedSources.article ?? [],
                  }) as Array<[string, NormalizedSource[]]>).map(([type, items]) => {
                    if (!items.length) return null;
                    return (
                      <section key={type} className="space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-white/45">
                            {type}
                          </span>
                          <span className="text-xs text-white/40">{items.length} items</span>
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                          {items.map((source) => (
                            <SourceCard key={source.id} source={source} />
                          ))}
                        </div>
                      </section>
                    );
                  })
                ) : (
                  <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-6 text-sm text-white/45">
                    No sources matched this node yet.
                  </div>
                )
              ) : (
                <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-6 text-sm text-white/45">
                  Search to populate results.
                </div>
              )}
            </div>
          </main>

          <aside className="min-h-0 rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-white/45">
                  <BarChart3 className="h-4 w-4 text-blue-400" />
                  <span className="text-xs font-semibold uppercase tracking-[0.2em]">Summary</span>
                </div>
                <p className="mt-1 text-xs text-white/45">
                  Switch between brief and extensive outputs.
                </p>
              </div>
            </div>

            <div className="mb-4 grid grid-cols-2 gap-2 rounded-2xl border border-white/10 bg-black/30 p-1">
              <button
                onClick={() => setSummaryMode("brief")}
                className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
                  summaryMode === "brief"
                    ? "bg-blue-600 text-white"
                    : "text-white/55 hover:bg-white/5 hover:text-white"
                }`}
              >
                Brief
              </button>
              <button
                onClick={() => setSummaryMode("extensive")}
                className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
                  summaryMode === "extensive"
                    ? "bg-blue-600 text-white"
                    : "text-white/55 hover:bg-white/5 hover:text-white"
                }`}
              >
                Extensive
              </button>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <div className="mb-3 flex items-center gap-2 text-white/45">
                <Sparkles className="h-4 w-4 text-blue-400" />
                <span className="text-xs font-semibold uppercase tracking-[0.2em]">
                  {summaryMode === "brief" ? "Brief summary" : "Extensive summary"}
                </span>
              </div>
              <p className="whitespace-pre-line text-sm leading-relaxed text-white/75">
                {summaryText || "Run a search to see the summary."}
              </p>
            </div>

            {selectedNode ? (
              <div className="mt-4 rounded-2xl border border-white/10 bg-black/25 p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">
                  Selected node
                </div>
                <h3 className="mt-2 text-lg font-semibold text-white">{selectedNode.label}</h3>
                <p className="mt-1 text-sm leading-relaxed text-white/65">
                  {selectedNode.summaryHint}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-white/45">
                    {selectedNode.sourceCount} sources
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-white/45">
                    Score {selectedNode.score}
                  </span>
                </div>
              </div>
            ) : null}
          </aside>
        </div>
      </div>
    </div>
  );
}
