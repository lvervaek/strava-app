import React, { useState, useEffect, useContext } from "react";
import { AppContext } from "../context/AppContext.js";
import axios from "axios";
import Button from 'react-bootstrap/Button';
import { Sidebar, Menu, MenuItem, SubMenu } from 'react-pro-sidebar';

function StravaSection() {

    const [filesData, setFilesData] = useState([]);
    const { gpxData, setGpxData, startAnimation } = useContext(AppContext);
    const clientId = "140154";
    const clientSecret = "4a2b5a3cc0b97ad64418e98b80edf4bd42993262";
    const redirectUri = "http://localhost:3000/callback"; // e.g., http://localhost:3000/callback

    const [accessToken, setAccessToken] = useState(null);

    // Redirect to Strava's OAuth2 authorization page
    const loginWithStrava = () => {
        const stravaAuthUrl = `https://www.strava.com/oauth/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&scope=activity:read_all`;
        window.location.href = stravaAuthUrl;
    };

     // Handle the authorization code from the URL (callback)
     useEffect(() => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get("code");

      if (code && !accessToken) {
          // Exchange the authorization code for an access token
          axios.post("https://www.strava.com/oauth/token", {
              client_id: clientId,
              client_secret: clientSecret,
              code: code,
              grant_type: "authorization_code",
          })
          .then(response => {
              setAccessToken(response.data.access_token);
              console.log("Access token:", response.data.access_token);
          })
          .catch(error => {
              console.error("Error exchanging code for token:", error);
          });
      }
    }, [accessToken]);

// Fetch GPX tracks after logging in
const fetchTracks = () => {
    if (!accessToken) return;

    axios.get("https://www.strava.com/api/v3/athlete/activities?per_page=10", {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    })
    .then(response => {
        console.log("User activities:", response.data);
        return streamGpx(response.data); // Ensure we return the promise from streamGpx
    })
    .then(gpxData => {
        console.log("All GPX data:", gpxData); // This is where the fully resolved data will be available
        setGpxData(gpxData);
    })
    .catch(error => {
        console.error("Error fetching activities or GPX data:", error);
    });
};

    function streamGpx(activities){
        const promises = activities.map(activity => {
            const activityId = activity.id;
            return axios.get(`https://www.strava.com/api/v3/activities/${activityId}/streams?keys=latlng&key_by_type=true`, {
                headers: { Authorization: `Bearer ${accessToken}` },
            })
            .then(response => {
                const latlngData = response.data.latlng?.data || [];
                return {
                    name: activityId,
                    positions: [latlngData.map(([a, b]) => [b, a])], // Swap latitude and longitude
                    times: 0,
                    type: activity.type,
                    duration: activity.elapsed_time,
                };
            })
            .catch(error => {
                console.error(`Error downloading GPX for activity ${activityId}:`, error);
                return null; // Return null or a placeholder in case of an error
            });
        });
    
        // Wait for all promises to resolve
        return Promise.all(promises)
            .then(results => results.filter(data => data !== null)); // Filter out null values from failed requests
    };
    
    return (
    <SubMenu defaultOpen label="Strava Connection" >
        <MenuItem> 
          {accessToken ? (
                <div>
                <Button onClick={fetchTracks}>Fetch GPX Tracks</Button>
              </div>
          ) : (
              <Button onClick={loginWithStrava}>Log in with Strava</Button>
          )}
        </MenuItem>
      </SubMenu>
    );
  };

export default StravaSection;