import { createRoot } from "react-dom/client";
import { Capacitor } from "@capacitor/core";
import App from "./App";
import "./index.css";

// Initialize StatusBar for native platforms (dynamic import to avoid build errors)
if (Capacitor.isNativePlatform()) {
  import("@capacitor/status-bar").then(({ StatusBar, Style }) => {
    StatusBar.setStyle({ style: Style.Dark });
    StatusBar.setBackgroundColor({ color: '#ffffff' });
    StatusBar.setOverlaysWebView({ overlay: false });
  }).catch(() => {
    // StatusBar plugin not available
  });
}

createRoot(document.getElementById("root")!).render(<App />);
