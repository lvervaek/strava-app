import React, { useRef, useEffect, useState, setState } from 'react';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import FileUpload from "./FileUpload.tsx";
import mapboxgl from '!mapbox-gl'; // eslint-disable-line import/no-webpack-loader-syntax
import {featureEach} from '@turf/turf'

// Main functions
const mainFunctions = require("./main-functions");

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

  const MAX_LENGTH = 50;

  let i = 0;
  var deletions = [];
  var linesComplete = {
    "type": "FeatureCollection",
    "features": []
  }
  var upload = 0;

  function animate() {
    if(i == 0) {
      console.log("First animate")
      console.log(coordsLengths)
      console.log(points)
      console.log(positionsResResultArray)
    }

    if (i < maxCoordsLength) {
      featureEach(lines, function (currentFeature, featureIndex){
        if (i == positionsResResultArray[featureIndex].length - 1){
          deletions.push(featureIndex)
        } else {
          currentFeature.geometry.coordinates.push(positionsResResultArray[featureIndex][i])
          points.features[featureIndex].geometry.coordinates = positionsResResultArray[featureIndex][i]
        }
      });

      deletions.forEach((toDelete) => {
        linesComplete.features.push(lines.features[toDelete])
        lines.features.splice(toDelete,1)
        points.features.splice(toDelete,1)
        positionsResResultArray.splice(toDelete,1)
        map.current.getSource('trace2').setData(linesComplete);
        console.log(linesComplete)
      });
      deletions = []

      map.current.getSource('trace').setData(lines);
      map.current.getSource('point').setData(points);
      //map.current.panTo(coordinates[i]);
      i++;
      window.requestAnimationFrame(animate);
    } else {

    }
  }

  const handleGetFilesData = (data) => {
    console.log("wokrs"+data)
    alert(data);
  };

  const handleClose = () => setShow(false);

  const buttonClick = () => {
    // check if files have been uploaded
    //...
    window.requestAnimationFrame(animate);
  }

  function increaseProgressbar(increase) {
    console.log("I am first")
    upload = upload + increase;
    setUploadProgress(upload)
  }

  function getExtension(filename) {
    return filename.split('.').pop()
  }

  function handleMultipleChange(event) {
    if (Array.from(event.target.files).length > MAX_LENGTH) {
      event.preventDefault();
      alert(`Cannot upload more than ${MAX_LENGTH} .gpx files`);
      return;
    }
    if (getExtension(Array.from(event.target.files)[0]["name"]) != "gpx"){
      event.preventDefault();
      alert(`Can only process .gpx files`);
      return;
    }
    setFiles([...event.target.files]);
  }

  function diff(ary) {
    var newA = [];
    for (var i = 1; i < ary.length; i++)  newA.push(ary[i] - ary[i - 1])
    return newA;
  }

  const handleMultipleSubmit = (event) => {
    event.preventDefault();
    setShow(true)
    let promises = [];
    for (let i = 0 ; i < files.length; i++){
      let filePromise = new Promise(resolve => {
        let reader = new FileReader();
        reader.readAsText(files[i])    
        reader.onload = () => resolve([reader.result, files[i].name])
      });
      filePromise.then(increaseProgressbar(100/files.length/2))
      promises.push(filePromise);
    }
    Promise.all(promises).then(async fileContents => {
      let delta = 100/fileContents.length/2;
      for (let fileContent of fileContents) {
        //console.log(fileContent)
        const parseGpxData = await mainFunctions.parseGpxFileData(fileContent[0]);
        const trackInfo = await mainFunctions.getTracksPositions(parseGpxData);
        var trackPositions = trackInfo.positions;
        var trackTimes = trackInfo.times;
        positionsResResultArray.push(trackPositions[0]);

        const counts = {};
        for (const num of diff(trackTimes[0])) {
          counts[num] = counts[num] ? counts[num] + 1 : 1;
        }
        
        console.log(counts)

        // Save Coordinates for later  
        const coordinates = trackPositions[0];
      
        if (coordinates.length > maxCoordsLength) { 
          setMaxCoordsLength(coordinates.length);
        }

        //add feature to FeatureCollection
        //console.log("vlak na awaits")
        //console.log(coordsLengths)
        coordsLengths.push(coordinates.length)
        console.log("no I am")
        lines.features.push(getLineFeature(fileContent[1], parseGpxData[0].type, [coordinates[0]]))
        points.features.push(getPointFeature(coordinates[0]))
        increaseProgressbar(delta)
        map.current.jumpTo({ 'center': positionsResResultArray[0][0], 'zoom': 14 })
        //console.log(points)
        setShow(false)
      }
    })
  }

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

  return (
    <div>
      <div className="sidebar">
        Longitude: {lng} | Latitude: {lat} | Zoom: {zoom}     
        <Form onSubmit={handleMultipleSubmit}>
          <p>Upload .gpx files and play animation!</p>
            <Form.Control type="file" multiple onChange={handleMultipleChange} accept=".gpx"/>
          <Button class="button" type="submit">Upload</Button>
          <Button class="button" onClick={buttonClick}>Click Me!</Button>
        </Form>
        <FileUpload getFilesData={handleGetFilesData}></FileUpload>
      </div>
      <Modal show={show} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>Uploading</Modal.Title>
        </Modal.Header>
        <Modal.Body>Upload in progress!</Modal.Body>
        <progress value={uploadProgress} max="100"></progress>
        <Modal.Footer>
        </Modal.Footer>
      </Modal>
      <div ref={mapContainer} className="map-container" />
    </div>
  );
}