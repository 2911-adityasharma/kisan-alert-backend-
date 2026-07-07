import { Outlet } from "react-router";
import { Signal, Wifi, BatteryFull } from "lucide-react";

export function Root() {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background:
          "linear-gradient(135deg, #0a3d1a 0%, #1B5E20 40%, #1a4a6e 100%)",
        fontFamily: "Inter, sans-serif",
      }}
    >
      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)`,
          backgroundSize: "32px 32px",
        }}
      />

      <div className="relative" style={{ width: "390px", height: "844px" }}>
        {/* Phone shell */}
        <div
          className="absolute inset-0 rounded-[52px]"
          style={{
            background:
              "linear-gradient(180deg, #2a2a2a 0%, #1a1a1a 50%, #232323 100%)",
            boxShadow:
              "0 60px 120px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1)",
          }}
        />

        {/* Side buttons */}
        <div
          className="absolute rounded-l"
          style={{
            left: "-3px",
            top: "120px",
            width: "3px",
            height: "40px",
            background: "#333",
          }}
        />
        <div
          className="absolute rounded-l"
          style={{
            left: "-3px",
            top: "172px",
            width: "3px",
            height: "60px",
            background: "#333",
          }}
        />
        <div
          className="absolute rounded-l"
          style={{
            left: "-3px",
            top: "244px",
            width: "3px",
            height: "60px",
            background: "#333",
          }}
        />
        <div
          className="absolute rounded-r"
          style={{
            right: "-3px",
            top: "160px",
            width: "3px",
            height: "80px",
            background: "#333",
          }}
        />

        {/* Screen */}
        <div
          className="absolute overflow-hidden"
          style={{
            inset: "8px",
            borderRadius: "46px",
            background: "#F8FAF5",
          }}
        >
          {/* Status bar */}
          <div
            className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-7"
            style={{ height: "46px", paddingTop: "14px" }}
          >
            <span
              style={{
                fontSize: "13px",
                fontWeight: 600,
                color: "#212121",
                fontFamily: "Inter, sans-serif",
              }}
            >
              9:41
            </span>
            {/* Dynamic island */}
            <div
              className="absolute left-1/2 -translate-x-1/2"
              style={{
                top: "10px",
                width: "110px",
                height: "30px",
                background: "#1a1a1a",
                borderRadius: "20px",
              }}
            />
            <div className="flex items-center gap-1" style={{ marginTop: "-2px" }}>
              <Signal size={12} color="#212121" />
              <Wifi size={12} color="#212121" />
              <BatteryFull size={14} color="#212121" />
            </div>
          </div>

          {/* Page content */}
          <div
            className="absolute left-0 right-0 bottom-0"
            style={{ top: "46px", overflow: "hidden" }}
          >
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
