import React, { useRef, useEffect, useState, setState } from 'react';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import FileUpload from "./FileUpload.js";
import StravaLoginButton from "./StravaFlow.js";
import mapboxgl from '!mapbox-gl'; // eslint-disable-line import/no-webpack-loader-syntax
import {featureEach} from '@turf/turf'
import axios from "axios";

// Main functions
const mainFunctions = require("./main-functions.js");

mapboxgl.accessToken = 'pk.eyJ1IjoibHZlcnZhZWtlIiwiYSI6ImNsbHh5eXkxbTI2djczcG1sb2dvNTB5YzEifQ.EyJFvAhhrr5DTj0jcAC-dQ';

function getPointFeature(coordinates) {
  return {
    "type": "Feature",
    "properties": {},
    "geometry": {
        "type": "Point",
        "coordinates": coordinates
    }
  }
};

function getLineFeature(name, type, coordinates) {
  return { 
    "type": "Feature", 
    "properties": { 
      "name": name, 
      "activitytype": type
    },
    "geometry": { 
      "type": "LineString", 
      "coordinates": coordinates 
    }
  }
};

export default function App() {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const fileUploadRef = useRef();
  const [lng, setLng] = useState(null);
  const [lat, setLat] = useState(null);
  const [gpxData, setGpxData] = useState([]);
  const [zoom, setZoom] = useState(9);
  const [files, setFiles] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [coordsLengths, setCoordsLengths] = useState([]);
  const [show, setShow] = useState(false);
  const [maxCoordsLength, setMaxCoordsLength] = useState(0);
  const [lines, setLines] = useState({
    "type": "FeatureCollection",
    "features": []
  });
  const [points, setPoints] = useState({
    "type": "FeatureCollection",
    "features": []
  });
  const [positionsResResultArray, setPositionResResultArray] = useState([]);
  const [backupResultArray, setBackupResultArray] = useState([]);
  const [animationDisabled, setAnimationDisabled] = useState(true);
  const [resetDisabled, setResetDisabled] = useState(true);
  const [showSidebar, setShowSidebar] = useState(true); // Sidebar visibility state

  const MAX_LENGTH = 50;

  let i = 0;
  let maxFPS = 60;
  let frameCount = 0;
  var deletions = [];
  var linesComplete = {
    "type": "FeatureCollection",
    "features": []
  }
  var upload = 0;

  function updateFeatures(i) {
      featureEach(lines, (currentFeature, featureIndex) => {
        if (i === positionsResResultArray[featureIndex].length - 1) {
          deletions.push(featureIndex);
        } else {
          currentFeature.geometry.coordinates.push(positionsResResultArray[featureIndex][i]);
          points.features[featureIndex].geometry.coordinates = positionsResResultArray[featureIndex][i];
        }
      });
  }

  function deleteFeatures() {
    deletions.forEach((toDelete) => {
        linesComplete.features.push(lines.features[toDelete]);
        lines.features.splice(toDelete, 1);
        points.features.splice(toDelete, 1);
        positionsResResultArray.splice(toDelete, 1);
        map.current.getSource('trace2').setData(linesComplete);
    });
    deletions = [];
  }

  let updateCounter = 0;
  function animate() {
    if(i == 0) {
      console.log("First animate")
      console.log(animationDisabled)
      console.log(coordsLengths)
      console.log(points)
      console.log(positionsResResultArray)
      console.log(maxCoordsLength)
    }
    frameCount++;

    if((i < Math.max(...coordsLengths)) && frameCount >= Math.round(maxFPS/350)){
        updateFeatures(i);
        deleteFeatures();

        if (updateCounter % 3 === 0) {
            map.current.getSource('trace').setData(lines);
            map.current.getSource('point').setData(points);
        }
        //map.current.panTo(coordinates[i]);
        i++;
        frameCount = 0;
      }
      updateCounter++;
      window.requestAnimationFrame(animate);
  }

  const handleGetFilesData = (fileData) => {
    //console.log("works"+fileData)
    for (let data of fileData){
      positionsResResultArray.push(data.positions[0]);
      backupResultArray.push(data.positions[0]);
      // Save Coordinates for later  
      const coordinates = data.positions[0];
      
      if (coordinates.length > maxCoordsLength) { 
        setMaxCoordsLength(coordinates.length);
      }

      coordsLengths.push(coordinates.length)
      lines.features.push(getLineFeature(data.name, data.type, [coordinates[0]]))
      points.features.push(getPointFeature(coordinates[0]))
      //increaseProgressbar(delta)
      map.current.jumpTo({ 'center': positionsResResultArray[0][0], 'zoom': 14 })
    }
    window.requestAnimationFrame(animate);
  };

  const handleStravaFilesData = (fileData) => {
    handleGetFilesData(fileData);   
  };

  const handleClose = () => setShow(false);

  function increaseProgressbar(increase) {
    console.log("I am first")
    upload = upload + increase;
    setUploadProgress(upload)
  }

  function getExtension(filename) {
    return filename.split('.').pop()
  }

  function diff(ary) {
    var newA = [];
    for (var i = 1; i < ary.length; i++)  newA.push(ary[i] - ary[i - 1])
    return newA;
  }

  const toggleSidebar = () => {
    setShowSidebar(!showSidebar);
  };

  useEffect(() => {

    if (map.current) return; // initialize map only once
    
    document.title = "Activity Track";
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/lvervaeke/cllydq1vh01l601p94kxjem08',
      //style: 'mapbox://styles/mapbox/satellite-v9',
      center: [lng, lat],
      zoom: zoom
    });
    
    map.current.on('load', async () => {

      // Get all gpx filenames
      const gpxFilenamesArray = await mainFunctions.getAllGpxFilenamesDirectory();

      // Line
      map.current.addSource('trace', { type: 'geojson', data: lines });
      map.current.addSource('trace2', { type: 'geojson', data: linesComplete });
      map.current.addLayer({
        'id': 'trace',
        'type': 'line',
        'source': 'trace',
        'paint': {
          'line-color': [
            'match',
            ['get', 'activitytype'],
            'running',
            '#42e3f5',
            'Run',
            '#42e3f5',
            'Workout',
            '#42e3f5',
            'biking',
            '#fc2626',
            'cycling',
            '#fc2626',
            'Ride',
            '#fc2626',
            'blue'
            ],
          'line-opacity': 0.35,
          'line-width': 2,
          'line-blur': 3
          }
        }
      );

      map.current.addLayer({
        'id': 'trace2',
        'type': 'line',
        'source': 'trace2',
        'paint': {
          'line-color': [
            'match',
            ['get', 'activitytype'],
            'running',
            '#42e3f5',
            'biking',
            '#fc2626',
            'cycling',
            '#fc2626',
            'blue'
            ],
          'line-opacity': 0.35,
          'line-width': 2,
          'line-blur': 3
          }
        }
      );
      
      // Point source and layer
      map.current.addSource('point', { type: 'geojson', data: points });
      map.current.addLayer({
        'id': 'point',
        'type': 'circle',
        'source': 'point',
        'paint': {
          'circle-color': '#fbb03b',
          'circle-radius': {
            'base': 1.75,
            'stops': [
            [12, 2],
            [22, 180]
            ]
          }
      }});

      map.current.jumpTo({ 'center': [3.73,51.04], 'zoom': 14 })
    });
    
    map.current.on('move', () => {
      setLng(map.current.getCenter().lng.toFixed(4));
      setLat(map.current.getCenter().lat.toFixed(4));
      setZoom(map.current.getZoom().toFixed(2));
    });
    
  }, [lines, uploadProgress]);

  const resetAnimation = () => {
    i = 0;
    lines.features = [];
    points.features = [];
    linesComplete.features = [];
    setPositionResResultArray([]);
    setCoordsLengths([]);
    map.current.getSource('trace').setData(lines);
    map.current.getSource('point').setData(points);
    map.current.getSource('trace2').setData(linesComplete);
    console.log(positionsResResultArray)
    console.log(lines)
    setAnimationDisabled(false);
  }

  return (
      <div style={{ display: 'flex' }}>
      {/* Sidebar */}
      <div
        className={`sidebar ${showSidebar ? 'visible' : 'hidden'}`}
        style={{
          width: showSidebar ? '250px' : '0', // Adjust width based on state
          transition: 'width 0.3s ease', // Smooth transition effect
          overflowX: 'hidden', // Prevent content overflow when collapsed
          backgroundColor: '#f8f9fa', // Optional styling
        }}
        >
        <Button onClick={toggleSidebar} style={{ margin: '10px' }}>
          {showSidebar ? 'Hide Sidebar' : 'Show Sidebar'}
        </Button>
        <StravaLoginButton getStravaData={handleStravaFilesData}></StravaLoginButton>
        {showSidebar && (
                <>
                    <p>Longitude: {lng} | Latitude: {lat} | Zoom: {zoom}</p>
                    <FileUpload getFilesData={handleGetFilesData} resetAnimation={resetAnimation} animationState={animationDisabled} setAnimationDisabled={setAnimationDisabled} resetState={resetDisabled} setResetDisabled={setResetDisabled}></FileUpload>
                </>
        )}
      </div>

       {/* Map Container */}
      <div ref={mapContainer} className="map-container" style={{ flex: 1, position: 'relative' }} />

      <Modal show={show} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>Uploading</Modal.Title>
        </Modal.Header>
        <Modal.Body>Upload in progress!</Modal.Body>
        <progress value={uploadProgress} max="100"></progress>
        <Modal.Footer>
        </Modal.Footer>
      </Modal>

      </div>
  );
}