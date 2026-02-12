import React, { useContext } from "react";
import { AppContext } from "../context/AppContext.js";
import { COLOR_SCHEMES } from "../MapContainer.js";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";

function SchemePreview({ scheme, size = 48 }) {
  const w = size;
  const h = size * 0.6;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      {/* Track line (run color) */}
      <path
        d={`M4,${h - 6} Q${w * 0.3},${h * 0.2} ${w * 0.6},${h * 0.45} T${w - 6},${h * 0.3}`}
        fill="none"
        stroke={scheme.run}
        strokeWidth={2.5}
        strokeLinecap="round"
        opacity={0.7}
      />
      {/* Second track (ride color) */}
      <path
        d={`M6,${h * 0.3} Q${w * 0.35},${h * 0.7} ${w * 0.65},${h * 0.5} T${w - 4},${h - 4}`}
        fill="none"
        stroke={scheme.ride}
        strokeWidth={2}
        strokeLinecap="round"
        opacity={0.55}
      />
      {/* Point dot */}
      <circle cx={w - 6} cy={h * 0.3} r={3.5} fill={scheme.point} />
    </svg>
  );
}

function ControlsSection() {
  const {
    gpxData, isAnimating, isPaused,
    startAnimation, pauseAnimation, resumeAnimation, resetAnimation,
    playbackSpeed, setPlaybackSpeed,
    colorScheme, setColorScheme,
    animationProgress, setSeekFraction,
    showPlayPrompt
  } = useContext(AppContext);

  const handlePauseResume = () => {
    if (isPaused) {
      resumeAnimation();
    } else {
      pauseAnimation();
    }
  };

  return (
    <div>
      <div className="mb-2">
        <Button
          size="sm"
          variant={showPlayPrompt ? "info" : "outline-light"}
          className={showPlayPrompt ? "play-btn--pulse" : ""}
          onClick={startAnimation}
          disabled={gpxData.length === 0 || (isAnimating && !isPaused)}
        >
          Play
        </Button>
        <Button
          size="sm"
          variant="outline-light"
          className="ms-2"
          onClick={handlePauseResume}
          disabled={!isAnimating}
        >
          {isPaused ? "Resume" : "Pause"}
        </Button>
        <Button
          size="sm"
          variant="outline-light"
          className="ms-2"
          onClick={resetAnimation}
          disabled={!isAnimating}
        >
          Reset
        </Button>
      </div>
      <Form.Group className="mb-2">
        <Form.Label style={{ color: "#aaa", fontSize: "0.8rem", marginBottom: 2 }}>
          Timeline: {Math.round(animationProgress * 100)}%
        </Form.Label>
        <Form.Range
          min={0}
          max={1000}
          step={1}
          value={Math.round(animationProgress * 1000)}
          onChange={(e) => setSeekFraction(Number(e.target.value) / 1000)}
          disabled={!isAnimating}
        />
      </Form.Group>
      <Form.Group>
        <Form.Label style={{ color: "#aaa", fontSize: "0.8rem", marginBottom: 2 }}>
          Speed: {playbackSpeed}x
        </Form.Label>
        <Form.Range
          min={1}
          max={500}
          step={1}
          value={playbackSpeed}
          onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
        />
      </Form.Group>
      <div>
        <Form.Label style={{ color: "#aaa", fontSize: "0.8rem", marginBottom: 4 }}>
          Color scheme
        </Form.Label>
        <div className="scheme-picker">
          {Object.entries(COLOR_SCHEMES).map(([key, scheme]) => (
            <button
              key={key}
              className={`scheme-picker__item ${colorScheme === key ? "scheme-picker__item--active" : ""}`}
              onClick={() => setColorScheme(key)}
              title={scheme.name}
            >
              <SchemePreview scheme={scheme} />
              <span className="scheme-picker__label">{scheme.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ControlsSection;
