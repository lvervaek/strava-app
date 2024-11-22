import React from "react";
import { AppContextProvider } from "./context/AppContext.js"; // Import the context provider
import SidebarMenu from "./SidebarMenu.js"; // Sidebar with sections
import MapContainer from "./MapContainer"; // Map with GPX visualization
import "./App.css"; // Styling for layout

function App() {
  return (
    <AppContextProvider>
    <div style={{ position: "relative", height: "100vh", width: "100%" }}>
      {/* MapContainer as the background */}
      <MapContainer />
      {/* SidebarMenu positioned on top */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: -15,
          //width: "300px", // Sidebar width
          height: "100%", // Full height
          backgroundColor: "rgba(255, 255, 255, 0.2)", // Semi-transparent background
          zIndex: 10, // Ensures it stays on top
          overflowY: "auto", // Allow scrolling if content overflows
        }}
      >
        <SidebarMenu />
      </div>
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 50,
          //width: "300px", // Sidebar width
          height: "100%", // Full height
          backgroundColor: "rgba(255, 255, 255, 0)", // Semi-transparent background
          zIndex: 10, // Ensures it stays on top
          overflowY: "auto", // Allow scrolling if content overflows
        }}
      >

      </div>
    </div>
  </AppContextProvider>
  );
}

export default App;