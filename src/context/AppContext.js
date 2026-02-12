import React, { createContext, useState, useEffect } from "react";

export const AppContext = createContext();

export function AppContextProvider({ children }) {
  const [gpxData, setGpxData] = useState([]);
  const [settings, setSettings] = useState({
    color: "#42e3f5",
    lineWidth: 2,
  });
  const [stravaConnected, setStravaConnected] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [shouldReset, setShouldReset] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(30);
  const [isExporting, setIsExporting] = useState(false);
  const [colorScheme, setColorScheme] = useState("arctic");
  const [mapRef, setMapRef] = useState(null);
  const [animationProgress, setAnimationProgress] = useState(0);
  const [seekFraction, setSeekFraction] = useState(null);
  const [showPlayPrompt, setShowPlayPrompt] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);

  useEffect(() => {
    if (!localStorage.getItem("strideStoryOnboarded")) {
      setShowOnboarding(true);
    }
  }, []);

  const completeOnboarding = () => {
    localStorage.setItem("strideStoryOnboarded", "true");
    setShowOnboarding(false);
    setOnboardingStep(0);
  };

  const restartOnboarding = () => {
    setOnboardingStep(0);
    setShowOnboarding(true);
  };

  const addTracks = (newTracks) => {
    if (newTracks.length > 0) {
      setShowPlayPrompt(true);
    }
    setGpxData((prev) => [...prev, ...newTracks]);
  };

  const removeTrack = (index) => {
    setGpxData((prev) => prev.filter((_, i) => i !== index));
  };

  const startAnimation = () => {
    if (gpxData.length > 0) {
      setShowPlayPrompt(false);
      setIsPaused(false);
      setIsAnimating(true);
    }
  };

  const pauseAnimation = () => {
    setIsPaused(true);
  };

  const resumeAnimation = () => {
    setIsPaused(false);
  };

  const resetAnimation = () => {
    setIsAnimating(false);
    setIsPaused(false);
    setShouldReset(true);
    setAnimationProgress(0);
  };

  const contextValue = {
    gpxData,
    setGpxData,
    settings,
    setSettings,
    stravaConnected,
    setStravaConnected,
    isAnimating,
    setIsAnimating,
    isPaused,
    setIsPaused,
    addTracks,
    removeTrack,
    startAnimation,
    pauseAnimation,
    resumeAnimation,
    resetAnimation,
    shouldReset,
    setShouldReset,
    playbackSpeed,
    setPlaybackSpeed,
    isExporting,
    setIsExporting,
    colorScheme,
    setColorScheme,
    mapRef,
    setMapRef,
    showOnboarding,
    onboardingStep,
    setOnboardingStep,
    completeOnboarding,
    restartOnboarding,
    animationProgress,
    setAnimationProgress,
    seekFraction,
    setSeekFraction,
    showPlayPrompt,
    setShowPlayPrompt,
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}
