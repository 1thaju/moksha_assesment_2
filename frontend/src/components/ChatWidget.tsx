import { useState } from "react";
import { MessageCircleMore, Send, X } from "lucide-react";
import { api, ApiError } from "../lib/api";
import { useAuth } from "../context/AuthContext";

interface ChatMessage {
  role: "user" | "assistant";
  text: string;
}

export function ChatWidget() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", text: "Hi! Ask me about our products or your order status." },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  if (!user) return null;

  async function handleSend() {
    const question = input.trim();
    if (!question || sending) return;

    setMessages((prev) => [...prev, { role: "user", text: question }]);
    setInput("");
    setSending(true);

    try {
      const res = await api.post<{ answer: string }>("/agent/ask", { question });
      setMessages((prev) => [...prev, { role: "assistant", text: res.answer }]);
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Sorry, something went wrong.";
      setMessages((prev) => [...prev, { role: "assistant", text: msg }]);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {open ? (
        <div className="flex h-[430px] w-[350px] flex-col overflow-hidden rounded-[22px] border border-black/10 bg-white shadow-[0_18px_50px_rgba(0,0,0,0.12)]">
          <div className="flex items-center justify-between border-b border-black/10 bg-[#f5f5f3] px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-md border border-black bg-black text-white">
                <MessageCircleMore size={15} />
              </div>
              <span className="text-sm font-semibold">Hydra Support</span>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Close chat" className="rounded-md border border-black/10 bg-white p-1.5 hover:bg-black hover:text-white">
              <X size={14} />
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto bg-[#fafaf9] p-3">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`max-w-[85%] rounded-md px-3 py-2 text-sm ${
                  m.role === "user"
                    ? "ml-auto border border-black bg-black text-white"
                    : "border border-black/10 bg-white text-black"
                }`}
              >
                {m.text}
              </div>
            ))}
            {sending && <div className="text-xs text-black/45">Thinking...</div>}
          </div>

          <div className="flex items-center gap-2 border-t border-black/10 bg-white p-2.5">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Ask about a product or order..."
              className="flex-1 rounded-md border border-black/10 bg-[#f5f5f3] px-3 py-2.5 text-sm text-black outline-none placeholder:text-black/35 focus:border-black"
            />
            <button onClick={handleSend} disabled={sending} aria-label="Send" className="flex h-10 w-10 items-center justify-center rounded-md border border-black bg-black text-white hover:bg-white hover:text-black disabled:cursor-not-allowed disabled:bg-black/10 disabled:text-black/40">
              <Send size={15} />
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="flex h-12 w-12 items-center justify-center rounded-md border border-black bg-black text-white shadow-[0_12px_30px_rgba(0,0,0,0.18)] hover:bg-white hover:text-black"
          aria-label="Open support chat"
        >
          <MessageCircleMore size={18} />
        </button>
      )}
    </div>
  );
}
