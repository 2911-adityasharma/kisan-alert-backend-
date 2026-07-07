import { useState } from "react";
import { useNavigate, useLocation } from "react-router";
import { motion } from "motion/react";
import { ChevronLeft, Download, Share2, MessageCircle, AlertTriangle, CheckCircle, ChevronDown, ChevronUp } from "lucide-react";
import { API_BASE_URL } from "../services/api";

const defaultTreatments = [
  {
    step: 1,
    title: "Immediate Action",
    title_local: "వెంటనే తీసుకోవలసిన చర్యలు",
    icon: "⚡",
    color: "#D32F2F",
    bg: "#FFEBEE",
    actions: ["Remove infected leaves immediately", "Stop overhead irrigation", "Improve air circulation"],
  },
  {
    step: 2,
    title: "Spray Treatment",
    title_local: "స్ప్రే చికిత్స",
    icon: "💧",
    color: "#1976D2",
    bg: "#E3F2FD",
    actions: ["Mancozeb 75% WP @ 2.5 g/L water", "Spray every 7-10 days", "Spray in early morning"],
  },
  {
    step: 3,
    title: "Fertilizer",
    title_local: "ఎరువులు",
    icon: "🌿",
    color: "#2E7D32",
    bg: "#E8F5E9",
    actions: ["Apply Potassium @ 50 kg/ha", "Avoid excess Nitrogen", "Maintain soil pH 6.0-6.5"],
  },
  {
    step: 4,
    title: "Prevention",
    title_local: "భవిష్యత్తు నివారణ",
    icon: "🛡️",
    color: "#6A1B9A",
    bg: "#F3E5F5",
    actions: ["Use resistant variety next season", "Crop rotation recommended", "Apply neem-based pesticide"],
  },
];

