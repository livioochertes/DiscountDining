import { createRoot } from "react-dom/client";
import { Capacitor } from "@capacitor/core";
import { StatusBar, Style } from "@capacitor/status-bar";
import App from "./App";
import "./index.css";

// Initialize StatusBar for native platforms
if (Capacitor.isNativePlatform()) {
  StatusBar.setStyle({ style: Style.Dark });
  StatusBar.setBackgroundColor({ color: '#ffffff' });
  StatusBar.setOverlaysWebView({ overlay: false });
}

createRoot(document.getElementById("root")!).render(<App />);
