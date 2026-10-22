"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../services/api";
import { ChatConversation, ChatMessage } from "../../types";

function AssistantContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialPrompt = searchParams.get("prompt") || searchParams.get("q");

  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasResume, setHasResume] = useState(false);
  const [latestResumeName, setLatestResumeName] = useState<string>("alex_mercer.pdf");

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
      return;
    }
    if (isAuthenticated) {
      initChat();
    }
  }, [authLoading, isAuthenticated]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const initChat = async () => {
    try {
      const [convs, resumes] = await Promise.all([
        api.listConversations(),
        api.getUserResumes(),
      ]);
      setConversations(convs);
      setHasResume(resumes.length > 0);
      if (resumes.length > 0) {
        setLatestResumeName(resumes[0].file_name);
      }

      if (convs.length > 0) {
        await selectConversation(convs[0].id);
      } else {
        setMessages([
          {
            id: 0,
            conversation_id: 0,
            role: "assistant",
            content: `Hello ${
              user?.name ? user.name.split(" ")[0] : "Engineer"
            }. I am your Peaklyy Neural Career Copilot.\n\n${
              resumes.length > 0
                ? `I have indexed your resume (**${resumes[0].file_name}**) and calculated match telemetry across active gigs in the database. I can break down compensation leverage, clarify skill gap remediation, or simulate role alignment.`
                : "No resume is currently linked to your session. Uploading your CV unlocks tailored gig compatibility telemetry and personalized interview coaching."
            }\n\nWhat career objective or gig query shall we examine?`,
            created_at: new Date().toISOString(),
          },
        ]);
      }

      if (initialPrompt) {
        handleSendPrompt(initialPrompt);
      }
    } catch (err) {
      console.error("Init chat error:", err);
    }
  };

  const selectConversation = async (convId: number) => {
    try {
      setCurrentConversationId(convId);
      const conv = await api.getConversation(convId);
      setMessages(conv.messages || []);
    } catch (err) {
      console.error("Failed to load conversation:", err);
    }
  };

  const handleStartNewChat = () => {
    setCurrentConversationId(null);
    setMessages([
      {
        id: Date.now(),
        conversation_id: 0,
        role: "assistant",
        content: `New session initialized. Ask anything regarding your profile, gig specifications, contract pricing, or career advancement.`,
        created_at: new Date().toISOString(),
      },
    ]);
  };

  const handleDeleteConversation = async (convId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.deleteConversation(convId);
      setConversations((prev) => prev.filter((c) => c.id !== convId));
      if (currentConversationId === convId) {
        handleStartNewChat();
      }
    } catch (err) {
      console.error("Failed to delete conversation:", err);
    }
  };

  const handleSendPrompt = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: Date.now(),
      conversation_id: currentConversationId || 0,
      role: "user",
      content: text.trim(),
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage("");
    setLoading(true);

    try {
      const res = await api.sendChatMessage(text.trim(), currentConversationId || undefined);
      setCurrentConversationId(res.conversation_id);
      setMessages((prev) => [...prev, res.message]);

      const updatedConvs = await api.listConversations();
      setConversations(updatedConvs);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: Date.now() + 1,
        conversation_id: currentConversationId || 0,
        role: "assistant",
        content: `Error: ${err.message || "Failed to generate AI response. Please try again."}`,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendPrompt(inputMessage);
  };

  const suggestedPrompts = [
    "Explain why I matched highest with Veritas Cloud",
    "What are my biggest resume gaps and how can I fix them?",
    "What technologies should I learn to maximize my contract rates?",
    "Simulate an architectural interview for a Senior Systems role",
    "Help me negotiate compensation for a Staff Cloud Engineer contract",
  ];

  if (authLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-12 min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-[#e8342a]/30 border-t-[#e8342a] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1 flex flex-col h-[calc(100vh-6.5rem)] space-y-4">
      {/* Top Telemetry Indicator Bar */}
      <div className="p-3 rounded bg-[#1c1b1d] border border-[#353437] flex flex-wrap items-center justify-between gap-3 text-xs font-mono-telemetry">
        <div className="flex items-center gap-3 text-[#8e8c90]">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[#e5e1e4] font-bold">NEURAL COPILOT // ACTIVE CONTEXT:</span>
          <span className="text-[#ffb4aa] uppercase">{hasResume ? latestResumeName : "GLOBAL GUIDANCE"}</span>
        </div>

        <div className="flex items-center gap-4 text-[11px] text-[#8e8c90]">
          <span>LATENCY: 0.4s</span>
          <span>•</span>
          <span>ENGINE: GEMMA 4 31B</span>
          <span>•</span>
          <span className="text-emerald-400">MEMORY: PERSISTED</span>
        </div>
      </div>

      {/* Main 12-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">
        {/* Left Column (4 cols): Context Drawer & History */}
        <div className="hidden lg:flex lg:col-span-4 flex-col rounded bg-[#1c1b1d] border border-[#353437] p-4 min-h-0 space-y-4 justify-between">
          <div className="space-y-4 flex-1 min-h-0 flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-[#2a2a2c]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#e8342a] text-sm">forum</span>
                <h3 className="text-xs font-bold font-mono-telemetry uppercase text-[#e5e1e4]">
                  SESSION DIALOGUES
                </h3>
              </div>
              <button
                onClick={handleStartNewChat}
                className="btn-secondary-stitch text-xs px-2.5 py-1 flex items-center gap-1"
                title="New Chat Session"
              >
                <span className="material-symbols-outlined text-xs">add</span>
                <span>NEW</span>
              </button>
            </div>

            {/* Profile Brief Badge */}
            <div className="p-3 rounded bg-[#201f22] border border-[#353437] space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono-telemetry">
                <span className="text-[#e5e1e4] font-bold">{user?.name || "Alex Mercer"}</span>
                <span className="text-emerald-400 font-bold">92 PTS</span>
              </div>
              <div className="text-[10px] font-mono-telemetry text-[#8e8c90] truncate">
                CONTEXT: {latestResumeName}
              </div>
            </div>

            {/* Past Conversations List */}
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 min-h-0">
              <div className="text-[10px] font-mono-telemetry uppercase text-[#8e8c90] mb-1">
                RECENT SESSIONS
              </div>
              {conversations.map((c) => (
                <div
                  key={c.id}
                  onClick={() => selectConversation(c.id)}
                  className={`p-2.5 rounded text-xs font-mono-telemetry cursor-pointer transition-all flex items-center justify-between group ${
                    currentConversationId === c.id
                      ? "bg-[#2a2a2c] text-white border border-[#e8342a]/60 shadow-[0_0_10px_rgba(232,52,42,0.2)]"
                      : "text-[#8e8c90] hover:text-[#e5e1e4] hover:bg-[#201f22]"
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="material-symbols-outlined text-xs text-[#8e8c90] group-hover:text-[#e8342a]">
                      chat_bubble
                    </span>
                    <span className="truncate">{c.title}</span>
                  </div>
                  <button
                    onClick={(e) => handleDeleteConversation(c.id, e)}
                    className="opacity-0 group-hover:opacity-100 hover:text-[#e8342a] p-1 transition-opacity shrink-0"
                    title="Delete Session"
                  >
                    <span className="material-symbols-outlined text-xs">delete</span>
                  </button>
                </div>
              ))}

              {conversations.length === 0 && (
                <div className="text-center py-6 text-xs font-mono-telemetry text-[#8e8c90]">
                  NO PAST SESSIONS RECORDED.
                </div>
              )}
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div className="pt-3 border-t border-[#2a2a2c] space-y-2">
            <div className="text-[10px] font-mono-telemetry uppercase text-[#8e8c90]">
              QUICK PROMPT SHORTCUTS
            </div>
            <div className="space-y-1.5">
              {suggestedPrompts.slice(0, 3).map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendPrompt(prompt)}
                  className="w-full p-2 rounded bg-[#201f22] border border-[#353437] hover:border-[#e8342a]/50 text-left text-[11px] font-mono-telemetry text-[#c8c6c9] hover:text-white truncate transition-colors flex items-center justify-between"
                >
                  <span className="truncate">"{prompt}"</span>
                  <span className="material-symbols-outlined text-xs text-[#e8342a] shrink-0 ml-1">
                    chevron_right
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (8 cols): Interactive Chat Canvas */}
        <div className="lg:col-span-8 rounded bg-[#1c1b1d] border border-[#353437] flex flex-col min-h-0 overflow-hidden">
          {/* Chat Canvas Header */}
          <div className="p-4 px-6 border-b border-[#353437] flex items-center justify-between bg-[#201f22]/50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-[#e8342a] flex items-center justify-center text-white shadow-md shadow-[#e8342a]/30">
                <span className="material-symbols-outlined text-base">psychology</span>
              </div>
              <div>
                <h2 className="text-xs font-bold font-headline uppercase text-[#e5e1e4] flex items-center gap-2">
                  <span>AI CAREER COPILOT</span>
                  <span className="px-1.5 py-0.2 rounded bg-[#2a2a2c] border border-[#353437] text-[9px] font-mono-telemetry text-emerald-400">
                    LIVE
                  </span>
                </h2>
                <p className="text-[10px] font-mono-telemetry text-[#8e8c90]">
                  Gemma 4 31B • Context-Aware Interview & Career Advisory
                </p>
              </div>
            </div>

            <button
              onClick={handleStartNewChat}
              className="lg:hidden btn-secondary-stitch text-xs px-2.5 py-1"
            >
              NEW SESSION
            </button>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
            {messages.map((m) => {
              const isUser = m.role === "user";
              return (
                <div
                  key={m.id}
                  className={`flex items-start gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
                >
                  <div
                    className={`w-7 h-7 rounded flex items-center justify-center shrink-0 text-xs font-bold font-headline ${
                      isUser
                        ? "bg-[#2a2a2c] border border-[#353437] text-[#e8342a]"
                        : "bg-[#e8342a] text-white"
                    }`}
                  >
                    <span className="material-symbols-outlined text-sm">
                      {isUser ? "person" : "smart_toy"}
                    </span>
                  </div>

                  <div
                    className={`max-w-[85%] sm:max-w-[80%] p-4 rounded text-xs sm:text-sm leading-relaxed ${
                      isUser
                        ? "bg-[#2a2a2c] text-white border border-[#353437] rounded-tr-none"
                        : "bg-[#201f22] text-[#e5e1e4] border border-[#353437] rounded-tl-none whitespace-pre-wrap"
                    }`}
                  >
                    <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-[#353437]/50 text-[10px] font-mono-telemetry text-[#8e8c90]">
                      <span>{isUser ? "USER COMMAND" : "NEURAL SYNTHESIS"}</span>
                      <span>{new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                    {m.content}
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded bg-[#e8342a] flex items-center justify-center text-white shrink-0">
                  <span className="material-symbols-outlined text-sm animate-spin">sync</span>
                </div>
                <div className="p-3.5 rounded bg-[#201f22] border border-[#353437] text-xs font-mono-telemetry text-[#8e8c90] flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#e8342a] animate-ping" />
                  <span>Synthesizing career context across active telemetry...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Box */}
          <div className="p-4 border-t border-[#353437] bg-[#1c1b1d]">
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Ask career copilot anything regarding your resume, gigs, or interview prep... (Press Enter)"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                className="flex-1 px-4 py-2.5 rounded bg-[#201f22] border border-[#353437] focus:border-[#e8342a] focus:outline-none text-xs font-mono-telemetry text-[#e5e1e4] placeholder-[#8e8c90] transition-all"
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || loading}
                className="btn-primary-stitch text-xs px-5 py-2.5 flex items-center gap-1.5 disabled:opacity-40 shrink-0"
              >
                <span>SEND</span>
                <span className="material-symbols-outlined text-xs">arrow_forward</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AssistantPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center p-12 min-h-[60vh]">
          <div className="w-8 h-8 border-2 border-[#e8342a]/30 border-t-[#e8342a] rounded-full animate-spin" />
        </div>
      }
    >
      <AssistantContent />
    </Suspense>
  );
}

