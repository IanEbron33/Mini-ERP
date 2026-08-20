"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  Bot,
  User,
  Send,
  X,
  RefreshCw,
  Check,
  Package,
  DollarSign,
  TrendingUp,
  Shield,
  Loader2,
  AlertCircle,
  Minimize2,
  Maximize2,
  Trash2,
  ArrowRight,
  ChevronRight,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { adjustStockAction } from "@/app/actions/products";
import { invalidateCache } from "@/lib/cache/swr-cache";
import { toast } from "sonner";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  toolCalled?: string;
  proposedAction?: {
    type: string;
    productId: string;
    productName: string;
    productSku: string;
    currentStock: number;
    shiftAmount: number;
    reason: string;
  } | null;
  actionExecuted?: boolean;
}

const QUICK_PROMPTS = [
  { label: "Financial P&L Summary", prompt: "Summarize our current financial performance: gross revenue, total restock expenses, net profit, and estimated tax.", icon: DollarSign },
  { label: "Critical Restock Alerts", prompt: "Which products are currently at or below their reorder threshold or completely out of stock?", icon: Package },
  { label: "Recent Sales Orders", prompt: "Show me the most recent sales orders placed, their customer names, item counts, and fulfillment status.", icon: TrendingUp },
  { label: "Security & Audit Trail", prompt: "Review recent administrative and security audit logs for any warnings or critical actions.", icon: Shield },
];

/**
 * Custom Rich Markdown Parser Component
 * Parses Headers, Tables, Bullet Lists, Bold Highlights, and Code pills
 */
