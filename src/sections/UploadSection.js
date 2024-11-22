import React, { useState, useEffect, useContext } from "react";
import { AppContext } from "../context/AppContext.js";
import axios from "axios";
import Button from 'react-bootstrap/Button';

function UploadSection() {

    const { gpxData, startAnimation } = useContext(AppContext);
    
    return (
      <div>

      </div>
    );
  };

export default UploadSection;