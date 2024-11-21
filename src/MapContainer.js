import React, { useContext, useEffect } from "react";
import { AppContext } from "./AppContext"; // Import the AppContext
import mapboxgl from "mapbox-gl"; // Import Mapbox GL JS
import "mapbox-gl/dist/mapbox-gl.css"; // Import Mapbox CSS

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

function MapContainer() {
    const { gpxData, settings, isAnimating, setIsAnimating } = useContext(AppContext); // Access global state
    const mapContainer = useRef(null);
    const map = useRef(null);
    const [lng, setLng] = useState(null);
    const [lat, setLat] = useState(null);
    const [zoom, setZoom] = useState(9);
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
    };

    useEffect(() => {
        if (isAnimating) {
          animate();
        }
      }, [isAnimating]);

    useEffect(() => {
        // Initialize Mapbox map
        if (map.current) return; // initialize map only once
    
        document.title = "Stride Story";
        
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
  
    return <div id="map" className="map-container"></div>;
  }

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
  
  export default MapContainer;