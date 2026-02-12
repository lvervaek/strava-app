import React, { useContext, useRef } from "react";
import { AppContext } from "../context/AppContext.js";
import { CloudUpload } from "react-bootstrap-icons";

const mainFunctions = require("../main-functions");

function UploadSection() {
  const { addTracks } = useContext(AppContext);
  const inputRef = useRef(null);

  const handleFileChange = (e) => {
    const files = e.currentTarget.files;
    if (!files || files.length === 0) return;

    const promises = [];
    for (let i = 0; i < files.length; i++) {
      promises.push(
        new Promise((resolve) => {
          const reader = new FileReader();
          reader.readAsText(files[i]);
          reader.onload = () => resolve([reader.result, files[i].name]);
        })
      );
    }

    Promise.all(promises).then(async (fileContents) => {
      const newTracks = [];
      for (const [xmlContent, fileName] of fileContents) {
        const parseGpxData = await mainFunctions.parseGpxFileData(xmlContent);
        const trackInfo = mainFunctions.getTracksPositions(parseGpxData);
        newTracks.push({
          name: fileName,
          positions: trackInfo.positions,
          times: trackInfo.times,
          type: parseGpxData[0]?.type || "",
          duration: trackInfo.times[0]?.length > 0
            ? trackInfo.times[0][trackInfo.times[0].length - 1] - trackInfo.times[0][0]
            : 0,
        });
      }
      addTracks(newTracks);
      e.target.value = "";
    });
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".gpx"
        onChange={handleFileChange}
        style={{ display: "none" }}
      />
      <button className="sidebar-action-btn" onClick={() => inputRef.current.click()}>
        <CloudUpload size={16} />
        <span>Choose GPX files</span>
      </button>
    </>
  );
}

export default UploadSection;
