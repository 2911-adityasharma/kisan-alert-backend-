import { useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import {
  ChevronRight, Globe, Mic, WifiOff, HelpCircle,
  Settings, LogOut, Edit2, Star, Shield, Bell
} from "lucide-react";
import { getSessionFarmer, clearSession, setSessionLanguage } from "../services/api";

type MenuItem = {
  icon: React.ReactNode;
  label: string;
  labelHi: string;
  desc?: string;
  color: string;
  action?: () => void;
  toggle?: boolean;
  value?: string;
  badge?: string;
};

export function Profile() {
  const navigate = useNavigate();
  const [offlineMode, setOfflineMode] = useState(false);
  const [voiceAssist, setVoiceAssist] = useState(true);
  const [notifications, setNotifications] = useState(true);

  const farmer = getSessionFarmer() || {
    name: "Demo Guest",
    phone: "919876543210",
    village_id: "village_anantapur",
    language: "en"
  };

  const lang = farmer.language;

  const profileSections: { title: string; items: MenuItem[] }[] = [
    {
      title: "My Farm",
      items: [
        {
          icon: <span style={{ fontSize: "18px" }}>🌾</span>,
          label: "My Crops",
          labelHi: "मेरी फसलें",
          desc: farmer.village_id === "village_warangal" ? "Rice" : 
                farmer.village_id === "village_sehore" ? "Soybean" : "Groundnut",
          color: "#2E7D32",
          value: "1 crop",
        },
        {
          icon: <span style={{ fontSize: "18px" }}>📍</span>,
          label: "Farm Location",
          labelHi: "खेत का स्थान",
          desc: farmer.village_id === "village_anantapur" ? "Anantapur, AP" : 
                farmer.village_id === "village_warangal" ? "Warangal, Telangana" : "Sehore, MP",
          color: "#1976D2",
          value: "2.5 acres",
        },
        {
          icon: <span style={{ fontSize: "18px" }}>📊</span>,
          label: "Scan History",
          labelHi: "स्कैन इतिहास",
          desc: "Last scan: Today",
          color: "#6A1B9A",
          value: "1 scan",
        },
      ],
    },
    {
      title: "Settings",
      items: [
        {
          icon: <Globe size={20} color="#1976D2" />,
          label: "Language",
          labelHi: "भाषा",
          desc: `Currently: ${lang === "te" ? "తెలుగు" : (lang === "hi" ? "हिंदी" : "English")}`,
          color: "#1976D2",
          action: () => {
            const nextLang = lang === "te" ? "hi" : (lang === "hi" ? "en" : "te");
            setSessionLanguage(nextLang);
            window.location.reload();
          }
        },
        {
          icon: <Mic size={20} color="#2E7D32" />,
          label: "Voice Assistant",
          labelHi: "वॉयस असिस्टेंट",
          color: "#2E7D32",
          toggle: true,
        },
        {
          icon: <Bell size={20} color="#FB8C00" />,
          label: "Notifications",
          labelHi: "सूचनाएं",
          color: "#FB8C00",
          toggle: true,
        },
        {
          icon: <WifiOff size={20} color="#616161" />,
          label: "Offline Mode",
          labelHi: "ऑफलाइन मोड",
          desc: "Works without internet",
          color: "#616161",
          toggle: true,
        },
      ],
    },
    {
      title: "Support",
      items: [
        {
          icon: <HelpCircle size={20} color="#1976D2" />,
          label: "Help & FAQ",
          labelHi: "मदद और सवाल",
          color: "#1976D2",
          badge: "New",
        },
        {
          icon: <Shield size={20} color="#2E7D32" />,
          label: "Privacy Policy",
          labelHi: "गोपनीयता नीति",
          color: "#2E7D32",
        },
        {
          icon: <Settings size={20} color="#616161" />,
          label: "App Settings",
          labelHi: "ऐप सेटिंग्स",
          color: "#616161",
        },
      ],
    },
  ];

  const getToggleValue = (label: string) => {
    if (label === "Voice Assistant") return voiceAssist;
    if (label === "Offline Mode") return offlineMode;
    if (label === "Notifications") return notifications;
    return false;
  };

  const handleToggle = (label: string) => {
    if (label === "Voice Assistant") setVoiceAssist((v) => !v);
    if (label === "Offline Mode") setOfflineMode((v) => !v);
    if (label === "Notifications") setNotifications((v) => !v);
  };

  const handleLogout = () => {
    clearSession();
    navigate("/");
  };

  return (
    <div
      className="h-full overflow-y-auto"
      style={{ background: "#F8FAF5", fontFamily: "Inter, sans-serif" }}
    >
      {/* Profile header */}
      <div
        className="relative px-5 pt-5 pb-8"
        style={{
          background: "linear-gradient(145deg, #1B5E20 0%, #2E7D32 100%)",
          borderBottomLeftRadius: "32px",
          borderBottomRightRadius: "32px",
        }}
      >
        {/* Decorative */}
        <div
          className="absolute top-0 right-0 rounded-full opacity-10"
          style={{ width: "160px", height: "160px", background: "white", top: "-40px", right: "-40px" }}
        />

        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="relative">
              <div
                className="flex items-center justify-center rounded-3xl"
                style={{
                  width: "72px",
                  height: "72px",
                  background: "rgba(255,255,255,0.2)",
                  fontSize: "32px",
                  border: "2px solid rgba(255,255,255,0.3)",
                }}
              >
                👨‍🌾
              </div>
              <div
                className="absolute flex items-center justify-center rounded-full"
                style={{
                  width: "22px",
                  height: "22px",
                  background: "#4CAF50",
                  bottom: "-4px",
                  right: "-4px",
                  border: "2px solid #2E7D32",
                }}
              >
                <span style={{ fontSize: "10px", color: "white" }}>✓</span>
              </div>
            </div>
            <div>
              <h1
                style={{
                  fontFamily: "Poppins, sans-serif",
                  fontSize: "20px",
                  fontWeight: 700,
                  color: "white",
                  lineHeight: 1.2,
                }}
              >
                {farmer.name}
              </h1>
              <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.8)" }}>+91 {farmer.phone}</p>
              <div
                className="flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full"
                style={{ background: "rgba(255,255,255,0.15)", width: "fit-content" }}
              >
                <Star size={10} color="#FFD700" fill="#FFD700" />
                <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.9)", fontWeight: 600 }}>
                  Verified Farmer
                </span>
              </div>
            </div>
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            className="flex items-center justify-center rounded-2xl"
            style={{ width: "44px", height: "44px", background: "rgba(255,255,255,0.15)", border: "none" }}
          >
            <Edit2 size={16} color="white" />
          </motion.button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { val: "2.5", unit: "Acres", label: "Farm Size", icon: "🌾" },
            { val: "1", unit: "Scan", label: "This Month", icon: "📸" },
            { val: "98%", unit: "Health", label: "Crop Score", icon: "💚" },
          ].map((s, i) => (
            <div
              key={i}
              className="rounded-2xl p-3 text-center"
              style={{ background: "rgba(255,255,255,0.12)" }}
            >
              <div style={{ fontSize: "18px", marginBottom: "2px" }}>{s.icon}</div>
              <div
                style={{
                  fontFamily: "Poppins, sans-serif",
                  fontSize: "16px",
                  fontWeight: 700,
                  color: "white",
                }}
              >
                {s.val}
              </div>
              <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.6)" }}>{s.unit}</div>
              <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.7)" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Menu sections */}
      <div className="px-5 pt-5 pb-4">
        {profileSections.map((section, si) => (
          <div key={si} className="mb-5">
            <p
              style={{
                fontSize: "12px",
                fontWeight: 700,
                color: "#9E9E9E",
                letterSpacing: "0.8px",
                textTransform: "uppercase",
                marginBottom: "10px",
              }}
            >
              {section.title}
            </p>
            <div
              className="rounded-3xl overflow-hidden"
              style={{ background: "white", boxShadow: "0 4px 16px rgba(0,0,0,0.06)", border: "1px solid #F1F8E9" }}
            >
              {section.items.map((item, ii) => (
                <motion.button
                  key={ii}
                  whileTap={{ scale: 0.99 }}
                  onClick={item.action}
                  className="w-full flex items-center gap-3 px-4 py-4"
                  style={{
                    background: "transparent",
                    border: "none",
                    borderBottom: ii < section.items.length - 1 ? "1px solid #F8FAF5" : "none",
                    textAlign: "left",
                    cursor: item.action ? "pointer" : "default"
                  }}
                >
                  <div
                    className="rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ width: "40px", height: "40px", background: `${item.color}12` }}
                  >
                    {item.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p style={{ fontSize: "14px", fontWeight: 600, color: "#212121" }}>
                        {lang === "te" ? (item.labelHi || item.label) : (lang === "hi" ? item.labelHi : item.label)}
                      </p>
                      {item.badge && (
                        <span
                          className="px-1.5 py-0.5 rounded-full"
                          style={{
                            background: "#E8F5E9",
                            color: "#2E7D32",
                            fontSize: "9px",
                            fontWeight: 700,
                          }}
                        >
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: "11px", color: "#9E9E9E" }}>
                      {item.desc || item.labelHi}
                    </p>
                  </div>
                  {item.toggle ? (
                    <div
                      onClick={(e) => { e.stopPropagation(); handleToggle(item.label); }}
                      className="relative rounded-full transition-all"
                      style={{
                        width: "44px",
                        height: "24px",
                        background: getToggleValue(item.label) ? "#2E7D32" : "#E0E0E0",
                        flexShrink: 0,
                        cursor: "pointer",
                      }}
                    >
                      <motion.div
                        animate={{ x: getToggleValue(item.label) ? "22px" : "2px" }}
                        transition={{ duration: 0.2 }}
                        style={{
                          position: "absolute",
                          top: "2px",
                          width: "20px",
                          height: "20px",
                          background: "white",
                          borderRadius: "50%",
                          boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                        }}
                      />
                    </div>
                  ) : item.value ? (
                    <div className="flex items-center gap-2">
                      <span
                        className="px-2 py-1 rounded-full"
                        style={{ background: `${item.color}12`, color: item.color, fontSize: "11px", fontWeight: 600 }}
                      >
                        {item.value}
                      </span>
                      <ChevronRight size={16} color="#BDBDBD" />
                    </div>
                  ) : (
                    <ChevronRight size={16} color="#BDBDBD" />
                  )}
                </motion.button>
              ))}
            </div>
          </div>
        ))}

        {/* Logout */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 rounded-2xl mb-4"
          style={{
            height: "52px",
            background: "#FFEBEE",
            border: "1.5px solid #FFCDD2",
            color: "#D32F2F",
            fontFamily: "Poppins, sans-serif",
            fontSize: "14px",
            fontWeight: 600,
            cursor: "pointer"
          }}
        >
          <LogOut size={18} />
          Logout / बाहर निकलें
        </motion.button>

        <p style={{ fontSize: "11px", color: "#BDBDBD", textAlign: "center", paddingBottom: "8px" }}>
          Krishi Bandhu v2.1.0 • Made in India 🇮🇳
        </p>
      </div>
    </div>
  );
}
