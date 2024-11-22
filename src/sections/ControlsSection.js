import React, {useState, useEffect, useContext } from "react";
import { AppContext } from "../context/AppContext.js";
import { Sidebar, Menu, MenuItem, SubMenu } from 'react-pro-sidebar';
import Button from 'react-bootstrap/Button';
import { Toggles } from 'react-bootstrap-icons';


function ControlsSection() {
  const { gpxData, startAnimation } = useContext(AppContext);

  return (
    <SubMenu defaultOpen icon={<Toggles color="#3b3b3b"/>} >
      <MenuItem>
      <Button
        onClick={startAnimation}
        disabled={gpxData.length === 0} // Disable button if no GPX data
        className={gpxData.length > 0 ? "active" : "disabled"}
      >
        Play
      </Button>
      </MenuItem>
    </SubMenu>
  );
}

export default ControlsSection;