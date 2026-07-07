import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Bell, Filter } from "lucide-react";

const categories = ["All", "Weather", "Disease", "Scheme", "Market", "Pest"];

type Alert = {
  id: number;
  type: "weather" | "disease" | "scheme" | "market" | "pest";
  title: string;
  titleHi: string;
  desc: string;
  descHi: string;
  icon: string;
  color: string;
  bg: string;
  badge: string;
  time: string;
  important?: boolean;
};

const alerts: Alert[] = [
  {
    id: 1,
    type: "weather",
    title: "Heavy Rainfall Warning",
    titleHi: "भारी वर्षा चेतावनी",
    desc: "IMD predicts heavy to very heavy rainfall in Maharashtra for next 72 hours.",
    descHi: "महाराष्ट्र में अगले 72 घंटों में भारी बारिश की संभावना।",
    icon: "🌧️",
    color: "#1565C0",
    bg: "#E3F2FD",
    badge: "Weather",
    time: "2h ago",
    important: true,
  },
  {
    id: 2,
    type: "disease",
    title: "Paddy Blast Outbreak Alert",
    titleHi: "धान झुलसा रोग प्रकोप",
    desc: "Leaf blast disease detected in 5 districts. Spray Tricyclazole immediately.",
    descHi: "5 जिलों में पत्ती झुलसा रोग पाया गया है। तुरंत ट्राइसाइक्लाजोल छिड़कें।",
    icon: "🦠",
    color: "#C62828",
    bg: "#FFEBEE",
    badge: "Disease",
    time: "5h ago",
    important: true,
  },
  {
    id: 3,
    type: "scheme",
    title: "PM-KISAN 18th Installment",
    titleHi: "PM-KISAN 18वीं किश्त",
    desc: "₹2,000 installment released. Check your bank account. Deadline for new registration: Aug 15.",
    descHi: "₹2,000 की किश्त जारी। बैंक खाता जाँचें। नया पंजीकरण 15 अगस्त तक।",
    icon: "💰",
    color: "#2E7D32",
    bg: "#E8F5E9",
    badge: "Scheme",
    time: "1d ago",
  },
  {
    id: 4,
    type: "pest",
    title: "Fall Armyworm Warning",
    titleHi: "फॉल आर्मीवर्म चेतावनी",
    desc: "Fall armyworm spotted in maize crops. Use Spinetoram 11.7 SC @ 0.5 ml/L.",
    descHi: "मक्के की फसल में फॉल आर्मीवर्म पाया गया। स्पिनेटोरम का उपयोग करें।",
    icon: "🐛",
    color: "#E65100",
    bg: "#FFF3E0",
    badge: "Pest",
    time: "1d ago",
  },
  {
    id: 5,
    type: "market",
    title: "Soybean MSP Increased",
    titleHi: "सोयाबीन MSP में वृद्धि",
    desc: "Government increases MSP for Soybean to ₹4,892/quintal for Kharif 2026.",
    descHi: "खरीफ 2026 के लिए सोयाबीन MSP ₹4,892/क्विंटल तय किया गया।",
    icon: "📈",
    color: "#1565C0",
    bg: "#E3F2FD",
    badge: "Market",
    time: "2d ago",
  },
  {
    id: 6,
    type: "scheme",
    title: "Pradhan Mantri Fasal Bima",
    titleHi: "प्रधानमंत्री फसल बीमा योजना",
    desc: "Last date for Kharif crop insurance enrollment: July 31. Apply at nearest CSC.",
    descHi: "खरीफ फसल बीमा की अंतिम तिथि: 31 जुलाई। नजदीकी CSC पर जाएं।",
    icon: "🏛️",
    color: "#6A1B9A",
    bg: "#F3E5F5",
    badge: "Scheme",
    time: "3d ago",
  },
];

