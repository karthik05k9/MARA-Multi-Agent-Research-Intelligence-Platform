import React, { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import {
  Search,
  Database,
  BookOpen,
  TrendingUp,
  Cpu,
  Layers,
  AlertTriangle,
  Trash2,
  Clock,
  ArrowRight,
  Send,
  ExternalLink,
  CheckCircle,
  X,
  MessageSquare,
  ChevronRight,
  Sparkles,
  Info,
} from "lucide-react";
import type {
  EvidenceSource,
  ResearchProject,
  ChatMessage,
} from "./types.js";

type TabType = "summary" | "debate" | "sources" | "chat";
type StudyMode = "summarize" | "compare" | "forecast" | "debate" | "explain_simply";
type TimeWindow = "30d" | "90d" | "all";

interface SavedResearchItem {
  id: string;
  topic: string;
  timestamp: string;
  timeWindow: string;
  mode: string;
  summaryText: string;
  sourceCount: number;
  hypothesisCount: number;
}

function getModeLabel(m: string) {
  switch (m) {
    case "summarize":
      return "Summarize Trends";
    case "compare":
      return "Compare Systems";
    case "forecast":
      return "Forecast Shift";
    case "debate":
      return "Analyze Debates";
    case "explain_simply":
      return "Explain Simply";
    default:
      return m;
  }
}

function getSourceColor(type: string) {
  switch (type) {
    case "paper":
      return "bg-rose-500/10 border-rose-500/25 text-rose-400";
    case "github":
      return "bg-emerald-500/10 border-emerald-500/25 text-emerald-400";
    case "article":
      return "bg-amber-500/10 border-amber-500/25 text-amber-400";
    case "model":
      return "bg-indigo-500/10 border-indigo-500/25 text-indigo-400";
    case "benchmark":
      return "bg-blue-500/10 border-blue-500/25 text-blue-400";
    default:
      return "bg-white/5 border-white/10 text-white/60";
  }
}

function summarizeProject(project: ResearchProject) {
  return {
    executiveSummary: project.report?.executiveSummary ?? "",
    keyTakeaways: project.report?.keyTakeaways ?? [],
    futureOutlook: project.report?.futureOutlook ?? "",
    confidenceRating: project.report?.confidenceRating ?? { score: 0, explanation: "" },
    domainDistribution:
      project.report?.domainDistribution ?? {
        paper: 0,
        github: 0,
        article: 0,
        model: 0,
        benchmark: 0,
      },
  };
}

function StudyDashboard({
  project,
  selectedTab,
  setSelectedTab,
  chatMessage,
  setChatMessage,
  isSendingChat,
  sendChatMessage,
  chatBottomRef,
}: {
  project: ResearchProject;
  selectedTab: TabType;
  setSelectedTab: React.Dispatch<React.SetStateAction<TabType>>;
  chatMessage: string;
  setChatMessage: React.Dispatch<React.SetStateAction<string>>;
  isSendingChat: boolean;
  sendChatMessage: (e: React.FormEvent) => Promise<void>;
  chatBottomRef: React.RefObject<HTMLDivElement | null>;
}) {
  const report = summarizeProject(project);

  return (
    <motion.div key={project.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col gap-6">
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-sm flex flex-col xl:flex-row justify-between gap-5">
        <div>
          <span className="text-xs font-mono uppercase bg-blue-600/10 text-blue-400 border border-blue-500/20 font-semibold tracking-wider rounded px-2.5 py-1 inline-block">
            {getModeLabel(project.mode)}
          </span>
          <h2 className="text-3xl lg:text-4xl font-light text-white tracking-tight mt-3 font-serif">
            {project.topic}
          </h2>
          <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-white/55">
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-white/40" />
              <span>Analyzed: {new Date(project.timestamp).toLocaleDateString()}</span>
            </span>
            <span className="hidden sm:inline">•</span>
            <span className="flex items-center gap-1.5">
              <Database className="w-4 h-4 text-white/40" />
              <span>Sources: {project.sources.length}</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 border-l border-white/10 pl-0 xl:pl-6">
          <div className="text-center">
            <div className="text-3xl font-mono text-blue-400 tracking-tight font-semibold">
              {report.confidenceRating.score}/10
            </div>
            <span className="text-[10px] font-mono uppercase text-white/40 tracking-wider">
              Certainty
            </span>
          </div>
          <div className="w-2 h-14 bg-white/5 rounded-full overflow-hidden relative">
            <div
              className="absolute bottom-0 left-0 right-0 bg-blue-500 shadow-[0_0_8px_#3b82f6] rounded-full"
              style={{ height: `${report.confidenceRating.score * 10}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-5 gap-4">
        {Object.entries(report.domainDistribution).map(([domain, count]) => (
          <div key={domain} className="bg-white/5 border border-white/10 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between text-white/40 mb-1">
              <span className="text-[10px] font-mono uppercase tracking-wider font-semibold">{domain}s</span>
              <BookOpen className="w-4 h-4 text-white/20" />
            </div>
            <div className="text-xl font-mono text-white leading-tight">{count}</div>
          </div>
        ))}
      </div>

      <div className="border-b border-white/10 flex gap-3 overflow-x-auto">
        {([
          ["summary", "Synthesis Report"],
          ["debate", `Debate Arena (${project.hypotheses.length})`],
          ["sources", `Source Explorer (${project.sources.length})`],
          ["chat", "RAG Workspace Chat"],
        ] as const).map(([tab, label]) => (
          <button
            key={tab}
            onClick={() => setSelectedTab(tab)}
            className={`pb-3 text-sm uppercase tracking-wider font-semibold border-b-2 px-1 transition-all whitespace-nowrap ${
              selectedTab === tab
                ? "border-blue-500 text-white"
                : "border-transparent text-white/40 hover:text-white/80"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1 min-h-0">
        {selectedTab === "summary" && (
          <div className="space-y-6">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-sm">
              <h3 className="text-xs uppercase tracking-[0.2em] font-semibold text-white/40 mb-3 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-blue-400" />
                <span>Executive Summary</span>
              </h3>
              <p className="text-white/80 text-base leading-relaxed whitespace-pre-line">
                {report.executiveSummary}
              </p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-sm">
                <h3 className="text-xs uppercase tracking-[0.2em] font-semibold text-white/40 mb-4 flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span>Takeaways</span>
                </h3>
                <ul className="space-y-3">
                  {report.keyTakeaways.map((task, idx) => (
                    <li key={idx} className="text-sm text-white/70 flex items-start gap-2.5 leading-relaxed">
                      <span className="w-6 h-6 bg-white/5 border border-white/10 rounded-full flex items-center justify-center font-mono text-[10px] text-white/50 font-semibold shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span>{task}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-sm">
                <h3 className="text-xs uppercase tracking-[0.2em] font-semibold text-white/40 mb-4 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-blue-400" />
                  <span>Future Projection</span>
                </h3>
                <p className="text-sm text-white/70 leading-relaxed whitespace-pre-line">{report.futureOutlook}</p>
                <div className="mt-4 p-3 bg-black/40 rounded-lg border border-white/5 text-xs text-white/45 flex items-center gap-2">
                  <Info className="w-4 h-4 text-white/30" />
                  <span>Confidence: {report.confidenceRating.explanation}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedTab === "debate" && (
          <div className="space-y-5">
            <div className="text-sm text-white/45 max-w-3xl">
              Hypothesis and critic agents compare the strongest signals across papers, GitHub, and model hubs.
            </div>
            <div className="space-y-4">
              {project.hypotheses.map((h, index) => (
                <div key={h.id || index} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-sm">
                  <div className="p-4 bg-white/5 border-b border-white/10 flex flex-col xl:flex-row xl:items-center justify-between gap-3">
                    <div className="flex items-start gap-3 pr-4">
                      <span className="w-7 h-7 bg-blue-600 text-white rounded flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 font-mono shadow-[0_0_8px_#3b82f6]">
                        C{index + 1}
                      </span>
                      <div>
                        <h4 className="text-base font-bold text-white">{h.claim}</h4>
                        <div className="mt-1">
                          <span className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 font-bold rounded border ${h.status === "supported" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : h.status === "contested" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : "bg-rose-500/10 text-rose-400 border-rose-500/20"}`}>
                            {h.status}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 pr-1">
                      <div className="text-center">
                        <div className="text-sm font-bold text-white font-mono">{h.evidence_strength}/10</div>
                        <div className="text-[10px] font-mono uppercase text-white/40">Strength</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-bold text-white font-mono">{h.novelty}/10</div>
                        <div className="text-[10px] font-mono uppercase text-white/40">Novelty</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-bold text-white font-mono">{h.risk}/10</div>
                        <div className="text-[10px] font-mono uppercase text-white/40">Hype Risk</div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 xl:grid-cols-2 divide-y xl:divide-y-0 xl:divide-x divide-white/10">
                    <div className="p-5 bg-black/20">
                      <span className="text-xs font-mono uppercase text-white/40 font-semibold tracking-wide block mb-2">Pros</span>
                      <p className="text-sm text-white/80 leading-relaxed whitespace-pre-line">{h.pros}</p>
                    </div>
                    <div className="p-5 bg-white/5">
                      <span className="text-xs font-mono uppercase text-rose-400 font-semibold tracking-wide block mb-2 flex items-center gap-1">
                        <AlertTriangle className="w-4 h-4 text-rose-400" />
                        <span>Cons</span>
                      </span>
                      <p className="text-sm text-white/80 leading-relaxed whitespace-pre-line">{h.cons}</p>
                    </div>
                  </div>

                  <div className="p-4 bg-black/45 border-t border-white/10 text-sm text-white/60 flex items-start gap-2">
                    <Info className="w-4 h-4 text-white/35 shrink-0 mt-0.5" />
                    <p>
                      <strong className="text-white font-semibold">Decision:</strong> {h.reasoning}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedTab === "sources" && (
          <div className="space-y-4">
            <div className="text-sm text-white/45">Click any source to open it directly.</div>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {project.sources.map((src) => (
                <div key={src.id} className="bg-white/5 border border-white/10 hover:border-white/30 rounded-2xl p-5 shadow-sm transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-3 gap-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded border ${getSourceColor(src.source_type)}`}>
                          {src.source_type}
                        </span>
                        <span className="text-[10px] text-white/30 font-mono">ID: {src.id}</span>
                      </div>
                      <span className="text-sm text-white/50 font-serif italic whitespace-nowrap">{src.date}</span>
                    </div>

                    <a href={src.url} target="_blank" rel="noreferrer" className="text-base font-bold text-white hover:text-blue-400 hover:underline inline-flex items-center gap-1 leading-snug">
                      <span>{src.title}</span>
                      <ExternalLink className="w-4 h-4 text-white/35 shrink-0" />
                    </a>

                    <p className="text-sm mt-3 text-white/70 leading-relaxed">{src.summary}</p>
                  </div>

                  <div className="mt-5 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-2.5">
                    <div className="flex flex-wrap gap-1">
                      {(src.topic_tags ?? []).map((tag) => (
                        <span key={tag} className="text-[10px] bg-black/40 text-white/50 rounded px-1.5 py-0.5 border border-white/5 font-mono">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-3 text-[10px] font-mono text-white/40">
                      <div>Relevance: <span className="text-white font-semibold">{src.relevance_score}</span></div>
                      <div>Authority: <span className="text-white font-semibold">{src.confidence}</span></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedTab === "chat" && (
          <div className="bg-white/5 border border-white/10 rounded-2xl shadow-sm flex flex-col h-[560px] overflow-hidden">
            <div className="p-4 bg-white/5 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-white/45" />
                <span className="text-sm font-bold text-white uppercase tracking-wide">Grounded RAG Sandbox</span>
              </div>
              <span className="text-[10px] font-mono text-white/30">Retrieval active</span>
            </div>

            <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-gradient-to-b from-transparent to-black/30">
              {project.chatHistory.map((m) => {
                const isAssistant = m.role === "assistant";
                return (
                  <div key={m.id} className={`flex ${isAssistant ? "justify-start" : "justify-end"}`}>
                    <div className={`max-w-[88%] rounded-xl p-4 shadow-sm border ${isAssistant ? "bg-white/5 border-white/10 text-white rounded-bl-none" : "bg-blue-600/10 border-blue-500/20 text-blue-100 rounded-br-none"}`}>
                      <div className="flex items-center gap-1.5 mb-1 text-[10px] font-mono uppercase tracking-wider text-white/40 font-semibold">
                        <span>{isAssistant ? "Orchestration Bot" : "User Researcher"}</span>
                        <span>•</span>
                        <span>{new Date(m.timestamp).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}</span>
                      </div>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.content}</p>

                      {isAssistant && m.citations && m.citations.length > 0 && (
                        <div className="mt-3 pt-2.5 border-t border-white/10 text-[10px] text-white/40">
                          <span className="font-mono uppercase tracking-wider font-semibold block mb-1 text-[9px]">
                            Retrieved Citations:
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {m.citations.map((cId) => {
                              const origSource = project.sources.find((src) => src.id === cId);
                              return origSource ? (
                                <a key={cId} href={origSource.url} target="_blank" rel="noreferrer" className="bg-black/40 hover:bg-white/5 text-white/60 rounded px-1.5 py-0.5 border border-white/5 flex items-center gap-1">
                                  <span className="font-semibold text-white">[{origSource.id}]</span>
                                  <span className="truncate max-w-[120px]">{origSource.title}</span>
                                </a>
                              ) : null;
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {isSendingChat && (
                <div className="flex justify-start">
                  <div className="bg-white/5 border border-white/10 rounded-lg p-4 font-mono text-[10px] text-white/40 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" />
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                    <span>Sifting local vector database...</span>
                  </div>
                </div>
              )}

              <div ref={chatBottomRef} />
            </div>

            <form onSubmit={sendChatMessage} className="p-4 border-t border-white/10 flex gap-2.5 bg-black/40">
              <input
                type="text"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                placeholder="Ask a follow-up..."
                className="flex-1 rounded-md border border-white/10 py-2 px-3 text-sm bg-black/40 text-white placeholder-white/30 focus:outline-none focus:border-blue-500"
                disabled={isSendingChat}
              />
              <button
                type="submit"
                disabled={isSendingChat || !chatMessage.trim()}
                className="bg-blue-600 hover:bg-blue-500 text-white rounded-md px-4 py-2 flex items-center justify-center transition-colors disabled:opacity-40"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function App() {
  const [savedStudies, setSavedStudies] = useState<SavedResearchItem[]>([]);
  const [activeProject, setActiveProject] = useState<ResearchProject | null>(null);
  const [selectedTab, setSelectedTab] = useState<TabType>("summary");
  const [query, setQuery] = useState("");
  const [timeWindow, setTimeWindow] = useState<TimeWindow>("all");
  const [mode, setMode] = useState<StudyMode>("summarize");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [chatMessage, setChatMessage] = useState("");
  const [isSendingChat, setIsSendingChat] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const suggestions: Array<{ text: string; mode: StudyMode; win: TimeWindow }> = [
    { text: "What is happening in Applied NLP right now?", mode: "summarize", win: "all" },
    { text: "Small task-specific LLMs vs fine-tuning general models", mode: "compare", win: "90d" },
    { text: "Future of Agentic Workflows and RAG integration", mode: "forecast", win: "all" },
    { text: "Are standard NLP benchmarks becoming saturated?", mode: "debate", win: "all" },
  ];

  const loadingSequence = [
    { label: "Query Translation", desc: "Understanding topics, search terms, and technology focus areas." },
    { label: "Deploying Crawlers", desc: "Scouting academic papers on arXiv, trending repos on GitHub, and Hugging Face hubs." },
    { label: "Normalizing Evidence", desc: "Sifting raw search data, cleaning schemas, and computing freshness algorithms." },
    { label: "Hypothesis Debate", desc: "Hypothesis agent proposing trends; Critic agent finding core gaps and hype signals." },
    { label: "Synthesis Report", desc: "Scoring agent rating certainty; Report agent compiling final dashboard metrics." },
  ];

  useEffect(() => {
    fetchSavedStudies();
  }, []);

  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [activeProject?.chatHistory]);

  const fetchSavedStudies = async () => {
    try {
      const res = await fetch("http://localhost:3000/api/research/list");
      if (res.ok) {
        const data = await res.json();
        setSavedStudies(data);
      }
    } catch (err) {
      console.error("Error listing researches:", err);
    }
  };

  const loadProject = async (id: string) => {
    try {
      setIsLoading(true);
      setLoadingStep(0);
      setErrorMessage(null);
      const res = await fetch(`http://localhost:3000/api/research/get/${id}`);
      if (res.ok) {
        const data: ResearchProject = await res.json();
        setActiveProject(data);
        setSelectedTab("summary");
      } else {
        setErrorMessage("Could not load the research study file.");
      }
    } catch (err) {
      setErrorMessage("Error retrieving previous study.");
    } finally {
      setIsLoading(false);
    }
  };

  const deleteProject = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this research study? This action is permanent.")) return;
    try {
      const res = await fetch(`http://localhost:3000/api/research/${id}`, { method: "DELETE" });
      if (res.ok) {
        setSavedStudies((prev) => prev.filter((p) => p.id !== id));
        if (activeProject && activeProject.id === id) {
          setActiveProject(null);
        }
      }
    } catch (err) {
      console.error("Error deleting study:", err);
    }
  };

  const triggerNewResearch = async (searchQuery = query, studyMode = mode, studyWin = timeWindow) => {
    if (!searchQuery || !searchQuery.trim()) return;

    setIsLoading(true);
    setErrorMessage(null);
    setLoadingStep(0);

    const timer1 = setTimeout(() => setLoadingStep(1), 3500);
    const timer2 = setTimeout(() => setLoadingStep(2), 7000);
    const timer3 = setTimeout(() => setLoadingStep(3), 11000);
    const timer4 = setTimeout(() => setLoadingStep(4), 14500);

    try {
      const res = await fetch("http://localhost:3000/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: searchQuery,
          timeWindow: studyWin,
          mode: studyMode,
        }),
      });

      const contentType = res.headers.get("content-type") || "";

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText);
      }

      if (!contentType.includes("application/json")) {
        const text = await res.text();
        console.error("Expected JSON but received:");
        console.error(text);
        throw new Error(`Expected JSON response but received ${contentType}`);
      }

      const completedProject: ResearchProject = await res.json();
      setActiveProject(completedProject);
      setSelectedTab("summary");
      setQuery("");
      await fetchSavedStudies();
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "Failed running multi-agent research workflow.");
    } finally {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
      setIsLoading(false);
    }
  };

  const sendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const currentProject = activeProject;
    if (!chatMessage.trim() || !currentProject || isSendingChat) return;

    const userMsg = chatMessage;
    setChatMessage("");
    setIsSendingChat(true);

    const optimisticUserMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      role: "user",
      content: userMsg,
      timestamp: new Date().toISOString(),
    };

    setActiveProject((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        chatHistory: [...prev.chatHistory, optimisticUserMsg],
      };
    });

    try {
      const res = await fetch(`http://localhost:3000/api/research/${currentProject.id}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg,
          chatHistory: currentProject.chatHistory,
        }),
      });

      if (!res.ok) {
        throw new Error("Chat engine timed out or failed to parse response.");
      }

      const rawResult = await res.json();
      setActiveProject((prev) => {
        if (!prev) return null;
        const updatedChat = prev.chatHistory.filter((m) => m.id !== optimisticUserMsg.id);
        return {
          ...prev,
          chatHistory: [...updatedChat, rawResult.userMessage, rawResult.answer],
        };
      });
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Error generating grounded chatbot response.");
    } finally {
      setIsSendingChat(false);
    }
  };

  return (
    <div id="app-container" className="min-h-screen bg-[#050505] font-sans text-[#E0E0E0] flex flex-col antialiased lg:text-base selection:bg-blue-500/30 selection:text-white">
      <header id="app-header" className="h-16 border-b border-white/10 bg-[#0a0a0a] flex items-center justify-between px-6 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/5 border border-white/10 rounded-md flex items-center justify-center text-white">
            <Cpu className="w-5 h-5 text-blue-400 shadow-[0_0_8px_#3b82f6]" />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-white">Multi-Agent AI Research Assistant</h1>
            <p className="text-[10px] font-mono text-white/45 uppercase tracking-[0.2em] leading-none">Control Center v1.8</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs font-mono text-white/70">
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full shadow-[0_0_8px_#3b82f6] animate-pulse" />
            System Online
          </div>
          <a href="https://ai.studio/build" target="_blank" rel="noreferrer" className="text-xs text-white/40 hover:text-white transition-colors flex items-center gap-1">
            <span>AI Studio</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </header>

      <div className="flex-1 flex flex-col md:flex-row min-h-0 w-full max-w-[1600px] mx-auto">
        <aside id="sidebar-panel" className="w-full md:w-[24rem] lg:w-[28rem] xl:w-[32rem] border-r border-white/10 bg-[#050505] flex flex-col shrink-0 md:sticky md:top-16 md:h-[calc(100vh-4rem)]">
          <div className="p-6 border-b border-white/10">
            <h2 className="text-xs uppercase tracking-[0.2em] font-semibold text-white/40 mb-4 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span>Launch Research Channel</span>
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-white/30 mb-2">Core Topic / Query</label>
                <div className="relative">
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="e.g. Applied NLP, Multi-Agent, etc."
                    className="w-full bg-white/5 border border-white/10 rounded-md py-3 pl-3 pr-10 text-sm lg:text-base text-white placeholder-white/20 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50"
                    disabled={isLoading}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") triggerNewResearch();
                    }}
                  />
                  <button
                    onClick={() => triggerNewResearch()}
                    disabled={isLoading || !query.trim()}
                    className="absolute right-2 top-2 p-1.5 rounded hover:bg-white/5 text-white/40 disabled:opacity-40"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-white/30 mb-2">Time Window</label>
                  <select
                    value={timeWindow}
                    onChange={(e: any) => setTimeWindow(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-md p-2.5 text-sm text-white/80 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                    disabled={isLoading}
                  >
                    <option value="30d" className="bg-[#111111] text-white">Last 30 Days</option>
                    <option value="90d" className="bg-[#111111] text-white">Last 90 Days</option>
                    <option value="all" className="bg-[#111111] text-white">All-Time Trends</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-white/30 mb-2">Analysis Mode</label>
                  <select
                    value={mode}
                    onChange={(e: any) => setMode(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-md p-2.5 text-sm text-white/80 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                    disabled={isLoading}
                  >
                    <option value="summarize" className="bg-[#111111] text-white">Summarize Trends</option>
                    <option value="compare" className="bg-[#111111] text-white">Compare Tech</option>
                    <option value="forecast" className="bg-[#111111] text-white">Forecast Future</option>
                    <option value="debate" className="bg-[#111111] text-white">Debate Claims</option>
                    <option value="explain_simply" className="bg-[#111111] text-white">Explain Simply</option>
                  </select>
                </div>
              </div>

              <button
                onClick={() => triggerNewResearch()}
                disabled={isLoading || !query.trim()}
                className="w-full mt-2 bg-blue-600 hover:bg-blue-500 text-white rounded-md py-3 px-4 text-sm font-semibold tracking-widest leading-none uppercase shadow-[0_0_12px_rgba(59,130,246,0.3)] transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Search className="w-4 h-4" />
                <span>Execute Intel Search</span>
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="p-6 flex items-center justify-between">
              <h3 className="text-xs uppercase tracking-[0.2em] font-semibold text-white/40 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-white/40" />
                <span>Recent Saved Channels</span>
              </h3>
              <span className="text-xs bg-white/5 text-[#E0E0E0] border border-white/10 rounded px-2 py-0.5 font-mono">
                {savedStudies.length}
              </span>
            </div>

            {savedStudies.length === 0 ? (
              <div className="px-5 py-8 text-center border border-dashed border-white/10 mx-5 rounded-lg">
                <Info className="w-5 h-5 text-white/20 mx-auto mb-2" />
                <p className="text-sm text-white/40 leading-relaxed">No completed channels saved yet. Run your first technical lookup.</p>
              </div>
            ) : (
              <div className="space-y-1.5 px-3 pb-4">
                {savedStudies.map((study) => {
                  const isActive = activeProject && activeProject.id === study.id;
                  const dateStr = new Date(study.timestamp).toLocaleDateString(undefined, { month: "short", day: "numeric" });

                  return (
                    <div
                      key={study.id}
                      onClick={() => loadProject(study.id)}
                      className={`group relative p-3 rounded-md cursor-pointer transition-all border ${
                        isActive
                          ? "bg-white/5 border-l-2 border-blue-500 border-y border-r border-white/10 text-white shadow-sm"
                          : "hover:bg-white/5 border-transparent text-white/60"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="pr-4">
                          <p className={`text-sm font-semibold leading-tight tracking-tight ${isActive ? "text-white" : "text-white/80"}`}>
                            {study.topic}
                          </p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className={`text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded ${isActive ? "bg-blue-500/20 text-blue-400 border border-blue-500/25" : "bg-[#161616] text-white/55 border border-white/5"}`}>
                              {study.timeWindow}
                            </span>
                            <span className="text-[10px] text-white/40 font-serif italic">{dateStr}</span>
                          </div>
                        </div>

                        <button
                          onClick={(e) => deleteProject(e, study.id)}
                          className={`opacity-0 group-hover:opacity-100 absolute right-2.5 top-2.5 p-1 rounded hover:bg-white/10 text-white/30 hover:text-rose-400 transition-all ${
                            isActive ? "hover:bg-white/20 text-white/40 hover:text-rose-400" : ""
                          }`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </aside>

        <main id="main-content-display" className="flex-1 bg-[#050505] p-8 lg:p-10 overflow-y-auto flex flex-col min-h-0">
          {errorMessage && (
            <div className="bg-rose-950/20 border border-rose-500/20 rounded-lg p-4 mb-6 flex items-start gap-3 text-rose-200">
              <AlertTriangle className="w-5 h-5 shrink-0 text-rose-500 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-xs font-semibold uppercase tracking-wider">Engine Processing Interruption</h4>
                <p className="text-sm mt-1">{errorMessage}</p>
              </div>
              <button onClick={() => setErrorMessage(null)} className="p-1 rounded hover:bg-rose-900/30 text-rose-300">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {isLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center py-20 bg-white/5 border border-white/10 rounded-2xl shadow-sm text-center px-6">
              <div className="relative w-16 h-16 mb-8 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-4 border-white/5" />
                <div className="absolute inset-0 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
                <Cpu className="w-6 h-6 text-blue-400 animate-pulse shadow-[0_0_12px_#3b82f6]" />
              </div>

              <div className="max-w-md">
                <span className="text-[10px] font-mono uppercase bg-white/5 border border-white/10 rounded-full px-3 py-1 font-semibold text-white/60 tracking-widest leading-none mb-3 inline-block">
                  PROBING WEB SYSTEMS
                </span>

                <h3 className="text-2xl font-semibold tracking-tight text-white">Executing Orchestrator Sequences</h3>
                <p className="text-white/50 text-sm mt-1.5">Deploying coordinated agents for live research.</p>

                <div className="mt-8 space-y-3.5 text-left border-t border-white/10 pt-6">
                  {loadingSequence.map((step, idx) => {
                    const isCompleted = loadingStep > idx;
                    const isActive = loadingStep === idx;

                    return (
                      <div
                        key={step.label}
                        className={`flex items-start gap-3 transition-opacity duration-300 ${isCompleted ? "opacity-100" : isActive ? "opacity-100" : "opacity-35"}`}
                      >
                        <div className="mt-0.5">
                          {isCompleted ? (
                            <CheckCircle className="w-4 h-4 text-blue-400" />
                          ) : isActive ? (
                            <div className="w-4 h-4 rounded-full border-2 border-blue-500 border-t-transparent animate-spin shrink-0" />
                          ) : (
                            <div className="w-4 h-4 rounded-full border border-white/20 shrink-0" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-white/90">{step.label}</span>
                            {isActive && (
                              <span className="text-[8px] uppercase tracking-widest bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded px-1.5 py-0.5 leading-none">
                                Deploying
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-white/50 mt-0.5 leading-tight">{step.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : activeProject ? (
            <StudyDashboard
              project={activeProject}
              selectedTab={selectedTab}
              setSelectedTab={setSelectedTab}
              chatMessage={chatMessage}
              setChatMessage={setChatMessage}
              isSendingChat={isSendingChat}
              sendChatMessage={sendChatMessage}
              chatBottomRef={chatBottomRef}
            />
          ) : (
            <div className="flex-1 flex flex-col justify-between">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-10 lg:p-14 shadow-sm flex-1 flex flex-col justify-center">
                <div className="max-w-3xl mx-auto text-center">
                  <div className="w-14 h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-blue-400 mx-auto mb-6 shadow-xl shadow-black/40">
                    <Layers className="w-7 h-7 text-blue-400" />
                  </div>

                  <h2 className="text-4xl md:text-5xl lg:text-6xl font-light text-white tracking-tight font-serif">
                    A Research Intelligence Platform
                  </h2>
                  <p className="text-white/60 font-serif italic text-base md:text-lg lg:text-xl mt-4 max-w-2xl mx-auto leading-relaxed">
                    Collect structured papers, GitHub momentum, model releases, and technical discussions—then turn them into verified hypotheses and grounded chat.
                  </p>

                  <div className="mt-12 pt-8 border-t border-white/10 text-left">
                    <h4 className="text-xs uppercase tracking-[0.2em] font-semibold text-white/40 mb-4 text-center">
                      Select a Concept Channel to Begin
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                      {suggestions.map((sug) => (
                        <div
                          key={sug.text}
                          onClick={() => {
                            setQuery(sug.text);
                            setMode(sug.mode as any);
                            setTimeWindow(sug.win as any);
                            triggerNewResearch(sug.text, sug.mode, sug.win);
                          }}
                          className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl p-5 lg:p-6 cursor-pointer transition-all flex items-start gap-3"
                        >
                          <div className="p-1.5 rounded bg-black/40 border border-white/5 shrink-0 mt-0.5">
                            <Sparkles className="w-4 h-4 text-blue-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm lg:text-base font-semibold text-white/90 line-clamp-2 leading-snug">
                              {sug.text}
                            </p>
                            <div className="flex items-center gap-2 mt-1.5">
                              <span className="text-[10px] font-mono text-blue-400 uppercase tracking-wider font-semibold">
                                {getModeLabel(sug.mode)}
                              </span>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-white/40 shrink-0 self-center" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between text-[10px] text-white/35 font-mono px-2 tracking-wider">
                <span>SYSTEM TARGET INGRESS — PORT: 3000</span>
                <span>UTC TIME INJECTION — ACTIVE</span>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
