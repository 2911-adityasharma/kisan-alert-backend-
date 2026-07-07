import { Outlet, useNavigate, useLocation } from "react-router";
import { motion } from "motion/react";
import { Home, Scan, MessageCircle, Bell, User } from "lucide-react";

const navItems = [
  { icon: Home, label: "Home", path: "/app" },
  { icon: Bell, label: "Alerts", path: "/app/alerts" },
  { icon: Scan, label: "Scan", path: "/app/scan", highlight: true },
  { icon: MessageCircle, label: "Kisan AI", path: "/app/chat" },
  { icon: User, label: "Profile", path: "/app/profile" },
];

export function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === "/app") return location.pathname === "/app";
    return location.pathname === path;
  };

  const isHome = location.pathname === "/app";

  return (
    <div className="relative flex flex-col h-full" style={{ fontFamily: "Inter, sans-serif" }}>
      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto" style={{ paddingBottom: "76px" }}>
        <Outlet />
      </div>

      {/* Floating AI button — only on home screen */}
      {isHome && (
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={() => navigate("/app/chat")}
          className="flex items-center justify-center rounded-full"
          style={{
            position: "absolute",
            width: "52px",
            height: "52px",
            background: "linear-gradient(135deg, #1565C0 0%, #1976D2 100%)",
            boxShadow: "0 8px 24px rgba(25,118,210,0.5)",
            bottom: "88px",
            right: "16px",
            border: "none",
            fontSize: "22px",
            zIndex: 40,
          }}
          animate={{ y: [0, -4, 0] }}
          transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
        >
          🤖
        </motion.button>
      )}

      {/* Bottom Navigation */}
      <div
        className="absolute bottom-0 left-0 right-0"
        style={{
          background: "white",
          borderTop: "1px solid #F1F8E9",
          boxShadow: "0 -4px 20px rgba(0,0,0,0.08)",
          height: "76px",
          display: "flex",
          alignItems: "center",
          paddingBottom: "8px",
          paddingLeft: "4px",
          paddingRight: "4px",
        }}
      >
        {navItems.map((item) => {
          const active = isActive(item.path);
          const Icon = item.icon;

          if (item.highlight) {
            return (
              <div key={item.path} className="flex-1 flex items-center justify-center">
                <motion.button
                  whileTap={{ scale: 0.92 }}
                  onClick={() => navigate(item.path)}
                  className="flex flex-col items-center justify-center"
                  style={{
                    width: "64px",
                    height: "64px",
                    borderRadius: "20px",
                    background: "linear-gradient(135deg, #2E7D32 0%, #43A047 100%)",
                    boxShadow: "0 6px 20px rgba(46,125,50,0.45)",
                    marginTop: "-20px",
                    border: "none",
                  }}
                >
                  <Icon size={26} color="white" strokeWidth={2} />
                  <span
                    style={{
                      fontSize: "9px",
                      color: "rgba(255,255,255,0.9)",
                      fontWeight: 600,
                      marginTop: "2px",
                    }}
                  >
                    {item.label}
                  </span>
                </motion.button>
              </div>
            );
          }

          return (
            <motion.button
              key={item.path}
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate(item.path)}
              className="flex-1 flex flex-col items-center justify-center gap-1"
              style={{
                background: "transparent",
                border: "none",
                paddingTop: "4px",
              }}
            >
              <div
                className="flex items-center justify-center rounded-2xl transition-all"
                style={{
                  width: "44px",
                  height: "28px",
                  background: active ? "#E8F5E9" : "transparent",
                }}
              >
                <Icon
                  size={22}
                  color={active ? "#2E7D32" : "#9E9E9E"}
                  strokeWidth={active ? 2.5 : 1.8}
                />
              </div>
              <span
                style={{
                  fontSize: "10px",
                  color: active ? "#2E7D32" : "#9E9E9E",
                  fontWeight: active ? 600 : 400,
                }}
              >
                {item.label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
