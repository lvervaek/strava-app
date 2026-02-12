import React, { useContext } from "react";
import { AppContext } from "../context/AppContext.js";
import Button from "react-bootstrap/Button";

function ExportSection() {
  const { setIsExporting, gpxData } = useContext(AppContext);

  return (
    <Button
      size="sm"
      variant="outline-info"
      disabled={gpxData.length === 0}
      onClick={() => setIsExporting(true)}
    >
      Export image
    </Button>
  );
}

export default ExportSection;
