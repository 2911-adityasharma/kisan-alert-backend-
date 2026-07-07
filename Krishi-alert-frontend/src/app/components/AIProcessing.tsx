import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { motion } from "motion/react";
import { AlertCircle, ChevronLeft, Loader2 } from "lucide-react";
import { uploadAndScanCrop } from "../services/api";

const steps = [
  { label: "Analyzing crop image...", labelHi: "फसल की फोटो विश्लेषण हो रही है...", icon: "🔍", duration: 1000 },
  { label: "Detecting disease patterns...", labelHi: "रोग के लक्षण पहचाने जा रहे हैं...", icon: "🦠", duration: 800 },
  { label: "Checking pest damage...", labelHi: "कीटों की जाँच हो रही है...", icon: "🐛", duration: 800 },
  { label: "Nutrient deficiency check...", labelHi: "पोषण की कमी की जाँच...", icon: "🌿", duration: 800 },
  { label: "Generating recommendations...", labelHi: "सुझाव तैयार किए जा रहे हैं...", icon: "📋", duration: 800 },
];

export function AIProcessing() {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const imageBlob = location.state?.imageBlob;
    if (!imageBlob) {
      setError("No image captured. Please go back and try again.");
      return;
    }

    const phone = localStorage.getItem("phone") || "";
    const language = localStorage.getItem("language") || "te";

    let apiResult: any = null;
    let apiError: any = null;
    let uploadDone = false;

    // Trigger API call in parallel
    const runScan = async () => {
      try {
        const res = await uploadAndScanCrop(imageBlob, phone, language);
        apiResult = res.data;
      } catch (err: any) {
        console.error("Upload error:", err);
        apiError = err.message || "Failed to analyze crop photo.";
      } finally {
        uploadDone = true;
      }
    };
    runScan();

    // Progress animation loop
    let totalElapsed = 0;
    const interval = setInterval(() => {
      totalElapsed += 60;
      
      // Calculate animated progress (goes up to 95% until API finishes)
      const animatedProgress = Math.min((totalElapsed / 4500) * 100, 95);
      
      if (uploadDone) {
        if (apiError) {
          setError(apiError);
          clearInterval(interval);
          return;
        }
        
        // Fast-forward to 100% and navigate
        setProgress(100);
        setCurrentStep(steps.length - 1);
        clearInterval(interval);
        
        setTimeout(() => {
          navigate("/result", { state: { diagnosis: apiResult } });
        }, 400);
        return;
      }

      setProgress(animatedProgress);

      // Transition through steps based on elapsed time
      let elapsed = 0;
      for (let i = 0; i < steps.length; i++) {
        elapsed += steps[i].duration;
        if (totalElapsed < elapsed) {
          setCurrentStep(i);
          break;
        }
      }
    }, 60);

    return () => {
      clearInterval(interval);
    };
  }, [navigate, location.state]);

  if (error) {
    return (
      <div
        className="h-full flex flex-col items-center justify-center p-6 relative overflow-hidden"
        style={{
          background: "linear-gradient(160deg, #0a1628 0%, #0d2137 50%, #0a2010 100%)",
          fontFamily: "Inter, sans-serif",
          color: "white"
        }}
      >
        <AlertCircle size={44} color="#D32F2F" />
        <h2 style={{ fontFamily: "Poppins, sans-serif", fontSize: "20px", fontWeight: 700, margin: "16px 0 8px 0" }}>
          Diagnosis Failed
        </h2>
        <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.7)", textAlign: "center", marginBottom: "24px", lineHeight: 1.5 }}>
          {error}
        </p>
        <button
          onClick={() => navigate("/app/scan")}
          className="flex items-center justify-center gap-2 rounded-2xl"
          style={{
            background: "#2E7D32",
            color: "white",
            height: "48px",
            width: "160px",
            fontFamily: "Poppins, sans-serif",
            fontWeight: 600,
            border: "none",
            cursor: "pointer"
          }}
        >
          <ChevronLeft size={16} />
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div
      className="h-full flex flex-col items-center justify-center relative overflow-hidden"
      style={{
        background: "linear-gradient(160deg, #0a1628 0%, #0d2137 50%, #0a2010 100%)",
        fontFamily: "Inter, sans-serif",
      }}
    >
      {/* Background particles */}
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: `${4 + (i % 3) * 3}px`,
            height: `${4 + (i % 3) * 3}px`,
            background: i % 2 === 0 ? "rgba(67,160,71,0.4)" : "rgba(25,118,210,0.3)",
            left: `${10 + (i * 7.5) % 80}%`,
            top: `${10 + (i * 9) % 80}%`,
          }}
          animate={{ y: [0, -20, 0], opacity: [0.3, 0.8, 0.3] }}
          transition={{ repeat: Infinity, duration: 2 + i * 0.3, delay: i * 0.2 }}
        />
      ))}

      {/* AI Logo */}
      <div className="relative mb-10">
        {[80, 110, 140].map((size, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: `${size}px`,
              height: `${size}px`,
              border: `1.5px solid ${i === 0 ? "rgba(67,160,71,0.6)" : i === 1 ? "rgba(25,118,210,0.4)" : "rgba(67,160,71,0.2)"}`,
              top: "50%",
              left: "50%",
              marginTop: `-${size / 2}px`,
              marginLeft: `-${size / 2}px`,
            }}
            animate={{ rotate: i % 2 === 0 ? 360 : -360, scale: [1, 1.04, 1] }}
            transition={{
              rotate: { repeat: Infinity, duration: 4 + i * 1.5, ease: "linear" },
              scale: { repeat: Infinity, duration: 2, ease: "easeInOut" },
            }}
          />
        ))}

        <motion.div
          animate={{ scale: [1, 1.06, 1] }}
          transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
          className="relative flex items-center justify-center"
          style={{
            width: "72px",
            height: "72px",
            borderRadius: "22px",
            background: "linear-gradient(135deg, #1B5E20 0%, #2E7D32 100%)",
            boxShadow: "0 0 40px rgba(67,160,71,0.5)",
            fontSize: "30px",
          }}
        >
          🤖
        </motion.div>
      </div>

      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h2
          style={{
            fontFamily: "Poppins, sans-serif",
            fontSize: "22px",
            fontWeight: 700,
            color: "white",
            marginBottom: "8px",
          }}
        >
          AI Analyzing...
        </h2>
        <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.6)" }}>
          Please wait while we process your crop photo
        </p>
      </motion.div>

      {/* Step indicator */}
      <motion.div
        key={currentStep}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 px-5 py-3 rounded-2xl mb-8"
        style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}
      >
        <span style={{ fontSize: "20px" }}>{steps[currentStep]?.icon}</span>
        <div>
          <p style={{ fontSize: "13px", color: "white", fontWeight: 500 }}>
            {steps[currentStep]?.label}
          </p>
          <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)", marginTop: "2px" }}>
            {steps[currentStep]?.labelHi}
          </p>
        </div>
      </motion.div>

      {/* Steps list */}
      <div className="w-full px-8 mb-8">
        {steps.map((step, i) => (
          <div key={i} className="flex items-center gap-3 mb-2">
            <div
              className="flex items-center justify-center rounded-full flex-shrink-0"
              style={{
                width: "24px",
                height: "24px",
                background:
                  i < currentStep
                    ? "#4CAF50"
                    : i === currentStep
                    ? "#43A047"
                    : "rgba(255,255,255,0.1)",
                border: i === currentStep ? "2px solid rgba(67,160,71,0.5)" : "none",
                transition: "all 0.3s",
              }}
            >
              {i < currentStep ? (
                <span style={{ fontSize: "11px", color: "white" }}>✓</span>
              ) : i === currentStep ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                  style={{ width: "10px", height: "10px", borderRadius: "50%", borderTop: "2px solid white", borderRight: "2px solid transparent" }}
                />
              ) : (
                <span style={{ fontSize: "10px" }}>{step.icon}</span>
              )}
            </div>
            <span
              style={{
                fontSize: "12px",
                color:
                  i < currentStep
                    ? "#4CAF50"
                    : i === currentStep
                    ? "white"
                    : "rgba(255,255,255,0.35)",
                fontWeight: i === currentStep ? 600 : 400,
                transition: "all 0.3s",
              }}
            >
              {step.label}
            </span>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="w-full px-8">
        <div className="flex justify-between mb-2">
          <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)" }}>Analyzing</span>
          <span style={{ fontSize: "12px", color: "#43A047", fontWeight: 600 }}>
            {Math.round(progress)}%
          </span>
        </div>
        <div
          className="w-full rounded-full overflow-hidden"
          style={{ height: "6px", background: "rgba(255,255,255,0.1)" }}
        >
          <motion.div
            style={{
              height: "100%",
              borderRadius: "3px",
              background: "linear-gradient(90deg, #2E7D32, #43A047, #66BB6A)",
              boxShadow: "0 0 10px rgba(67,160,71,0.6)",
            }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", textAlign: "center", marginTop: "8px" }}>
          AI-powered by Krishi Bandhu Engine v2.0
        </p>
      </div>
    </div>
  );
}
