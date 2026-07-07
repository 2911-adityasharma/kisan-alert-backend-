import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Mic, Camera, Send, ChevronRight, Loader2 } from "lucide-react";
import { chatKisanDost } from "../services/api";

type Message = {
  id: number;
  role: "user" | "ai";
  text: string;
  time: string;
};

const suggestions = {
  te: [
    "నా పంటకు ఏ తెగులు సోకింది?",
    "రేపు వాతావరణం ఎలా ఉంటుంది?",
    "యూరియా ఎప్పుడు వేయాలి?",
    "పురుగుమందు పిచికారీ ఎలా చేయాలి?",
    "పీఎం-కిసాన్ పథకం అంటే ఏమిటి?",
    "వరి నాట్లు ఎప్పుడు వేయాలి?"
  ],
  hi: [
    "मेरी फसल में क्या बीमारी है?",
    "कल का मौसम कैसा रहेगा?",
    "यूरिया कब डालनी चाहिए?",
    "कीटनाशक कैसे लगाएं?",
    "PM-Kisan योजना क्या है?",
    "धान की बुवाई कब करें?"
  ],
  en: [
    "What disease does my crop have?",
    "How is the weather tomorrow?",
    "When should I apply urea?",
    "How to apply pesticides?",
    "What is PM-Kisan scheme?",
    "When to sow paddy?"
  ]
};

