import React, { useContext } from "react";
import { AppContext } from "../context/AppContext.js";
import { CloseButton, Table } from "react-bootstrap";

function formatDuration(duration) {
  if (!duration || duration === 0) return "--:--";
  // Strava gives duration in seconds, GPX upload gives ms
  const ms = duration > 100000 ? duration : duration * 1000;
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function truncateName(name, maxLen = 20) {
  const str = String(name);
  return str.length > maxLen ? str.substring(0, maxLen) + "..." : str;
}

function TracksSection() {
  const { gpxData, removeTrack } = useContext(AppContext);

  if (gpxData.length === 0) {
    return (
      <div style={{ color: "#999", fontSize: "0.8rem", fontStyle: "italic" }}>
        Use the Strava or Upload section to add tracks first!
      </div>
    );
  }

  return (
    <div className="tableContainer">
      <Table size="sm" hover className="mb-0">
        <thead>
          <tr>
            <th>#</th>
            <th>Name</th>
            <th>Type</th>
            <th>Duration</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {gpxData.map((track, i) => (
            <tr key={i}>
              <td>{i + 1}</td>
              <td title={String(track.name)}>{truncateName(track.name)}</td>
              <td>{track.type || "--"}</td>
              <td>{formatDuration(track.duration)}</td>
              <td>
                <CloseButton onClick={() => removeTrack(i)} />
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}

export default TracksSection;
