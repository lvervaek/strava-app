import React, { useState, useEffect, useRef, useContext } from "react";
import { AppContext } from "../context/AppContext.js";
import axios from "axios";
import Spinner from "react-bootstrap/Spinner";
import { Strava } from "react-bootstrap-icons";

const isMobile = () => window.innerWidth <= 768;

function StravaSection() {
  const { addTracks } = useContext(AppContext);
  const clientId = process.env.REACT_APP_STRAVA_CLIENT_ID;
  const redirectUri = window.location.origin + window.location.pathname;

  const [accessToken, setAccessToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null); // "fetching" | "done" | "error"
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const pollTimerRef = useRef(null);

  // On mount: check if returning from a same-tab Strava redirect (mobile flow)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const wasRedirecting = sessionStorage.getItem("stravaRedirect");

    if (code && wasRedirecting) {
      sessionStorage.removeItem("stravaRedirect");
      window.history.replaceState({}, document.title, redirectUri);
      exchangeCodeForToken(code);
    }

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loginWithStrava = () => {
    const stravaAuthUrl = `https://www.strava.com/oauth/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&scope=activity:read_all`;

    if (isMobile()) {
      sessionStorage.setItem("stravaRedirect", "true");
      window.location.href = stravaAuthUrl;
      return;
    }

    const popup = window.open(stravaAuthUrl, "stravaAuth", "width=600,height=700");

    pollTimerRef.current = setInterval(() => {
      try {
        if (!popup || popup.closed) {
          clearInterval(pollTimerRef.current);
          return;
        }
        const popupUrl = popup.location.href;
        if (popupUrl.startsWith(redirectUri)) {
          const params = new URLSearchParams(popup.location.search);
          const code = params.get("code");
          popup.close();
          clearInterval(pollTimerRef.current);
          if (code) {
            exchangeCodeForToken(code);
          }
        }
      } catch {
        // Cross-origin error while popup is on Strava domain — ignore
      }
    }, 500);
  };

  const exchangeCodeForToken = (code) => {
    setLoading(true);
    setStatus("fetching");
    axios
      .post("/api/strava-token", { code })
      .then((response) => {
        const token = response.data.access_token;
        setAccessToken(token);
        return fetchTracks(token);
      })
      .catch((error) => {
        console.error("Error exchanging code for token:", error);
        setLoading(false);
        setStatus("error");
      });
  };

  const fetchTracks = (token) => {
    const authToken = token || accessToken;
    if (!authToken) return;

    setLoading(true);
    setStatus("fetching");

    return axios
      .get("https://www.strava.com/api/v3/athlete/activities?per_page=75", {
        headers: { Authorization: `Bearer ${authToken}` },
      })
      .then((response) => {
        const activities = response.data.filter(
          (a) => a.type !== "VirtualRide" && a.start_latlng && a.start_latlng.length === 2
        );
        return streamGpx(activities, authToken);
      })
      .then((tracks) => {
        addTracks(tracks);
        setLoading(false);
        setStatus("done");
      })
      .catch((error) => {
        console.error("Error fetching activities:", error);
        setLoading(false);
        setStatus("error");
      });
  };

  function streamGpx(activities, authToken) {
    const total = activities.length;
    let done = 0;
    setProgress({ done: 0, total });

    const promises = activities.map((activity) => {
      const activityId = activity.id;
      return axios
        .get(
          `https://www.strava.com/api/v3/activities/${activityId}/streams?keys=latlng&key_by_type=true`,
          { headers: { Authorization: `Bearer ${authToken}` } }
        )
        .then((response) => {
          done++;
          setProgress({ done, total });
          const latlngData = response.data.latlng?.data || [];
          return {
            name: activity.name || activityId,
            positions: [latlngData.map(([a, b]) => [b, a])],
            times: 0,
            type: activity.type,
            duration: activity.elapsed_time,
          };
        })
        .catch((error) => {
          done++;
          setProgress({ done, total });
          console.error(`Error fetching stream for activity ${activityId}:`, error);
          return null;
        });
    });

    return Promise.all(promises).then((results) =>
      results.filter((data) => data !== null && data.positions[0].length > 0)
    );
  }

  return (
    <div>
      {loading ? (
        <div style={{ color: "#aaa", fontSize: "0.8rem" }}>
          <Spinner animation="border" size="sm" className="me-2" />
          {progress.total > 0
            ? `Fetching ${progress.done}/${progress.total} activities...`
            : "Connecting..."}
        </div>
      ) : accessToken ? (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button className="sidebar-action-btn" onClick={() => fetchTracks()}>
            <Strava size={16} />
            <span>Fetch again</span>
          </button>
          {status === "done" && (
            <span style={{ color: "#6f6", fontSize: "0.75rem" }}>Done!</span>
          )}
        </div>
      ) : (
        <button className="sidebar-action-btn sidebar-action-btn--strava" onClick={loginWithStrava}>
          <Strava size={16} />
          <span>Connect with Strava</span>
        </button>
      )}
    </div>
  );
}

export default StravaSection;
