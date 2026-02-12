import React, { useContext } from "react";
import { AppContext } from "../context/AppContext.js";
import Button from "react-bootstrap/Button";

function AboutSection() {
  const { restartOnboarding } = useContext(AppContext);

  return (
    <div style={{ color: "#d0d0d0", fontSize: "0.85rem" }}>
      <p style={{ margin: "0 0 12px" }}>Made by Loic. Please let me know your feedback!</p>
      <Button size="sm" variant="outline-secondary" onClick={restartOnboarding}>
        Show tour again
      </Button>
    </div>
  );
}

export default AboutSection;
