import React, { useState, useEffect, useContext } from "react";
import { AppContext } from "../context/AppContext.js";
import Button from 'react-bootstrap/Button';
import { Sidebar, Menu, MenuItem, SubMenu } from 'react-pro-sidebar';
import { InfoCircle } from 'react-bootstrap-icons';

function AboutSection() {

    const { gpxData, startAnimation } = useContext(AppContext);
    // Link to coffee dontation website!
    return (
      <SubMenu defaultOpen icon={<InfoCircle color="#3b3b3b"/>}  >
      <MenuItem> 
        <div>Made by Loic. Please let me know your feedback!</div>
      </MenuItem>
    </SubMenu>
    );
  };

export default AboutSection;