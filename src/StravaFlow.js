import React, { useState, useEffect } from "react";
import axios from "axios";
import Button from 'react-bootstrap/Button';

const StravaLoginButton = ({
    getStravaData
}) => {
    const [filesData, setFilesData] = useState([]);
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
          // Process the data, which includes activity info but not GPX files directly.
          for (let activity of response.data){
            var activityId = activity.id;
            axios.get(`https://www.strava.com/api/v3/activities/${activityId}/streams?keys=latlng&key_by_type=true`, {
                headers: { Authorization: `Bearer ${accessToken}` },    
            })  
            .then(responseAct => {
                // Process or save the GPX file from `response.data`
                console.log("Activity gpx: ", responseAct.data )
                let fileData = {
                    name: activityId,
                    positions: [responseAct.data.latlng.data.map(([a, b]) => [b, a])],
                    times: 0,
                    type: activity.type,
                    duration: activity.elapsed_time
                }
                filesData.push(fileData);
            })
            .catch(error => {
                console.error("Error downloading GPX:", error);
            });
          }
          console.log("Filesdata: ", filesData );
      })
      .catch(error => {
          console.error("Error fetching activities:", error);
      });
    };

    const animate = () => {
        console.log("Filesdata: ", filesData );
        getStravaData(filesData);
    };
    
    return (
      <div>
          {accessToken ? (
                <div>
                <Button onClick={fetchTracks}>Fetch GPX Tracks</Button>
                <Button onClick={animate}>Animate</Button>
              </div>
          ) : (
              <Button onClick={loginWithStrava}>Log in with Strava</Button>
          )}
      </div>
    );
  };

  export default StravaLoginButton;