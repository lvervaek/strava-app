import React, { useState, useEffect, useRef, useCallback, useContext } from "react";
import { AppContext } from "./context/AppContext.js";
import StravaSection from "./sections/StravaSection.js";
import UploadSection from "./sections/UploadSection.js";
import ControlsSection from "./sections/ControlsSection.js";
import TracksSection from "./sections/TracksSection.js";
import AboutSection from "./sections/AboutSection.js";
import ExportSection from "./sections/ExportSection.js";
import { Strava, CloudUpload, ListUl, PlayCircle, CameraFill, InfoCircle, XLg } from "react-bootstrap-icons";

function SidebarItem({ icon, label, isExpanded, isMobile, isActive, onClick }) {
  return (
    <div
      className={`sidebar__item ${isActive ? "sidebar__item--active" : ""}`}
      onClick={onClick}
    >
      <span className="sidebar__icon">{icon}</span>
      {isExpanded && !isMobile && <span className="sidebar__label">{label}</span>}
    </div>
  );
}

const SECTIONS = [
  { key: "strava", label: "Strava", icon: <Strava color="#fc4c02" size={20} /> },
  { key: "upload", label: "Upload", icon: <CloudUpload color="#e0e0e0" size={20} /> },
  { key: "tracks", label: "Tracks", icon: <ListUl color="#e0e0e0" size={20} /> },
  { key: "controls", label: "Controls", icon: <PlayCircle color="#e0e0e0" size={20} /> },
  { key: "export", label: "Export", icon: <CameraFill color="#e0e0e0" size={20} /> },
  { key: "about", label: "About", icon: <InfoCircle color="#e0e0e0" size={20} /> },
];

function Sidebar({ forceExpanded = false }) {
  const { showPlayPrompt } = useContext(AppContext);
  const [isHovered, setIsHovered] = useState(false);
  const [activeSection, setActiveSection] = useState(null);
  const [isMobile, setIsMobile] = useState(
    () => window.matchMedia("(max-width: 768px)").matches
  );
  const sidebarRef = useRef(null);

  // On mobile, expanded = has active section; on desktop, expanded = hovered or forced
  const isExpanded = isMobile
    ? forceExpanded || activeSection !== null
    : forceExpanded || isHovered;

  // Track viewport changes
  useEffect(() => {
    const mql = window.matchMedia("(max-width: 768px)");
    const handler = (e) => setIsMobile(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  // Auto-open Controls section when tracks finish loading
  useEffect(() => {
    if (showPlayPrompt) {
      setActiveSection("controls");
      if (!isMobile) setIsHovered(true);
    }
  }, [showPlayPrompt, isMobile]);

  // Close on outside click/touch (disabled when forceExpanded)
  const handleOutside = useCallback((e) => {
    if (sidebarRef.current && !sidebarRef.current.contains(e.target)) {
      setIsHovered(false);
      setActiveSection(null);
    }
  }, []);

  useEffect(() => {
    if (forceExpanded) return;
    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("touchstart", handleOutside);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("touchstart", handleOutside);
    };
  }, [forceExpanded, handleOutside]);

  const handleClose = () => {
    setIsHovered(false);
    setActiveSection(null);
  };

  const toggleSection = (key) => {
    setActiveSection((prev) => (prev === key ? null : key));
  };

  const sectionContent = {
    strava: <StravaSection />,
    upload: <UploadSection />,
    tracks: <TracksSection />,
    controls: <ControlsSection />,
    export: <ExportSection />,
    about: <AboutSection />,
  };

  return (
    <div
      ref={sidebarRef}
      className={`sidebar ${isMobile ? "sidebar--mobile" : ""} ${isExpanded ? "sidebar--expanded" : "sidebar--collapsed"}`}
      onMouseEnter={() => { if (!forceExpanded && !isMobile) setIsHovered(true); }}
    >
      {isExpanded && !isMobile && (
        <>
          <button className="sidebar__close" onClick={handleClose}>
            <XLg />
          </button>
          <div className="sidebar__title">Stride Story</div>
        </>
      )}

      {/* On mobile expanded: show close + active section content above the icon bar */}
      {isMobile && isExpanded && activeSection && (
        <div className="sidebar__sheet">
          <button className="sidebar__close" onClick={handleClose}>
            <XLg />
          </button>
          <div className="sidebar__sheet-content">
            {sectionContent[activeSection]}
          </div>
        </div>
      )}

      <nav className="sidebar__nav">
        {SECTIONS.map(({ key, label, icon }) => (
          <React.Fragment key={key}>
            <SidebarItem
              icon={icon}
              label={label}
              isExpanded={isExpanded}
              isMobile={isMobile}
              isActive={activeSection === key}
              onClick={() => toggleSection(key)}
            />
            {/* Desktop: section content inline under item */}
            {!isMobile && activeSection === key && isExpanded && (
              <div className="sidebar__section-content">
                {sectionContent[key]}
              </div>
            )}
          </React.Fragment>
        ))}
      </nav>
    </div>
  );
}

export default Sidebar;
