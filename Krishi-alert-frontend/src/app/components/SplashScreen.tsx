import { useEffect } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";

function PlantAIIcon() {
  return (
    <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
      {/* Soil base */}
      <ellipse cx="36" cy="58" rx="20" ry="5" fill="rgba(255,255,255,0.2)" />

      {/* Main stem */}
      <path d="M36 58 Q36 40 36 22" stroke="rgba(255,255,255,0.9)" strokeWidth="3" strokeLinecap="round" />

      {/* Left leaf */}
      <path d="M36 40 Q22 32 18 20 Q30 22 36 38" fill="rgba(255,255,255,0.7)" />

      {/* Right leaf */}
      <path d="M36 34 Q50 26 54 14 Q42 16 36 32" fill="rgba(255,255,255,0.85)" />

      {/* Top bud */}
      <circle cx="36" cy="18" r="6" fill="rgba(255,255,255,0.95)" />
      <path d="M36 18 Q36 13 36 10" stroke="rgba(255,255,255,0.6)" strokeWidth="2" strokeLinecap="round" />

      {/* AI circuit dots */}
      <circle cx="20" cy="18" r="2.5" fill="rgba(255,255,255,0.5)" />
      <circle cx="52" cy="22" r="2.5" fill="rgba(255,255,255,0.5)" />
      <circle cx="16" cy="32" r="2" fill="rgba(255,255,255,0.4)" />
      <circle cx="56" cy="36" r="2" fill="rgba(255,255,255,0.4)" />

      {/* Circuit lines */}
      <path d="M20 18 L26 26" stroke="rgba(255,255,255,0.3)" strokeWidth="1" strokeDasharray="2 2" />
      <path d="M52 22 L46 30" stroke="rgba(255,255,255,0.3)" strokeWidth="1" strokeDasharray="2 2" />
    </svg>
  );
}

export function SplashScreen() {
  const navigate = useNavigate();

  useEffect(() => {
    const t = setTimeout(() => navigate("/language"), 2800);
    return () => clearTimeout(t);
  }, [navigate]);

  return (
    <div
      className="h-full flex flex-col items-center justify-center relative overflow-hidden"
      style={{
        background: "linear-gradient(160deg, #1B5E20 0%, #2E7D32 55%, #388E3C 100%)",
      }}
    >
      {/* Decorative circles */}
      <div
        className="absolute rounded-full opacity-10"
        style={{ width: "320px", height: "320px", background: "white", top: "-80px", right: "-80px" }}
      />
      <div
        className="absolute rounded-full opacity-10"
        style={{ width: "200px", height: "200px", background: "white", bottom: "-40px", left: "-40px" }}
      />

      {/* Logo */}
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.7, ease: [0.34, 1.56, 0.64, 1] }}
        className="mb-8"
      >
        <div
          className="flex items-center justify-center"
          style={{
            width: "120px",
            height: "120px",
            borderRadius: "32px",
            background: "rgba(255,255,255,0.15)",
            backdropFilter: "blur(12px)",
            border: "1.5px solid rgba(255,255,255,0.35)",
            boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
          }}
        >
          <PlantAIIcon />
        </div>
      </motion.div>

      {/* Title */}
      <motion.div
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.45, duration: 0.6 }}
        className="text-center px-8"
      >
        <h1
          style={{
            fontFamily: "Poppins, sans-serif",
            fontSize: "34px",
            fontWeight: 700,
            color: "white",
            letterSpacing: "-0.5px",
            marginBottom: "10px",
            lineHeight: 1.2,
          }}
        >
          Krishi Bandhu
        </h1>
        <div
          style={{
            width: "48px",
            height: "3px",
            borderRadius: "2px",
            background: "rgba(255,255,255,0.5)",
            margin: "0 auto 14px",
          }}
        />
        <p
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: "16px",
            color: "rgba(255,255,255,0.85)",
            fontWeight: 400,
          }}
        >
          Helping Every Farmer Grow
        </p>
      </motion.div>

      {/* Gov branding */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9, duration: 0.5 }}
        className="absolute bottom-24 flex flex-col items-center gap-1"
      >
        <div className="flex items-center gap-2 px-4 py-2 rounded-full" style={{ background: "rgba(255,255,255,0.12)" }}>
          <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.7)", fontFamily: "Inter, sans-serif" }}>
            Ministry of Agriculture • Government of India
          </span>
        </div>
      </motion.div>

      {/* Loading dots */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.1 }}
        className="absolute bottom-10 flex gap-2"
      >
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }}
            transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.25 }}
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: "rgba(255,255,255,0.8)",
            }}
          />
        ))}
      </motion.div>
    </div>
  );
}
