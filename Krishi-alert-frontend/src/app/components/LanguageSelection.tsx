import { useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { Search, ChevronRight } from "lucide-react";

const languages = [
  { code: "hi", name: "हिंदी", label: "Hindi", native: "हिंदी" },
  { code: "en", name: "English", label: "English", native: "English" },
  { code: "mr", name: "मराठी", label: "Marathi", native: "मराठी" },
  { code: "gu", name: "ગુજરાતી", label: "Gujarati", native: "ગુજરાતી" },
  { code: "pa", name: "ਪੰਜਾਬੀ", label: "Punjabi", native: "ਪੰਜਾਬੀ" },
  { code: "bn", name: "বাংলা", label: "Bengali", native: "বাংলা" },
  { code: "ta", name: "தமிழ்", label: "Tamil", native: "தமிழ்" },
  { code: "te", name: "తెలుగు", label: "Telugu", native: "తెలుగు" },
  { code: "kn", name: "ಕನ್ನಡ", label: "Kannada", native: "ಕನ್ನಡ" },
  { code: "ml", name: "മലയാളം", label: "Malayalam", native: "മലയാളം" },
  { code: "or", name: "ଓଡ଼ିଆ", label: "Odia", native: "ଓଡ଼ିଆ" },
  { code: "as", name: "অসমীয়া", label: "Assamese", native: "অসমীয়া" },
];

export function LanguageSelection() {
  const [selected, setSelected] = useState("hi");
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const filtered = languages.filter(
    (l) =>
      l.label.toLowerCase().includes(search.toLowerCase()) ||
      l.native.includes(search)
  );

  return (
    <div
      className="h-full flex flex-col"
      style={{ background: "#F8FAF5", fontFamily: "Inter, sans-serif" }}
    >
      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="pt-6 px-6 pb-4"
      >
        <div
          className="w-10 h-10 rounded-2xl flex items-center justify-center mb-5"
          style={{ background: "#E8F5E9" }}
        >
          <span style={{ fontSize: "20px" }}>🌐</span>
        </div>
        <h1
          style={{
            fontFamily: "Poppins, sans-serif",
            fontSize: "24px",
            fontWeight: 700,
            color: "#212121",
            marginBottom: "6px",
          }}
        >
          Choose Language
        </h1>
        <p style={{ fontSize: "14px", color: "#616161" }}>
          अपनी भाषा चुनें • Select your preferred language
        </p>
      </motion.div>

      {/* Search */}
      <div className="px-6 mb-4">
        <div
          className="flex items-center gap-3 px-4 rounded-2xl"
          style={{ background: "white", border: "1.5px solid #E8F5E9", height: "48px", boxShadow: "0 2px 8px rgba(46,125,50,0.08)" }}
        >
          <Search size={18} color="#43A047" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search language..."
            style={{
              border: "none",
              outline: "none",
              background: "transparent",
              fontSize: "15px",
              color: "#212121",
              fontFamily: "Inter, sans-serif",
              flex: 1,
            }}
          />
        </div>
      </div>

      {/* Language grid */}
      <div className="flex-1 overflow-y-auto px-6">
        <div className="grid grid-cols-2 gap-3 pb-4">
          {filtered.map((lang, i) => {
            const isSelected = selected === lang.code;
            return (
              <motion.button
                key={lang.code}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => setSelected(lang.code)}
                className="flex flex-col items-start p-4 rounded-2xl text-left transition-all"
                style={{
                  background: isSelected ? "#2E7D32" : "white",
                  border: `2px solid ${isSelected ? "#2E7D32" : "#E8F5E9"}`,
                  boxShadow: isSelected
                    ? "0 8px 20px rgba(46,125,50,0.25)"
                    : "0 2px 8px rgba(0,0,0,0.06)",
                  transform: isSelected ? "scale(1.02)" : "scale(1)",
                }}
              >
                <span
                  style={{
                    fontFamily: "Poppins, sans-serif",
                    fontSize: "20px",
                    fontWeight: 600,
                    color: isSelected ? "white" : "#212121",
                    lineHeight: 1.3,
                  }}
                >
                  {lang.native}
                </span>
                <span
                  style={{
                    fontSize: "12px",
                    color: isSelected ? "rgba(255,255,255,0.8)" : "#616161",
                    marginTop: "2px",
                  }}
                >
                  {lang.label}
                </span>
                {isSelected && (
                  <div
                    className="mt-2 w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ background: "rgba(255,255,255,0.25)" }}
                  >
                    <span style={{ fontSize: "11px", color: "white" }}>✓</span>
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Continue button */}
      <div className="px-6 py-5">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate("/onboarding")}
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
          }}
        >
          Continue
          <ChevronRight size={20} />
        </motion.button>
      </div>
    </div>
  );
}
