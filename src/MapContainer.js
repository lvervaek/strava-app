import React, { useContext, useRef, useEffect, useState } from "react";
import { AppContext } from "./context/AppContext";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_TOKEN;

export const COLOR_SCHEMES = {
  arctic:  { name: "Arctic",  run: "#42e3f5", ride: "#fc2626", point: "#fbb03b" },
  ember:   { name: "Ember",   run: "#ff6b35", ride: "#e83f6f", point: "#ffba08" },
  forest:  { name: "Forest",  run: "#2dc653", ride: "#5eead4", point: "#facc15" },
  violet:  { name: "Violet",  run: "#a78bfa", ride: "#f472b6", point: "#fcd34d" },
};

function getPointFeature(coordinates) {
    return {
      type: "Feature",
      properties: {},
      geometry: { type: "Point", coordinates }
    };
}

function getLineFeature(name, type, coordinates) {
    return {
      type: "Feature",
      properties: { name, activitytype: type },
      geometry: { type: "LineString", coordinates }
    };
}

// Linearly interpolate between two [lng, lat] coordinates
function lerp(a, b, t) {
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

// Find the start point with the most neighbors within ~1km
function findDensestStart(tracks) {
    const starts = tracks.map((t) => t.positions[0]); // [lng, lat]
    if (starts.length === 1) return starts[0];

    const RADIUS_M = 1000;
    let bestIdx = 0;
    let bestScore = -1;

    for (let i = 0; i < starts.length; i++) {
        let score = 0;
        for (let j = 0; j < starts.length; j++) {
            if (i === j) continue;
            const dLat = (starts[j][1] - starts[i][1]) * 111320;
            const dLng = (starts[j][0] - starts[i][0]) * 111320 * Math.cos(starts[i][1] * Math.PI / 180);
            if (dLat * dLat + dLng * dLng <= RADIUS_M * RADIUS_M) {
                score++;
            }
        }
        if (score > bestScore) {
            bestScore = score;
            bestIdx = i;
        }
    }

    return starts[bestIdx];
}

function MapContainer() {
    const {
      gpxData, isAnimating, setIsAnimating,
      shouldReset, setShouldReset, playbackSpeed, isPaused, setMapRef,
      colorScheme, isExporting,
      setAnimationProgress, seekFraction, setSeekFraction
    } = useContext(AppContext);

    const mapContainer = useRef(null);
    const map = useRef(null);
    const animFrameRef = useRef(null);
    const playbackSpeedRef = useRef(playbackSpeed);
    const isPausedRef = useRef(isPaused);

    // Animation data stored in refs to avoid re-renders during animation
    const tracksRef = useRef([]);       // pre-processed track data
    const linesRef = useRef({ type: "FeatureCollection", features: [] });
    const linesCompleteRef = useRef({ type: "FeatureCollection", features: [] });
    const pointsRef = useRef({ type: "FeatureCollection", features: [] });
    const elapsedRef = useRef(0);       // elapsed simulation time in ms
    const lastFrameRef = useRef(0);     // last performance.now() timestamp
    const updateCounterRef = useRef(0);
    const maxDurationRef = useRef(0);   // duration of longest track in ms

    // Keep refs in sync so the animation loop sees changes
    useEffect(() => { playbackSpeedRef.current = playbackSpeed; }, [playbackSpeed]);
    useEffect(() => { isPausedRef.current = isPaused; }, [isPaused]);

    const [lng, setLng] = useState(null);
    const [lat, setLat] = useState(null);
    const [zoom, setZoom] = useState(9);

    // Pre-process tracks: extract positions, compute relative timestamps, init cursors
    function initializeTracks() {
        const tracks = [];
        for (const data of gpxData) {
            const positions = data.positions[0];
            if (!positions || positions.length === 0) continue;

            // Build relative time array in ms
            let relTimes;
            const rawTimes = data.times;

            if (rawTimes && Array.isArray(rawTimes[0]) && rawTimes[0].length === positions.length) {
                // GPX upload: times is [[Date, Date, ...]]
                const t0 = rawTimes[0][0].getTime();
                relTimes = rawTimes[0].map((t) => t.getTime() - t0);
            } else if (rawTimes && Array.isArray(rawTimes) && rawTimes.length === positions.length && rawTimes[0] instanceof Date) {
                // Direct Date array (shouldn't happen with current flow but safe)
                const t0 = rawTimes[0].getTime();
                relTimes = rawTimes.map((t) => t.getTime() - t0);
            } else {
                // No timestamps (Strava or missing): uniform spacing, 1 second per point
                relTimes = positions.map((_, i) => i * 1000);
            }

            tracks.push({
                name: data.name,
                type: data.type,
                positions,
                relTimes,
                totalDuration: relTimes[relTimes.length - 1],
                cursor: 0,
                finished: false,
            });
        }
        return tracks;
    }

    function startAnimationLoop() {
        const tracks = initializeTracks();
        if (tracks.length === 0) return;

        tracksRef.current = tracks;
        elapsedRef.current = 0;
        lastFrameRef.current = performance.now();
        updateCounterRef.current = 0;
        maxDurationRef.current = Math.max(...tracks.map((t) => t.totalDuration));

        // Initialize GeoJSON features
        const lines = { type: "FeatureCollection", features: [] };
        const points = { type: "FeatureCollection", features: [] };
        const linesComplete = { type: "FeatureCollection", features: [] };

        for (const track of tracks) {
            lines.features.push(getLineFeature(track.name, track.type, [track.positions[0]]));
            points.features.push(getPointFeature(track.positions[0]));
        }

        linesRef.current = lines;
        pointsRef.current = points;
        linesCompleteRef.current = linesComplete;

        // Jump to the densest cluster of start points (skip when exporting — user already positioned)
        if (!isExporting) {
            map.current.jumpTo({ center: findDensestStart(tracks), zoom: 14 });
        }

        function animate(now) {
            const deltaMs = now - lastFrameRef.current;
            lastFrameRef.current = now;

            // When paused, keep the loop running but don't advance time
            if (isPausedRef.current) {
                animFrameRef.current = requestAnimationFrame(animate);
                return;
            }

            // Advance simulation clock
            elapsedRef.current += deltaMs * playbackSpeedRef.current;
            const elapsed = elapsedRef.current;

            const lines = linesRef.current;
            const points = pointsRef.current;
            let allFinished = true;
            const toComplete = [];

            for (let t = 0; t < tracksRef.current.length; t++) {
                const track = tracksRef.current[t];
                if (track.finished) continue;

                const { positions, relTimes } = track;

                // Check if track is done
                if (elapsed >= track.totalDuration) {
                    // Set final line and hide the point
                    lines.features[t].geometry.coordinates = [...positions];
                    points.features[t].geometry.coordinates = [];
                    track.finished = true;
                    toComplete.push(t);
                    continue;
                }

                allFinished = false;

                // Advance cursor forward (O(1) amortized)
                while (
                    track.cursor < relTimes.length - 2 &&
                    relTimes[track.cursor + 1] <= elapsed
                ) {
                    track.cursor++;
                }

                const c = track.cursor;
                const segDuration = relTimes[c + 1] - relTimes[c];
                const fraction = segDuration > 0 ? (elapsed - relTimes[c]) / segDuration : 0;
                const interpolated = lerp(positions[c], positions[c + 1], fraction);

                // Build line up to current cursor + interpolated point
                lines.features[t].geometry.coordinates = positions.slice(0, c + 1).concat([interpolated]);
                points.features[t].geometry.coordinates = interpolated;
            }

            // Copy completed tracks to the "complete" layer (keep originals in place to preserve indices)
            if (toComplete.length > 0) {
                for (const idx of toComplete) {
                    linesCompleteRef.current.features.push({
                        ...lines.features[idx],
                        geometry: { ...lines.features[idx].geometry, coordinates: [...lines.features[idx].geometry.coordinates] }
                    });
                }
                map.current.getSource('trace2').setData(linesCompleteRef.current);
            }

            // Throttle map updates to ~20fps (every 3rd frame at 60fps)
            updateCounterRef.current++;
            if (updateCounterRef.current % 3 === 0) {
                map.current.getSource('trace').setData(lines);
                map.current.getSource('point').setData(points);
                if (maxDurationRef.current > 0) {
                    setAnimationProgress(Math.min(1, elapsed / maxDurationRef.current));
                }
            }

            if (allFinished) {
                // Final update when all tracks are done
                map.current.getSource('trace').setData(lines);
                map.current.getSource('point').setData(points);
                setAnimationProgress(1);
            } else {
                animFrameRef.current = requestAnimationFrame(animate);
            }
        }

        animFrameRef.current = requestAnimationFrame(animate);
    }

    function doReset() {
        // Cancel any running animation
        if (animFrameRef.current) {
            cancelAnimationFrame(animFrameRef.current);
            animFrameRef.current = null;
        }
        tracksRef.current = [];
        elapsedRef.current = 0;

        const emptyFC = { type: "FeatureCollection", features: [] };
        linesRef.current = { ...emptyFC };
        linesCompleteRef.current = { ...emptyFC };
        pointsRef.current = { ...emptyFC };

        if (map.current && map.current.getSource('trace')) {
            map.current.getSource('trace').setData(emptyFC);
            map.current.getSource('point').setData(emptyFC);
            map.current.getSource('trace2').setData(emptyFC);
        }
    }

    // Start animation when triggered
    useEffect(() => {
        if (isAnimating && map.current) {
          startAnimationLoop();
        }
        return () => {
            if (animFrameRef.current) {
                cancelAnimationFrame(animFrameRef.current);
                animFrameRef.current = null;
            }
        };
      // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [isAnimating]);

    // Handle reset from context
    useEffect(() => {
        if (shouldReset) {
          doReset();
          setShouldReset(false);
        }
      // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [shouldReset]);

    // Fit map to tracks around the densest cluster when data is loaded
    useEffect(() => {
        if (!map.current || gpxData.length === 0) return;

        // Build simple track list with first positions
        const tracks = gpxData
          .map((d) => ({ positions: d.positions[0] || d.positions }))
          .filter((t) => t.positions && t.positions.length > 0);
        if (tracks.length === 0) return;

        const center = findDensestStart(tracks);
        const RADIUS_M = 25000;

        // Keep only tracks whose start is within 3km of the densest cluster center
        const nearby = tracks.filter((t) => {
            const s = t.positions[0];
            const dLat = (s[1] - center[1]) * 111320;
            const dLng = (s[0] - center[0]) * 111320 * Math.cos(center[1] * Math.PI / 180);
            return dLat * dLat + dLng * dLng <= RADIUS_M * RADIUS_M;
        });
        const useTracks = nearby.length > 0 ? nearby : tracks;

        // Compute bounds of those tracks
        let minLng = Infinity, maxLng = -Infinity, minLat = Infinity, maxLat = -Infinity;
        for (const t of useTracks) {
            for (const p of t.positions) {
                if (p[0] < minLng) minLng = p[0];
                if (p[0] > maxLng) maxLng = p[0];
                if (p[1] < minLat) minLat = p[1];
                if (p[1] > maxLat) maxLat = p[1];
            }
        }

        map.current.fitBounds([[minLng, minLat], [maxLng, maxLat]], { padding: 60, maxZoom: 12 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [gpxData]);

    // Handle seek from scrubber
    useEffect(() => {
        if (seekFraction === null || !map.current) return;
        if (tracksRef.current.length === 0 || maxDurationRef.current === 0) {
            setSeekFraction(null);
            return;
        }

        const targetElapsed = seekFraction * maxDurationRef.current;
        elapsedRef.current = targetElapsed;

        // Reset cursors and finished state for all tracks, then render one frame
        const lines = linesRef.current;
        const points = pointsRef.current;
        linesCompleteRef.current = { type: "FeatureCollection", features: [] };

        for (let t = 0; t < tracksRef.current.length; t++) {
            const track = tracksRef.current[t];
            track.cursor = 0;
            track.finished = false;

            const { positions, relTimes } = track;

            if (targetElapsed >= track.totalDuration) {
                lines.features[t].geometry.coordinates = [...positions];
                points.features[t].geometry.coordinates = [];
                track.finished = true;
                linesCompleteRef.current.features.push({
                    ...lines.features[t],
                    geometry: { ...lines.features[t].geometry, coordinates: [...positions] }
                });
            } else {
                // Advance cursor to correct position
                while (track.cursor < relTimes.length - 2 && relTimes[track.cursor + 1] <= targetElapsed) {
                    track.cursor++;
                }
                const c = track.cursor;
                const segDuration = relTimes[c + 1] - relTimes[c];
                const fraction = segDuration > 0 ? (targetElapsed - relTimes[c]) / segDuration : 0;
                const interpolated = lerp(positions[c], positions[c + 1], fraction);
                lines.features[t].geometry.coordinates = positions.slice(0, c + 1).concat([interpolated]);
                points.features[t].geometry.coordinates = interpolated;
            }
        }

        map.current.getSource('trace').setData(lines);
        map.current.getSource('point').setData(points);
        map.current.getSource('trace2').setData(linesCompleteRef.current);
        setAnimationProgress(seekFraction);
        setSeekFraction(null);
      // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [seekFraction]);

    // Update map paint when color scheme changes
    useEffect(() => {
        if (!map.current) return;

        const applyScheme = () => {
            const scheme = COLOR_SCHEMES[colorScheme] || COLOR_SCHEMES.arctic;
            const lineColor = [
              'match', ['get', 'activitytype'],
              'running', scheme.run, 'Run', scheme.run, 'Workout', scheme.run,
              'biking', scheme.ride, 'cycling', scheme.ride, 'Ride', scheme.ride,
              scheme.run
            ];
            map.current.setPaintProperty('trace', 'line-color', lineColor);
            map.current.setPaintProperty('trace2', 'line-color', lineColor);
            map.current.setPaintProperty('point', 'circle-color', scheme.point);
        };

        if (map.current.isStyleLoaded() && map.current.getLayer('trace')) {
            applyScheme();
        } else {
            map.current.once('idle', applyScheme);
            return () => map.current.off('idle', applyScheme);
        }
    }, [colorScheme]);

    // Initialize Mapbox map (once)
    useEffect(() => {
        if (map.current) return;

        document.title = "Stride Story";

        map.current = new mapboxgl.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/lvervaeke/cllydq1vh01l601p94kxjem08',
          center: [lng, lat],
          zoom: zoom,
          preserveDrawingBuffer: true
        });

        setMapRef(map.current);

        const emptyFC = { type: "FeatureCollection", features: [] };

        map.current.on('load', () => {
            map.current.addSource('trace', { type: 'geojson', data: emptyFC });
            map.current.addSource('trace2', { type: 'geojson', data: emptyFC });
            map.current.addSource('point', { type: 'geojson', data: emptyFC });

            const scheme = COLOR_SCHEMES.arctic;
            const linePaint = {
              'line-color': [
                'match', ['get', 'activitytype'],
                'running', scheme.run,
                'Run', scheme.run,
                'Workout', scheme.run,
                'biking', scheme.ride,
                'cycling', scheme.ride,
                'Ride', scheme.ride,
                scheme.run
              ],
              'line-opacity': 0.35,
              'line-width': 2,
              'line-blur': 3
            };

            map.current.addLayer({ id: 'trace', type: 'line', source: 'trace', paint: linePaint });
            map.current.addLayer({ id: 'trace2', type: 'line', source: 'trace2', paint: linePaint });
            map.current.addLayer({
              id: 'point',
              type: 'circle',
              source: 'point',
              paint: {
                'circle-color': scheme.point,
                'circle-radius': { base: 1.75, stops: [[12, 2], [22, 180]] }
              }
            });

            map.current.jumpTo({ center: [3.73, 51.04], zoom: 10 });
        });

        map.current.on('move', () => {
            setLng(map.current.getCenter().lng.toFixed(4));
            setLat(map.current.getCenter().lat.toFixed(4));
            setZoom(map.current.getZoom().toFixed(2));
        });
      // eslint-disable-next-line react-hooks/exhaustive-deps
      }, []);

    return (
        <div
          ref={mapContainer}
          className="map-container"
          style={{ height: "100%", width: "100%", position: "relative" }}
        />
    );
}

export default MapContainer;