function FormattedMarkdown({ content }: { content: string }) {
  // Helper to parse inline markdown (bold, code, italics)
  const renderInline = (text: string): React.ReactNode[] => {
    // Regex matches: **bold**, `code`, *italic*
    const parts = text.split(/(\*\*.*?\*\*|`.*?`|\*.*?\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={index} className="font-bold text-[#341100]">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith("`") && part.endsWith("`")) {
        return (
          <code
            key={index}
            className="px-1.5 py-0.5 bg-[#fcf3e3] text-[#713105] rounded-md font-mono text-[10px] font-semibold border border-[#e8decf]"
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      if (part.startsWith("*") && part.endsWith("*") && !part.startsWith("**")) {
        return (
          <em key={index} className="italic text-[#7f5e35]">
            {part.slice(1, -1)}
          </em>
        );
      }
      return part;
    });
  };

  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // 1. Table Detection
    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("|") && lines[i].trim().endsWith("|")) {
        tableLines.push(lines[i].trim());
        i++;
      }

      if (tableLines.length >= 2) {
        const headerRow = tableLines[0]
          .split("|")
          .map((c) => c.trim())
          .filter((c, idx, arr) => idx > 0 && idx < arr.length - 1);

        // Check if row 1 is a separator (|---|---|)
        const hasSeparator = tableLines[1].includes("---");
        const bodyRows = (hasSeparator ? tableLines.slice(2) : tableLines.slice(1)).map((row) =>
          row
            .split("|")
            .map((c) => c.trim())
            .filter((c, idx, arr) => idx > 0 && idx < arr.length - 1)
        );

        elements.push(
          <div key={`table-${i}`} className="overflow-x-auto my-2.5 rounded-xl border border-[#e8decf] shadow-2xs">
            <table className="w-full text-left text-[11px]">
              <thead className="bg-[#fff7e8] border-b border-[#e8decf] text-[10px] uppercase font-bold text-[#7f5e35] tracking-wider">
                <tr>
                  {headerRow.map((h, hIdx) => (
                    <th key={hIdx} className="py-2 px-3">
                      {renderInline(h)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e8decf]/60 text-[#341100] bg-white">
                {bodyRows.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-[#fff7e8]/40 transition-colors">
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="py-2 px-3">
                        {renderInline(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        continue;
      }
    }

    // 2. Horizontal Divider
    if (trimmed === "---" || trimmed === "***" || trimmed === "___") {
      elements.push(<hr key={`hr-${i}`} className="border-[#e8decf] my-2.5" />);
      i++;
      continue;
    }

    // 3. Headings
    if (trimmed.startsWith("### ")) {
      const text = trimmed.replace(/^###\s+/, "");
      elements.push(
        <h4 key={`h3-${i}`} className="font-bold text-xs text-[#341100] mt-2 mb-1">
          {renderInline(text)}
        </h4>
      );
      i++;
      continue;
    }

    if (trimmed.startsWith("## ")) {
      const text = trimmed.replace(/^##\s+/, "");
      elements.push(
        <h3 key={`h2-${i}`} className="font-bold text-sm text-[#341100] mt-2.5 mb-1">
          {renderInline(text)}
        </h3>
      );
      i++;
      continue;
    }

    if (trimmed.startsWith("# ")) {
      const text = trimmed.replace(/^#\s+/, "");
      elements.push(
        <h2 key={`h1-${i}`} className="font-bold text-base text-[#341100] mt-3 mb-1.5">
          {renderInline(text)}
        </h2>
      );
      i++;
      continue;
    }

    // 4. Bullet list items
    if (trimmed.startsWith("* ") || trimmed.startsWith("- ")) {
      const text = trimmed.replace(/^[\*\-]\s+/, "");
      elements.push(
        <div key={`li-${i}`} className="flex items-start gap-2 my-1 pl-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[#713105] mt-1.5 shrink-0" />
          <span className="leading-relaxed">{renderInline(text)}</span>
        </div>
      );
      i++;
      continue;
    }

    // 5. Empty Lines
    if (!trimmed) {
      elements.push(<div key={`empty-${i}`} className="h-1" />);
      i++;
      continue;
    }

    // 6. Regular Paragraph
    elements.push(
      <p key={`p-${i}`} className="leading-relaxed my-0.5">
        {renderInline(trimmed)}
      </p>
    );
    i++;
  }

  return <div className="space-y-0.5 text-xs text-[#341100]">{elements}</div>;
}

export function AdminAiCopilot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [executingActionId, setExecutingActionId] = useState<string | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "initial-msg",
      role: "assistant",
      content:
        "Hello Administrator. I am your **Mini-ERP AI Copilot**. I have live access to your financial ledgers, inventory stock, sales orders, and audit feeds. How can I assist your operations today?",
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputMessage;
    if (!text.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!textToSend) setInputMessage("");
    setIsLoading(true);

    try {
      const historyPayload = [...messages, userMessage].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch("/api/ai/admin-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: historyPayload }),
      });

      const data = await res.json();

      if (data.error) {
        setMessages((prev) => [
          ...prev,
          {
            id: `error-${Date.now()}`,
            role: "assistant",
            content: `I encountered an issue processing your request: ${data.error}`,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: `assistant-${Date.now()}`,
            role: "assistant",
            content: data.content || "No response received.",
            toolCalled: data.toolCalled,
            proposedAction: data.proposedAction || null,
          },
        ]);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: "assistant",
          content: `Connection error: ${err.message || "Failed to communicate with AI server."}`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExecuteAction = async (msgId: string, action: any) => {
    setExecutingActionId(msgId);
    try {
      const res = await adjustStockAction({
        productId: action.productId,
        productName: action.productName,
        productSku: action.productSku,
        currentStock: action.currentStock,
        shiftAmount: action.shiftAmount,
        reason: action.reason,
        actorName: "Staff Admin (via AI Copilot)",
      });

      if (res.success) {
        toast.success(res.message || "Stock adjusted successfully.");
        invalidateCache([
          "admin_sales_data",
          "admin_dashboard_metrics",
          "admin_finance_ledger",
          "catalog_products",
          "inventory_stock_logs",
        ]);

        setMessages((prev) =>
          prev.map((m) => (m.id === msgId ? { ...m, actionExecuted: true } : m))
        );
      } else {
        toast.error(res.error || "Failed to execute stock adjustment.");
      }
    } catch (err: any) {
      toast.error(err.message || "Action failed.");
    } finally {
      setExecutingActionId(null);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: `init-${Date.now()}`,
        role: "assistant",
        content:
          "Chat history cleared. How can I assist you with enterprise operations?",
      },
    ]);
  };

  return (
    <>
      {/* Premium Floating Action Button */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in zoom-in-95">
          <button
            onClick={() => setIsOpen(true)}
            className="group relative flex items-center gap-3 px-5 py-3 rounded-full bg-gradient-to-r from-[#713105] via-[#5c2704] to-[#4f351c] text-[#fff7e8] shadow-2xl border border-[#cfab71]/70 hover:border-[#cfab71] transition-all duration-300 hover:scale-105 cursor-pointer shadow-[#713105]/30 hover:shadow-[#713105]/50"
          >
            <div className="w-8 h-8 rounded-full bg-[#fff7e8]/15 border border-[#cfab71]/40 flex items-center justify-center text-[#fff7e8] group-hover:rotate-12 transition-transform duration-300 shadow-xs">
              <Sparkles className="w-4 h-4 text-[#cfab71]" />
            </div>
            <div className="text-left pr-1">
              <div className="text-xs font-bold leading-tight flex items-center gap-2 text-white tracking-wide">
                <span>AI Copilot</span>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </div>
            </div>
          </button>
        </div>
      )}

      {/* Floating Slide-Over Drawer / Panel */}
      {isOpen && (
        <div
          className={`fixed z-50 bottom-4 right-4 ${
            isExpanded
              ? "w-[calc(100vw-32px)] md:w-[720px] h-[calc(100vh-32px)]"
              : "w-[calc(100vw-32px)] sm:w-[480px] h-[640px]"
          } max-w-full transition-all duration-300 ease-out animate-in slide-in-from-bottom-6 fade-in flex flex-col`}
        >
          <Card className="flex flex-col h-full bg-white border border-[#e8decf] rounded-3xl shadow-2xl overflow-hidden ring-1 ring-black/5">
            {/* Drawer Header */}
            <CardHeader className="p-4.5 bg-[#fff7e8]/95 backdrop-blur-md border-b border-[#e8decf] flex flex-row items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#713105] to-[#4f351c] border border-[#cfab71]/40 flex items-center justify-center text-[#fff7e8] shadow-md">
                  <Sparkles className="w-5 h-5 text-[#cfab71]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-sm font-bold text-[#341100] tracking-tight">
                      ERP AI Copilot
                    </CardTitle>
                    <Badge className="bg-[#fcf3e3] text-[#713105] border-[#cfab71]/60 text-[9px] uppercase font-bold px-2 py-0.5 shadow-2xs">
                      Admin Mode
                    </Badge>
                  </div>
                  <p className="text-[11px] text-[#7f5e35] mt-0.5">
                    Live Enterprise Intelligence & Operations
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-[#7f5e35]">
                <button
                  onClick={clearChat}
                  title="Clear conversation"
                  className="p-1.5 hover:bg-[#cfab71]/20 rounded-xl hover:text-[#341100] transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  title={isExpanded ? "Collapse width" : "Expand width"}
                  className="p-1.5 hover:bg-[#cfab71]/20 rounded-xl hover:text-[#341100] transition-colors hidden sm:block"
                >
                  {isExpanded ? (
                    <Minimize2 className="w-4 h-4" />
                  ) : (
                    <Maximize2 className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  title="Close Copilot"
                  className="p-1.5 hover:bg-[#cfab71]/20 rounded-xl hover:text-[#341100] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </CardHeader>

            {/* Quick Prompt Recommendation Chips (Clean scroll, no default scrollbar) */}
            <div className="px-3 py-2.5 bg-[#fcf3e3]/70 border-b border-[#e8decf] overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden flex items-center gap-2 shrink-0">
              <span className="text-[10px] font-bold text-[#7f5e35] uppercase tracking-wider pl-1 shrink-0">
                Suggestions:
              </span>
              {QUICK_PROMPTS.map((qp, idx) => {
                const IconComponent = qp.icon;
                return (
                  <button
                    key={idx}
                    disabled={isLoading}
                    onClick={() => handleSendMessage(qp.prompt)}
                    className="shrink-0 flex items-center gap-1.5 bg-white hover:bg-[#fff7e8] border border-[#e8decf] hover:border-[#cfab71] text-[#713105] text-[11px] font-semibold px-3 py-1.5 rounded-xl shadow-2xs transition-all cursor-pointer disabled:opacity-50 hover:shadow-xs"
                  >
                    <IconComponent className="w-3.5 h-3.5 text-[#cfab71]" />
                    <span>{qp.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Message Stream */}
            <CardContent className="flex-1 p-4.5 overflow-y-auto space-y-4 text-xs text-[#341100] bg-[#faf7f2]/50 [scrollbar-width:thin]">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {msg.role === "assistant" && (
                    <div className="w-8 h-8 rounded-2xl bg-gradient-to-br from-[#713105] to-[#4f351c] text-[#fff7e8] flex items-center justify-center shrink-0 mt-0.5 shadow-xs border border-[#cfab71]/40">
                      <Bot className="w-4 h-4 text-[#cfab71]" />
                    </div>
                  )}

                  <div
                    className={`max-w-[88%] rounded-2xl p-4 space-y-2.5 shadow-xs ${
                      msg.role === "user"
                        ? "bg-gradient-to-br from-[#713105] to-[#4f351c] text-[#fff7e8] rounded-tr-xs shadow-md"
                        : "bg-white border border-[#e8decf] rounded-tl-xs"
                    }`}
                  >
                    {/* Message Content formatted as Rich HTML Markdown */}
                    {msg.role === "user" ? (
                      <div className="leading-relaxed whitespace-pre-wrap font-sans text-xs text-[#fff7e8]">
                        {msg.content}
                      </div>
                    ) : (
                      <FormattedMarkdown content={msg.content} />
                    )}

                    {/* Interactive Proposed Action Card */}
                    {msg.proposedAction && (
                      <div className="mt-3 p-3.5 rounded-2xl bg-gradient-to-b from-[#fff7e8] to-white border border-[#cfab71]/60 shadow-xs space-y-2.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 font-bold text-xs text-[#713105]">
                            <Package className="w-4 h-4 text-[#713105]" />
                            <span>Action Proposal: Stock Adjustment</span>
                          </div>
                          <Badge className="bg-amber-100 text-amber-900 border-amber-300 text-[9px] uppercase font-bold px-2 py-0.5">
                            Human Review
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[11px] text-[#4f351c] pt-1">
                          <div className="bg-[#fff7e8]/60 p-2 rounded-xl border border-[#e8decf]/60">
                            <span className="text-[#7f5e35] block text-[10px]">Product Name</span>
                            <strong className="text-[#341100] truncate block">{msg.proposedAction.productName}</strong>
                          </div>
                          <div className="bg-[#fff7e8]/60 p-2 rounded-xl border border-[#e8decf]/60">
                            <span className="text-[#7f5e35] block text-[10px]">Product SKU</span>
                            <span className="font-mono font-bold text-[#341100]">{msg.proposedAction.productSku}</span>
                          </div>
                          <div className="bg-[#fff7e8]/60 p-2 rounded-xl border border-[#e8decf]/60">
                            <span className="text-[#7f5e35] block text-[10px]">Adjustment Shift</span>
                            <span className={`font-bold ${msg.proposedAction.shiftAmount >= 0 ? "text-emerald-700" : "text-red-600"}`}>
                              {msg.proposedAction.shiftAmount >= 0 ? `+${msg.proposedAction.shiftAmount}` : msg.proposedAction.shiftAmount} units
                            </span>
                          </div>
                          <div className="bg-[#fff7e8]/60 p-2 rounded-xl border border-[#e8decf]/60">
                            <span className="text-[#7f5e35] block text-[10px]">Action Reason</span>
                            <span className="text-[#341100] truncate block">{msg.proposedAction.reason}</span>
                          </div>
                        </div>

                        <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#e8decf]">
                          {msg.actionExecuted ? (
                            <Badge className="bg-emerald-50 text-emerald-800 border-emerald-300 text-[10px] py-1 px-3 flex items-center gap-1.5 font-bold">
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              Action Executed in Database
                            </Badge>
                          ) : (
                            <Button
                              size="sm"
                              disabled={executingActionId === msg.id}
                              onClick={() => handleExecuteAction(msg.id, msg.proposedAction)}
                              className="bg-[#713105] text-[#fff7e8] hover:bg-[#4f351c] text-[11px] font-bold h-8 px-3.5 rounded-xl shadow-xs gap-1.5 cursor-pointer"
                            >
                              {executingActionId === msg.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Check className="w-3.5 h-3.5" />
                              )}
                              Confirm & Execute Action
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {msg.role === "user" && (
                    <div className="w-8 h-8 rounded-2xl bg-[#cfab71] text-[#341100] flex items-center justify-center shrink-0 mt-0.5 shadow-xs font-bold text-xs">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-3 justify-start">
                  <div className="w-8 h-8 rounded-2xl bg-gradient-to-br from-[#713105] to-[#4f351c] text-[#fff7e8] flex items-center justify-center shrink-0 shadow-xs border border-[#cfab71]/40">
                    <Bot className="w-4 h-4 text-[#cfab71]" />
                  </div>
                  <div className="bg-white border border-[#e8decf] rounded-2xl rounded-tl-xs p-3.5 shadow-xs flex items-center gap-2.5 text-xs text-[#7f5e35]">
                    <Loader2 className="w-4 h-4 animate-spin text-[#713105]" />
                    <span>Analyzing enterprise records & running calculations...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </CardContent>

            {/* Input Bar */}
            <div className="p-3.5 bg-white border-t border-[#e8decf] shrink-0">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2 bg-[#fff7e8]/90 border border-[#e8decf] focus-within:border-[#713105] focus-within:ring-2 focus-within:ring-[#713105]/20 rounded-2xl p-1.5 transition-all"
              >
                <input
                  type="text"
                  value={inputMessage}
                  disabled={isLoading}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Ask financial summaries, restock alerts, or propose orders..."
                  className="flex-1 bg-transparent px-3 h-9 text-xs text-[#341100] placeholder:text-[#7f5e35]/60 focus:outline-hidden"
                />
                <Button
                  type="submit"
                  disabled={isLoading || !inputMessage.trim()}
                  className="bg-[#713105] text-[#fff7e8] hover:bg-[#4f351c] h-9 px-3.5 rounded-xl cursor-pointer shadow-xs disabled:opacity-40 transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                </Button>
              </form>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}

export default AdminAiCopilot;
