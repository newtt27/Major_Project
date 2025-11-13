"use client";

import { useState, useEffect, useRef } from "react";
import { Send, Bot, User } from "lucide-react";
import { useAppSelector } from "@/app/redux";
import {
  useChatbotMutation,
  useSuggestAssignmentMutation,
  usePredictTaskRiskMutation,
} from "@/state/api";
import DashboardWrapper from "../dashboardWrapper";
import ReactMarkdown from "react-markdown";

interface Message {
  id: string;
  text: string;
  sender: "user" | "ai";
  timestamp: Date;
  isTyping?: boolean;
}

const AUTO_DELETE_TIMEOUT = 300000; // 5 phút

export default function AIChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [chatbot, { isLoading: isChatLoading }] = useChatbotMutation();
  const [suggestAssignment, { isLoading: isSuggestLoading }] = useSuggestAssignmentMutation();
  const [predictTaskRisk, { isLoading: isRiskLoading }] = usePredictTaskRiskMutation();
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingMessageId = useRef<string | null>(null); // Lưu ID tin nhắn đang gõ

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];
    messages.forEach((msg) => {
      const timer = setTimeout(() => {
        setMessages((prev) => prev.filter((m) => m.id !== msg.id));
      }, AUTO_DELETE_TIMEOUT);
      timers.push(timer);
    });
    return () => timers.forEach(clearTimeout);
  }, [messages]);

  const extractTaskId = (text: string): string | null => {
    const match = text.match(/task\s*#?(\d+)/i);
    return match ? match[1] : null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !isAuthenticated || isChatLoading || isSuggestLoading || isRiskLoading) return;

    const userText = input.trim();
    const userMessage: Message = {
      id: crypto.randomUUID(),
      text: userText,
      sender: "user",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    // Tạo placeholder "•••" (chỉ 1 lần)
    const typingMsg: Message = {
      id: crypto.randomUUID(),
      text: "",
      sender: "ai",
      timestamp: new Date(),
      isTyping: true,
    };
    setMessages((prev) => [...prev, typingMsg]);
    typingMessageId.current = typingMsg.id;

    // Xử lý lệnh
    if (/gợi ý.*task/i.test(userText)) {
      const taskId = extractTaskId(userText);
      if (!taskId) {
        replaceTypingMessage("Vui lòng nhập Task ID");
        return;
      }
      try {
        const res = await suggestAssignment({ taskId }).unwrap();
        typeMessage(res.reply);
      } catch {
        replaceTypingMessage("Không thể gợi ý phân công.");
      }
      return;
    }

    if (/rủi ro.*task/i.test(userText)) {
      const taskId = extractTaskId(userText);
      if (!taskId) {
        replaceTypingMessage("Vui lòng nhập Task ID");
        return;
      }
      try {
        const res = await predictTaskRisk({ taskId }).unwrap();
        typeMessage(res.reply);
      } catch {
        replaceTypingMessage("Không thể dự đoán rủi ro.");
      }
      return;
    }

    // Chat bình thường
    try {
      const res = await chatbot({ message: userText }).unwrap();
      typeMessage(res.reply);
    } catch {
      replaceTypingMessage("Lỗi xử lý AI.");
    }
  };

  // Hàm thay thế tin nhắn "•••" bằng text thật
  const replaceTypingMessage = (text: string) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === typingMessageId.current
          ? { ...m, text, isTyping: false }
          : m
      )
    );
    typingMessageId.current = null;
  };

  // Hiệu ứng gõ chữ từng ký tự
  const typeMessage = (fullText: string) => {
    let index = 0;
    const interval = setInterval(() => {
      if (index <= fullText.length) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === typingMessageId.current
              ? { ...m, text: fullText.slice(0, index), isTyping: index < fullText.length }
              : m
          )
        );
        index++;
      } else {
        clearInterval(interval);
        typingMessageId.current = null;
      }
    }, 20);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center p-8 bg-white rounded-2xl shadow-lg">
          <p className="text-xl font-semibold text-red-600">Vui lòng đăng nhập để sử dụng AI Assistant</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardWrapper>
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <header className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-5 shadow-lg sticky top-0 z-20 backdrop-blur-sm bg-opacity-90">
          <div className="max-w mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold">AI Assistant</h1>
              </div>
            </div>
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-6" style={{ maxHeight: "calc(100vh - 180px)" }}>
          <div className="max-w mx-auto">
            {messages.length === 0 && !(isChatLoading || isSuggestLoading || isRiskLoading) && (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-4">
                  <Bot className="w-10 h-10 text-blue-600" />
                </div>
                <p className="text-gray-600 text-lg">Hãy bắt đầu cuộc trò chuyện!</p>
              </div>
            )}

            <div className="space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"} animate-in slide-in-from-bottom-2 duration-300`}
                >
                  {/* AI Message */}
                  {msg.sender === "ai" && (
                    <div className="flex gap-2 items-end max-w-[85%]">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-md">
                        <Bot className="w-5 h-5 text-white" />
                      </div>
                      <div className="bg-white text-gray-800 px-4 py-3 rounded-2xl rounded-tl-none shadow-sm border border-gray-200">
                        {msg.isTyping ? (
                          <div className="flex gap-1 items-center">
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                          </div>
                        ) : (
                          <div className="prose prose-sm max-w-none text-gray-800">
                            <ReactMarkdown>{msg.text}</ReactMarkdown>
                          </div>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* User Message */}
                  {msg.sender === "user" && (
                    <div className="flex gap-2 items-end max-w-[85%] flex-row-reverse">
                      <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shadow-md">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-3 rounded-2xl rounded-tr-none shadow-sm">
                        <p className="text-sm md:text-base leading-relaxed break-words">
                          {msg.text}
                        </p>
                        <p className="text-xs text-blue-100 mt-1">
                          {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div ref={messagesEndRef} />
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white/80 backdrop-blur-md border-t border-gray-200 p-4 md:p-6 sticky bottom-0 z-20"
        >
          <div className="max-w mx-auto">
            <div className="flex gap-3 items-center bg-gray-50 rounded-2xl p-2 shadow-inner">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Nhập tin nhắn (VD: gợi ý task 2)"
                className="flex-1 px-4 py-3 bg-transparent text-gray-800 placeholder-gray-500 focus:outline-none text-sm md:text-base"
                disabled={isChatLoading || isSuggestLoading || isRiskLoading}
              />
              <button
                type="submit"
                disabled={isChatLoading || isSuggestLoading || isRiskLoading || !input.trim()}
                className={`p-3 rounded-xl transition-all flex items-center justify-center ${
                  input.trim() && !isChatLoading && !isSuggestLoading && !isRiskLoading
                    ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                <Send size={20} />
              </button>
            </div>
            <p className="text-xs text-gray-500 text-center mt-2">
              Tin nhắn tự xóa sau 5 phút • Powered by xAI
            </p>
          </div>
        </form>
      </div>
    </DashboardWrapper>
  );
}