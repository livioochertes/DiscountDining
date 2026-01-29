import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import { 
  MessageCircle, X, Send, Loader2, Bot, User, ThumbsUp, 
  ThumbsDown, AlertCircle, ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface Message {
  id: number;
  conversationId: number;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
}

interface Conversation {
  id: number;
  customerId: number;
  title: string | null;
  status: string;
  isHandledByAI: boolean;
  createdAt: string;
  messages?: Message[];
}

interface SupportChatWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  translations?: {
    chatTitle?: string;
    typeMessage?: string;
    send?: string;
    startNewChat?: string;
    aiAssistant?: string;
    escalatedMessage?: string;
    resolveChat?: string;
    wasHelpful?: string;
  };
}

export function SupportChatWidget({ isOpen, onClose, translations }: SupportChatWidgetProps) {
  const [message, setMessage] = useState("");
  const [currentConversationId, setCurrentConversationId] = useState<number | null>(null);
  const [streamingContent, setStreamingContent] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const t = {
    chatTitle: translations?.chatTitle || "Support Chat",
    typeMessage: translations?.typeMessage || "Type your message...",
    send: translations?.send || "Send",
    startNewChat: translations?.startNewChat || "Start a new conversation",
    aiAssistant: translations?.aiAssistant || "AI Assistant",
    escalatedMessage: translations?.escalatedMessage || "This conversation has been escalated to a human agent.",
    resolveChat: translations?.resolveChat || "Resolve",
    wasHelpful: translations?.wasHelpful || "Was this helpful?",
  };

  const { data: conversations } = useQuery<Conversation[]>({
    queryKey: ["/api/support/conversations"],
    enabled: isOpen,
  });

  const { data: currentConversation, refetch: refetchConversation } = useQuery<Conversation>({
    queryKey: ["/api/support/conversations", currentConversationId],
    enabled: isOpen && currentConversationId !== null,
  });

  const createConversationMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/support/conversations", {});
      return res.json();
    },
    onSuccess: (data) => {
      setCurrentConversationId(data.id);
      queryClient.invalidateQueries({ queryKey: ["/api/support/conversations"] });
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async ({ conversationId, content }: { conversationId: number; content: string }) => {
      setIsStreaming(true);
      setStreamingContent("");

      const response = await fetch(`/api/support/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader available");

      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.content) {
                accumulated += data.content;
                setStreamingContent(accumulated);
              }
              if (data.done) {
                setIsStreaming(false);
                refetchConversation();
              }
              if (data.escalated) {
                setIsStreaming(false);
                refetchConversation();
              }
            } catch {
            }
          }
        }
      }
    },
    onSettled: () => {
      setIsStreaming(false);
      setStreamingContent("");
    },
  });

  const resolveConversationMutation = useMutation({
    mutationFn: async (conversationId: number) => {
      const res = await apiRequest("POST", `/api/support/conversations/${conversationId}/resolve`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/support/conversations"] });
      setCurrentConversationId(null);
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentConversation?.messages, streamingContent]);

  useEffect(() => {
    if (isOpen && conversations && conversations.length > 0) {
      const activeConversation = conversations.find(c => c.status === "active" || c.status === "escalated");
      if (activeConversation) {
        setCurrentConversationId(activeConversation.id);
      }
    }
  }, [isOpen, conversations]);

  const handleSend = async () => {
    if (!message.trim()) return;

    let convId = currentConversationId;

    if (!convId) {
      const newConv = await createConversationMutation.mutateAsync();
      convId = newConv.id;
    }

    if (!convId) return;

    const userMessage = message.trim();
    setMessage("");

    await sendMessageMutation.mutateAsync({ conversationId: convId, content: userMessage });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full sm:max-w-md h-[85vh] sm:h-[600px] bg-white rounded-t-2xl sm:rounded-2xl flex flex-col shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-primary to-primary/80 text-white rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold">{t.chatTitle}</h3>
              <p className="text-xs text-white/80">{t.aiAssistant}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
          {!currentConversationId && !currentConversation?.messages?.length && (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Bot className="w-8 h-8 text-primary" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">{t.chatTitle}</h4>
              <p className="text-sm text-gray-500 mb-6">{t.startNewChat}</p>
            </div>
          )}

          {currentConversation?.status === "escalated" && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800">{t.escalatedMessage}</p>
            </div>
          )}

          {currentConversation?.messages?.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex gap-3",
                msg.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              {msg.role !== "user" && (
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
              )}
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm",
                  msg.role === "user"
                    ? "bg-primary text-white rounded-br-sm"
                    : "bg-white border border-gray-200 text-gray-900 rounded-bl-sm"
                )}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
              {msg.role === "user" && (
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-gray-600" />
                </div>
              )}
            </div>
          ))}

          {isStreaming && streamingContent && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-primary" />
              </div>
              <div className="max-w-[80%] rounded-2xl rounded-bl-sm px-4 py-2.5 text-sm bg-white border border-gray-200 text-gray-900">
                <p className="whitespace-pre-wrap">{streamingContent}</p>
                <span className="inline-block w-2 h-4 bg-primary/50 ml-1 animate-pulse" />
              </div>
            </div>
          )}

          {sendMessageMutation.isPending && !isStreaming && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-primary" />
              </div>
              <div className="max-w-[80%] rounded-2xl rounded-bl-sm px-4 py-3 bg-white border border-gray-200">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  <span className="text-sm text-gray-500">Typing...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {currentConversation?.status === "resolved" ? (
          <div className="p-4 border-t bg-gray-50">
            <Button
              onClick={() => {
                setCurrentConversationId(null);
                createConversationMutation.mutate();
              }}
              className="w-full"
            >
              {t.startNewChat}
            </Button>
          </div>
        ) : (
          <div className="p-4 border-t bg-white">
            <div className="flex gap-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={t.typeMessage}
                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                disabled={sendMessageMutation.isPending || createConversationMutation.isPending}
              />
              <Button
                onClick={handleSend}
                disabled={!message.trim() || sendMessageMutation.isPending || createConversationMutation.isPending}
                className="px-4 rounded-xl"
              >
                {sendMessageMutation.isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </Button>
            </div>
            
            {currentConversationId && currentConversation?.status !== "escalated" && (
              <button
                onClick={() => resolveConversationMutation.mutate(currentConversationId)}
                className="w-full mt-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                disabled={resolveConversationMutation.isPending}
              >
                {t.resolveChat}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function SupportChatButton({ onClick, className }: { onClick: () => void; className?: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "fixed bottom-24 right-4 z-40 w-14 h-14 bg-primary text-white rounded-full shadow-lg flex items-center justify-center hover:bg-primary/90 transition-all hover:scale-105",
        className
      )}
    >
      <MessageCircle className="w-6 h-6" />
    </button>
  );
}