export function GovernmentAlerts() {
  const [active, setActive] = useState("All");

  const filtered =
    active === "All"
      ? alerts
      : alerts.filter(
          (a) => a.type.toLowerCase() === active.toLowerCase() || a.badge === active
        );

  return (
    <div
      className="h-full flex flex-col"
      style={{ background: "#F8FAF5", fontFamily: "Inter, sans-serif" }}
    >
      {/* Header */}
      <div
        className="px-5 pt-5 pb-5"
        style={{
          background: "linear-gradient(145deg, #1B5E20 0%, #2E7D32 100%)",
          borderBottomLeftRadius: "24px",
          borderBottomRightRadius: "24px",
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div
              className="rounded-2xl flex items-center justify-center"
              style={{ width: "40px", height: "40px", background: "rgba(255,255,255,0.15)" }}
            >
              <Bell size={20} color="white" />
            </div>
            <div>
              <h1
                style={{
                  fontFamily: "Poppins, sans-serif",
                  fontSize: "18px",
                  fontWeight: 700,
                  color: "white",
                  lineHeight: 1.2,
                }}
              >
                Government Alerts
              </h1>
              <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.75)" }}>
                सरकारी सूचनाएं
              </p>
            </div>
          </div>
          <div
            className="flex items-center gap-1 px-3 py-1 rounded-full"
            style={{ background: "rgba(255,255,255,0.15)" }}
          >
            <Filter size={12} color="rgba(255,255,255,0.8)" />
            <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.8)" }}>Filter</span>
          </div>
        </div>

        <div
          className="mt-3 px-3 py-2 rounded-2xl flex items-center gap-2"
          style={{ background: "rgba(255,255,255,0.12)" }}
        >
          <span style={{ fontSize: "14px" }}>🔔</span>
          <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.9)" }}>
            {alerts.filter((a) => a.important).length} urgent alerts require attention
          </span>
        </div>
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 px-4 py-3 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActive(cat)}
            className="flex-shrink-0 px-4 py-2 rounded-full"
            style={{
              background: active === cat ? "#2E7D32" : "white",
              color: active === cat ? "white" : "#616161",
              border: active === cat ? "none" : "1.5px solid #E8F5E9",
              fontSize: "12px",
              fontWeight: active === cat ? 600 : 400,
              boxShadow: active === cat ? "0 4px 12px rgba(46,125,50,0.3)" : "none",
              transition: "all 0.2s",
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Alerts list */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <AnimatePresence mode="popLayout">
          {filtered.map((alert, i) => (
            <motion.div
              key={alert.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ delay: i * 0.05, duration: 0.25 }}
              className="rounded-3xl p-4 mb-3"
              style={{
                background: "white",
                border: `1.5px solid ${alert.color}20`,
                boxShadow: alert.important
                  ? `0 4px 16px ${alert.color}18`
                  : "0 2px 8px rgba(0,0,0,0.06)",
              }}
            >
              <div className="flex items-start gap-3">
                <div
                  className="rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ width: "48px", height: "48px", background: alert.bg, fontSize: "22px" }}
                >
                  {alert.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div>
                      {alert.important && (
                        <span
                          className="inline-block px-2 py-0.5 rounded-full mb-1"
                          style={{
                            background: `${alert.color}18`,
                            color: alert.color,
                            fontSize: "9px",
                            fontWeight: 700,
                            letterSpacing: "0.5px",
                          }}
                        >
                          URGENT
                        </span>
                      )}
                      <p
                        style={{
                          fontFamily: "Poppins, sans-serif",
                          fontSize: "13px",
                          fontWeight: 700,
                          color: "#212121",
                          lineHeight: 1.3,
                          display: "block",
                        }}
                      >
                        {alert.title}
                      </p>
                      <p style={{ fontSize: "11px", color: "#9E9E9E", marginTop: "1px" }}>
                        {alert.titleHi}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span
                        className="px-2 py-1 rounded-full"
                        style={{
                          background: alert.bg,
                          color: alert.color,
                          fontSize: "9px",
                          fontWeight: 700,
                        }}
                      >
                        {alert.badge}
                      </span>
                      <span style={{ fontSize: "10px", color: "#BDBDBD" }}>{alert.time}</span>
                    </div>
                  </div>

                  <p style={{ fontSize: "12px", color: "#616161", lineHeight: 1.5, marginBottom: "4px" }}>
                    {alert.desc}
                  </p>
                  <p style={{ fontSize: "11px", color: "#9E9E9E", lineHeight: 1.4 }}>
                    {alert.descHi}
                  </p>

                  <button
                    style={{
                      marginTop: "8px",
                      background: "transparent",
                      border: "none",
                      padding: 0,
                      fontSize: "12px",
                      fontWeight: 600,
                      color: alert.color,
                    }}
                  >
                    Read More →
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16">
            <span style={{ fontSize: "48px", marginBottom: "12px" }}>📭</span>
            <p style={{ fontFamily: "Poppins, sans-serif", fontSize: "16px", fontWeight: 600, color: "#9E9E9E" }}>
              No alerts in this category
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
