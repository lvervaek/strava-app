import React, { createContext, useState } from "react";

// Create the Context
export const AppContext = createContext();

// Define the provider component
export function AppContextProvider({ children }) {
  // Global state variables
  const [gpxData, setGpxData] = useState([]); // Array of GPX tracks
  const [settings, setSettings] = useState({
    color: "#42e3f5", // Default track color
    lineWidth: 2,     // Default track line width
  });
  const [stravaConnected, setStravaConnected] = useState(false); // Strava connection status
  const [isAnimating, setIsAnimating] = useState(false); // Animation state

  const startAnimation = () => {
    if (gpxData.length > 0) {
      setIsAnimating(true);
    }
  };

  // Context value to share state and updater functions
  const contextValue = {
    gpxData,
    setGpxData,
    settings,
    setSettings,
    stravaConnected,
    setStravaConnected,
    isAnimating,
    setIsAnimating,
    startAnimation,
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}
