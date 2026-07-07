import { useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { X, Zap, ZapOff, Image, RotateCcw, Info } from "lucide-react";

export function CameraScreen() {
  const [flash, setFlash] = useState(false);
  const [captured, setCaptured] = useState(false);
  const navigate = useNavigate();

  const handleCapture = () => {
    setCaptured(true);
    
    // Generate a mock JPEG blob dynamically of a leaf with spot details
    const canvas = document.createElement("canvas");
    canvas.width = 400;
    canvas.height = 400;
    const ctx = canvas.getContext("2d");
    
    if (ctx) {
      // Background gradient
      const grad = ctx.createLinearGradient(0, 0, 400, 400);
      grad.addColorStop(0, "#1A251C");
      grad.addColorStop(1, "#0A0F0B");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 400, 400);
      
      // Draw leaf stem
      ctx.strokeStyle = "#33691E";
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(200, 380);
      ctx.quadraticCurveTo(200, 280, 200, 100);
      ctx.stroke();

      // Draw leaf shape
      ctx.fillStyle = "#2E7D32";
      ctx.beginPath();
      ctx.ellipse(200, 220, 90, 130, -Math.PI / 12, 0, Math.PI * 2);
      ctx.fill();

      // Draw a lighter green layer
      ctx.fillStyle = "#43A047";
      ctx.beginPath();
      ctx.ellipse(210, 210, 70, 110, Math.PI / 15, 0, Math.PI * 2);
      ctx.fill();

      // Draw brown leaf spot damage representing leaf blast / spot disease
      ctx.fillStyle = "#795548";
      ctx.strokeStyle = "#5D4037";
      ctx.lineWidth = 2;
      
      // Spot 1
      ctx.beginPath();
      ctx.ellipse(170, 180, 14, 22, -Math.PI / 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      
      // Spot 2
      ctx.beginPath();
      ctx.ellipse(230, 240, 10, 16, Math.PI / 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Spot 3
      ctx.beginPath();
      ctx.arc(190, 260, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      
      // Spot centers (grey rot)
      ctx.fillStyle = "#9E9E9E";
      ctx.beginPath();
      ctx.arc(170, 180, 5, 0, Math.PI * 2);
      ctx.arc(230, 240, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    
    canvas.toBlob((blob) => {
      setTimeout(() => {
        navigate("/processing", { state: { imageBlob: blob } });
      }, 500);
    }, "image/jpeg", 0.85);
  };

  const handleGalleryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      navigate("/processing", { state: { imageBlob: file } });
    }
  };

  return (
    <div className="h-full flex flex-col" style={{ background: "#000", fontFamily: "Inter, sans-serif" }}>
      {/* Camera viewfinder */}
      <div className="flex-1 relative overflow-hidden">
        {/* Simulated camera background */}
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(160deg, #1a2a1a 0%, #0d1a0d 40%, #1a2820 100%)",
          }}
        />

        {/* Simulated crop in frame */}
        <div className="absolute inset-0 flex items-center justify-center">
          <svg width="220" height="220" viewBox="0 0 220 220" style={{ opacity: 0.5 }}>
            <ellipse cx="110" cy="130" rx="50" ry="70" fill="#2E7D32" transform="rotate(-15 110 130)" />
            <ellipse cx="140" cy="100" rx="40" ry="60" fill="#43A047" transform="rotate(20 140 100)" />
            <ellipse cx="80" cy="110" rx="35" ry="55" fill="#388E3C" transform="rotate(-30 80 110)" />
            <path d="M110 180 Q110 170 110 130" stroke="#33691E" strokeWidth="4" fill="none" />
            <path d="M140 160 Q130 150 110 130" stroke="#33691E" strokeWidth="3" fill="none" />
            <circle cx="95" cy="115" r="8" fill="#8B4513" opacity="0.7" />
            <circle cx="120" cy="100" r="6" fill="#8B4513" opacity="0.6" />
            <circle cx="105" cy="135" r="5" fill="#A0522D" opacity="0.5" />
          </svg>
        </div>

        {/* Overlay vignette */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,0.65) 100%)",
          }}
        />

        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-5 py-4 z-20">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate("/app")}
            className="flex items-center justify-center rounded-full"
            style={{ width: "40px", height: "40px", background: "rgba(0,0,0,0.5)", border: "none", cursor: "pointer" }}
          >
            <X size={20} color="white" />
          </motion.button>
          <div
            className="px-3 py-1 rounded-full"
            style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.2)" }}
          >
            <span style={{ fontSize: "12px", color: "white", fontWeight: 500 }}>
              📸 Crop Scanner
            </span>
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setFlash(!flash)}
            className="flex items-center justify-center rounded-full"
            style={{ width: "40px", height: "40px", background: "rgba(0,0,0,0.5)", border: "none", cursor: "pointer" }}
          >
            {flash ? (
              <Zap size={20} color="#FFD700" fill="#FFD700" />
            ) : (
              <ZapOff size={20} color="rgba(255,255,255,0.7)" />
            )}
          </motion.button>
        </div>

        {/* Scanning frame corners */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative" style={{ width: "220px", height: "220px" }}>
            {/* Animated scan line */}
            <motion.div
              animate={{ top: ["0%", "100%", "0%"] }}
              transition={{ repeat: Infinity, duration: 2.5, ease: "linear" }}
              className="absolute left-0 right-0"
              style={{
                height: "2px",
                background: "linear-gradient(90deg, transparent, #43A047, transparent)",
                boxShadow: "0 0 8px rgba(67,160,71,0.8)",
              }}
            />

            {/* Corner markers */}
            {[
              { top: 0, left: 0, rotate: "0deg" },
              { top: 0, right: 0, rotate: "90deg" },
              { bottom: 0, right: 0, rotate: "180deg" },
              { bottom: 0, left: 0, rotate: "270deg" },
            ].map((pos, i) => (
              <div
                key={i}
                className="absolute"
                style={{
                  ...pos,
                  width: "28px",
                  height: "28px",
                  borderTop: "3px solid #43A047",
                  borderLeft: "3px solid #43A047",
                  borderRadius: "4px 0 0 0",
                  transform: `rotate(${pos.rotate})`,
                  boxShadow: "0 0 10px rgba(67,160,71,0.4)",
                }}
              />
            ))}
          </div>
        </div>

        {/* Tips */}
        <div className="absolute bottom-6 left-5 right-5 z-10">
          <div
            className="rounded-2xl px-4 py-3 flex items-start gap-3"
            style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.1)" }}
          >
            <Info size={16} color="#43A047" style={{ flexShrink: 0, marginTop: "1px" }} />
            <div>
              <p style={{ fontSize: "12px", fontWeight: 600, color: "white", marginBottom: "2px" }}>
                Photo Tips for Best Results
              </p>
              <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.7)", lineHeight: 1.4 }}>
                • Keep crop 20-30cm away • Natural light is best
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom controls */}
      <div
        className="flex items-center justify-between px-8 py-6"
        style={{ background: "#0d0d0d" }}
      >
        {/* Gallery */}
        <label
          className="flex flex-col items-center gap-1 cursor-pointer"
        >
          <input
            type="file"
            accept="image/*"
            onChange={handleGalleryUpload}
            style={{ display: "none" }}
          />
          <div
            className="rounded-2xl flex items-center justify-center"
            style={{ width: "52px", height: "52px", background: "#1a1a1a", border: "2px solid #333" }}
          >
            <Image size={22} color="white" />
          </div>
          <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.6)" }}>Gallery</span>
        </label>

        {/* Capture */}
        <motion.button
          whileTap={{ scale: 0.93 }}
          onClick={handleCapture}
          className="flex items-center justify-center rounded-full"
          style={{
            width: "76px",
            height: "76px",
            background: "white",
            border: "4px solid #43A047",
            boxShadow: captured
              ? "0 0 0 8px rgba(67,160,71,0.3)"
              : "0 6px 24px rgba(0,0,0,0.5)",
            transition: "all 0.2s",
            cursor: "pointer"
          }}
        >
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "50%",
              background: captured ? "#43A047" : "white",
              transition: "all 0.2s",
            }}
          />
        </motion.button>

        {/* Flip */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          className="flex flex-col items-center gap-1"
          style={{ background: "transparent", border: "none" }}
        >
          <div
            className="rounded-2xl flex items-center justify-center"
            style={{ width: "52px", height: "52px", background: "#1a1a1a", border: "2px solid #333" }}
          >
            <RotateCcw size={22} color="white" />
          </div>
          <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.6)" }}>Flip</span>
        </motion.button>
      </div>
    </div>
  );
}
