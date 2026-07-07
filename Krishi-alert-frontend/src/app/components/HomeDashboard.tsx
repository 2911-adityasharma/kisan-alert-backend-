import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import {
  Bell, MapPin, Droplets, Wind, CloudRain,
  Camera, TrendingUp, ChevronRight,
  AlertTriangle, Banknote, Star, Loader2, AlertCircle
} from "lucide-react";
import { getDashboard } from "../services/api";

export function HomeDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDashboard = async () => {
      const phone = localStorage.getItem("phone") || "919876543210";
      setLoading(true);
      setError("");
      try {
        const res = await getDashboard(phone);
        setData(res);
      } catch (err: any) {
        logger_error(err);
        setError("Failed to connect to backend service. Check if backend is running.");
      } finally {
        setLoading(false);
      }
    };
    loadDashboard();
  }, []);

  // Helper log function to satisfy build/lint standard
  const logger_error = (err: any) => {
    console.error("Dashboard load error:", err);
  };

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center" style={{ background: "#F8FAF5" }}>
        <Loader2 className="animate-spin text-green-700" size={36} />
        <p style={{ marginTop: "12px", fontSize: "14px", color: "#616161", fontFamily: "Inter, sans-serif" }}>
          Loading your farm dashboard...
        </p>
      </div>
    );
  }

  // Graceful fallback to static dashboard on API error
  if (error || !data) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6" style={{ background: "#F8FAF5" }}>
        <AlertCircle size={36} color="#D32F2F" />
        <p style={{ margin: "12px 0", fontSize: "14px", color: "#616161", textAlign: "center", fontFamily: "Inter, sans-serif" }}>
          {error || "Unable to retrieve dashboard data."}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-5 py-2.5 rounded-2xl"
          style={{ background: "#2E7D32", color: "white", border: "none", fontWeight: 600, fontSize: "13px" }}
        >
          Try Again
        </button>
      </div>
    );
  }

  const { farmer, plot, weather, mandi_prices, alerts, schemes, officer, seasonal_advisory } = data;
  const lang = farmer?.language || "en";

  return (
    <div className="min-h-full" style={{ background: "#F8FAF5" }}>
      {/* Header */}
      <div
        className="px-5 pt-4 pb-6 relative overflow-hidden"
        style={{
          background: "linear-gradient(145deg, #1B5E20 0%, #2E7D32 60%, #388E3C 100%)",
          borderBottomLeftRadius: "28px",
          borderBottomRightRadius: "28px",
        }}
      >
        {/* Decorative circle */}
        <div
          className="absolute -top-8 -right-8 rounded-full opacity-10"
          style={{ width: "130px", height: "130px", background: "white" }}
        />
        <div
          className="absolute -bottom-4 -left-4 rounded-full opacity-10"
          style={{ width: "80px", height: "80px", background: "white" }}
        />

        <div className="flex justify-between items-start mb-5 relative">
          <div>
            <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.75)" }}>
              {lang === "hi" ? "नमस्ते" : (lang === "te" ? "నమస్కారం" : "Hello")} 🙏
            </p>
            <h1
              style={{
                fontFamily: "Poppins, sans-serif",
                fontSize: "22px",
                fontWeight: 700,
                color: "white",
                lineHeight: 1.3,
              }}
            >
              {farmer?.name || "Farmer Ji"}
            </h1>
            <div className="flex items-center gap-1 mt-1">
              <MapPin size={12} color="rgba(255,255,255,0.75)" />
              <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.75)" }}>
                {farmer?.village_id === "village_anantapur" ? "Anantapur, Andhra Pradesh" : 
                 farmer?.village_id === "village_warangal" ? "Warangal, Telangana" : 
                 farmer?.village_id === "village_sehore" ? "Sehore, Madhya Pradesh" : 
                 farmer?.village_id || "Indian Farm"}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <motion.button
              whileTap={{ scale: 0.92 }}
              className="relative flex items-center justify-center rounded-2xl"
              style={{ width: "44px", height: "44px", background: "rgba(255,255,255,0.15)" }}
            >
              <Bell size={20} color="white" />
              <div
                className="absolute flex items-center justify-center rounded-full"
                style={{
                  width: "16px",
                  height: "16px",
                  background: "#FB8C00",
                  top: "-4px",
                  right: "-4px",
                  fontSize: "9px",
                  color: "white",
                  fontWeight: 700,
                }}
              >
                {alerts.length}
              </div>
            </motion.button>
            <div
              className="rounded-2xl flex items-center justify-center"
              style={{ width: "44px", height: "44px", background: "rgba(255,255,255,0.15)", fontSize: "20px" }}
            >
              👨‍🌾
            </div>
          </div>
        </div>

        {/* Weather card */}
        <div
          className="rounded-2xl p-4 relative"
          style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.2)" }}
        >
          <div className="flex justify-between items-start">
            <div>
              <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.8)", marginBottom: "2px" }}>
                {lang === "hi" ? "आज का मौसम" : (lang === "te" ? "ఈరోజు వాతావరణం" : "Today's Weather")}
              </p>
              <div className="flex items-end gap-2">
                <span
                  style={{
                    fontFamily: "Poppins, sans-serif",
                    fontSize: "38px",
                    fontWeight: 700,
                    color: "white",
                    lineHeight: 1,
                  }}
                >
                  {weather?.temp}°
                </span>
                <span style={{ fontSize: "14px", color: "rgba(255,255,255,0.8)", marginBottom: "4px" }}>C</span>
              </div>
              <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.75)" }}>{weather?.condition}</p>
            </div>
            <span style={{ fontSize: "52px", opacity: 0.9 }}>
              {weather?.condition?.toLowerCase().includes("rain") ? "🌧️" : 
               weather?.condition?.toLowerCase().includes("cloud") ? "⛅" : "☀️"}
            </span>
          </div>
          <div className="flex gap-4 mt-3">
            {[
              { icon: <Droplets size={13} />, val: weather?.humidity, label: lang === "hi" ? "आर्द्रता" : (lang === "te" ? "తేమ" : "Humidity") },
              { icon: <Wind size={13} />, val: weather?.wind, label: lang === "hi" ? "हवा" : (lang === "te" ? "గాలి" : "Wind") },
              { icon: <CloudRain size={13} />, val: weather?.rain_prob, label: lang === "hi" ? "वर्षा" : (lang === "te" ? "వర్షం" : "Rain") },
            ].map((w, i) => (
              <div key={i} className="flex items-center gap-1">
                <span style={{ color: "rgba(255,255,255,0.7)" }}>{w.icon}</span>
                <span style={{ fontSize: "12px", color: "white", fontWeight: 500 }}>{w.val}</span>
                <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.6)" }}>{w.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-5">
        {/* Quick actions */}
        <div className="mt-5 mb-5">
          <div className="grid grid-cols-4 gap-3">
            {[
              { icon: "📸", label: lang === "hi" ? "स्कैन फसल" : (lang === "te" ? "పంట స్కాన్" : "Scan Crop"), color: "#E8F5E9", action: () => navigate("/app/scan") },
              { icon: "📋", label: lang === "hi" ? "इतिहास" : (lang === "te" ? "చరిత్ర" : "History"), color: "#E3F2FD", action: () => {} },
              { icon: "📊", label: lang === "hi" ? "मंडी" : (lang === "te" ? "మార్కెట్" : "Market"), color: "#FFF8E1", action: () => {} },
              { icon: "👨‍💼", label: lang === "hi" ? "अधिकारी" : (lang === "te" ? "అధికారి" : "Officer"), color: "#F3E5F5", action: () => {} },
            ].map((item, i) => (
              <motion.button
                key={i}
                whileTap={{ scale: 0.93 }}
                onClick={item.action}
                className="flex flex-col items-center gap-2"
                style={{ background: "transparent", border: "none" }}
              >
                <div
                  className="rounded-2xl flex items-center justify-center"
                  style={{ width: "56px", height: "56px", background: item.color, boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
                >
                  <span style={{ fontSize: "22px" }}>{item.icon}</span>
                </div>
                <span style={{ fontSize: "11px", color: "#616161", fontWeight: 500, textAlign: "center", lineHeight: 1.2 }}>
                  {item.label}
                </span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Scan Crop Banner */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate("/app/scan")}
          className="w-full rounded-3xl p-4 flex items-center gap-4 mb-5"
          style={{
            background: "linear-gradient(135deg, #2E7D32 0%, #43A047 100%)",
            border: "none",
            boxShadow: "0 8px 24px rgba(46,125,50,0.3)",
            cursor: "pointer"
          }}
        >
          <div
            className="rounded-2xl flex items-center justify-center"
            style={{ width: "52px", height: "52px", background: "rgba(255,255,255,0.2)", flexShrink: 0 }}
          >
            <Camera size={26} color="white" />
          </div>
          <div className="flex-1 text-left">
            <p style={{ fontFamily: "Poppins, sans-serif", fontSize: "15px", fontWeight: 700, color: "white" }}>
              {lang === "hi" ? "अपनी फसल स्कैन करें" : (lang === "te" ? "మీ పంటను స్కాన్ చేయండి" : "Scan Your Crop Now")}
            </p>
            <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.8)", marginTop: "2px" }}>
              {lang === "hi" ? "अपनी फसल की फोटो लें • 30 सेकंड में विश्लेषण" : 
               (lang === "te" ? "పంట ఫోటో తీయండి • 30 సెకన్లలో విశ్లేషణ" : "Take a photo of your crop • AI analysis in 30 seconds")}
            </p>
          </div>
          <ChevronRight size={22} color="rgba(255,255,255,0.8)" />
        </motion.button>

        {/* Government Alerts */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-3">
            <h3
              style={{ fontFamily: "Poppins, sans-serif", fontSize: "16px", fontWeight: 700, color: "#212121" }}
            >
              {lang === "hi" ? "सरकारी सूचनाएं" : (lang === "te" ? "ప్రభుత్వ హెచ్చరికలు" : "Government Alerts")}
            </h3>
            <button
              onClick={() => navigate("/app/alerts")}
              style={{ fontSize: "12px", color: "#2E7D32", fontWeight: 600, background: "none", border: "none", cursor: "pointer" }}
            >
              {lang === "hi" ? "सभी देखें" : (lang === "te" ? "అన్నీ చూడు" : "See All")}
            </button>
          </div>
          {alerts.map((alert: any, i: number) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex items-start gap-3 p-3 rounded-2xl mb-2"
              style={{ background: alert.bg, border: `1px solid ${alert.color}22` }}
            >
              <div
                className="rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ width: "40px", height: "40px", background: `${alert.color}18`, fontSize: "18px" }}
              >
                {alert.icon}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center">
                  <p style={{ fontSize: "13px", fontWeight: 700, color: alert.color }}>
                    {alert.title}
                  </p>
                  <span style={{ fontSize: "10px", color: "#9E9E9E" }}>{alert.time}</span>
                </div>
                <p style={{ fontSize: "12px", color: "#616161", marginTop: "2px", lineHeight: 1.4 }}>
                  {alert.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Mandi Prices */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-3">
            <h3
              style={{ fontFamily: "Poppins, sans-serif", fontSize: "16px", fontWeight: 700, color: "#212121" }}
            >
              {lang === "hi" ? "मंडी भाव" : (lang === "te" ? "మండి ధరలు" : "Mandi Prices")}
            </h3>
            <div className="flex items-center gap-1">
              <TrendingUp size={13} color="#43A047" />
              <span style={{ fontSize: "11px", color: "#43A047", fontWeight: 600 }}>
                {lang === "hi" ? "लाइव" : (lang === "te" ? "లైవ్" : "Live")}
              </span>
            </div>
          </div>
          <div
            className="rounded-3xl overflow-hidden"
            style={{ background: "white", boxShadow: "0 4px 16px rgba(0,0,0,0.06)" }}
          >
            {mandi_prices.map((item: any, i: number) => (
              <div
                key={i}
                className="flex items-center justify-between px-4 py-3"
                style={{ borderBottom: i < mandi_prices.length - 1 ? "1px solid #F1F8E9" : "none" }}
              >
                <div className="flex items-center gap-3">
                  <span style={{ fontSize: "20px" }}>{item.emoji}</span>
                  <div>
                    <p style={{ fontSize: "14px", fontWeight: 600, color: "#212121" }}>{item.cropLocal || item.crop}</p>
                    <p style={{ fontSize: "11px", color: "#9E9E9E" }}>{item.crop} / Quintal</p>
                  </div>
                </div>
                <div className="text-right">
                  <p style={{ fontSize: "15px", fontWeight: 700, color: "#212121" }}>{item.price}</p>
                  <p style={{ fontSize: "11px", fontWeight: 600, color: item.up ? "#4CAF50" : "#D32F2F" }}>
                    {item.change}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Kisan Dost AI */}
        <motion.div
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate("/app/chat")}
          className="rounded-3xl p-4 mb-5 flex items-center gap-3"
          style={{
            background: "linear-gradient(135deg, #E3F2FD 0%, #E8EAF6 100%)",
            border: "1.5px solid #BBDEFB",
            cursor: "pointer",
          }}
        >
          <div
            className="rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ width: "52px", height: "52px", background: "#1976D2", fontSize: "22px" }}
          >
            🤖
          </div>
          <div className="flex-1">
            <p style={{ fontFamily: "Poppins, sans-serif", fontSize: "14px", fontWeight: 700, color: "#1976D2" }}>
              {lang === "hi" ? "किसान दोस्त AI" : (lang === "te" ? "కిసాన్ దోస్త్ AI" : "Kisan Dost AI")}
            </p>
            <p style={{ fontSize: "12px", color: "#616161", marginTop: "2px" }}>
              {lang === "hi" ? "खेती के बारे में कुछ भी पूछें" : (lang === "te" ? "వ్యవసాయం గురించి ఏదైనా అడగండి" : "Ask anything about farming in regional languages")}
            </p>
          </div>
          <ChevronRight size={20} color="#1976D2" />
        </motion.div>

        {/* Latest Schemes */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-3">
            <h3 style={{ fontFamily: "Poppins, sans-serif", fontSize: "16px", fontWeight: 700, color: "#212121" }}>
              {lang === "hi" ? "सरकारी योजनाएं" : (lang === "te" ? "ప్రభుత్వ పథకాలు" : "Govt. Schemes")}
            </h3>
            <Star size={14} color="#F9A825" fill="#F9A825" />
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
            {schemes.map((s: any, i: number) => (
              <div
                key={i}
                className="rounded-2xl p-4 flex-shrink-0"
                style={{
                  width: "150px",
                  background: `${s.color}12`,
                  border: `1.5px solid ${s.color}30`,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                }}
              >
                <div
                  className="rounded-xl flex items-center justify-center mb-2"
                  style={{ width: "36px", height: "36px", background: `${s.color}20` }}
                >
                  <Banknote size={18} color={s.color} />
                </div>
                <p style={{ fontFamily: "Poppins, sans-serif", fontSize: "13px", fontWeight: 700, color: "#212121" }}>
                  {s.name}
                </p>
                <p style={{ fontSize: "15px", fontWeight: 700, color: s.color, margin: "4px 0" }}>
                  {s.amount}
                </p>
                <p style={{ fontSize: "10px", color: "#9E9E9E" }}>{s.deadline}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Nearby Officer */}
        <div
          className="rounded-3xl p-4 mb-5 flex items-center gap-3"
          style={{ background: "white", boxShadow: "0 4px 16px rgba(0,0,0,0.06)", border: "1px solid #F1F8E9" }}
        >
          <div
            className="rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ width: "52px", height: "52px", background: "#E8F5E9", fontSize: "22px" }}
          >
            👨‍💼
          </div>
          <div className="flex-1">
            <p style={{ fontFamily: "Poppins, sans-serif", fontSize: "14px", fontWeight: 700, color: "#212121" }}>
              {officer?.name}
            </p>
            <p style={{ fontSize: "12px", color: "#616161" }}>{officer?.role} • {officer?.distance}</p>
            <div className="flex items-center gap-1 mt-1">
              <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#4CAF50" }} />
              <span style={{ fontSize: "11px", color: "#4CAF50", fontWeight: 600 }}>
                {lang === "hi" ? "उपलब्ध" : (lang === "te" ? "అందుబాటులో ఉన్నారు" : "Available")}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <a
              href={`tel:${officer?.phone}`}
              className="rounded-xl flex items-center justify-center"
              style={{ width: "36px", height: "36px", background: "#E8F5E9", textDecoration: "none" }}
            >
              <span style={{ fontSize: "16px" }}>📞</span>
            </a>
            <button
              onClick={() => navigate("/app/chat")}
              className="rounded-xl flex items-center justify-center"
              style={{ width: "36px", height: "36px", background: "#E3F2FD", border: "none", cursor: "pointer" }}
            >
              <span style={{ fontSize: "16px" }}>💬</span>
            </button>
          </div>
        </div>

        {/* Seasonal Advisory */}
        <div
          className="rounded-3xl p-4 mb-6 flex items-start gap-3"
          style={{ background: "linear-gradient(135deg, #FFF8E1 0%, #FFF3E0 100%)", border: "1.5px solid #FFE082" }}
        >
          <span style={{ fontSize: "24px", flexShrink: 0 }}>🌱</span>
          <div>
            <p style={{ fontFamily: "Poppins, sans-serif", fontSize: "14px", fontWeight: 700, color: "#E65100" }}>
              {lang === "hi" ? "सामयिक फसल सलाह" : (lang === "te" ? "కాలానుగుణ పంట సలహా" : "Seasonal Advisory")}
            </p>
            <p style={{ fontSize: "12px", color: "#616161", lineHeight: 1.5, marginTop: "4px" }}>
              {seasonal_advisory}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