export function KisanDost() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [recording, setRecording] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  
  const lang = (localStorage.getItem("language") || "te") as "te" | "hi" | "en";

  useEffect(() => {
    // Localize welcome message
    const welcomes = {
      te: "నమస్కారం! 🙏 నేను కిసాన్ దోస్త్, మీ AI వ్యవసాయ సహాయకుడిని. ఈరోజు నేను మీకు ఎలా సహాయం చేయగలను?",
      hi: "नमस्ते! 🙏 मैं किसान दोस्त हूँ, आपका AI कृषि सहायक। आज मैं आपकी कैसे मदद कर सकता हूँ?",
      en: "Hello! I'm Kisan Dost, your AI agriculture assistant. How can I help you today?"
    };
    setMessages([
      {
        id: 1,
        role: "ai",
        text: welcomes[lang] || welcomes.en,
        time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
      }
    ]);
  }, [lang]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;
    const userMsg: Message = {
      id: Date.now(),
      role: "user",
      text,
      time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    // Keep history formatted for backend
    const formattedHistory = messages.map(msg => ({
      role: msg.role === "user" ? "user" : "assistant",
      text: msg.text
    }));

    try {
      const res = await chatKisanDost(text, lang, formattedHistory);
      const aiMsg: Message = {
        id: Date.now() + 1,
        role: "ai",
        text: res.text,
        time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error(err);
      const errorReplies = {
        te: "క్షమించండి, సర్వర్‌కు కనెక్ట్ చేయడంలో సమస్య ఏర్పడింది. దయచేసి తర్వాత మళ్ళీ ప్రయత్నించండి.",
        hi: "क्षमा करें, सर्वर से जुड़ने में समस्या हुई। कृपया बाद में पुनः प्रयास करें।",
        en: "Sorry, I encountered a connection issue. Please try again shortly."
      };
      const aiMsg: Message = {
        id: Date.now() + 1,
        role: "ai",
        text: errorReplies[lang] || errorReplies.en,
        time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const listSuggestions = suggestions[lang] || suggestions.en;

  return (
    <div
      className="h-full flex flex-col"
      style={{ background: "#F8FAF5", fontFamily: "Inter, sans-serif" }}
    >
      {/* Header */}
      <div
        className="px-5 pt-4 pb-4 flex items-center gap-3"
        style={{
          background: "linear-gradient(145deg, #1565C0 0%, #1976D2 100%)",
          boxShadow: "0 4px 16px rgba(25,118,210,0.25)",
        }}
      >
        <div
          className="rounded-2xl flex items-center justify-center"
          style={{ width: "48px", height: "48px", background: "rgba(255,255,255,0.15)", fontSize: "22px" }}
        >
          🤖
        </div>
        <div className="flex-1">
          <h1
            style={{
              fontFamily: "Poppins, sans-serif",
              fontSize: "16px",
              fontWeight: 700,
              color: "white",
            }}
          >
            Kisan Dost AI
          </h1>
          <div className="flex items-center gap-1">
            <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#4CAF50" }} />
            <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.8)" }}>
              Online • Powered by AI
            </span>
          </div>
        </div>
        <div
          className="px-3 py-1 rounded-full"
          style={{ background: "rgba(255,255,255,0.15)", fontSize: "11px", color: "rgba(255,255,255,0.85)" }}
        >
          {lang === "te" ? "తెలుగు" : (lang === "hi" ? "हिंदी" : "English")} ✓
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {/* Suggested questions (only shown at start) */}
        {messages.length === 1 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4"
          >
            <p style={{ fontSize: "12px", color: "#9E9E9E", marginBottom: "10px", textAlign: "center" }}>
              {lang === "te" ? "తప్పక అడగండి" : (lang === "hi" ? "जल्दी पूछें" : "Quick Questions")}
            </p>
            <div className="flex flex-wrap gap-2">
              {listSuggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(s)}
                  className="px-3 py-2 rounded-2xl flex items-center gap-1"
                  style={{
                    background: "white",
                    border: "1.5px solid #BBDEFB",
                    fontSize: "11px",
                    color: "#1976D2",
                    fontWeight: 500,
                    cursor: "pointer"
                  }}
                >
                  {s}
                  <ChevronRight size={10} />
                </button>
              ))}
            </div>
          </motion.div>
        )}

        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.25 }}
              className={`flex mb-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "ai" && (
                <div
                  className="flex items-center justify-center rounded-xl mr-2 flex-shrink-0"
                  style={{ width: "32px", height: "32px", background: "#E3F2FD", fontSize: "15px", alignSelf: "flex-end" }}
                >
                  🤖
                </div>
              )}
              <div style={{ maxWidth: "78%" }}>
                <div
                  className="px-4 py-3 rounded-3xl"
                  style={{
                    background:
                      msg.role === "user"
                        ? "linear-gradient(135deg, #2E7D32, #43A047)"
                        : "white",
                    color: msg.role === "user" ? "white" : "#212121",
                    borderBottomRightRadius: msg.role === "user" ? "6px" : "24px",
                    borderBottomLeftRadius: msg.role === "ai" ? "6px" : "24px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                    whiteSpace: "pre-line",
                  }}
                >
                  <p style={{ fontSize: "13px", lineHeight: 1.55 }}>{msg.text}</p>
                </div>
                <p
                  style={{
                    fontSize: "10px",
                    color: "#BDBDBD",
                    marginTop: "3px",
                    textAlign: msg.role === "user" ? "right" : "left",
                    paddingLeft: "4px",
                    paddingRight: "4px",
                  }}
                >
                  {msg.time}
                </p>
              </div>
              {msg.role === "user" && (
                <div
                  className="flex items-center justify-center rounded-xl ml-2 flex-shrink-0"
                  style={{ width: "32px", height: "32px", background: "#E8F5E9", fontSize: "15px", alignSelf: "flex-end" }}
                >
                  👨‍🌾
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing indicator */}
        {isTyping && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 mb-3"
          >
            <div
              className="flex items-center justify-center rounded-xl"
              style={{ width: "32px", height: "32px", background: "#E3F2FD", fontSize: "15px" }}
            >
              🤖
            </div>
            <div
              className="flex items-center gap-1 px-4 py-3 rounded-3xl"
              style={{ background: "white", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}
            >
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  animate={{ y: [0, -5, 0] }}
                  transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.15 }}
                  style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#1976D2" }}
                />
              ))}
            </div>
          </motion.div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div
        className="px-4 py-3 flex items-center gap-2"
        style={{ background: "white", borderTop: "1px solid #F1F8E9", boxShadow: "0 -4px 16px rgba(0,0,0,0.06)" }}
      >
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setRecording(!recording)}
          className="flex items-center justify-center rounded-2xl flex-shrink-0"
          style={{
            width: "44px",
            height: "44px",
            background: recording ? "#FFEBEE" : "#E8F5E9",
            border: "none",
            flexShrink: 0,
            cursor: "pointer"
          }}
        >
          <Mic size={20} color={recording ? "#D32F2F" : "#2E7D32"} />
        </motion.button>

        <div
          className="flex-1 flex items-center gap-2 rounded-2xl px-4"
          style={{ background: "#F8FAF5", border: "1.5px solid #E8F5E9", height: "44px" }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
            placeholder={lang === "te" ? "వ్యవసాయం గురించి అడగండి..." : (lang === "hi" ? "खेती के बारे में पूछें..." : "Ask about crops & farming...")}
            style={{
              border: "none",
              outline: "none",
              background: "transparent",
              fontSize: "13px",
              color: "#212121",
              fontFamily: "Inter, sans-serif",
              flex: 1,
            }}
          />
          <button
            className="flex items-center justify-center flex-shrink-0"
            style={{ background: "transparent", border: "none" }}
          >
            <Camera size={18} color="#9E9E9E" />
          </button>
        </div>

        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => sendMessage(input)}
          className="flex items-center justify-center rounded-2xl flex-shrink-0"
          style={{
            width: "44px",
            height: "44px",
            background: input.trim()
              ? "linear-gradient(135deg, #2E7D32, #43A047)"
              : "#E8F5E9",
            border: "none",
            boxShadow: input.trim() ? "0 4px 12px rgba(46,125,50,0.3)" : "none",
            transition: "all 0.2s",
            cursor: "pointer"
          }}
        >
          <Send size={18} color={input.trim() ? "white" : "#9E9E9E"} />
        </motion.button>
      </div>
    </div>
  );
}