export function DiagnosisResult() {
  const navigate = useNavigate();
  const location = useLocation();
  const [expanded, setExpanded] = useState<number | null>(0);
  
  const lang = localStorage.getItem("language") || "te";

  // Use dynamic diagnosis if passed in router navigation state, or fall back to default Rice Leaf Blast
  const diagnosis = location.state?.diagnosis || {
    disease_name: "Rice Leaf Blast",
    disease_name_local: lang === "te" ? "వరి అగ్గి తెగులు" : (lang === "hi" ? "धान का झुलसा रोग" : "Rice Leaf Blast"),
    severity: "HIGH SEVERITY",
    confidence: "94%",
    affected_pct: "35%",
    risk_level: "High",
    about: lang === "te" ? "ఇది మాగ్నాపోర్తే ఒరైజే శిలీంధ్రం వల్ల వస్తుంది. తేమతో కూడిన వాతావరణంలో వేగంగా వ్యాపిస్తుంది." : 
           (lang === "hi" ? "यह मैग्नापोर्थे ओराइजी कवक के कारण होता है। नम परिस्थितियों में तेजी से फैलता है।" : 
            "Caused by fungus Magnaporthe oryzae. Spreads rapidly in humid conditions."),
    treatments: defaultTreatments,
    photo_url: null
  };

  return (
    <div
      className="h-full flex flex-col overflow-y-auto"
      style={{ background: "#F8FAF5", fontFamily: "Inter, sans-serif" }}
    >
      {/* Header */}
      <div
        className="relative px-5 pt-5 pb-6"
        style={{
          background: diagnosis.severity === "HIGH SEVERITY"
            ? "linear-gradient(145deg, #B71C1C 0%, #D32F2F 100%)"
            : "linear-gradient(145deg, #E65100 0%, #F57C00 100%)",
          borderBottomLeftRadius: "28px",
          borderBottomRightRadius: "28px",
        }}
      >
        <button
          onClick={() => navigate("/app")}
          className="flex items-center gap-2 mb-4"
          style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.9)", cursor: "pointer" }}
        >
          <ChevronLeft size={20} color="white" />
          <span style={{ fontSize: "14px", color: "white" }}>
            {lang === "te" ? "హోమ్ పేజీ" : (lang === "hi" ? "मुख्य पृष्ठ" : "Back to Home")}
          </span>
        </button>

        <div className="flex items-start gap-4">
          {/* Disease illustration / Image scan thumbnail */}
          {diagnosis.photo_url ? (
            <img
              src={`${API_BASE_URL}${diagnosis.photo_url}`}
              alt="Crop Scan thumbnail"
              style={{
                width: "80px",
                height: "80px",
                borderRadius: "16px",
                objectFit: "cover",
                border: "2px solid rgba(255,255,255,0.4)"
              }}
            />
          ) : (
            <div
              className="rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{
                width: "80px",
                height: "80px",
                background: "rgba(255,255,255,0.15)",
                backdropFilter: "blur(10px)",
                fontSize: "36px",
              }}
            >
              🍂
            </div>
          )}
          
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span
                className="px-2 py-1 rounded-full"
                style={{
                  background: "rgba(255,255,255,0.2)",
                  fontSize: "9px",
                  color: "white",
                  fontWeight: 700,
                  letterSpacing: "0.5px"
                }}
              >
                {diagnosis.severity}
              </span>
            </div>
            <h1
              style={{
                fontFamily: "Poppins, sans-serif",
                fontSize: "20px",
                fontWeight: 700,
                color: "white",
                lineHeight: 1.3,
                marginBottom: "4px",
              }}
            >
              {diagnosis.disease_name}
            </h1>
            <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.85)" }}>
              {diagnosis.disease_name_local}
            </p>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mt-5">
          {[
            { label: lang === "te" ? "ఖచ్చితత్వం" : (lang === "hi" ? "सटीकता" : "Confidence"), value: diagnosis.confidence, icon: "🎯" },
            { label: lang === "te" ? "ప్రభావిత ప్రాంతం" : (lang === "hi" ? "प्रभावित हिस्सा" : "Affected"), value: diagnosis.affected_pct, icon: "📍" },
            { label: lang === "te" ? "ప్రమాద స్థాయి" : (lang === "hi" ? "जोखिम स्तर" : "Risk Level"), value: diagnosis.risk_level, icon: "⚠️" },
          ].map((s, i) => (
            <div
              key={i}
              className="rounded-2xl p-3 text-center"
              style={{ background: "rgba(255,255,255,0.15)" }}
            >
              <div style={{ fontSize: "16px", marginBottom: "2px" }}>{s.icon}</div>
              <div
                style={{
                  fontFamily: "Poppins, sans-serif",
                  fontSize: "16px",
                  fontWeight: 700,
                  color: "white",
                }}
              >
                {s.value}
              </div>
              <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.7)" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-5 pt-5">
        {/* Disease info */}
        <div
          className="rounded-2xl p-4 mb-4 flex items-start gap-3"
          style={{ background: "#FFF3E0", border: "1.5px solid #FFCC02" }}
        >
          <AlertTriangle size={18} color="#FB8C00" style={{ flexShrink: 0, marginTop: "1px" }} />
          <div>
            <p style={{ fontSize: "13px", fontWeight: 700, color: "#E65100", marginBottom: "4px" }}>
              {lang === "te" ? "తెగులు గురించి" : (lang === "hi" ? "रोग के बारे में" : "About Disease")}
            </p>
            <p style={{ fontSize: "12px", color: "#616161", lineHeight: 1.5 }}>
              {diagnosis.about}
            </p>
          </div>
        </div>

        {/* Treatment Steps */}
        <h2
          style={{
            fontFamily: "Poppins, sans-serif",
            fontSize: "16px",
            fontWeight: 700,
            color: "#212121",
            marginBottom: "12px",
          }}
        >
          {lang === "te" ? "చికిత్స ప్రణాళిక" : (lang === "hi" ? "उपचार योजना" : "Treatment Plan")}
        </h2>

        {diagnosis.treatments.map((t: any, i: number) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="rounded-2xl mb-3 overflow-hidden"
            style={{
              background: "white",
              boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
              border: `1px solid ${t.color}20`,
            }}
          >
            <button
              className="w-full flex items-center gap-3 p-4"
              style={{ background: "transparent", border: "none", textAlign: "left", cursor: "pointer" }}
              onClick={() => setExpanded(expanded === i ? null : i)}
            >
              <div
                className="rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ width: "44px", height: "44px", background: t.bg, fontSize: "20px" }}
              >
                {t.icon}
              </div>
              <div className="flex-1">
                <p style={{ fontSize: "14px", fontWeight: 700, color: "#212121" }}>
                  {lang === "te" ? "దశ" : (lang === "hi" ? "चरण" : "Step")} {t.step}: {t.title}
                </p>
                <p style={{ fontSize: "12px", color: "#9E9E9E" }}>{t.title_local || t.titleHi}</p>
              </div>
              {expanded === i ? (
                <ChevronDown size={18} color="#9E9E9E" />
              ) : (
                <ChevronUp size={18} color="#9E9E9E" />
              )}
            </button>

            {expanded === i && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                transition={{ duration: 0.2 }}
                className="px-4 pb-4"
              >
                <div style={{ height: "1px", background: `${t.color}20`, marginBottom: "12px" }} />
                {t.actions.map((action: string, ai: number) => (
                  <div key={ai} className="flex items-start gap-2 mb-2">
                    <CheckCircle size={14} color={t.color} style={{ flexShrink: 0, marginTop: "2px" }} />
                    <span style={{ fontSize: "13px", color: "#424242", lineHeight: 1.4 }}>{action}</span>
                  </div>
                ))}
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Action buttons */}
      <div className="px-5 py-5 flex gap-3">
        <button
          className="flex-1 flex items-center justify-center gap-2 rounded-2xl"
          style={{
            height: "50px",
            background: "white",
            border: "1.5px solid #C8E6C9",
            color: "#2E7D32",
            fontFamily: "Poppins, sans-serif",
            fontSize: "13px",
            fontWeight: 600,
            cursor: "pointer"
          }}
        >
          <Download size={16} />
          Save PDF
        </button>
        <button
          className="flex-1 flex items-center justify-center gap-2 rounded-2xl"
          style={{
            height: "50px",
            background: "white",
            border: "1.5px solid #C8E6C9",
            color: "#2E7D32",
            fontFamily: "Poppins, sans-serif",
            fontSize: "13px",
            fontWeight: 600,
            cursor: "pointer"
          }}
        >
          <Share2 size={16} />
          Share
        </button>
        <button
          className="flex-1 flex items-center justify-center gap-2 rounded-2xl"
          onClick={() => navigate("/app/chat")}
          style={{
            height: "50px",
            background: "linear-gradient(135deg, #1565C0 0%, #1976D2 100%)",
            border: "none",
            color: "white",
            fontFamily: "Poppins, sans-serif",
            fontSize: "13px",
            fontWeight: 600,
            boxShadow: "0 4px 14px rgba(25,118,210,0.35)",
            cursor: "pointer"
          }}
        >
          <MessageCircle size={16} />
          Consult
        </button>
      </div>
    </div>
  );
}
