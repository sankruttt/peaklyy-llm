"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import { ChatConversation, ChatMessage } from "../types";
import FormattedMessage from "./FormattedMessage";

export default function ChatBubble() {
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  // Floating coordinates for draggable closed trigger button and open window
  const [btnPos, setBtnPos] = useState<{ x: number; y: number } | null>(null);
  const [winPos, setWinPos] = useState<{ x: number; y: number } | null>(null);

  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [latestResumeName, setLatestResumeName] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize floating positions on client mount and track viewport resize
  useEffect(() => {
    if (typeof window !== "undefined") {
      const defaultBtnX = window.innerWidth - 80;
      const defaultBtnY = window.innerHeight - 80;
      setBtnPos({ x: Math.max(16, defaultBtnX), y: Math.max(16, defaultBtnY) });

      const winWidth = Math.min(420, window.innerWidth - 32);
      const defaultWinX = window.innerWidth - winWidth - 24;
      const defaultWinY = Math.max(20, window.innerHeight - 620);
      setWinPos({ x: Math.max(16, defaultWinX), y: defaultWinY });
    }

    const handleResize = () => {
      if (typeof window === "undefined") return;
      setBtnPos((prev) => {
        if (!prev) return null;
        return {
          x: Math.max(12, Math.min(window.innerWidth - 72, prev.x)),
          y: Math.max(12, Math.min(window.innerHeight - 72, prev.y)),
        };
      });
      setWinPos((prev) => {
        if (!prev) return null;
        const width = Math.min(420, window.innerWidth - 32);
        return {
          x: Math.max(12, Math.min(window.innerWidth - width - 12, prev.x)),
          y: Math.max(12, Math.min(window.innerHeight - 150, prev.y)),
        };
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (isOpen && isAuthenticated) {
      loadChat();
    }
  }, [isOpen, isAuthenticated]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const loadChat = async () => {
    try {
      const [convs, resumes] = await Promise.all([
        api.listConversations(),
        api.getUserResumes(),
      ]);
      setConversations(convs);
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
            content: `Hello ${user?.name ? user.name.split(" ")[0] : "Engineer"}. I am Mawa, your AI Career Copilot. Ask me about your match ratings, resume improvements, or interview preparation.`,
            created_at: new Date().toISOString(),
          },
        ]);
      }
    } catch (err) {
      console.error("Failed to load chat in bubble:", err);
    }
  };

  const selectConversation = async (convId: number) => {
    try {
      setLoading(true);
      const conv = await api.getConversation(convId);
      setCurrentConversationId(conv.id);
      setMessages(conv.messages || []);
    } catch (err) {
      console.warn("Failed to select conversation:", err);
      setCurrentConversationId(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (customPrompt?: string) => {
    const textToSend = customPrompt || inputMessage;
    if (!textToSend.trim() || loading) return;

    if (!customPrompt) setInputMessage("");
    setLoading(true);

    const tempUserMsg: ChatMessage = {
      id: Date.now(),
      conversation_id: currentConversationId || 0,
      role: "user",
      content: textToSend,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const res = await api.sendChatMessage(textToSend, currentConversationId || undefined);
      setMessages((prev) => [...prev, res.message]);
      setCurrentConversationId(res.conversation_id);
      const convs = await api.listConversations();
      setConversations(convs);
    } catch (err) {
      console.error("Failed to send message:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          conversation_id: currentConversationId || 0,
          role: "assistant",
          content: "Encountered a communication issue with the inference engine. Please retry.",
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const startNewChat = () => {
    setCurrentConversationId(null);
    setMessages([
      {
        id: 0,
        conversation_id: 0,
        role: "assistant",
        content: "New session started. How can I assist with your career or gig strategy today?",
        created_at: new Date().toISOString(),
      },
    ]);
  };

  // Drag logic for Closed Floating Trigger Button
  const handleBtnDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    const isTouch = "touches" in e;
    const clientX = isTouch ? e.touches[0].clientX : e.clientX;
    const clientY = isTouch ? e.touches[0].clientY : e.clientY;

    const curX = btnPos ? btnPos.x : window.innerWidth - 80;
    const curY = btnPos ? btnPos.y : window.innerHeight - 80;

    let hasDragged = false;
    const startX = clientX;
    const startY = clientY;

    const handleMove = (moveEvt: MouseEvent | TouchEvent) => {
      const moveX = "touches" in moveEvt ? moveEvt.touches[0].clientX : moveEvt.clientX;
      const moveY = "touches" in moveEvt ? moveEvt.touches[0].clientY : moveEvt.clientY;
      const dx = moveX - startX;
      const dy = moveY - startY;

      if (Math.hypot(dx, dy) > 5) {
        hasDragged = true;
      }

      const newX = Math.max(12, Math.min(window.innerWidth - 72, curX + dx));
      const newY = Math.max(12, Math.min(window.innerHeight - 72, curY + dy));
      setBtnPos({ x: newX, y: newY });
    };

    const handleEnd = () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleEnd);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("touchend", handleEnd);

      if (!hasDragged) {
        setIsOpen(true);
      }
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleEnd);
    window.addEventListener("touchmove", handleMove);
    window.addEventListener("touchend", handleEnd);
  };

  // Drag logic for Open Chat Window
  const handleWinDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    const isTouch = "touches" in e;
    const clientX = isTouch ? e.touches[0].clientX : e.clientX;
    const clientY = isTouch ? e.touches[0].clientY : e.clientY;

    const modalWidth = Math.min(420, window.innerWidth - 32);
    const curX = winPos ? winPos.x : window.innerWidth - modalWidth - 24;
    const curY = winPos ? winPos.y : window.innerHeight - 620;

    const startX = clientX;
    const startY = clientY;

    const handleMove = (moveEvt: MouseEvent | TouchEvent) => {
      const moveX = "touches" in moveEvt ? moveEvt.touches[0].clientX : moveEvt.clientX;
      const moveY = "touches" in moveEvt ? moveEvt.touches[0].clientY : moveEvt.clientY;
      const dx = moveX - startX;
      const dy = moveY - startY;

      const newX = Math.max(12, Math.min(window.innerWidth - modalWidth - 12, curX + dx));
      const newY = Math.max(12, Math.min(window.innerHeight - 100, curY + dy));
      setWinPos({ x: newX, y: newY });
    };

    const handleEnd = () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleEnd);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("touchend", handleEnd);
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleEnd);
    window.addEventListener("touchmove", handleMove);
    window.addEventListener("touchend", handleEnd);
  };

  const quickPrompts = [
    "Analyze gap for Top Match",
    "Generate technical pitch",
    "Interview preparation",
    "Salary negotiation leverage",
  ];

  // If already on the dedicated full page assistant, do not render the floating bubble
  if (pathname === "/assistant") return null;

  return (
    <>
      {/* Floatable / Draggable Action Button (Closed State) */}
      {!isOpen && (
        <div
          onMouseDown={handleBtnDragStart}
          onTouchStart={handleBtnDragStart}
          style={
            btnPos
              ? { left: `${btnPos.x}px`, top: `${btnPos.y}px` }
              : undefined
          }
          className={`fixed z-50 select-none cursor-grab active:cursor-grabbing ${
            !btnPos ? "bottom-6 right-6" : ""
          }`}
          title="Drag to move around or click to open Mawa"
        >
          <div className="relative w-14 h-14 rounded-full bg-[#1c1b1d] border-2 border-[#e8342a] shadow-[0_0_24px_rgba(232,52,42,0.45)] hover:shadow-[0_0_32px_rgba(232,52,42,0.7)] hover:scale-105 active:scale-95 transition-transform flex items-center justify-center text-white group">
            <span className="material-symbols-outlined text-2xl group-hover:rotate-12 transition-transform text-[#e8342a]">
              psychology
            </span>
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[#1c1b1d] animate-pulse" />
          </div>
        </div>
      )}

      {/* Floatable / Draggable Interactive Chat Window */}
      {isOpen && (
        <div
          style={
            winPos
              ? { left: `${winPos.x}px`, top: `${winPos.y}px` }
              : undefined
          }
          className={`fixed z-50 w-[360px] sm:w-[420px] h-[580px] max-h-[85vh] bg-[#1c1b1d] border border-[#353437] rounded-xl shadow-2xl flex flex-col overflow-hidden backdrop-blur-2xl animate-in slide-in-from-bottom-4 duration-200 ${
            !winPos ? "bottom-6 right-4 sm:right-6" : ""
          }`}
        >
          {/* Header with Drag Handle */}
          <div className="p-3 bg-[#201f22] border-b border-[#353437] flex items-center justify-between gap-3 shrink-0">
            {/* Header Drag Handle */}
            <div
              onMouseDown={handleWinDragStart}
              onTouchStart={handleWinDragStart}
              className="flex items-center gap-2 min-w-0 flex-1 select-none cursor-grab active:cursor-grabbing"
              title="Click and drag to move chat window"
            >
              <span className="material-symbols-outlined text-sm text-[#8e8c90] hover:text-white shrink-0">
                drag_indicator
              </span>
              <div className="w-7 h-7 rounded bg-[#e8342a] flex items-center justify-center text-white text-xs font-black font-headline shrink-0">
                M
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold font-headline uppercase text-[#e5e1e4] truncate">
                    MAWA
                  </h3>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                </div>
                <p className="text-[10px] font-mono-telemetry text-[#8e8c90] truncate">
                  CONTEXT: {latestResumeName || "GLOBAL MAWA"}
                </p>
              </div>
            </div>

            {/* Header Action Controls - Exactly 3 buttons: New Chat, Take to Full Page, Close */}
            <div className="flex items-center gap-1.5 shrink-0">
              {/* 1. New Chat */}
              <button
                onClick={startNewChat}
                title="New Chat"
                className="w-7 h-7 rounded hover:bg-[#2a2a2c] text-[#8e8c90] hover:text-[#e5e1e4] flex items-center justify-center transition-colors text-xs"
              >
                <span className="material-symbols-outlined text-sm">edit_square</span>
              </button>

              {/* 2. Take to Full Page */}
              <Link
                href={currentConversationId ? `/assistant?c=${currentConversationId}` : "/assistant"}
                onClick={() => setIsOpen(false)}
                title="Take to Full Page"
                className="w-7 h-7 rounded hover:bg-[#2a2a2c] text-[#8e8c90] hover:text-[#e5e1e4] flex items-center justify-center transition-colors text-xs"
              >
                <span className="material-symbols-outlined text-sm">open_in_new</span>
              </Link>

              {/* 3. Close Bubble */}
              <button
                onClick={() => setIsOpen(false)}
                title="Close Bubble"
                className="w-7 h-7 rounded hover:bg-[#e8342a]/20 text-[#8e8c90] hover:text-[#e8342a] flex items-center justify-center transition-colors text-xs"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
          </div>

          {/* Quick Prompt Suggestions */}
          <div className="px-3 py-2 bg-[#1c1b1d] border-b border-[#2a2a2c] flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
            {quickPrompts.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(q)}
                disabled={loading}
                className="px-2.5 py-1 rounded bg-[#201f22] border border-[#353437] hover:border-[#e8342a]/60 text-[10px] font-mono-telemetry text-[#8e8c90] hover:text-[#e5e1e4] whitespace-nowrap transition-colors disabled:opacity-40 shrink-0"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Chat Messages Canvas */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0 bg-[#0e0e10]/60">
            {messages.map((m) => {
              const isAssistant = m.role === "assistant";
              return (
                <div
                  key={m.id}
                  className={`flex gap-2.5 ${isAssistant ? "justify-start" : "justify-end"}`}
                >
                  {isAssistant && (
                    <div className="w-6 h-6 rounded bg-[#201f22] border border-[#353437] flex items-center justify-center text-[#e8342a] shrink-0 text-[11px] font-bold">
                      M
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] rounded p-3 text-xs leading-relaxed ${
                      isAssistant
                        ? "bg-[#201f22] border border-[#353437] text-[#e5e1e4]"
                        : "bg-[#2a2a2c] text-white border border-[#e8342a]/30"
                    }`}
                  >
                    <FormattedMessage content={m.content} />
                    <div className="text-[9px] font-mono-telemetry text-[#8e8c90] mt-1.5 text-right">
                      {new Date(m.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="flex items-center gap-2 p-2.5 rounded bg-[#201f22] border border-[#353437] text-xs font-mono-telemetry text-[#8e8c90] w-fit">
                <span className="w-2 h-2 rounded-full bg-[#e8342a] animate-ping" />
                <span>Generating response...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Footer Input */}
          <div className="p-3 bg-[#201f22] border-t border-[#353437] shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask Mawa..."
                disabled={loading}
                className="flex-1 bg-[#1c1b1d] border border-[#353437] focus:border-[#e8342a] rounded px-3 py-2 text-xs text-[#e5e1e4] placeholder-[#8e8c90] focus:outline-none transition-colors"
              />
              <button
                type="submit"
                disabled={loading || !inputMessage.trim()}
                className="px-3.5 py-2 rounded bg-[#e8342a] hover:bg-[#d42d24] text-white text-xs font-bold font-mono-telemetry transition-colors disabled:opacity-40 flex items-center justify-center shrink-0"
              >
                <span className="material-symbols-outlined text-sm">send</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
