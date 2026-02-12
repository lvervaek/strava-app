import React, { useContext } from "react";
import { AppContextProvider, AppContext } from "./context/AppContext.js";
import Sidebar from "./Sidebar.js";
import MapContainer from "./MapContainer";
import ExportOverlay from "./ExportOverlay.js";
import OnboardingOverlay from "./OnboardingOverlay.js";
import "./App.css";

function AppContent() {
  const { isExporting, showOnboarding, showPlayPrompt, startAnimation } = useContext(AppContext);
  return (
    <div style={{ position: "relative", height: "100dvh", width: "100%" }}>
      <MapContainer />
      <Sidebar forceExpanded={showOnboarding} />
      {isExporting && <ExportOverlay />}
      {showOnboarding && <OnboardingOverlay />}
      {showPlayPrompt && (
        <div className="play-toast" onClick={startAnimation}>
          <span className="play-toast__icon">&#9654;</span>
          <span>Press play to start the animation!</span>
        </div>
      )}
    </div>
  );
}

function App() {
  return (
    <AppContextProvider>
      <AppContent />
    </AppContextProvider>
  );
}

export default App;
