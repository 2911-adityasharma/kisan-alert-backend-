import { useState } from "react";
import { useNavigate, useLocation } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { ChevronRight, ChevronLeft, MapPin, User, Home, BookOpen, Layers, Loader2, AlertCircle } from "lucide-react";
import { registerFarmer, setSessionFarmer } from "../services/api";

const slides = [
  {
    id: 0,
    emoji: "📸",
    bgFrom: "#1B5E20",
    bgTo: "#2E7D32",
    illustration: (
      <svg width="180" height="180" viewBox="0 0 180 180" fill="none">
        <circle cx="90" cy="90" r="75" fill="rgba(255,255,255,0.1)" />
        <rect x="45" y="65" width="90" height="68" rx="14" fill="rgba(255,255,255,0.9)" />
        <circle cx="90" cy="99" r="20" fill="#43A047" />
        <circle cx="90" cy="99" r="14" fill="#66BB6A" />
        <circle cx="90" cy="99" r="6" fill="white" />
        <rect x="62" y="72" width="16" height="10" rx="5" fill="#E8F5E9" />
        <circle cx="125" cy="75" r="5" fill="#FF7043" />
        <path d="M55 155 Q90 130 125 155" fill="#795548" opacity="0.4" />
        <rect x="70" y="148" width="40" height="12" rx="4" fill="#795548" opacity="0.5" />
        <path d="M58 80 L58 68 L70 68" stroke="white" strokeWidth="2" strokeLinecap="round" />
        <path d="M122 80 L122 68 L110 68" stroke="white" strokeWidth="2" strokeLinecap="round" />
        <path d="M58 118 L58 130 L70 130" stroke="white" strokeWidth="2" strokeLinecap="round" />
        <path d="M122 118 L122 130 L110 130" stroke="white" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
    title: "ఫసల్ స్కాన్ చేయండి",
    titleEn: "Scan Your Crop",
    desc: "మీ ఫోన్‌తో పంట ఫోటో తీయండి మరియు AI ద్వారా పరిష్కారం పొందండి",
    descEn: "Take a photo of your crop and let AI identify problems instantly",
  },
  {
    id: 1,
    emoji: "🤖",
    bgFrom: "#1565C0",
    bgTo: "#1976D2",
    illustration: (
      <svg width="180" height="180" viewBox="0 0 180 180" fill="none">
        <circle cx="90" cy="90" r="75" fill="rgba(255,255,255,0.1)" />
        <ellipse cx="90" cy="80" rx="40" ry="38" fill="rgba(255,255,255,0.85)" />
        <path d="M65 80 Q65 55 90 55 Q115 55 115 80" stroke="#1976D2" strokeWidth="3" fill="none" />
        <path d="M70 85 Q70 105 90 108 Q110 105 110 85" stroke="#1976D2" strokeWidth="2" fill="none" />
        <circle cx="80" cy="72" r="5" fill="#42A5F5" />
        <circle cx="100" cy="72" r="5" fill="#42A5F5" />
        <circle cx="90" cy="90" r="7" fill="#1976D2" />
        <path d="M130 50 Q145 65 145 90" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeDasharray="4 3" />
        <path d="M50 50 Q35 65 35 90" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeDasharray="4 3" />
        <rect x="60" y="125" width="60" height="26" rx="13" fill="rgba(255,255,255,0.9)" />
        <text x="90" y="143" textAnchor="middle" fill="#1976D2" fontSize="11" fontWeight="bold">95% Accurate</text>
      </svg>
    ),
    title: "AI రోగాలను గుర్తిస్తుంది",
    titleEn: "AI Detects Disease",
    desc: "మా AI సిస్టమ్ పంట ఆకుల ఆధారంగా తెగుళ్లను విశ్లేషిస్తుంది",
    descEn: "Our AI engine diagnoses diseases from leaf patterns, color & symptoms",
  },
  {
    id: 2,
    emoji: "🏛️",
    bgFrom: "#4A148C",
    bgTo: "#6A1B9A",
    illustration: (
      <svg width="180" height="180" viewBox="0 0 180 180" fill="none">
        <circle cx="90" cy="90" r="75" fill="rgba(255,255,255,0.1)" />
        <rect x="50" y="70" width="80" height="70" rx="4" fill="rgba(255,255,255,0.85)" />
        <rect x="55" y="60" width="70" height="16" rx="4" fill="rgba(255,255,255,0.7)" />
        <rect x="70" y="52" width="40" height="12" rx="3" fill="rgba(255,255,255,0.6)" />
        <rect x="60" y="80" width="16" height="18" rx="2" fill="#CE93D8" />
        <rect x="82" y="80" width="16" height="18" rx="2" fill="#CE93D8" />
        <rect x="104" y="80" width="16" height="18" rx="2" fill="#CE93D8" />
        <rect x="79" y="108" width="22" height="32" rx="4" fill="#AB47BC" />
        <rect x="56" y="63" width="5" height="77" fill="rgba(255,255,255,0.4)" />
        <rect x="119" y="63" width="5" height="77" fill="rgba(255,255,255,0.4)" />
        <circle cx="140" cy="55" r="16" fill="rgba(255,255,255,0.9)" />
        <text x="140" y="61" textAnchor="middle" fill="#6A1B9A" fontSize="14" fontWeight="bold">₹</text>
        <circle cx="42" cy="55" r="16" fill="rgba(76,175,80,0.9)" />
        <path d="M34 55 L40 62 L52 48" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: "ప్రభుత్వ సేవలు",
    titleEn: "Get Government Support",
    desc: "వ్యవసాయ అధికారులు మరియు సబ్సిడీల సమాచారం నేరుగా పొందండి",
    descEn: "Connect directly with schemes, subsidies & agricultural officers",
  },
];

export function Onboarding() {
  const [current, setCurrent] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Form fields
  const [name, setName] = useState("");
  const [phone, setPhone] = useState(location.state?.phone || "");
  const [village, setVillage] = useState("");
  const [crop, setCrop] = useState("Rice");
  const [language, setLanguage] = useState("te");
  const [plotSize, setPlotSize] = useState("");
  const [soilCard, setSoilCard] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleNext = () => {
    if (current < slides.length - 1) {
      setCurrent(current + 1);
    } else {
      setShowForm(true);
    }
  };

  const handleBack = () => {
    if (showForm) {
      setShowForm(false);
    } else if (current > 0) {
      setCurrent(current - 1);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !village) {
      setError("Please fill in Name, Phone, and Village ID.");
      return;
    }
    
    setLoading(true);
    setError("");
    
    try {
      const res = await registerFarmer({
        phone,
        name,
        village_id: village,
        language,
        crop_current: crop,
        plot_size: plotSize ? parseFloat(plotSize) : undefined,
        soil_data_ref: soilCard ? soilCard : `village_default:${village}`,
        lat: 17.9689, // Warangal coordinate fallback
        lng: 79.5941
      });
      
      setSessionFarmer(res.farmer);
      localStorage.setItem("token", res.token);
      navigate("/app");
    } catch (err: any) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const slide = slides[current];

  if (showForm) {
    return (
      <div className="h-full flex flex-col" style={{ background: "#F8FAF5", fontFamily: "Inter, sans-serif" }}>
        {/* Header */}
        <div
          className="px-5 pt-4 pb-4 flex items-center gap-3"
          style={{
            background: "linear-gradient(145deg, #1B5E20 0%, #2E7D32 100%)",
            boxShadow: "0 4px 16px rgba(46,125,50,0.2)",
          }}
        >
          <button
            onClick={handleBack}
            className="flex items-center justify-center w-8 h-8 rounded-full"
            style={{ background: "rgba(255,255,255,0.15)", border: "none" }}
          >
            <ChevronLeft size={18} color="white" />
          </button>
          <h1 style={{ fontFamily: "Poppins, sans-serif", fontSize: "16px", fontWeight: 700, color: "white" }}>
            Complete Registration 👨‍🌾
          </h1>
        </div>

        {/* Form Body */}
        <form onSubmit={handleRegister} className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">
          {error && (
            <div
              className="p-3 rounded-2xl flex items-center gap-2"
              style={{ background: "#FFEBEE", border: "1px solid #FFCDD2", color: "#D32F2F", fontSize: "13px" }}
            >
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <p style={{ fontSize: "13px", color: "#616161" }}>
            Please provide your details to personalize crop and weather alerts.
          </p>

          {/* Full Name */}
          <div>
            <label style={{ fontSize: "12px", fontWeight: 600, color: "#2E7D32", display: "flex", itemsCenter: "center", gap: 1, marginBottom: "5px" }}>
              <User size={13} /> Farmer's Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ramesh Yadav"
              className="w-full rounded-2xl px-4"
              style={{ height: "46px", background: "white", border: "1.5px solid #C8E6C9", fontSize: "14px", outline: "none" }}
            />
          </div>

          {/* Mobile Phone */}
          <div>
            <label style={{ fontSize: "12px", fontWeight: 600, color: "#2E7D32", display: "flex", itemsCenter: "center", gap: 1, marginBottom: "5px" }}>
              <User size={13} /> Mobile Number *
            </label>
            <input
              type="tel"
              required
              maxLength={10}
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
              placeholder="10-digit number"
              className="w-full rounded-2xl px-4"
              style={{ height: "46px", background: "white", border: "1.5px solid #C8E6C9", fontSize: "14px", outline: "none" }}
            />
          </div>

          {/* Village ID */}
          <div>
            <label style={{ fontSize: "12px", fontWeight: 600, color: "#2E7D32", display: "flex", itemsCenter: "center", gap: 1, marginBottom: "5px" }}>
              <Home size={13} /> Village ID / Name *
            </label>
            <select
              value={village}
              required
              onChange={(e) => setVillage(e.target.value)}
              className="w-full rounded-2xl px-4"
              style={{ height: "46px", background: "white", border: "1.5px solid #C8E6C9", fontSize: "14px", outline: "none" }}
            >
              <option value="">Select Village</option>
              <option value="village_anantapur">Anantapur (AP)</option>
              <option value="village_warangal">Warangal (Telangana)</option>
              <option value="village_sehore">Sehore (MP)</option>
            </select>
          </div>

          {/* Preferred Language */}
          <div>
            <label style={{ fontSize: "12px", fontWeight: 600, color: "#2E7D32", display: "flex", itemsCenter: "center", gap: 1, marginBottom: "5px" }}>
              <BookOpen size={13} /> Preferred Language
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full rounded-2xl px-4"
              style={{ height: "46px", background: "white", border: "1.5px solid #C8E6C9", fontSize: "14px", outline: "none" }}
            >
              <option value="te">Telugu (తెలుగు)</option>
              <option value="hi">Hindi (हिंदी)</option>
              <option value="en">English</option>
            </select>
          </div>

          {/* Current Crop */}
          <div>
            <label style={{ fontSize: "12px", fontWeight: 600, color: "#2E7D32", display: "flex", itemsCenter: "center", gap: 1, marginBottom: "5px" }}>
              <Layers size={13} /> Current Crop
            </label>
            <select
              value={crop}
              onChange={(e) => setCrop(e.target.value)}
              className="w-full rounded-2xl px-4"
              style={{ height: "46px", background: "white", border: "1.5px solid #C8E6C9", fontSize: "14px", outline: "none" }}
            >
              <option value="Rice">Rice (వరి)</option>
              <option value="Wheat">Wheat (గోధుమ)</option>
              <option value="Cotton">Cotton (ప్రత్తి)</option>
              <option value="Soybean">Soybean (సోయాబీన్)</option>
              <option value="Groundnut">Groundnut (వేరుశనగ)</option>
              <option value="None">None</option>
            </select>
          </div>

          {/* Plot Size */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label style={{ fontSize: "12px", fontWeight: 600, color: "#2E7D32", display: "block", marginBottom: "5px" }}>
                Farm Size (Acres)
              </label>
              <input
                type="number"
                step="0.1"
                value={plotSize}
                onChange={(e) => setPlotSize(e.target.value)}
                placeholder="e.g. 2.5"
                className="w-full rounded-2xl px-4"
                style={{ height: "46px", background: "white", border: "1.5px solid #C8E6C9", fontSize: "14px", outline: "none" }}
              />
            </div>
            <div>
              <label style={{ fontSize: "12px", fontWeight: 600, color: "#2E7D32", display: "block", marginBottom: "5px" }}>
                Soil Card ID (Opt)
              </label>
              <input
                type="text"
                value={soilCard}
                onChange={(e) => setSoilCard(e.target.value)}
                placeholder="e.g. SHC-1234"
                className="w-full rounded-2xl px-4"
                style={{ height: "46px", background: "white", border: "1.5px solid #C8E6C9", fontSize: "14px", outline: "none" }}
              />
            </div>
          </div>

          {/* Register Button */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-2xl mt-4"
            style={{
              background: "linear-gradient(135deg, #2E7D32 0%, #43A047 100%)",
              color: "white",
              height: "52px",
              fontFamily: "Poppins, sans-serif",
              fontSize: "15px",
              fontWeight: 600,
              boxShadow: "0 8px 24px rgba(46,125,50,0.3)",
              border: "none",
              cursor: loading ? "default" : "pointer"
            }}
          >
            {loading ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <>
                Register & Get Started
                <ChevronRight size={18} />
              </>
            )}
          </motion.button>
        </form>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col" style={{ fontFamily: "Inter, sans-serif" }}>
      {/* Skip */}
      <div className="flex justify-between items-center px-6 pt-4">
        {current > 0 ? (
          <button
            onClick={handleBack}
            style={{ fontSize: "14px", color: "#616161", fontWeight: 500, background: "none", border: "none" }}
          >
            Back
          </button>
        ) : (
          <div />
        )}
        <button
          onClick={() => setShowForm(true)}
          style={{ fontSize: "14px", color: "#616161", fontWeight: 500, background: "none", border: "none" }}
        >
          Skip
        </button>
      </div>

      {/* Slide */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.35 }}
          className="flex-1 flex flex-col"
        >
          {/* Illustration area */}
          <div
            className="mx-6 rounded-3xl flex items-center justify-center"
            style={{
              background: `linear-gradient(140deg, ${slide.bgFrom} 0%, ${slide.bgTo} 100%)`,
              height: "280px",
              boxShadow: "0 16px 40px rgba(0,0,0,0.18)",
            }}
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
            >
              {slide.illustration}
            </motion.div>
          </div>

          {/* Text */}
          <div className="px-8 pt-8 flex-1">
            <h2
              style={{
                fontFamily: "Poppins, sans-serif",
                fontSize: "26px",
                fontWeight: 700,
                color: "#212121",
                marginBottom: "8px",
                lineHeight: 1.3,
              }}
            >
              {slide.title}
            </h2>
            <p
              style={{
                fontSize: "13px",
                color: "#43A047",
                fontWeight: 600,
                marginBottom: "12px",
                letterSpacing: "0.2px",
              }}
            >
              {slide.titleEn}
            </p>
            <p style={{ fontSize: "15px", color: "#616161", lineHeight: 1.6 }}>
              {slide.desc}
            </p>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Dots + Button */}
      <div className="px-6 pb-6">
        {/* Dot indicators */}
        <div className="flex justify-center gap-2 mb-6">
          {slides.map((_, i) => (
            <motion.button
              key={i}
              onClick={() => setCurrent(i)}
              animate={{ width: i === current ? "24px" : "8px" }}
              transition={{ duration: 0.3 }}
              style={{
                height: "8px",
                borderRadius: "4px",
                background: i === current ? "#2E7D32" : "#C8E6C9",
                border: "none",
                cursor: "pointer",
              }}
            />
          ))}
        </div>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleNext}
          className="w-full flex items-center justify-center gap-2 rounded-2xl"
          style={{
            background: "linear-gradient(135deg, #2E7D32 0%, #43A047 100%)",
            color: "white",
            height: "56px",
            fontFamily: "Poppins, sans-serif",
            fontSize: "16px",
            fontWeight: 600,
            boxShadow: "0 8px 24px rgba(46,125,50,0.35)",
            border: "none",
            cursor: "pointer"
          }}
        >
          {current === slides.length - 1 ? "Get Started" : "Next"}
          <ChevronRight size={20} />
        </motion.button>
      </div>
    </div>
  );
}
