import React, { useContext } from "react";
import { AppContext } from "./context/AppContext.js";
import { COLOR_SCHEMES } from "./MapContainer.js";

const STEPS = [
  {
    title: "Connect with Strava or upload your own GPX files!",
    desc: "Link your Strava account to pull your latest activities, or drop in GPX files from any device.",
    targetY: 79,   // midpoint between strava + upload items
  },
  {
    title: "Control the animation!",
    desc: "Hit play to watch your tracks come alive. Adjust speed, pause, or pick a color scheme.",
    targetY: 199,
    hasDemo: true,
  },
  {
    title: "Share and export!",
    desc: "Frame your tracks with the export overlay and download a high-res image to share.",
    targetY: 247,
  },
];

function StepDots({ total, current }) {
  return (
    <div className="onboarding-card__dots">
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className={`onboarding-dot ${i === current ? "onboarding-dot--active" : ""}`} />
      ))}
    </div>
  );
}

function DemoAnimation() {
  const { colorScheme } = useContext(AppContext);
  const scheme = COLOR_SCHEMES[colorScheme] || COLOR_SCHEMES.arctic;

  const runPath = "M 15 55 Q 55 15, 95 40 T 185 30";
  const ridePath = "M 10 35 Q 60 65, 110 45 T 190 60";

  return (
    <div className="onboarding-card__demo">
      <svg width="200" height="80" viewBox="0 0 200 80">
        <path d={ridePath} fill="none" stroke={scheme.ride} strokeWidth={2} strokeLinecap="round" opacity={0.35} />
        <path d={runPath} fill="none" stroke={scheme.run} strokeWidth={2.5} strokeLinecap="round" opacity={0.6} />
        <circle r={4} fill={scheme.point}>
          <animateMotion dur="2.5s" repeatCount="indefinite" path={runPath} />
        </circle>
        <circle r={3} fill={scheme.point} opacity={0.6}>
          <animateMotion dur="3s" repeatCount="indefinite" path={ridePath} />
        </circle>
      </svg>
    </div>
  );
}

function OnboardingOverlay() {
  const { onboardingStep, setOnboardingStep, completeOnboarding } = useContext(AppContext);
  const step = STEPS[onboardingStep];
  const isLast = onboardingStep === STEPS.length - 1;

  const handleNext = () => {
    if (isLast) {
      completeOnboarding();
    } else {
      setOnboardingStep(onboardingStep + 1);
    }
  };

  // Card positioned to the right of sidebar, vertically aligned with target
  const cardLeft = 440;
  const cardTop = Math.max(step.targetY - 20, 16);

  // Arrow: from card left edge curving to sidebar right edge (~420px)
  const arrowTipX = 0;
  const arrowStartX = 60;
  const arrowMidY = 25;

  return (
    <div className="onboarding-overlay">
      {/* Full-screen blur */}
      <div className="onboarding-blur" />

      {/* Arrow */}
      <svg
        className="onboarding-arrow"
        style={{ left: cardLeft - 62, top: step.targetY - 5 }}
        width="65"
        height="50"
        viewBox="0 0 65 50"
      >
        <defs>
          <marker id="ob-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8" fill="#42e3f5" />
          </marker>
        </defs>
        <path
          d={`M${arrowStartX},${arrowMidY} Q30,${arrowMidY} ${arrowTipX + 8},${arrowMidY}`}
          fill="none"
          stroke="#42e3f5"
          strokeWidth={2}
          markerEnd="url(#ob-arrow)"
          className="onboarding-arrow__path"
        />
      </svg>

      {/* Card */}
      <div className="onboarding-card" style={{ left: cardLeft, top: cardTop }} key={onboardingStep}>
        <StepDots total={STEPS.length} current={onboardingStep} />
        <h3 className="onboarding-card__title">{step.title}</h3>
        <p className="onboarding-card__desc">{step.desc}</p>
        {step.hasDemo && <DemoAnimation />}
        <div className="onboarding-card__footer">
          <button className="onboarding-btn onboarding-btn--skip" onClick={completeOnboarding}>
            Skip
          </button>
          <button className="onboarding-btn onboarding-btn--next" onClick={handleNext}>
            {isLast ? "Get Started" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default OnboardingOverlay;
