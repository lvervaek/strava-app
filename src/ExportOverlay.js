import React, { useContext, useEffect, useState, useRef } from "react";
import { AppContext } from "./context/AppContext.js";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Spinner from "react-bootstrap/Spinner";
import { XLg } from "react-bootstrap-icons";

function ExportOverlay() {
  const {
    gpxData, mapRef, setIsExporting,
    setPlaybackSpeed, resetAnimation, startAnimation
  } = useContext(AppContext);

  const [cropRect, setCropRect] = useState(null);
  const [scale, setScale] = useState(2);
  const [exporting, setExporting] = useState(false);

  // Video recording state
  const [targetDuration, setTargetDuration] = useState(10);
  const [recording, setRecording] = useState(false);
  const [recordProgress, setRecordProgress] = useState(0);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const progressTimerRef = useRef(null);
  const recordStartRef = useRef(0);
  const stopTimerRef = useRef(null);
  const savedMapStateRef = useRef(null);

  useEffect(() => {
    if (!mapRef || gpxData.length === 0) return;

    let minLng = Infinity, maxLng = -Infinity;
    let minLat = Infinity, maxLat = -Infinity;

    for (const track of gpxData) {
      const positions = track.positions[0] || track.positions;
      for (const pos of positions) {
        const lng = Array.isArray(pos[0]) ? pos[0][0] : pos[0];
        const lat = Array.isArray(pos[0]) ? pos[0][1] : pos[1];
        if (lng < minLng) minLng = lng;
        if (lng > maxLng) maxLng = lng;
        if (lat < minLat) minLat = lat;
        if (lat > maxLat) maxLat = lat;
      }
    }

    mapRef.fitBounds([[minLng, minLat], [maxLng, maxLat]], { padding: 80 });

    const isMobile = window.innerWidth <= 768;
    const margin = isMobile ? 0.05 : 0.1;
    setCropRect({
      left: window.innerWidth * margin,
      top: window.innerHeight * margin,
      width: window.innerWidth * (1 - 2 * margin),
      height: window.innerHeight * (1 - 2 * margin),
    });
  }, [mapRef, gpxData]);

  // Compute max track duration for auto-speed
  const computeAutoSpeed = () => {
    let maxDur = 0;
    for (const data of gpxData) {
      const positions = data.positions[0] || data.positions;
      if (!positions || positions.length === 0) continue;
      const rawTimes = data.times;
      let dur;
      if (rawTimes && Array.isArray(rawTimes[0]) && rawTimes[0].length === positions.length) {
        dur = rawTimes[0][rawTimes[0].length - 1].getTime() - rawTimes[0][0].getTime();
      } else if (rawTimes && Array.isArray(rawTimes) && rawTimes.length === positions.length && rawTimes[0] instanceof Date) {
        dur = rawTimes[rawTimes.length - 1].getTime() - rawTimes[0].getTime();
      } else {
        dur = positions.length * 1000;
      }
      if (dur > maxDur) maxDur = dur;
    }
    return maxDur > 0 ? maxDur / (targetDuration * 1000) : 100;
  };

  // ─── Image export (existing) ───
  const handleDownload = () => {
    if (!mapRef || !cropRect) return;

    if (scale === 1) {
      const mapCanvas = mapRef.getCanvas();
      const dpr = window.devicePixelRatio || 1;
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = cropRect.width * dpr;
      tempCanvas.height = cropRect.height * dpr;
      const ctx = tempCanvas.getContext("2d");
      ctx.drawImage(
        mapCanvas,
        cropRect.left * dpr, cropRect.top * dpr,
        cropRect.width * dpr, cropRect.height * dpr,
        0, 0,
        cropRect.width * dpr, cropRect.height * dpr
      );
      downloadFile(tempCanvas.toDataURL("image/png"), "stride-story-export.png");
      return;
    }

    setExporting(true);

    const savedCenter = mapRef.getCenter();
    const savedZoom = mapRef.getZoom();
    const savedBearing = mapRef.getBearing();
    const savedPitch = mapRef.getPitch();
    const geoCropCenter = mapRef.unproject([
      cropRect.left + cropRect.width / 2,
      cropRect.top + cropRect.height / 2,
    ]);
    const newZoom = savedZoom + Math.log2(scale);

    const container = mapRef.getContainer();
    const origWidth = container.style.width;
    const origHeight = container.style.height;
    const origOverflow = container.parentElement.style.overflow;

    container.parentElement.style.overflow = "hidden";
    container.style.width = (cropRect.width * scale) + "px";
    container.style.height = (cropRect.height * scale) + "px";
    mapRef.resize();
    mapRef.jumpTo({ center: geoCropCenter, zoom: newZoom, bearing: savedBearing, pitch: savedPitch });

    mapRef.once("idle", () => {
      const mapCanvas = mapRef.getCanvas();
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = mapCanvas.width;
      tempCanvas.height = mapCanvas.height;
      const ctx = tempCanvas.getContext("2d");
      ctx.drawImage(mapCanvas, 0, 0);
      downloadFile(tempCanvas.toDataURL("image/png"), "stride-story-export.png");

      container.style.width = origWidth;
      container.style.height = origHeight;
      container.parentElement.style.overflow = origOverflow;
      mapRef.resize();
      mapRef.jumpTo({ center: savedCenter, zoom: savedZoom, bearing: savedBearing, pitch: savedPitch });
      setExporting(false);
    });
  };

  // ─── Video recording ───
  const handleRecord = () => {
    if (!mapRef || !cropRect) return;

    const savedCenter = mapRef.getCenter();
    const savedZoom = mapRef.getZoom();
    const savedBearing = mapRef.getBearing();
    const savedPitch = mapRef.getPitch();
    const container = mapRef.getContainer();

    savedMapStateRef.current = {
      center: savedCenter, zoom: savedZoom,
      bearing: savedBearing, pitch: savedPitch,
      width: container.style.width,
      height: container.style.height,
      overflow: container.parentElement.style.overflow,
    };

    // Resize map to crop area
    const geoCropCenter = mapRef.unproject([
      cropRect.left + cropRect.width / 2,
      cropRect.top + cropRect.height / 2,
    ]);

    container.parentElement.style.overflow = "hidden";
    container.style.width = cropRect.width + "px";
    container.style.height = cropRect.height + "px";
    mapRef.resize();
    mapRef.jumpTo({ center: geoCropCenter, zoom: savedZoom, bearing: savedBearing, pitch: savedPitch });

    // Set auto speed and reset animation
    const autoSpeed = computeAutoSpeed();
    setPlaybackSpeed(autoSpeed);
    resetAnimation();

    mapRef.once("idle", () => {
      // Start animation after a tick so reset completes
      setTimeout(() => {
        startAnimation();

        // Start MediaRecorder
        const stream = mapRef.getCanvas().captureStream(15);
        const mimeType = MediaRecorder.isTypeSupported("video/webm; codecs=vp9")
          ? "video/webm; codecs=vp9"
          : "video/webm";
        const recorder = new MediaRecorder(stream, { mimeType });

        chunksRef.current = [];
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunksRef.current.push(e.data);
        };
        recorder.onstop = () => {
          const blob = new Blob(chunksRef.current, { type: mimeType });
          const url = URL.createObjectURL(blob);
          downloadFile(url, "stride-story.webm");
          URL.revokeObjectURL(url);
          restoreMap();
        };

        recorderRef.current = recorder;
        recorder.start(100); // collect chunks every 100ms
        setRecording(true);
        setRecordProgress(0);
        recordStartRef.current = performance.now();

        // Progress updates
        progressTimerRef.current = setInterval(() => {
          const elapsed = (performance.now() - recordStartRef.current) / 1000;
          setRecordProgress(Math.min(100, (elapsed / targetDuration) * 100));
        }, 200);

        // Stop after target duration
        stopTimerRef.current = setTimeout(() => {
          stopRecording();
        }, targetDuration * 1000);
      }, 100);
    });
  };

  const stopRecording = () => {
    if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }
    setRecording(false);
    setRecordProgress(0);
  };

  const restoreMap = () => {
    const saved = savedMapStateRef.current;
    if (!saved || !mapRef) return;
    const container = mapRef.getContainer();
    container.style.width = saved.width;
    container.style.height = saved.height;
    container.parentElement.style.overflow = saved.overflow;
    mapRef.resize();
    mapRef.jumpTo({ center: saved.center, zoom: saved.zoom, bearing: saved.bearing, pitch: saved.pitch });
    savedMapStateRef.current = null;
  };

  const downloadFile = (href, filename) => {
    const link = document.createElement("a");
    link.download = filename;
    link.href = href;
    link.click();
  };

  const handleClose = () => {
    if (recording) stopRecording();
    setIsExporting(false);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
      if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
    };
  }, []);

  if (!cropRect) return null;

  const { left, top, width, height } = cropRect;
  const right = left + width;
  const bottom = top + height;
  const cornerSize = 24;
  const cornerThick = 3;

  const dpr = window.devicePixelRatio || 1;
  const exportW = Math.round(width * dpr * scale);
  const exportH = Math.round(height * dpr * scale);
  const autoSpeed = Math.round(computeAutoSpeed());

  const isMobileView = window.innerWidth <= 768;
  const darkStyle = { background: "rgba(30,30,30,0.85)", color: "#e0e0e0", border: "1px solid rgba(255,255,255,0.15)" };

  return (
    <div className="export-overlay">
      {/* Dark blur panels */}
      <div className="export-overlay__dark" style={{ top: 0, left: 0, width: "100%", height: top }} />
      <div className="export-overlay__dark" style={{ top: bottom, left: 0, width: "100%", height: window.innerHeight - bottom }} />
      <div className="export-overlay__dark" style={{ top: top, left: 0, width: left, height: height }} />
      <div className="export-overlay__dark" style={{ top: top, left: right, width: window.innerWidth - right, height: height }} />

      {/* Corner brackets */}
      <div className="export-overlay__corner" style={{ top: top, left: left, borderTop: `${cornerThick}px solid #fff`, borderLeft: `${cornerThick}px solid #fff`, width: cornerSize, height: cornerSize }} />
      <div className="export-overlay__corner" style={{ top: top, left: right - cornerSize, borderTop: `${cornerThick}px solid #fff`, borderRight: `${cornerThick}px solid #fff`, width: cornerSize, height: cornerSize }} />
      <div className="export-overlay__corner" style={{ top: bottom - cornerSize, left: left, borderBottom: `${cornerThick}px solid #fff`, borderLeft: `${cornerThick}px solid #fff`, width: cornerSize, height: cornerSize }} />
      <div className="export-overlay__corner" style={{ top: bottom - cornerSize, left: right - cornerSize, borderBottom: `${cornerThick}px solid #fff`, borderRight: `${cornerThick}px solid #fff`, width: cornerSize, height: cornerSize }} />

      {/* Recording progress bar */}
      {recording && (
        <div className="export-overlay__progress" style={{ top: bottom - 3, left: left, width: width }}>
          <div className="export-overlay__progress-fill" style={{ width: `${recordProgress}%` }} />
        </div>
      )}

      {/* Action bar — row 1: image export */}
      <div className="export-overlay__actions" style={{ top: bottom + 16, left: left, width: width }}>
        <Form.Select size="sm" value={scale} onChange={(e) => setScale(Number(e.target.value))} style={{ width: 90, ...darkStyle }} disabled={recording}>
          <option value={1}>1x</option>
          <option value={2}>2x</option>
          <option value={4}>4x</option>
        </Form.Select>
        <span style={{ color: "#888", fontSize: "0.7rem", whiteSpace: "nowrap" }}>
          {exportW} &times; {exportH}px
        </span>
        <Button variant="info" size="sm" onClick={handleDownload} disabled={exporting || recording}>
          {exporting ? <><Spinner animation="border" size="sm" className="me-1" />Rendering...</> : "Download image"}
        </Button>
        {isMobileView && (
          <button className="export-overlay__close" onClick={handleClose}>
            <XLg size={18} />
          </button>
        )}
      </div>

      {/* Action bar — row 2: video export (hidden on mobile) */}
      {!isMobileView && (
        <div className="export-overlay__actions" style={{ top: bottom + 52, left: left, width: width }}>
          {recording ? (
            <>
              <span className="export-overlay__rec-dot" />
              <span style={{ color: "#ff4444", fontSize: "0.8rem", fontWeight: 500 }}>
                Recording...
              </span>
              <Button variant="outline-danger" size="sm" onClick={stopRecording}>
                Stop
              </Button>
            </>
          ) : (
            <>
              <Form.Label style={{ color: "#aaa", fontSize: "0.75rem", margin: 0, whiteSpace: "nowrap" }}>
                Duration: {targetDuration}s
              </Form.Label>
              <Form.Range
                min={5} max={30} step={1}
                value={targetDuration}
                onChange={(e) => setTargetDuration(Number(e.target.value))}
                style={{ width: 100 }}
                disabled={recording}
              />
              <span style={{ color: "#666", fontSize: "0.65rem", whiteSpace: "nowrap" }}>
                ~{autoSpeed}x
              </span>
              <Button variant="outline-warning" size="sm" onClick={handleRecord} disabled={exporting}>
                Record video
              </Button>
            </>
          )}
          <button className="export-overlay__close" onClick={handleClose}>
            <XLg size={18} />
          </button>
        </div>
      )}
    </div>
  );
}

export default ExportOverlay;
