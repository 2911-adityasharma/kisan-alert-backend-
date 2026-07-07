import { createBrowserRouter } from "react-router";
import { Root } from "./Root";
import { SplashScreen } from "./components/SplashScreen";
import { LanguageSelection } from "./components/LanguageSelection";
import { Onboarding } from "./components/Onboarding";
import { Login } from "./components/Login";
import { AppLayout } from "./components/AppLayout";
import { HomeDashboard } from "./components/HomeDashboard";
import { CameraScreen } from "./components/CameraScreen";
import { AIProcessing } from "./components/AIProcessing";
import { DiagnosisResult } from "./components/DiagnosisResult";
import { KisanDost } from "./components/KisanDost";
import { GovernmentAlerts } from "./components/GovernmentAlerts";
import { Profile } from "./components/Profile";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: SplashScreen },
      { path: "language", Component: LanguageSelection },
      { path: "onboarding", Component: Onboarding },
      { path: "login", Component: Login },
      {
        path: "app",
        Component: AppLayout,
        children: [
          { index: true, Component: HomeDashboard },
          { path: "scan", Component: CameraScreen },
          { path: "chat", Component: KisanDost },
          { path: "alerts", Component: GovernmentAlerts },
          { path: "profile", Component: Profile },
        ],
      },
      { path: "processing", Component: AIProcessing },
      { path: "result", Component: DiagnosisResult },
    ],
  },
]);
