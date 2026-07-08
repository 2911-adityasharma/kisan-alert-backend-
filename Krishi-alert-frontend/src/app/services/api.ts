// Kisan-Alert Frontend API Client
// Interfaces and fetch wrappers for backend communication

// Supports both VITE_API_URL (Render guide) and VITE_API_BASE_URL — whichever is set on Vercel.
// Falls back to localhost only for local development.
export const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:8000";

export interface Farmer {
  id: string;
  name: string;
  phone: string;
  language: string;
  village_id: string;
  onboarding_stage: string;
}

export interface Plot {
  id: string;
  farmer_id: string;
  lat: float;
  lng: float;
  crop_current: string;
  soil_data_ref: string;
}

// Session Helpers
export const getSessionFarmer = (): Farmer | null => {
  const data = localStorage.getItem("farmer");
  return data ? JSON.parse(data) : null;
};

export const setSessionFarmer = (farmer: Farmer) => {
  localStorage.setItem("farmer", JSON.stringify(farmer));
  localStorage.setItem("phone", farmer.phone);
  localStorage.setItem("language", farmer.language);
};

export const clearSession = () => {
  localStorage.removeItem("farmer");
  localStorage.removeItem("phone");
  localStorage.removeItem("token");
};

export const getSessionPhone = (): string => {
  return localStorage.getItem("phone") || "";
};

export const getSessionLanguage = (): string => {
  return localStorage.getItem("language") || "te";
};

export const setSessionLanguage = (lang: string) => {
  localStorage.setItem("language", lang);
  const farmer = getSessionFarmer();
  if (farmer) {
    farmer.language = lang;
    setSessionFarmer(farmer);
  }
};

// API calls

export async function sendOtp(phone: string) {
  const res = await fetch(`${API_BASE_URL}/api/auth/otp/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.detail || "Failed to send OTP.");
  }
  return res.json();
}

export async function verifyOtp(phone: string, otp: string) {
  const res = await fetch(`${API_BASE_URL}/api/auth/otp/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone, otp }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.detail || "Verification failed.");
  }
  return res.json();
}

export async function registerFarmer(data: {
  phone: string;
  name: string;
  village_id: string;
  language: string;
  lat?: number;
  lng?: number;
  crop_current?: string;
  plot_size?: number;
  soil_data_ref?: string;
}) {
  const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.detail || "Registration failed.");
  }
  return res.json();
}

export async function getDashboard(phone: string) {
  const res = await fetch(`${API_BASE_URL}/api/dashboard?phone=${phone}`);
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.detail || "Failed to load dashboard data.");
  }
  return res.json();
}

export async function chatKisanDost(message: string, language: string, history: any[]) {
  const res = await fetch(`${API_BASE_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, language, history }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.detail || "Failed to send message.");
  }
  return res.json();
}

export async function uploadAndScanCrop(imageBlob: Blob, phone: string, language: string) {
  const formData = new FormData();
  formData.append("file", imageBlob, "crop_scan.jpg");
  if (phone) formData.append("phone", phone);
  formData.append("language", language);

  const res = await fetch(`${API_BASE_URL}/api/scan`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.detail || "Scan failed.");
  }
  return res.json();
}
